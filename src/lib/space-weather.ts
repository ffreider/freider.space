// Space weather right now, from NOAA's Space Weather Prediction Center, for
// the descent's Sun stop. Each feed is fetched at most every 15 minutes, and
// anything that can't be fetched is left out (null).

import { latestSun } from "./sun";

const SWPC = "https://services.swpc.noaa.gov";
const TRONDHEIM = { lat: 63, lon: 10 }; // OVATION's grid is whole degrees

export type SpaceWeather = {
  sunImageTime: string | null; // when the GOES-19 image of the Sun was taken
  kp: number | null; // planetary K index, 0-9
  windSpeed: number | null; // solar wind, km/s
  bz: number | null; // north-south part of the solar wind's magnetic field, nT (south, negative, drives aurora)
  xrayNow: string | null; // flare class of the X-ray flux right now, e.g. "C2.1"
  xrayMax: string | null; // the largest in the last 24 hours
  aurora: number | null; // chance of aurora over Trondheim now, %, from the OVATION model
};

async function json(path: string) {
  try {
    const res = await fetch(SWPC + path, { next: { revalidate: 900 } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// GOES X-ray flux (0.1-0.8 nm, W/m²) as a flare class: A, B, C, M or X, then
// the multiplier, so 8.3e-7 is "B8.3".
function flareClass(flux: number) {
  const classes = ["A", "B", "C", "M", "X"];
  const i = Math.max(0, Math.min(4, Math.floor(Math.log10(flux)) + 8));
  return `${classes[i]}${(flux / 10 ** (i - 8)).toFixed(1)}`;
}

const finite = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function spaceWeather(): Promise<SpaceWeather> {
  const [sun, kp, wind, mag, xrays, ovation] = await Promise.all([
    latestSun(),
    json("/products/noaa-planetary-k-index.json"),
    json("/products/summary/solar-wind-speed.json"),
    json("/products/summary/solar-wind-mag-field.json"),
    json("/json/goes/primary/xrays-1-day.json"),
    json("/json/ovation_aurora_latest.json"),
  ]);

  const flux = Array.isArray(xrays)
    ? xrays.filter((x) => x?.energy === "0.1-0.8nm" && finite(x.flux)).map((x) => x.flux as number)
    : [];
  const here = ovation?.coordinates?.find?.(
    (c: number[]) => c[0] === TRONDHEIM.lon && c[1] === TRONDHEIM.lat,
  );

  return {
    sunImageTime: sun?.time ?? null,
    kp: Array.isArray(kp) ? finite(kp.at(-1)?.Kp) : null,
    windSpeed: finite(wind?.[0]?.proton_speed),
    bz: finite(mag?.[0]?.bz_gsm),
    xrayNow: flux.length ? flareClass(flux.at(-1)!) : null,
    xrayMax: flux.length ? flareClass(Math.max(...flux)) : null,
    aurora: here ? finite(here[2]) : null,
  };
}
