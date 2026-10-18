import type { Metadata, Viewport } from "next";
import { CHAPTER1 } from "./chapter1";
import { Story } from "./story";

// freider.space/space: the story of the space age told through every object
// ever tracked in orbit. Chapter 1, 1957 to 2019; chapters 2 and 3 (now, and
// what's planned) will follow on the same page.

const title = "How we got here: the space age, 1957 to 2019";
const description =
  "From Sputnik to the first Starlinks: the story of how the sky above us filled up, told through every object ever tracked in orbit.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/space" },
  openGraph: { title, description, url: "/space", type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#04060b" };

export default function SpacePage() {
  return <Story beats={CHAPTER1} />;
}
