import { waterfallUrl } from "@/lib/satnogs-log";
import { waterfallThumbnail } from "@/lib/waterfall";

// A small thumbnail of one reception's waterfall, for the logbook. Made here
// from the SatNOGS image (1 to 2 MB), so visitors' browsers don't contact
// SatNOGS and don't download full images just by scrolling the log. A
// recording never changes, so the thumbnail is cached for good.

export async function GET(_: Request, { params }: RouteContext<"/framsat/log/waterfall/[id]">) {
  const { id } = await params;
  if (!/^\d{1,10}$/.test(id)) return new Response("Not found", { status: 404 });
  const url = await waterfallUrl(Number(id));
  if (!url) return new Response("Not found", { status: 404 });
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return new Response("Not found", { status: 404 });
    const thumb = await waterfallThumbnail(await res.arrayBuffer(), 240, 96);
    return new Response(new Uint8Array(thumb), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
