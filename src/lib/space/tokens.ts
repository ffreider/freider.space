import { dayOf, type SpaceObject } from "./catalogue.ts";
import { countAt, type Counts } from "./counts.ts";

// Numbers in the story's text are written as tokens and filled in from the
// catalogue on the server, so the words, the counter and the globe can't
// disagree.
//
//   {count:1957-10-04}          objects in orbit that day
//   {count:2007-01-11:debris}   only one kind: satellites, rocketBodies, debris, unknown
//   {orbits:5:2019-05-24}       how many times object NORAD 5 (Vanguard 1) had
//                               gone round the Earth by that day
//
// A token that can't be filled throws: a wrong number in a sentence is worse
// than a failed build.

const DATE = "(\\d{4}-\\d\\d-\\d\\d)";
const TOKEN = new RegExp(`\\{count:${DATE}(?::(\\w+))?\\}|\\{orbits:(\\d+):${DATE}\\}`, "g");

const dayAt = (iso: string) => dayOf(new Date(`${iso}T00:00:00Z`));
const fmt = (n: number) => n.toLocaleString("en-GB");

export function fillTokens(text: string, objs: SpaceObject[]): string {
  return text.replace(TOKEN, (token, countIso?: string, kind?: string, norad?: string, orbitsIso?: string) => {
    if (countIso) {
      const counts = countAt(objs, dayAt(countIso));
      const key = (kind ?? "total") as keyof Counts;
      if (!(key in counts)) throw new Error(`unknown kind in ${token}`);
      return fmt(counts[key]);
    }
    const day = dayAt(orbitsIso!);
    const obj = objs.find((o) => o.norad === Number(norad));
    if (!obj) throw new Error(`no object ${norad} in the catalogue for ${token}`);
    if (day < obj.launchDay) throw new Error(`${token}: the object had not launched yet`);
    if (obj.decayDay !== null && obj.decayDay <= day) throw new Error(`${token}: the object had already fallen`);
    // A day is 1,440 minutes. The period is the catalogue's, held fixed, so
    // this is a count to the nearest few hundred over 60 years, not a
    // measurement (the real period shortened slightly with drag).
    return fmt(Math.floor(((day - obj.launchDay) * 1440) / obj.periodMin));
  });
}
