import { ImageResponse } from "next/og";
import { moonSvg } from "@/lib/moon-phase";

// Home-screen icon for iPhones and iPads: tonight's Moon on a polar-night
// tile. Redrawn every few hours.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const revalidate = 21600;

export default function AppleIcon() {
  const svg = moonSvg(180, { tile: true });
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} width={180} height={180} alt="" />,
    size,
  );
}
