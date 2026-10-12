import { ImageResponse } from "next/og";
import { moonSvg } from "@/lib/moon-phase";

// The tab icon: tonight's Moon, in its real phase. Redrawn every few hours.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const revalidate = 21600;

export default function Icon() {
  const svg = moonSvg(64);
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} width={64} height={64} alt="" />,
    size,
  );
}
