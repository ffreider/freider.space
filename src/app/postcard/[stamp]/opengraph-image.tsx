import { ImageResponse } from "next/og";
import { framsatTle } from "@/lib/framsat-tle";
import { loadPostcard } from "../load";
import { previewImage, renderCard } from "../sky";

// The link preview: the postcard on a dark ground.

export const alt = "A postcard from FramSat-1: the sky over a radio station as the satellite passed, its packets as dashes of light";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 900;
export const maxDuration = 60;

export default async function PostcardPreview({ params }: { params: Promise<{ stamp: string }> }) {
  const loaded = await loadPostcard((await params).stamp);
  if (!loaded?.card) {
    const [title, text] = loaded?.message ?? ["Postcard", "A link from freider.space"];
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#04060b", color: "#dce6f2" }}>
          <div style={{ fontSize: 64 }}>{title}</div>
          <div style={{ fontSize: 28, marginTop: 20, color: "#7c8c9e", maxWidth: 900 }}>{text}</div>
        </div>
      ),
      size,
    );
  }
  const card = await renderCard({ ...loaded.card, moment: loaded.moment }, 1, await framsatTle());
  return new Response(new Uint8Array(await previewImage(card)), { headers: { "Content-Type": "image/png" } });
}
