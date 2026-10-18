import { framsatTle } from "@/lib/framsat-tle";
import { loadPostcard } from "../../load";
import { renderCard } from "../../sky";

// The postcard at twice the size (A5 at 300 dpi), to print and frame.

export const maxDuration = 60;

export async function GET(_: Request, { params }: { params: Promise<{ stamp: string }> }) {
  const { stamp } = await params;
  const loaded = await loadPostcard(stamp);
  if (!loaded?.card) return new Response("No postcard to print yet", { status: 404 });
  const png = await renderCard({ ...loaded.card, moment: loaded.moment }, 2, await framsatTle());
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="framsat-1-postcard-${stamp}.png"`,
      "Cache-Control": loaded.settled ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, s-maxage=900",
    },
  });
}
