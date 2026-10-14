import { H, INK, LABEL_Y, MUTE, PAPER, type PlateLayout, RED, W, X0 } from "./plate-layout";

// The plate as vector graphics, for the page: sharp at any size, and the
// text stays text.

const mono = { fontFamily: "var(--font-plex-mono), ui-monospace, monospace", letterSpacing: 0.9 };
const serif = { fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 300 };

export function Plate({ layout, label }: { layout: PlateLayout; label: string }) {
  const { header, title, ridges, notes, caption, facts, footer } = layout;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ display: "block", width: "100%", height: "auto" }}>
      <rect width={W} height={H} fill={PAPER} />
      <text x={30} y={34} fill={INK} fontSize={5.6} style={mono}>{header[0]}</text>
      <text x={370} y={34} fill={INK} fontSize={5.6} textAnchor="end" style={mono}>{header[1]}</text>
      <line x1={30} y1={42} x2={370} y2={42} stroke={INK} strokeWidth={0.35} />
      <text x={30} y={84} fill={INK} fontSize={25} style={serif}>
        {title[0]} <tspan fontStyle="italic">{title[1]}</tspan>
      </text>

      {ridges.map((r, i) => (
        <g key={i}>
          <path d={r.fill} fill={PAPER} />
          <path d={r.line} fill="none" stroke={r.red ? RED : INK} strokeWidth={r.red ? 0.95 : 0.55} strokeLinejoin="round" />
        </g>
      ))}

      {notes.map((note) => (
        <g key={note.label}>
          <line x1={30} y1={note.y} x2={X0 - 8} y2={note.y} stroke={note.red ? RED : INK} strokeWidth={0.3} />
          <text x={30} y={note.y - 2.4} fill={note.red ? RED : INK} fontSize={5.2} style={mono}>{note.label}</text>
          <text x={X0 - 8} y={note.y - 2.4} fill={note.red ? RED : MUTE} fontSize={5.2} textAnchor="end" style={mono}>{note.time}</text>
        </g>
      ))}

      <line x1={30} y1={LABEL_Y} x2={370} y2={LABEL_Y} stroke={INK} strokeWidth={0.35} />
      {caption.map((line, i) => (
        <text key={i} x={30} y={LABEL_Y + 18 + i * 10.5} fill={INK} fontSize={8} style={serif}>{line}</text>
      ))}
      {facts.map((f, i) => (
        <g key={f.key}>
          <text x={250} y={LABEL_Y + 18 + i * 10.5} fill={MUTE} fontSize={5.2} style={mono}>{f.key}</text>
          <text x={370} y={LABEL_Y + 18 + i * 10.5} fill={f.red ? RED : INK} fontSize={5.2} textAnchor="end" style={mono}>{f.value}</text>
        </g>
      ))}
      <text x={30} y={540} fill={MUTE} fontSize={5} style={mono}>{footer[0]}</text>
      <text x={370} y={540} fill={MUTE} fontSize={5} textAnchor="end" style={mono}>{footer[1]}</text>
    </svg>
  );
}
