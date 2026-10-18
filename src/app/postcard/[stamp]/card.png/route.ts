import { framsatTle } from "@/lib/framsat-tle";
import { loadPostcard } from "../../load";
import { renderCard } from "../../sky";

// The postcard itself, as the page shows it (A6 at 300 dpi).

export const maxDuration = 60;

export async function GET(_: Request, { params }: { params: Promise<{ stamp: string }> }) {
  const { stamp } = await params;
  const loaded = await loadPostcard(stamp);
  if (!loaded?.card) return new Response("No postcard yet", { status: 404 });
  const png = await renderCard({ ...loaded.card, moment: loaded.moment }, 1, await framsatTle());
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // A settled postcard never changes.
      "Cache-Control": loaded.settled ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, s-maxage=900",
    },
  });
}
