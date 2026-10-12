import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when freider.space is shared on LinkedIn, Slack,
// iMessage and so on. Generated once at build time.

export const alt = "Freider Fløan: I like starting things, mostly about space.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAME = "Freider Fløan";
const TAGLINE = "I like starting things, mostly about space.";

// Fetch just the glyphs we need from Google Fonts, as TTF (which the image
// renderer understands; it can't read woff2).
async function googleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No TTF found for ${family}`);
  return (await fetch(src)).arrayBuffer();
}

export default async function OpenGraphImage() {
  const [heavy, regular, photo] = await Promise.all([
    googleFont("Schibsted+Grotesk", 800, NAME),
    googleFont("Schibsted+Grotesk", 400, TAGLINE + "freider.space"),
    readFile(join(process.cwd(), "public/freider.jpg")),
  ]);

  // As the homepage opens: the name huge on the left on polar night, the
  // photo on the right, one glacier-blue dot.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0a1220",
          color: "#eef2f5",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 64px 64px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Schibsted Heavy",
              fontSize: 128,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
            }}
          >
            <span>Freider</span>
            <span>Fløan</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ fontFamily: "Schibsted", fontSize: 40, lineHeight: 1.3, color: "rgba(238, 242, 245, 0.8)", maxWidth: 520 }}>
              {TAGLINE}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Schibsted", fontSize: 26, color: "#93a4b4" }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: "#a9d6ff" }} />
              freider.space
            </div>
          </div>
        </div>
        <img
          src={`data:image/jpeg;base64,${photo.toString("base64")}`}
          width={480}
          height={630}
          style={{ objectFit: "cover" }}
          alt=""
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Schibsted Heavy", data: heavy, weight: 800 },
        { name: "Schibsted", data: regular, weight: 400 },
      ],
    },
  );
}
