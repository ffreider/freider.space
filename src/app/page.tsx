import type { Viewport } from "next";
import { Home } from "./home";

// The phone browser's bars in polar night, like the page.
export const viewport: Viewport = { themeColor: "#0a1220" };

export default function Page() {
  return <Home lang="en" />;
}
