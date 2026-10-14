import { inPlace, loadCountries, placeName } from "@/app/place-name";
import { LAUNCH, parseStamp, postcardFor } from "@/lib/postcard";
import { type PlateLayout, plateLayout } from "./plate-layout";

// Everything a postcard needs from its link, for the page and both images.
// `null` for a link that isn't a postcard at all.

export type Loaded = {
  moment: Date;
  layout: PlateLayout | null;
  message: [string, string] | null; // shown instead of a plate
  label: string; // describes the plate, for screen readers
  settled: boolean; // won't change any more, so it can be cached for good
};

export async function loadPostcard(stamp: string): Promise<Loaded | null> {
  const moment = parseStamp(stamp);
  if (!moment) return null;
  const t = moment.getTime();
  const base = { moment, layout: null, label: "" };
  if (t < LAUNCH) {
    return { ...base, settled: true, message: ["Before launch", "FramSat-1 went up on 5 September 2026, at 20:12 UTC. Any minute since then has a postcard."] };
  }
  // A minute of leeway for clocks that run slightly fast.
  if (t > Date.now() + 60_000) {
    return { ...base, settled: false, message: ["Not yet", "This moment hasn’t happened yet. Come back after it has."] };
  }

  const card = await postcardFor(moment);
  if (card.kind === "developing") {
    return {
      ...base,
      settled: false,
      message: ["Developing", "Radio amateurs’ recordings of FramSat-1 take a few hours to be processed. Your plate will be ready here later today, at this same link."],
    };
  }
  if (card.kind === "none") {
    return {
      ...base,
      settled: true,
      message: ["Nothing heard", "No ground station heard FramSat-1 clearly within twelve hours of this moment. It happens, mostly over the oceans."],
    };
  }
  const { pass } = card;
  const where = pass.lat !== null && pass.lon !== null ? inPlace(placeName(await loadCountries(), pass.lat, pass.lon, "en")) : null;
  return {
    moment,
    layout: plateLayout(moment, pass, card.mine, where),
    message: null,
    label: `Ridge lines of FramSat-1's radio signal, received by ${pass.station}${where ? ` in ${where}` : ""}`,
    settled: Date.now() - t > 24 * 3600_000,
  };
}
