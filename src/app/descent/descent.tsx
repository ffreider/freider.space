import { descentTles } from "@/lib/descent-tles";
import type { Entry, TEXT, YearMonth } from "../home";
import type { Lang } from "../i18n";
import { DescentScripts } from "./scripts";
import { DESCENT_BODY, DESCENT_CSS } from "./markup";

// The homepage: a scroll-driven descent from the Moon to FramSat-1, past real
// spacecraft placed from their latest orbital elements. The markup and styles
// are in markup.ts, the behaviour in public/descent/core.js and main.js.
//
// The text is filled in here on the server, so search engines and AI tools
// read the whole page without running it. In the browser, core.js renders
// the same text again from the JSON passed along below.

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Photo thumbnails: about a fifth of the text column on desktop, most of the
// screen in the swipeable rows on phones.
const THUMB_SIZES = "(max-width: 900px) 84vw, 200px";

// A number never parts from its unit at a line break ("35,786 km").
const keepUnits = (s: string) => s.replace(/(\d) (?=(km\/s|km|ms|kg|s|min|h|%)(?![\w]))/g, "$1\u00a0");

// JSON that is safe to place inside a <script> element.
const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

const NOW_WORD = { en: "now", no: "nå" };

// The markup's accessible labels, in Norwegian for /no.
const LABELS_NO: Record<string, string> = {
  "What you are passing": "Det du passerer",
  Stops: "Stopp",
  View: "Visning",
  "FramSat-1 tracker": "FramSat-1-sporing",
  "Globe showing FramSat-1's position and ground track. Drag to turn it.": "Globus med FramSat-1s posisjon og bakkespor. Dra for å snu den.",
  "Time offset in minutes": "Tidsforskyvning i minutter",
};

const period = (start: YearMonth, end: YearMonth | undefined, lang: Lang) =>
  end
    ? start[0] === end[0]
      ? `${start[0]}`
      : `${start[0]}-${end[0]}`
    : `${start[0]}-${NOW_WORD[lang]}`;

// The list under Experience, as core.js's renderRoles builds it.
function rolesHtml(timeline: Entry[], lang: Lang) {
  return timeline
    .map((e) => {
      const name = e.org[lang];
      const org = e.href
        ? `<a href="${e.href}" target="_blank" rel="noopener">${escape(name)}</a>`
        : escape(name);
      const start = e.roles[e.roles.length - 1].start;
      let html = `<li><div class="org"><strong>${org}</strong><span class="when">${period(start, e.end, lang)}</span></div>`;
      if (e.description) html += `<p class="desc">${escape(e.description[lang])}</p>`;
      if (e.roles.length === 1) {
        html += `<p class="role-one">${escape(e.roles[0].title[lang])}</p>`;
      } else {
        html += `<ul class="sub">`;
        e.roles.forEach((role, i) => {
          const end = i > 0 ? e.roles[i - 1].start : e.end;
          html += `<li><div class="row"><span>${escape(role.title[lang])}</span><span class="when">${period(role.start, end, lang)}</span></div>`;
          if (role.note) html += `<span class="note">${escape(role.note[lang])}</span>`;
          html += `</li>`;
        });
        html += `</ul>`;
      }
      if (e.photos?.length) {
        html += `<div class="shots">`;
        for (const p of e.photos) {
          const cap = escape(p.caption[lang]);
          html += `<figure><button class="shot" type="button" data-full="/descent/photos/${p.src}-1600.webp" data-pw="${p.w}" data-ph="${p.h}"><img src="/descent/photos/${p.src}-640.webp" srcset="/descent/photos/${p.src}-640.webp 640w, /descent/photos/${p.src}-1000.webp 1000w" sizes="${THUMB_SIZES}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" alt="${cap}"></button><figcaption>${cap}${p.link ? ` <a href="${p.link.href}" target="_blank" rel="noopener">${escape(p.link.text[lang])}</a>` : ""}</figcaption></figure>`;
        }
        html += `</div>`;
      }
      return html + `</li>`;
    })
    .join("");
}

function fill(text: (typeof TEXT)["en"], timeline: Entry[], lang: Lang) {
  const strings = text as unknown as Record<string, unknown>;
  return (
    DESCENT_BODY
      // <tag data-t="key"></tag>: plain text
      .replace(/(<([a-z0-9]+)\b[^>]*\bdata-t="(\w+)"[^>]*>)(<\/\2>)/g, (whole, open, _tag, key, close) =>
        typeof strings[key] === "string" ? open + keepUnits(escape(strings[key] as string)) + close : whole,
      )
      // <tag data-h="key"></tag>: HTML (links)
      .replace(/(<([a-z0-9]+)\b[^>]*\bdata-h="(\w+)"[^>]*>)(<\/\2>)/g, (whole, open, _tag, key, close) =>
        typeof strings[key] === "string" ? open + keepUnits(strings[key] as string) + close : whole,
      )
      .replace(`<ul class="roles" id="roles"></ul>`, `<ul class="roles" id="roles">${rolesHtml(timeline, lang)}</ul>`)
      .replace(
        `<ul class="degrees" id="degrees"></ul>`,
        `<ul class="degrees" id="degrees">${text.degrees.map((d) => `<li>${escape(d)}</li>`).join("")}</ul>`,
      )
      .replace(
        `<a class="chip" id="langBtn" href="/no" hreflang="nb">Norsk</a>`,
        lang === "no"
          ? `<a class="chip" id="langBtn" href="/" hreflang="en">English</a>`
          : `<a class="chip" id="langBtn" href="/no" hreflang="nb">Norsk</a>`,
      )
      .replace(`href="/framsat"`, lang === "no" ? `href="/no/framsat"` : `href="/framsat"`)
      .replaceAll("__HI__", lang === "no" ? "Hei der :)" : "Hi there :)")
      .replace(
        "__ABOUT_ALT__",
        lang === "no" ? "Freider i en hvit romdrakt med hjelm, mellom to folk fra Nåva Space" : "Freider in a white spacesuit and helmet, between two people from Nåva Space",
      )
      .replace(
        "__FRAMSAT_ALT__",
        lang === "no" ? "FramSat-1, en liten kubeformet satellitt med solcellepaneler, på en antistatisk pose med røde Orbit NTNU-merkelapper" : "FramSat-1, a small cube-shaped satellite with solar panels, on an anti-static bag with red Orbit NTNU tags",
      )
      .replace(
        "__ANDOYA_ALT__",
        lang === "no" ? "En lysende rakettbane i bue opp fra Andøya i blå skumring, over vann og fjell" : "A rocket’s glowing trail arcing up from Andøya in blue twilight, over water and mountains",
      )
      .replace(
        "__LAUNCH_ALT__",
        lang === "no"
          ? "Isar Aerospaces Spectrum-rakett letter fra oppskytningsrampen på Andøya i flammer og røyk"
          : "Isar Aerospace’s Spectrum rocket lifting off its pad on Andøya in fire and smoke",
      )
      .replace(/aria-label="([^"]+)"/g, (whole, label: string) => (lang === "no" && LABELS_NO[label] ? `aria-label="${LABELS_NO[label]}"` : whole))
  );
}

export async function Descent({
  lang,
  timeline,
  text,
}: {
  lang: Lang;
  timeline: Entry[];
  text: typeof TEXT;
}) {
  const tles = await descentTles();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DESCENT_CSS }} />
      {/* without JavaScript the cover steps aside on its own, so scrolling must work */}
      <noscript>
        <style>{"html, body { overflow: auto !important; }"}</style>
      </noscript>
      <div id="descent" data-lang={lang} dangerouslySetInnerHTML={{ __html: fill(text[lang], timeline, lang) }} />
      <script type="application/json" id="tleData" dangerouslySetInnerHTML={{ __html: json(tles) }} />
      <script type="application/json" id="timelineData" dangerouslySetInnerHTML={{ __html: json(timeline) }} />
      <script type="application/json" id="textData" dangerouslySetInnerHTML={{ __html: json(text) }} />
      <DescentScripts />
    </>
  );
}
