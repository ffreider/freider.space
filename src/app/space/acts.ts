import type { Act, ColdOpen } from "./types";

// The five acts of chapter 1 and the cold open before the title.
// Counts and orbit numbers are tokens, filled in from the catalogue by code.

export const ACTS: Act[] = [
  {
    id: "act-1",
    numeral: "I",
    title: "The race",
    years: "1957 to 1961",
    before: "sputnik-1",
    count: "{count:1961-12-31}",
    witness:
      "Vanguard 1 went up in March 1958 and is still there. By the end of 1961 it had gone round the Earth {orbits:5:1961-12-31} times.",
  },
  {
    id: "act-2",
    numeral: "II",
    title: "What it was for",
    years: "1962 to 1969",
    before: "starfish-prime",
    count: "{count:1969-12-31}",
    witness: "Vanguard 1 is still up there. By the end of 1969 it will have gone round the Earth {orbits:5:1969-12-31} times.",
  },
  {
    id: "act-3",
    numeral: "III",
    title: "Routine",
    years: "1970 to 1989",
    before: "landsat-1",
    count: "{count:1989-12-31}",
    witness:
      "Vanguard 1 has been silent since May 1964 and keeps going round. By the end of 1989 it will have gone round the Earth {orbits:5:1989-12-31} times.",
  },
  {
    id: "act-4",
    numeral: "IV",
    title: "Business",
    years: "1990 to 2006",
    before: "hubble",
    count: "{count:2006-12-31}",
    witness: "Still silent. By the end of 2006 Vanguard 1 will have made {orbits:5:2006-12-31} circuits.",
  },
  {
    id: "act-5",
    numeral: "V",
    title: "Crowded",
    years: "2007 to 2019",
    before: "fengyun-1c",
    count: "{count:2019-05-24}",
    witness: "Vanguard 1 is still circling. By the day this chapter ends it will have gone round the Earth {orbits:5:2019-05-24} times.",
  },
];

export const COLD_OPEN: ColdOpen | null = {
  kicker: "25 January 1995",
  paragraphs: [
    "A Black Brant XII, a four-stage research rocket, left the range on Andøya in northern Norway on the morning of 25 January 1995. It carried a NASA experiment to study a fountain of ions rising out of the aurora, and it climbed to nearly 1,500 kilometres.",
    "On the Kola Peninsula in Russia, the early-warning radar at Olenegorsk tracked it. According to one account, its path looked like that of an American Trident missile.",
    "The next day, President Boris Yeltsin told reporters: “I used my black suitcase with the alarm button for the first time yesterday, which is carried with me wherever I go.” Or so he said.",
    "How close it came is disputed. Norway had given notice of the launch weeks before, and Russian early-warning officers have since said the briefcase was not activated. The rocket's payload came down near Svalbard, as planned, about 24 minutes after launch.",
  ],
  turn: "So how did the sky get so crowded that a science rocket could look like a missile? To find out, go back to 1957 and an empty sky.",
};
