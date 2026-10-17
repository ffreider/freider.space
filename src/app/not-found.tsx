import type { Metadata } from "next";
import { framsatTle } from "@/lib/framsat-tle";
import { Received } from "./received/received";

// English here; the page switches to the Norwegian title under /no.
export const metadata: Metadata = { title: "Not found | Freider Fløan" };

// Any address the site doesn't have: the waterfall from FramSat-1's last pass
// over Trondheim, with a 404 in the signal.
export default async function NotFound() {
  const tle = await framsatTle();
  return <Received tle={tle} />;
}
