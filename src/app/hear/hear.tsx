"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { type SatRec, twoline2satrec } from "satellite.js";
import { CARDS } from "@/lib/contact";
import type { Tle } from "@/lib/framsat-tle";
import type { Recording } from "@/lib/satnogs";
import { type Pass, TRONDHEIM, groundTrack, stateAt, upcomingPasses } from "../framsat-orbit";
import { placeName, useCountries } from "../place";
import { type World, drawGlobe, loadWorld } from "./globe";
import styles from "./hear.module.css";

type Source = Pick<Recording, "audio" | "start" | "station" | "seek" | "url"> & { where: string | null };

// Played when there's no recent recording, or the phone can't play Ogg
// (older iPhones): 20 s cut from a strong reception, starting just before a burst.
const BACKUP: Source = {
  audio: "/hear/framsat-1.m4a",
  start: "2026-10-13T19:06:59Z",
  station: "UX5UL",
  where: "Ukraine",
  seek: 0,
  url: "https://network.satnogs.org/observations/15187287/",
};
const CLIP_S = 20; // how much of a recording to play
// The recordings are static at close to full scale, and each station's level
// differs. Whatever comes in is measured and turned down to this quiet level
// (RMS, about -30 dBFS), fading in from silence, and nothing can ever go
// above CEILING.
const TARGET_RMS = 0.03;
const MAX_GAIN = 1;
const CEILING = 0.2; // about -14 dBFS

const coordinates = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? "W" : "E"}`;

function ago(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function Hear({ tle, recording }: { tle: Tle; recording: Source | null }) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const [started, setStarted] = useState(false);
  const signal = useSignal(recording);

  const begin = () => {
    signal.start();
    setStarted(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.col}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.site}>freider.space</a>

        <header className={styles.intro}>
          <h1 className={styles.title}>This is FramSat-1.</h1>
          <p className={styles.lede}>
            A student satellite I worked on at Orbit NTNU, launched on 5 September 2026. Radio amateurs around the
            world record it as it flies over them.
          </p>
        </header>

        {!started ? (
          <>
            <button type="button" className={styles.primary} onClick={begin}>
              <Speaker /> Hear it
            </button>
            <p className={styles.hint}>Turn your sound on.</p>
          </>
        ) : (
          <div className={styles.steps}>
            <Signal signal={signal} />
            <Postcard satrec={satrec} />
            <OverYou satrec={satrec} />
            <Cards />
          </div>
        )}
      </div>
    </main>
  );
}

// ---- 1. The signal --------------------------------------------------------

type SignalState = "loading" | "playing" | "done";

function useSignal(recording: Source | null) {
  const [state, setState] = useState<SignalState>("loading");
  const [source, setSource] = useState<Source>(recording ?? BACKUP);
  const analyser = useRef<AnalyserNode | null>(null);
  const control = useRef<{ replay: () => void; stop: () => void } | null>(null);

  // Everything here runs inside the tap, which phones require before they
  // play sound.
  const start = () => {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    // Play even with an iPhone's silent switch on, as videos do.
    if (nav.audioSession) nav.audioSession.type = "playback";
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    void ctx.resume();
    // source -> meter (measures the raw level) -> gain -> ceiling -> speaker
    const meter = ctx.createAnalyser();
    meter.fftSize = 1024;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    // A soft clipper, not a compressor: browsers' compressors add make-up
    // gain, which would make it louder.
    const ceiling = ctx.createWaveShaper();
    const curve = new Float32Array(1025);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = CEILING * Math.tanh(x / CEILING);
    }
    ceiling.curve = curve;
    meter.connect(gain).connect(ceiling).connect(ctx.destination);
    analyser.current = meter;

    // Keep the volume at TARGET_RMS while playing. Starting from zero, the
    // slow time constant also makes it fade in over a second or two.
    const samples = new Float32Array(meter.fftSize);
    let level = 0;
    let leveling = 0;
    const silence = () => {
      clearInterval(leveling);
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    };
    const fadeIn = () => {
      clearInterval(leveling);
      level = 0;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      leveling = window.setInterval(() => {
        meter.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const x of samples) sum += x * x;
        const rms = Math.sqrt(sum / samples.length);
        if (rms < 1e-4) return; // nothing coming in yet
        // The level estimate jumps up at once and only drifts down, so a
        // quiet moment (like a fade-in) never makes it turn the sound up.
        level = Math.max(rms, level * 0.97);
        const target = Math.min(MAX_GAIN, TARGET_RMS / level);
        const louder = target > gain.gain.value;
        gain.gain.setTargetAtTime(target, ctx.currentTime, louder ? 0.4 : 0.02);
      }, 100);
    };

    const element = (src: Source) => {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.src = src.seek ? `${src.audio}#t=${src.seek.toFixed(1)}` : src.audio;
      ctx.createMediaElementSource(audio).connect(meter);
      return audio;
    };

    const canOgg = new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== "";
    const live = recording && canOgg ? recording : null;
    const backup = element(BACKUP);
    // If the live recording is tried first, the backup is started muted in
    // the same tap, so phones still let it play later if the recording fails.
    if (live) {
      backup.muted = true;
      backup.play().then(
        () => {
          if (backup.muted) backup.pause(); // unless it took over meanwhile
        },
        () => {},
      );
    }
    let current!: { audio: HTMLAudioElement; src: Source };
    let fallbackTimer = 0;

    const play = (audio: HTMLAudioElement, src: Source) => {
      current = { audio, src };
      setSource(src);
      setState("loading");
      silence();
      audio.onplaying = () => {
        clearTimeout(fallbackTimer);
        fadeIn();
        setState("playing");
      };
      audio.ontimeupdate = () => {
        if (audio.currentTime < src.seek + CLIP_S - 0.6 || audio.paused) return;
        silence();
        setTimeout(() => audio.pause(), 600);
        setState("done");
      };
      audio.onended = () => {
        silence();
        setState("done");
      };
      if (src !== BACKUP) {
        const giveUp = () => {
          if (current.src === BACKUP) return;
          clearTimeout(fallbackTimer);
          audio.pause();
          backup.muted = false;
          backup.currentTime = 0;
          play(backup, BACKUP);
        };
        audio.onerror = giveUp;
        // Slow mobile data: don't keep people waiting on a 13 MB file.
        fallbackTimer = window.setTimeout(giveUp, 7000);
      } else {
        audio.muted = false;
      }
      audio.play().catch(() => src !== BACKUP && audio.onerror?.(new Event("error")));
    };

    if (live) play(element(live), live);
    else play(backup, BACKUP);

    control.current = {
      replay: () => {
        const { audio, src } = current;
        void ctx.resume();
        silence();
        audio.currentTime = src.seek;
        setState("loading");
        void audio.play();
      },
      stop: () => {
        silence();
        setTimeout(() => current.audio.pause(), 300);
        setState("done");
      },
    };
  };

  return {
    state,
    source,
    analyser,
    start,
    replay: () => control.current?.replay(),
    stop: () => control.current?.stop(),
  };
}

function Signal({ signal }: { signal: ReturnType<typeof useSignal> }) {
  const { state, source } = signal;
  const where = source.where ? ` in ${source.where}` : "";
  return (
    <section className={styles.step} aria-live="polite">
      <Waveform analyser={signal.analyser} active={state === "playing"} />
      <p className={styles.caption}>
        {state === "loading" && "Tuning in…"}
        {state === "playing" && (
          <>
            The hiss is the radio between signals. The short bursts are FramSat-1 sending data.{" "}
            <button type="button" className={styles.link} onClick={signal.stop}>
              Stop
            </button>
          </>
        )}
        {state === "done" && (
          <button type="button" className={styles.link} onClick={signal.replay}>
            Play it again
          </button>
        )}
      </p>
      <p className={styles.meta}>
        Recorded {ago(source.start)} by{" "}
        <a href={source.url} target="_blank" rel="noopener">
          {source.station}
        </a>
        {where}.
      </p>
    </section>
  );
}

function Waveform({ analyser, active }: { analyser: RefObject<AnalyserNode | null>; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.clientWidth * dpr;
    el.height = el.clientHeight * dpr;
    const data = new Float32Array(1024);
    let frame = 0;
    const draw = () => {
      const meter = analyser.current;
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.strokeStyle = "#a9d6ff";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      const mid = el.height / 2;
      if (active && meter) {
        meter.getFloatTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += v * v;
        // Drawn at the same height whatever the raw level, so it shows the
        // shape of the signal, not how loud the recording is.
        const scale = 0.28 / Math.max(Math.sqrt(sum / data.length), 0.01);
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * el.width;
          const y = mid + Math.max(-1, Math.min(1, data[i] * scale)) * mid * 0.9;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        frame = requestAnimationFrame(draw);
      } else {
        ctx.moveTo(0, mid);
        ctx.lineTo(el.width, mid);
      }
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser, active]);
  return <canvas ref={canvas} className={styles.wave} aria-hidden="true" />;
}

// ---- 2. The postcard ------------------------------------------------------

function useNow(ms: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function Postcard({ satrec }: { satrec: SatRec }) {
  const now = useNow(1000);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<World | null>(null);
  const countries = useCountries();
  const state = stateAt(satrec, now);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorld().then(setWorld);
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !state) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = el.clientWidth * dpr;
    if (el.width !== size) el.width = el.height = size;
    ctx.clearRect(0, 0, size, size);
    const track = groundTrack(satrec, now, 30).past;
    drawGlobe(ctx, { x: size / 2, y: size / 2, r: size * 0.42, lat: state.lat, lon: state.lon, track, world, date: now });
  }, [satrec, now, state, world]);

  if (!state) return null;
  const place = placeName(countries, state.lat, state.lon, "en");

  const save = async () => {
    setSaving(true);
    try {
      await savePostcard(satrec, new Date(), place, world, getComputedStyle(canvas.current!).fontFamily);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.step}>
      <canvas ref={canvas} className={styles.globe} role="img" aria-label={`FramSat-1 above ${place}`} />
      <p className={styles.caption}>
        Right now it’s {Math.round(state.altitude)} km above {place}, moving at {Math.round(state.speed).toLocaleString("en-GB")} km/h.
      </p>
      <p className={styles.mono}>{coordinates(state.lat, state.lon)}</p>
      <button type="button" className={styles.secondary} onClick={save} disabled={saving}>
        {saving ? "Making your postcard…" : "Save postcard"}
      </button>
    </section>
  );
}

// A 1080 × 1350 image of this moment, shared on phones (so it can go
// straight to Photos) and downloaded elsewhere.
async function savePostcard(satrec: SatRec, at: Date, place: string, world: World | null, font: string) {
  const state = stateAt(satrec, at);
  if (!state) return;
  await document.fonts.ready;
  const W = 1080;
  const H = 1350;
  const el = document.createElement("canvas");
  el.width = W;
  el.height = H;
  const ctx = el.getContext("2d")!;
  const bg = ctx.createRadialGradient(W / 2, H * 1.2, 0, W / 2, H * 1.2, H);
  bg.addColorStop(0, "#0b1726");
  bg.addColorStop(1, "#000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#93a4b4";
  ctx.font = `500 30px ${font}`;
  ctx.fillText("Postcard from orbit", 80, 120);
  ctx.fillStyle = "#eef2f5";
  ctx.font = `700 76px ${font}`;
  ctx.fillText("FramSat-1", 80, 200);

  drawGlobe(ctx, { x: W / 2, y: 640, r: 360, lat: state.lat, lon: state.lon, track: groundTrack(satrec, at, 30).past, world, date: at });

  ctx.fillStyle = "#eef2f5";
  ctx.font = `600 44px ${font}`;
  ctx.fillText(`${Math.round(state.altitude)} km above ${place}`, 80, 1110);
  ctx.fillStyle = "#93a4b4";
  ctx.font = `400 32px ${font}`;
  const day = at.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const time = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  ctx.fillText(`${coordinates(state.lat, state.lon)}  ·  ${day}, ${time} UTC`, 80, 1166);
  ctx.fillStyle = "#a9d6ff";
  ctx.font = `600 32px ${font}`;
  ctx.fillText("freider.space", 80, 1262);

  const blob = await new Promise<Blob | null>((done) => el.toBlob(done, "image/png"));
  if (!blob) return;
  const name = `framsat-1-${at.toISOString().slice(0, 16).replace(/[-:]/g, "")}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Postcard from FramSat-1" });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // they closed the share sheet
    }
  }
  download(blob, name);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- 3. Over you ----------------------------------------------------------

const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
const compass = (az: number) => COMPASS[Math.round(az / 45) % 8];
const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// "today at 21:47", "tonight at 22:10", "tomorrow at 06:12", in the phone's own time zone.
function when(d: Date) {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(d) - day(new Date())) / 86_400_000);
  const word = days === 0 ? (d.getHours() >= 18 ? "tonight" : "today") : days === 1 ? "tomorrow" : d.toLocaleDateString("en-GB", { weekday: "long" });
  return `${word} at ${clock(d)}`;
}

type Found = { pass: Pass; here: boolean; at: number }; // `at`: when it was worked out

function OverYou({ satrec }: { satrec: SatRec }) {
  const [state, setState] = useState<"idle" | "locating" | Found | "none">("idle");

  // The location is only used here, on this phone, to work out the pass.
  const locate = () => {
    setState("locating");
    const find = (place: { lat: number; lon: number }, here: boolean) => {
      const at = new Date();
      const [pass] = upcomingPasses(satrec, at, 1, 10, 2, place);
      setState(pass ? { pass, here, at: at.getTime() } : "none");
    };
    if (!navigator.geolocation) return find(TRONDHEIM, false);
    navigator.geolocation.getCurrentPosition(
      (p) => find({ lat: p.coords.latitude, lon: p.coords.longitude }, true),
      () => find(TRONDHEIM, false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  return (
    <section className={styles.step}>
      <h2 className={styles.heading}>When does it fly over you?</h2>
      {state === "idle" && (
        <>
          <button type="button" className={styles.secondary} onClick={locate}>
            Find out
          </button>
          <p className={styles.meta}>Uses your location on this phone only. It isn’t sent anywhere.</p>
        </>
      )}
      {state === "locating" && <p className={styles.caption}>Looking up…</p>}
      {state === "none" && <p className={styles.caption}>It won’t pass high enough over you in the next two days.</p>}
      {typeof state === "object" && <PassView {...state} />}
    </section>
  );
}

function PassView({ pass, here, at }: Found) {
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];
  const now = at >= pass.start.getTime();
  const minutes = Math.max(1, Math.round((pass.end.getTime() - pass.start.getTime()) / 60_000));
  return (
    <>
      {!here && <p className={styles.meta}>Without your location, here’s the next pass over Trondheim.</p>}
      <p className={styles.big}>{now ? `It’s over ${here ? "you" : "Trondheim"} right now.` : `Next over ${here ? "you" : "Trondheim"} ${when(pass.start)}.`}</p>
      <p className={styles.caption}>
        It rises in the {compass(first[0])}, climbs to {pass.maxElevation.toFixed(0)}° above the horizon and sets in the{" "}
        {compass(last[0])}, about {minutes} minutes later.{" "}
        {!here
          ? "It’s far too small to see."
          : pass.maxElevation >= 60
            ? "It’s far too small to see, but it will be almost straight above you."
            : "It’s far too small to see, but it will be there."}
      </p>
      {!now && (
        <button type="button" className={styles.secondary} onClick={() => downloadIcs(pass, here)}>
          Add to calendar
        </button>
      )}
    </>
  );
}

function downloadIcs(pass: Pass, here: boolean) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];
  const description =
    `Rises in the ${compass(first[0])}\\, peaks ${pass.maxElevation.toFixed(0)}° above the horizon` +
    ` and sets in the ${compass(last[0])}. Hear it and see where it is: https://freider.space/hear`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//freider.space//FramSat-1//EN",
    "BEGIN:VEVENT",
    `UID:framsat-1-${stamp(pass.start)}-hear@freider.space`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(pass.start)}`,
    `DTEND:${stamp(pass.end)}`,
    `SUMMARY:FramSat-1 flies over ${here ? "you" : "Trondheim"}`,
    `DESCRIPTION:${description}`,
    "URL:https://freider.space/hear",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:FramSat-1 rises in 10 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  download(new Blob([ics], { type: "text/calendar;charset=utf-8" }), `framsat-1-${stamp(pass.start).slice(0, 13)}.ics`);
}

// ---- 4. The cards ---------------------------------------------------------

function Cards() {
  return (
    <section className={styles.step}>
      <h2 className={styles.heading}>Keep in touch</h2>
      <div className={styles.cards}>
        <a href={`${CARDS.personal.path}/${CARDS.personal.file}`} className={styles.primary}>
          Save my contact
        </a>
        <a href={`${CARDS.meso.path}/${CARDS.meso.file}`} className={styles.secondary}>
          Save my Meso contact
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <p className={styles.more}>More about me on <a href="/">freider.space</a></p>
    </section>
  );
}

function Speaker() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}
