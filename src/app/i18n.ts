// The site comes in English (/) and Norwegian Bokmål (/no).

export type Lang = "en" | "no";

// A piece of text in both languages.
export type L = { en: string; no: string };

export const LOCALE: Record<Lang, string> = { en: "en-GB", no: "nb-NO" };

// Number formatting that follows the language: 27,148.5 in English,
// 27 148,5 in Norwegian.
export function numbers(lang: Lang) {
  const locale = lang === "en" ? "en-US" : "nb-NO";
  const fixed = (n: number, digits: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return {
    whole: (n: number) => Math.round(n).toLocaleString(locale),
    fixed,
    signed: (n: number, digits: number) => `${n >= 0 ? "+" : "−"}${fixed(Math.abs(n), digits)}`,
  };
}
