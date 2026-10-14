import type { Recording } from "@/lib/satnogs";

// Plays FramSat-1's signal as a highlight reel of its packets.
//
// A packet is a 0.2 s burst, once every 17.02 s, in a recording that is
// otherwise radio static. A burst isn't louder than the static: the receiver
// quietens the hiss while a real signal comes through, so the high frequencies
// drop by about 10 dB. That drop is what's listened for here. The audio runs
// through a short delay, so the gate can open just before each burst is heard;
// between bursts the static is turned well down, and after each burst the
// recording jumps to just before the next one. Volume is measured and levelled
// throughout, fades in from silence, and has a hard ceiling.

export type Source = Pick<Recording, "audio" | "start" | "station" | "seek" | "packets" | "url"> & {
  where: string | null;
  reel?: boolean; // already cut into consecutive bursts, so no jumping
};

export type SignalState = "loading" | "listening" | "playing" | "done";

// Played when there's no recent recording, or the phone can't play Ogg (older
// iPhones): six bursts from a strong reception, 2 s each, cut together.
export const BACKUP: Source = {
  audio: "/hear/framsat-1.m4a",
  start: "2026-10-13T19:06:59Z",
  station: "UX5UL",
  where: "Ukraine",
  seek: 0,
  packets: [
    "FS1.0 fc 01 00 00 7e 00 40 61",
    "FS1.0 fd 7f 01 00 00 7e 00 40",
    "FS1.0 fe 01 00 00 7e 00 40 61",
    "FS1.0 ff 01 00 00 7e 00 40 61",
    "FS1.0 00 01 00 00 7e 00 40 61",
    "FS1.0 01 01 00 00 7e 00 40 61",
  ],
  url: "https://network.satnogs.org/observations/15187287/",
  reel: true,
};

// Where in the original recording the backup's bursts were cut from.
export const BACKUP_FROM_S = 342;

export const PACKETS = 6; // bursts per play
const PERIOD_S = 17.02; // FramSat-1 sends a packet this often
const BEFORE_S = 1.0; // static heard before each burst
const AFTER_S = 0.9; // and after it
const LISTEN_MAX_S = 25; // give up on a recording with no burst found by then

const TARGET_RMS = 0.03; // about -30 dBFS while a burst plays
const MAX_GAIN = 1;
const CEILING = 0.2; // about -14 dBFS; nothing ever goes above this
const STATIC = 10 ** (-16 / 20); // the static between bursts, relative to them
const LOOKAHEAD_S = 0.15;
const DIP_DB = 6; // how far the hiss must drop to count as a burst
const MAX_BURST_S = 0.6; // longer than this is something else (a dropout)

export type Signal = {
  display: AnalyserNode; // what's actually heard, for drawing
  replay: () => void;
  stop: () => void;
};

export function startSignal(
  recording: Source | null,
  on: { state: (s: SignalState) => void; source: (s: Source) => void; packet: (n: number) => void },
): Signal {
  // Everything up to the first play() runs inside the tap, which phones
  // require before they play sound.
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  // Play even with an iPhone's silent switch on, as videos do.
  if (nav.audioSession) nav.audioSession.type = "playback";
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  void ctx.resume();
  const now = () => ctx.currentTime;

  // input ─┬─ meter (raw level, for levelling)
  //        ├─ high-pass ─ detector (finds bursts)
  //        └─ delay ─ level ─ gate ─ fader ─ ceiling ─ display ─ speaker
  const input = ctx.createGain();
  const meter = ctx.createAnalyser();
  meter.fftSize = 1024;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 10_000;
  const detector = ctx.createAnalyser();
  detector.fftSize = 1024; // about 20 ms
  const delay = ctx.createDelay(1);
  delay.delayTime.value = LOOKAHEAD_S;
  const level = ctx.createGain();
  level.gain.value = 0;
  const gate = ctx.createGain();
  gate.gain.value = STATIC;
  const fader = ctx.createGain();
  // A soft clipper, not a compressor: browsers' compressors add make-up
  // gain, which would make it louder.
  const ceiling = ctx.createWaveShaper();
  const curve = new Float32Array(1025);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = CEILING * Math.tanh(x / CEILING);
  }
  ceiling.curve = curve;
  const display = ctx.createAnalyser();
  display.fftSize = 1024;
  input.connect(meter);
  input.connect(highpass).connect(detector);
  input.connect(delay).connect(level).connect(gate).connect(fader).connect(ceiling).connect(display).connect(ctx.destination);

  const element = (src: Source) => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.src = src.seek ? `${src.audio}#t=${src.seek.toFixed(1)}` : src.audio;
    ctx.createMediaElementSource(audio).connect(input);
    return audio;
  };

  const canOgg = new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== "";
  const live = recording && canOgg ? recording : null;
  const backup = element(BACKUP);
  // If the live recording is tried first, the backup is started muted in the
  // same tap, so phones still let it play later if the recording fails.
  if (live) {
    backup.muted = true;
    backup.play().then(
      () => {
        if (backup.muted) backup.pause(); // unless it took over meanwhile
      },
      () => {},
    );
  }

  let audio = backup;
  let src = BACKUP;
  let state: SignalState = "loading";
  let packets = 0;
  let burstAt = -1; // element time the current or last burst started
  let inBurst = false;
  let baseline = 0; // the hiss level in dB, between bursts
  let seeking = false;
  let listeningSince = 0;
  let loop = 0;

  const setState = (s: SignalState) => {
    state = s;
    on.state(s);
  };
  const rms = (node: AnalyserNode, buf: Float32Array<ArrayBuffer>) => {
    node.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const x of buf) sum += x * x;
    return Math.sqrt(sum / buf.length);
  };
  const ramp = (param: AudioParam, to: number, at: number, tc: number) => {
    param.cancelScheduledValues(at);
    param.setTargetAtTime(to, at, tc);
  };

  // Levelling: the estimate jumps up at once and only drifts down, so a quiet
  // moment never makes it turn the sound up. Starting from zero, it also
  // fades in over a second or two.
  const raw = new Float32Array(meter.fftSize);
  let loud = 0;
  const levelTick = () => {
    const r = rms(meter, raw);
    if (r < 1e-4 || seeking) return;
    loud = Math.max(r, loud * 0.97);
    const target = Math.min(MAX_GAIN, TARGET_RMS / loud);
    ramp(level.gain, target, now(), target > level.gain.value ? 0.4 : 0.02);
  };

  const hf = new Float32Array(detector.fftSize);
  const detectTick = () => {
    if (seeking || audio.paused) return;
    const db = 20 * Math.log10(rms(detector, hf) + 1e-9);
    if (db < -100) return; // nothing coming in yet
    if (!baseline) baseline = db;
    const t = audio.currentTime;
    if (!inBurst && db < baseline - DIP_DB) {
      inBurst = true;
      burstAt = t;
      ramp(gate.gain, 1, now() + LOOKAHEAD_S - 0.08, 0.01);
    } else if (inBurst && (db > baseline - DIP_DB / 2 || t - burstAt > MAX_BURST_S)) {
      inBurst = false;
      ramp(gate.gain, STATIC, now() + LOOKAHEAD_S + 0.02, 0.03);
      if (t - burstAt <= MAX_BURST_S) {
        packets += 1;
        on.packet(packets);
        if (state !== "playing") setState("playing");
      }
    } else if (!inBurst) {
      baseline = baseline * 0.97 + db * 0.03;
    }
  };

  // After each burst, on to the next: jump ahead in a long recording, or
  // just keep going in the backup, which is already cut together.
  const reelTick = () => {
    if (seeking || audio.paused || state === "done") return;
    const t = audio.currentTime;
    if (!inBurst && burstAt >= 0 && t > burstAt + AFTER_S) {
      if (packets >= PACKETS) return finish();
      if (!src.reel) jump(burstAt + PERIOD_S - BEFORE_S);
      burstAt = -1;
    }
    if (packets === 0 && performance.now() - listeningSince > LISTEN_MAX_S * 1000) giveUp();
  };

  const jump = (to: number) => {
    seeking = true;
    ramp(fader.gain, 0, now(), 0.01);
    setTimeout(() => {
      audio.currentTime = to;
    }, 50);
  };
  const onSeeked = () => {
    if (!seeking) return;
    seeking = false;
    ramp(fader.gain, 1, now() + LOOKAHEAD_S, 0.02);
  };

  const finish = () => {
    setState("done");
    ramp(fader.gain, 0, now() + LOOKAHEAD_S, 0.05);
    setTimeout(() => audio.pause(), 500);
    clearInterval(loop);
  };

  let fallbackTimer = 0;
  const giveUp = () => {
    if (src === BACKUP) return finish();
    clearTimeout(fallbackTimer);
    audio.pause();
    backup.muted = false;
    backup.currentTime = 0;
    play(backup, BACKUP);
  };

  const play = (el: HTMLAudioElement, from: Source) => {
    audio = el;
    src = from;
    packets = 0;
    burstAt = -1;
    inBurst = false;
    baseline = 0;
    seeking = false;
    loud = 0;
    on.source(from);
    setState("loading");
    level.gain.cancelScheduledValues(now());
    level.gain.setValueAtTime(0, now());
    gate.gain.cancelScheduledValues(now());
    gate.gain.setValueAtTime(STATIC, now());
    fader.gain.cancelScheduledValues(now());
    fader.gain.setValueAtTime(1, now());
    el.onplaying = () => {
      clearTimeout(fallbackTimer);
      if (state === "loading") {
        listeningSince = performance.now();
        setState("listening");
      }
    };
    el.onseeked = onSeeked;
    el.onended = finish;
    if (from !== BACKUP) {
      el.onerror = giveUp;
      // Slow mobile data: don't keep people waiting on a 13 MB file.
      fallbackTimer = window.setTimeout(giveUp, 7000);
    } else {
      el.muted = false;
    }
    clearInterval(loop);
    loop = window.setInterval(() => {
      levelTick();
      detectTick();
      reelTick();
    }, 20);
    el.play().catch(() => from !== BACKUP && giveUp());
  };

  if (live) play(element(live), live);
  else play(backup, BACKUP);

  return {
    display,
    replay: () => {
      void ctx.resume();
      audio.pause();
      audio.currentTime = src.seek;
      play(audio, src);
    },
    stop: () => {
      if (state !== "done") finish();
    },
  };
}
