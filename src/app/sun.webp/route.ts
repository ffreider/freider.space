// /sun.webp: today's Sun for the descent's first stop. The newest GOES-19
// SUVI image (see src/lib/sun.ts), cropped to 1.55 solar radii around the
// Sun, which leaves out NOAA's caption, and made a small WebP. If NOAA can't
// be reached, the copy saved in public/descent/tex is used.

import sharp from "sharp";
import { latestSun, SUVI_DISK_RADIUS } from "@/lib/sun";

export const revalidate = 900;

// How far out from the Sun's centre the crop reaches, in solar radii. The
// shader in public/descent/main.js maps the image with the same number.
const REACH = 1.55;

export async function GET() {
  // a relative redirect, so the route doesn't depend on the request and can be cached
  const fallback = new Response(null, { status: 307, headers: { Location: "/descent/tex/sun-fallback.webp" } });
  const sun = await latestSun();
  if (!sun) return fallback;
  try {
    const res = await fetch(sun.url, { next: { revalidate: 900 } });
    if (!res.ok) return fallback;
    const png = Buffer.from(await res.arrayBuffer());
    const { width = 1280, height = 1280 } = await sharp(png).metadata();
    const half = Math.round(REACH * SUVI_DISK_RADIUS * width);
    const webp = await sharp(png)
      .extract({ left: Math.round(width / 2) - half, top: Math.round(height / 2) - half, width: 2 * half, height: 2 * half })
      .resize(1024, 1024)
      .removeAlpha()
      .webp({ quality: 82 })
      .toBuffer();
    return new Response(new Uint8Array(webp), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=3600",
        "X-Sun-Time": sun.time,
      },
    });
  } catch {
    return fallback;
  }
}
