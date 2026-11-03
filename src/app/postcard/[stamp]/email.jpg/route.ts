import sharp from "sharp";
import { framsatTle } from "@/lib/framsat-tle";
import { loadPostcard } from "../../load";
import { CARD, renderCard } from "../../sky";

// The postcard for an email: cropped to the square around the sky disc
// (compass letters included) and saved as a JPEG about 60 KB, where the
// print-ready card is nearly 2 MB. The station and time go in the email's
// text instead.

export const maxDuration = 60;

const SIZE = 1200; // twice the email's width, for sharp phone screens

export async function GET(_: Request, { params }: { params: Promise<{ stamp: string }> }) {
  const { stamp } = await params;
  const loaded = await loadPostcard(stamp);
  if (!loaded?.card) return new Response("No postcard yet", { status: 404 });
  const png = await renderCard({ ...loaded.card, moment: loaded.moment }, 1, await framsatTle());
  // The disc is centred at 42% of the card's height (see renderCard).
  const top = Math.round(CARD.height * 0.42 - CARD.width / 2);
  const jpg = await sharp(png)
    .extract({ left: 0, top, width: CARD.width, height: CARD.width })
    .resize(SIZE)
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": loaded.settled ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, s-maxage=900",
    },
  });
}
