"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { type SatRec, twoline2satrec } from "satellite.js";
import type { Tle } from "@/lib/framsat-tle";
import { LOCALE, type Lang } from "../i18n";
import { type Pass, dopplerHz, stateAt, upcomingPasses } from "../framsat-orbit";
import styles from "./received.module.css";

// The 404 page. A SatNOGS-style waterfall of FramSat-1's downlink: the carrier
// follows the real Doppler curve of its last pass over Trondheim and blooms
// into a 404 at closest approach. The recording plays once and stops, then a
// card shows the decoded packet and the way home.

const TEXT = {
  en: {
    title: "Not found | Freider Fløan",
    heading: "404: page not found",
    received: "Packet received",
    notFound: "Not found:",
    why: "The link may be old, or the address mistyped.",
    home: "Go to the homepage",
    track: "Track FramSat-1",
    other: "Norsk",
    lastPass: "FramSat-1, last pass over Trondheim",
    nowPass: "FramSat-1, passing over Trondheim now",
    overhead: "FramSat-1 is over Trondheim right now.",
    back: (t: string) => `FramSat-1 is back over Trondheim in ${t}.`,
    hours: "h",
  },
  no: {
    title: "Finnes ikke | Freider Fløan",
    heading: "404: siden finnes ikke",
    received: "Pakke mottatt",
    notFound: "Finnes ikke:",
    why: "Lenken kan være gammel, eller adressen feilskrevet.",
    home: "Gå til forsiden",
    track: "Følg FramSat-1",
    other: "English",
    lastPass: "FramSat-1, siste passering over Trondheim",
    nowPass: "FramSat-1, passerer over Trondheim nå",
    overhead: "FramSat-1 er over Trondheim akkurat nå.",
    back: (t: string) => `FramSat-1 er over Trondheim igjen om ${t}.`,
    hours: "t",
  },
};
const HOME = { en: "/", no: "/no" };
const TRACK = { en: "/framsat", no: "/no/framsat" };
const OTHER = { en: "/no", no: "/" };

const BAND_HZ = 12_000; // either side of 435.141 MHz

function span(ms: number, lang: Lang) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  const rest = `${pad(Math.floor(s / 60) % 60)} min ${pad(s % 60)} s`;
  return h ? `${h} ${TEXT[lang].hours} ${rest}` : rest.replace(/^0/, "");
}

const clock = (d: Date, lang: Lang) =>
  d.toLocaleTimeString(LOCALE[lang], { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" });

// The pass the waterfall shows: the one under way, or else the last one to end.
function passToShow(satrec: SatRec, now: number) {
  const recent = upcomingPasses(satrec, new Date(now - 12 * 3_600_000), 20, 0, 0.55);
  const current = recent.find((p) => p.start.getTime() <= now && p.end.getTime() > now);
  const last = recent.filter((p) => p.end.getTime() <= now).pop();
  return { pass: current ?? last ?? null, live: !!current };
}

// The Doppler shift across a pass, in Hz, sampled evenly from start to end.
function dopplerCurve(satrec: SatRec, pass: Pass, samples = 120) {
  const a = pass.start.getTime();
  const b = pass.end.getTime();
  return Array.from({ length: samples + 1 }, (_, i) => {
    const s = stateAt(satrec, new Date(a + ((b - a) * i) / samples));
    return s ? dopplerHz(s.rangeRate) : 0;
  });
}

// Black, navy, the site's glacier blue, near white.
const LUT = (() => {
  const stops = [[0, 0, 0, 0], [0.35, 10, 24, 46], [0.7, 169, 214, 255], [1, 244, 250, 255]];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let k = 0;
    while (v > stops[k + 1][0]) k++;
    const [a, b] = [stops[k], stops[k + 1]];
    const f = (v - a[0]) / (b[0] - a[0]);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = a[c + 1] + (b[c + 1] - a[c + 1]) * f;
  }
  return lut;
})();

// The whole recording as one image of 2H rows. Time runs down the screen, so
// the newest row is at the top: the top H rows are the pass as it ends up on
// screen, the bottom H rows the noise from before it.
function record(W: number, H: number, narrow: boolean, family: string, doppler: number[] | null) {
  const m = document.createElement("canvas");
  m.width = W;
  m.height = H;
  const mx = m.getContext("2d")!;
  mx.font = `800 100px ${family}`;
  const size = Math.min((100 * W * (narrow ? 0.84 : 0.6)) / mx.measureText("404").width, H * 0.5);
  mx.font = `800 ${size}px ${family}`;
  mx.letterSpacing = `${-0.04 * size}px`;
  mx.textAlign = "center";
  mx.textBaseline = "middle";
  mx.fillStyle = "#fff";
  const cy = H * (narrow ? 0.3 : 0.4);
  mx.fillText("404", W / 2, cy);
  const mask = mx.getImageData(0, 0, W, H).data;
  let y0 = H;
  let y1 = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x += 2) {
      if (mask[(y * W + x) * 4 + 3] > 0) {
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        break;
      }
    }
  }

  // The pass runs from AOS (below the 404) to LOS (above it), with closest
  // approach, and zero Doppler, in the middle of the 404.
  const half = Math.min(cy - 8, H - 8 - cy, H * 0.42);
  const los = cy - half;
  const aos = cy + half;
  const carrierX = (y: number) => {
    const f = (aos - y) / (aos - los); // 0 at AOS, 1 at LOS
    let hz: number;
    if (doppler) {
      const i = f * (doppler.length - 1);
      const k = Math.min(doppler.length - 2, Math.floor(i));
      hz = doppler[k] + (doppler[k + 1] - doppler[k]) * (i - k);
    } else {
      hz = -Math.tanh((f - 0.5) * 6) * 9000;
    }
    return W / 2 + (hz / BAND_HZ) * (W / 2);
  };

  const out = document.createElement("canvas");
  out.width = W;
  out.height = 2 * H;
  const ox = out.getContext("2d")!;
  const img = ox.createImageData(W, 2 * H);
  const d = img.data;
  const bias = Float32Array.from({ length: W }, (_, x) => 0.05 * Math.sin(x * 0.07) + 0.04 * Math.sin(x * 0.013 + 1));
  for (let y = 0; y < 2 * H; y++) {
    const wobble = Math.round(Math.sin(y * 0.09) * 1.2 + Math.sin(y * 0.023) * 1.5);
    const inPass = y < H && y > los && y < aos && (y < y0 - 6 || y > y1 + 6);
    const edge = inPass ? Math.min(1, (y - los) / 14, (aos - y) / 14) : 0;
    const cx = inPass ? carrierX(y) : 0;
    for (let x = 0; x < W; x++) {
      let v = 0.16 + bias[x] + Math.random() * 0.22 + (Math.random() < 0.004 ? 0.25 : 0);
      if (y < H) {
        const g = mask[(y * W + Math.max(0, Math.min(W - 1, x - wobble))) * 4 + 3] / 255;
        if (g) v += g * (0.3 + Math.random() * 0.32);
        else if (inPass) v += edge * 0.7 * Math.exp(-((x - cx) ** 2) / 2.5);
      }
      const i = Math.max(0, Math.min(255, (v * 255) | 0)) * 3;
      const o = (y * W + x) * 4;
      d[o] = LUT[i];
      d[o + 1] = LUT[i + 1];
      d[o + 2] = LUT[i + 2];
      d[o + 3] = 255;
    }
  }
  ox.putImageData(img, 0, 0);
  return out;
}

export function Received({ tle }: { tle: Tle }) {
  const pathname = usePathname() ?? "/";
  const lang: Lang = pathname === "/no" || pathname.startsWith("/no/") ? "no" : "en";
  const t = TEXT[lang];
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState<{ received: Date; live: boolean } | null>(null);
  const [next, setNext] = useState("");

  const said = `404 NOT FOUND ${pathname}`;
  const hex = Array.from(said, (c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(" ");
  const mhz = (hz: number) =>
    ((435_141_000 + hz) / 1e6).toLocaleString(LOCALE[lang], { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // The title in this page's language; Next writes the English metadata title
  // after hydration, so it's set again whenever the head changes.
  useEffect(() => {
    const set = () => {
      if (document.title !== t.title) document.title = t.title;
    };
    set();
    const watch = new MutationObserver(set);
    watch.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => watch.disconnect();
  }, [t]);

  // The waterfall: worked out once, played once.
  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const now = Date.now();
    const { pass, live } = passToShow(satrec, now);
    const doppler = pass ? dopplerCurve(satrec, pass) : null;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = getComputedStyle(cv).fontFamily;
    let raf = 0;
    let played = false;
    let timer = 0;
    const play = () => {
      cancelAnimationFrame(raf);
      const narrow = innerWidth < 700;
      const W = narrow ? 300 : 480;
      const H = Math.round((W * innerHeight) / innerWidth);
      cv.width = W;
      cv.height = H;
      const rec = record(W, H, narrow, family, doppler);
      // s rows of the pass are on screen
      const show = (s: number) => ctx.drawImage(rec, 0, H - s, W, H, 0, 0, W, H);
      if (played || reduced) {
        show(H);
        setDone(true);
        return;
      }
      played = true;
      const t0 = performance.now();
      const step = (time: number) => {
        const k = Math.min(1, (time - t0) / 5200);
        show(Math.round(H * (1 - (1 - k) ** 1.6)));
        if (k < 1) raf = requestAnimationFrame(step);
        else setDone(true);
      };
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      setShown({ received: live || !pass ? new Date(now) : pass.end, live });
      play();
    };
    document.fonts.load(`800 100px ${family}`).then(start, start);
    const resize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(play, 150);
    };
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      removeEventListener("resize", resize);
    };
  }, [satrec]);

  // When it's back over Trondheim, counted down every second.
  useEffect(() => {
    let upcoming: Pass | undefined;
    const tick = () => {
      const now = Date.now();
      if (!upcoming || upcoming.end.getTime() < now) upcoming = upcomingPasses(satrec, new Date(now), 1, 0, 1)[0];
      if (!upcoming) setNext("");
      else if (upcoming.start.getTime() <= now) setNext(t.overhead);
      else setNext(t.back(span(upcoming.start.getTime() - now, lang)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [satrec, lang, t]);

  return (
    <div className={styles.page}>
      <canvas ref={canvas} className={styles.waterfall} aria-hidden="true" />
      <header className={styles.top}>
        <a className={styles.mark} href={HOME[lang]}>freider.space</a>
        <a className={styles.chip} href={OTHER[lang]} lang={lang === "en" ? "nb" : "en"}>{t.other}</a>
      </header>
      <h1 className={styles.sr}>{t.heading}</h1>

      <aside className={`${styles.card} ${done ? styles.done : ""}`} lang={lang === "no" ? "nb" : "en"}>
        <h2 className={styles.cardTitle}>
          <span>{t.received}</span>
          {shown && <span className={styles.time}>{clock(shown.received, lang)}</span>}
        </h2>
        <p className={styles.message}>
          {t.notFound} <span className={styles.path}>freider.space{pathname}</span>
        </p>
        <p className={styles.why}>{t.why}</p>
        <p className={styles.hex} aria-hidden="true">{hex}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href={HOME[lang]}>{t.home}</a>
          <a className={styles.link} href={TRACK[lang]}>{t.track}</a>
        </div>
        <p className={styles.next} aria-live="off">{next}</p>
      </aside>

      <div className={styles.axis} aria-hidden="true">
        <span>{mhz(-BAND_HZ)} MHz</span>
        <span className={styles.centre}>{mhz(0)}</span>
        <span>{mhz(BAND_HZ)}</span>
        {shown && <span className={styles.who}>{shown.live ? t.nowPass : t.lastPass}</span>}
      </div>
    </div>
  );
}
