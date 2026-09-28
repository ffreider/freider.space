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

// Mirrors the six current roles in the homepage chart.
const lines = [0.78, 0.7, 0.58, 0.56, 0.49, 0.47];

export default async function OpenGraphImage() {
  const [unbounded, syne, photo] = await Promise.all([
    googleFont("Unbounded", 600, NAME),
    googleFont("Syne", 500, TAGLINE + "freider.space"),
    readFile(join(process.cwd(), "public/freider.jpg")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#ededed",
          backgroundColor: "#030304",
          backgroundImage: [
            "radial-gradient(circle at 12% 70%, rgba(13,148,136,0.45), transparent 45%)",
            "radial-gradient(circle at 50% 110%, rgba(37,99,235,0.35), transparent 45%)",
            "radial-gradient(circle at 92% 8%, rgba(162,28,175,0.45), transparent 45%)",
            "radial-gradient(circle at 70% 40%, rgba(109,40,217,0.3), transparent 40%)",
          ].join(", "),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <img
            src={`data:image/jpeg;base64,${photo.toString("base64")}`}
            width={170}
            height={170}
            style={{ borderRadius: 999 }}
            alt=""
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "Unbounded", fontSize: 76 }}>{NAME}</div>
            <div style={{ fontFamily: "Syne", fontSize: 34, color: "#a1a1aa" }}>
              {TAGLINE}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Syne", fontSize: 28, color: "#71717a" }}>
            freider.space
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
            {lines.map((width, i) => (
              <div
                key={i}
                style={{
                  width: 420 * (1 - width) + 60,
                  height: 5,
                  borderRadius: 999,
                  backgroundImage: "linear-gradient(90deg, #06b6d4, #8b5cf6 60%, #d946ef)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Unbounded", data: unbounded, weight: 600 },
        { name: "Syne", data: syne, weight: 500 },
      ],
    },
  );
}
