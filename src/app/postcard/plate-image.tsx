import { ImageResponse } from "next/og";
import { H, INK, LABEL_Y, MUTE, PAPER, type PlateLayout, RED, W, X0 } from "./plate-layout";

// The plate as a PNG: for link previews (on a wall, landscape) and for
// printing (the plate alone, A4 at 300 dpi). Same layout as the page.

// Fonts as TTF from Google Fonts (the image renderer can't read woff2).
async function googleFont(spec: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${spec}`)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No TTF found for ${spec}`);
  return (await fetch(src)).arrayBuffer();
}

async function fonts() {
  const [light, italic, mono] = await Promise.all([
    googleFont("Fraunces:wght@300"),
    googleFont("Fraunces:ital,wght@1,300"),
    googleFont("IBM+Plex+Mono:wght@400"),
  ]);
  return [
    { name: "Fraunces", data: light, weight: 300 as const, style: "normal" as const },
    { name: "Fraunces", data: italic, weight: 300 as const, style: "italic" as const },
    { name: "Plex Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

// Text placed by its baseline, as in the SVG version.
function Text({ x, y, size, s, children, end, serif, color = INK, italic }: {
  x: number; y: number; size: number; s: number; children: React.ReactNode;
  end?: boolean; serif?: boolean; color?: string; italic?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: (y - size * 0.82) * s,
        ...(end ? { right: (W - x) * s } : { left: x * s }),
        display: "flex",
        fontFamily: serif ? "Fraunces" : "Plex Mono",
        fontWeight: serif ? 300 : 400,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size * s,
        letterSpacing: serif ? 0 : 0.9 * s,
        color,
        whiteSpace: "pre",
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}

// The plate at scale `s` (1 = 400 × 566). With no layout, an empty plate
// with a short message (a postcard still developing, say).
function PlateNode({ layout, message, s }: { layout: PlateLayout | null; message?: [string, string]; s: number }) {
  if (!layout) {
    return (
      <div style={{ width: W * s, height: H * s, background: PAPER, display: "flex", flexDirection: "column", justifyContent: "center", padding: 60 * s }}>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 300, fontSize: 34 * s, color: INK }}>{message?.[0]}</div>
        <div style={{ marginTop: 12 * s, fontFamily: "Fraunces", fontWeight: 300, fontSize: 13 * s, lineHeight: 1.5, color: MUTE }}>{message?.[1]}</div>
      </div>
    );
  }
  const { header, title, ridges, notes, caption, facts, footer } = layout;
  return (
    <div style={{ width: W * s, height: H * s, background: PAPER, position: "relative", display: "flex" }}>
      <svg width={W * s} height={H * s} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1={30} y1={42} x2={370} y2={42} stroke={INK} strokeWidth={0.35} />
        {ridges.map((r, i) => [
          <path key={`f${i}`} d={r.fill} fill={PAPER} />,
          <path key={`l${i}`} d={r.line} fill="none" stroke={r.red ? RED : INK} strokeWidth={r.red ? 0.95 : 0.55} strokeLinejoin="round" />,
        ])}
        {notes.map((n) => (
          <line key={n.label} x1={30} y1={n.y} x2={X0 - 8} y2={n.y} stroke={n.red ? RED : INK} strokeWidth={0.3} />
        ))}
        <line x1={30} y1={LABEL_Y} x2={370} y2={LABEL_Y} stroke={INK} strokeWidth={0.35} />
      </svg>
      <Text x={30} y={34} size={5.6} s={s}>{header[0]}</Text>
      <Text x={370} y={34} size={5.6} s={s} end>{header[1]}</Text>
      <Text x={30} y={84} size={25} s={s} serif>
        {title[0] + " "}
        <span style={{ fontStyle: "italic" }}>{title[1]}</span>
      </Text>
      {notes.flatMap((n) => [
        <Text key={`a${n.label}`} x={30} y={n.y - 2.4} size={5.2} s={s} color={n.red ? RED : INK}>{n.label}</Text>,
        <Text key={`b${n.label}`} x={X0 - 8} y={n.y - 2.4} size={5.2} s={s} end color={n.red ? RED : MUTE}>{n.time}</Text>,
      ])}
      {caption.map((line, i) => (
        <Text key={`c${i}`} x={30} y={LABEL_Y + 18 + i * 10.5} size={8} s={s} serif>{line}</Text>
      ))}
      {facts.flatMap((f, i) => [
        <Text key={`k${f.key}`} x={250} y={LABEL_Y + 18 + i * 10.5} size={5.2} s={s} color={MUTE}>{f.key}</Text>,
        <Text key={`v${f.key}`} x={370} y={LABEL_Y + 18 + i * 10.5} size={5.2} s={s} end color={f.red ? RED : INK}>{f.value}</Text>,
      ])}
      <Text x={30} y={540} size={5} s={s} color={MUTE}>{footer[0]}</Text>
      <Text x={370} y={540} size={5} s={s} end color={MUTE}>{footer[1]}</Text>
    </div>
  );
}

// Landscape, for link previews: the plate framed on a wall.
export async function previewImage(layout: PlateLayout | null, message?: [string, string]) {
  const s = 1.0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#d9d3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", background: PAPER, border: "8px solid #1c1b19", padding: 14, boxShadow: "0 18px 40px -12px rgba(40,30,10,0.45)" }}>
          <PlateNode layout={layout} message={message} s={s} />
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await fonts() },
  );
}

// The plate alone at A4, 300 dpi (2480 × 3508), for printing.
export async function printImage(layout: PlateLayout, headers: Record<string, string>) {
  return new ImageResponse(<PlateNode layout={layout} s={2480 / W} />, {
    width: 2480,
    height: Math.round((H * 2480) / W),
    fonts: await fonts(),
    headers,
  });
}
