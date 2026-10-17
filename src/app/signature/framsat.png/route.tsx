import { ImageResponse } from "next/og";
import { twoline2satrec } from "satellite.js";
import { framsatTle } from "@/lib/framsat-tle";
import { stateAt } from "../../framsat-orbit";
import { inPlace, loadCountries, placeName } from "../../place-name";

// One line in my personal email signature (freider.floan@gmail.com), under my
// name like a status: where FramSat-1 is. It's an image because email can't
// run code; it's drawn at text size, in Arial's twin Arimo, on a transparent
// background so it sits in the signature like ordinary text. Email apps cache
// images (Gmail through its own proxy), so the line says when the reading was
// taken rather than "right now"; the time is what shows it's live.

export const dynamic = "force-dynamic";

const S = 2; // drawn at twice the size it's shown at, for sharp screens
const W = 420;
const H = 18;
// Mid blue: readable on white, and still on the dark backgrounds of dark mode.
const BLUE = "#3a82c4";

async function googleFont(spec: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${spec}`, { cache: "force-cache" })).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No TTF found for ${spec}`);
  return (await fetch(src, { cache: "force-cache" })).arrayBuffer();
}

export async function GET() {
  const [tle, countries, font] = await Promise.all([framsatTle(), loadCountries(), googleFont("Arimo:wght@400")]);
  const now = new Date();
  const state = stateAt(twoline2satrec(tle.line1, tle.line2), now);
  const at = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo", timeZoneName: "short" });
  const line = state
    ? `FramSat-1, ${Math.round(state.altitude)} km above ${inPlace(placeName(countries, state.lat, state.lon, "en"))} at ${at}`
    : "FramSat-1, a student satellite I worked on";
  // Long place names get slightly smaller type, so the line always fits.
  const size = line.length > 62 ? 11 : 12.5;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 7 * S,
          paddingLeft: 3 * S,
          fontFamily: "Arimo",
          fontSize: size * S,
          color: BLUE,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ width: 6 * S, height: 6 * S, borderRadius: 999, backgroundColor: BLUE, flexShrink: 0 }} />
        {line}
      </div>
    ),
    {
      width: W * S,
      height: H * S,
      fonts: [{ name: "Arimo", data: font, weight: 400 }],
      // Fresh every few minutes, so busy inboxes don't each redraw it.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60" },
    },
  );
}
