import { loadPostcard } from "../load";
import { previewImage } from "../plate-image";

// The link preview: the plate, framed on a wall.

export const alt = "A postcard from FramSat-1: one pass of its radio signal, as ridge lines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 900;

export default async function PostcardPreview({ params }: { params: Promise<{ stamp: string }> }) {
  const card = await loadPostcard((await params).stamp);
  return previewImage(card?.layout ?? null, card?.message ?? ["Postcard", "A link from freider.space"]);
}
