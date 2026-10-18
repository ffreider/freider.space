import { inPlace, loadCountries, placeName } from "@/app/place-name";
import { LAUNCH, type Pass, parseStamp, postcardFor } from "@/lib/postcard";

// Everything a postcard needs from its link, for the page and the images.
// `null` for a link that isn't a postcard at all.

export type Loaded = {
  moment: Date;
  card: { pass: Pass; mine: number; where: string | null } | null;
  message: [string, string] | null; // shown instead of a card
  label: string; // describes the card, for screen readers
  settled: boolean; // won't change any more, so it can be cached for good
};

export async function loadPostcard(stamp: string): Promise<Loaded | null> {
  const moment = parseStamp(stamp);
  if (!moment) return null;
  const t = moment.getTime();
  const base = { moment, card: null, label: "" };
  if (t < LAUNCH) {
    return { ...base, settled: true, message: ["Before launch", "FramSat-1 went up on 5 September 2026, at 20:12 UTC. Any minute since then has a postcard."] };
  }
  // A minute of leeway for clocks that run slightly fast.
  if (t > Date.now() + 60_000) {
    return { ...base, settled: false, message: ["Not yet", "This moment hasn’t happened yet. Come back after it has."] };
  }

  const found = await postcardFor(moment);
  if (found.kind === "developing") {
    return {
      ...base,
      settled: false,
      message: ["Developing", "Radio amateurs’ recordings of FramSat-1 take a few hours to be processed. Your postcard will be ready here later today, at this same link."],
    };
  }
  if (found.kind === "none") {
    return {
      ...base,
      settled: true,
      message: ["Nothing heard", "No ground station heard FramSat-1 clearly within twelve hours of this moment. It happens, mostly over the oceans."],
    };
  }
  const { pass } = found;
  const where = pass.lat !== null && pass.lon !== null ? inPlace(placeName(await loadCountries(), pass.lat, pass.lon, "en")) : null;
  return {
    moment,
    card: { pass, mine: found.mine, where },
    message: null,
    label: `The sky over ${pass.station}${where ? ` in ${where}` : ""} as FramSat-1 passed, with each radio packet the station received drawn as a dash of light`,
    settled: Date.now() - t > 24 * 3600_000,
  };
}
