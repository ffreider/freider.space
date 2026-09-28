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

  // The same split as the homepage: the name huge on the left, the photo
  // large on the right, on ice with one signal red.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#e7edf1",
          color: "#16202a",
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
            <div style={{ fontFamily: "Schibsted", fontSize: 40, lineHeight: 1.3, color: "#2a3642", maxWidth: 520 }}>
              {TAGLINE}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Schibsted", fontSize: 26, color: "#56626e" }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: "#d42a3c" }} />
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
