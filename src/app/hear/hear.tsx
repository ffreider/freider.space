"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type SatRec, twoline2satrec } from "satellite.js";
import { CARDS } from "@/lib/contact";
import { stampOf } from "@/lib/stamp";
import type { Tle } from "@/lib/framsat-tle";
import { type Pass, TRONDHEIM, groundTrack, stateAt, upcomingPasses } from "../framsat-orbit";
import { placeName, useCountries } from "../place";
import { type World, drawGlobe, loadWorld } from "./globe";
import { BACKUP, BACKUP_FROM_S, PACKETS, type Signal as Engine, type SignalState, type Source, startSignal } from "./signal";
import styles from "./hear.module.css";

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
            <Postcard satrec={satrec} source={signal.source} />
            <OverYou satrec={satrec} />
            <Cards />
          </div>
        )}
      </div>
    </main>
  );
}

// ---- 1. The signal --------------------------------------------------------

function useSignal(recording: Source | null) {
  const [state, setState] = useState<SignalState>("loading");
  const [source, setSource] = useState<Source>(recording ?? BACKUP);
  const [packet, setPacket] = useState(0);
  const engine = useRef<Engine | null>(null);
  const [display, setDisplay] = useState<AnalyserNode | null>(null);

  // Called inside the tap.
  const start = () => {
    engine.current = startSignal(recording, { state: setState, source: setSource, packet: setPacket });
    setDisplay(engine.current.display);
  };
  const replay = () => {
    setPacket(0);
    engine.current?.replay();
  };
  return { state, source, packet, display, start, replay, stop: () => engine.current?.stop() };
}

function Signal({ signal }: { signal: ReturnType<typeof useSignal> }) {
  const { state, source, packet } = signal;
  const where = source.where ? ` in ${source.where}` : "";
  const bytes = packet > 0 ? source.packets[(packet - 1) % source.packets.length] : null;
  return (
    <section className={styles.step} aria-live="polite">
      <Waveform analyser={signal.display} active={state === "listening" || state === "playing"} />
      <p className={styles.counter}>
        <span key={packet} className={packet ? styles.flash : undefined}>
          {packet ? `Packet ${Math.min(packet, PACKETS)} of ${PACKETS}` : state === "done" ? "" : "Listening for FramSat-1…"}
        </span>
      </p>
      <p className={styles.bytes} aria-label="The first bytes of the packet">
        {bytes ?? "\u00a0"}
      </p>
      <p className={styles.caption}>
        {state === "loading" && "Tuning in…"}
        {(state === "listening" || state === "playing") && (
          <>
            Each burst is FramSat-1 sending a packet of data. The static between them is turned down, and the 17
            seconds between packets are cut out.{" "}
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

// What's actually heard, at a fixed scale, so the bursts stand out from the
// turned-down static.
function Waveform({ analyser, active }: { analyser: AnalyserNode | null; active: boolean }) {
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
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.strokeStyle = "#a9d6ff";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      const mid = el.height / 2;
      if (active && analyser) {
        analyser.getFloatTimeDomainData(data);
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * el.width;
          const y = mid + Math.max(-1, Math.min(1, data[i] * 9)) * mid * 0.9;
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

function Postcard({ satrec, source }: { satrec: SatRec; source: Source }) {
  const now = useNow(1000);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<World | null>(null);
  const countries = useCountries();
  const state = stateAt(satrec, now);

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
  // The postcard of the pass you just heard: already processed, so it's
  // always ready. Its red line falls where the bursts were played from.
  const heardAt = new Date(Date.parse(source.start) + (source.reel ? BACKUP_FROM_S : source.seek + 10) * 1000);

  return (
    <section className={styles.step}>
      <canvas ref={canvas} className={styles.globe} role="img" aria-label={`FramSat-1 above ${place}`} />
      <p className={styles.caption}>
        Right now it’s {Math.round(state.altitude)} km above {place}, moving at {Math.round(state.speed).toLocaleString("en-GB")} km/h.
      </p>
      <p className={styles.mono}>{coordinates(state.lat, state.lon)}</p>
      <a href={`/postcard/${stampOf(heardAt)}`} className={styles.secondary}>
        Get the postcard of this pass
      </a>
      <p className={styles.meta}>A print of the whole pass you just heard, drawn from its radio signal.</p>
    </section>
  );
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
