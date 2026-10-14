import { loadPostcard } from "../../load";
import { printImage } from "../../plate-image";

// The plate alone as a PNG at A4, 300 dpi, to print and frame.

export async function GET(_: Request, { params }: { params: Promise<{ stamp: string }> }) {
  const { stamp } = await params;
  const card = await loadPostcard(stamp);
  if (!card?.layout) return new Response("No postcard to print yet", { status: 404 });
  return printImage(card.layout, {
    "Content-Disposition": `attachment; filename="framsat-1-postcard-${stamp}.png"`,
    // A plate that's settled never changes.
    "Cache-Control": card.settled ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, s-maxage=900",
  });
}
