// Shared text, palettes, experience chart and the FramSat-1 globe for the descent
// (src/app/descent). Plain browser script, loaded after its libraries.
window.Core = (() => {
  "use strict";

  const same = s => ({ en: s, no: s });
  // The site's content (timeline and the shared text) comes from the server
  // as JSON, from src/app/home.tsx, so there is one copy of it.
  const json = id => JSON.parse(document.getElementById(id).textContent);
  const timeline = json("timelineData");

  function fmtDur(min) {
    min = Math.round(Math.abs(min));
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  const STR = {
    en: {
      other: "Norsk",
      thermal: "Thermal",
      nowWord: "now",
      now: "Now", nowShort: "Now",
      lat: "Latitude", lon: "Longitude", alt: "Altitude", speed: "Speed",
      elev: "Elevation from Trondheim", doppler: "Doppler, 435.141 MHz",
      follow: "Follow",
      computed: "Computed in your browser from its orbital elements.",
      tracker: "Full tracker",
      trackerHref: "/framsat",
      facts: ["Launched 5 Sep 2026", "NORAD 98914", "95.8 min orbit", "516–596 km", "97.4° polar", "Downlink 435.141 MHz"],
      liveNow: (alt, place, dir, spd) => `Right now it’s ${alt} km above ${place}, heading ${dir} at ${spd} km/s.`,
      liveAt: (time, rel, alt, place, dir) => `At ${time} (${rel}) it ${rel.startsWith("in") ? "will be" : "was"} ${alt} km above ${place}, heading ${dir}.`,
      north: "north", south: "south",
      inH: m => `in ${fmtDur(m)}`, agoH: m => `${fmtDur(m)} ago`,
      below: "below horizon",
      nextPass: (t, rel, el) => `Next pass over Trondheim: ${t} (${rel}), up to ${el}° above the horizon.`,
      overhead: el => `Over Trondheim now, ${el}° above the horizon. Tune to 435.141 MHz.`,
      noPass: "No pass over Trondheim in the next 24 hours.",
      noLoad: "The live position could not load here.",
      ocean: { arctic: "the Arctic Ocean", southern: "the Southern Ocean", atlantic: "the Atlantic Ocean", indian: "the Indian Ocean", pacific: "the Pacific Ocean" },
      west: "W",
      locale: "en-GB", region: "en",
    },
    no: {
      other: "English",
      thermal: "Termisk",
      nowWord: "nå",
      now: "Nå", nowShort: "Nå",
      lat: "Breddegrad", lon: "Lengdegrad", alt: "Høyde", speed: "Fart",
      elev: "Elevasjon fra Trondheim", doppler: "Doppler, 435,141 MHz",
      follow: "Følg",
      computed: "Beregnet i nettleseren din fra banedataene.",
      tracker: "Full sporing",
      trackerHref: "/no/framsat",
      facts: ["Skutt opp 5. sep. 2026", "NORAD 98914", "95,8 min omløp", "516–596 km", "97,4° polar", "Nedlink 435,141 MHz"],
      liveNow: (alt, place, dir, spd) => `Akkurat nå er den ${alt} km over ${place}, på vei ${dir} i ${spd} km/s.`,
      liveAt: (time, rel, alt, place, dir) => `Klokka ${time} (${rel}) ${rel.startsWith("om") ? "vil den være" : "var den"} ${alt} km over ${place}, på vei ${dir}.`,
      north: "nordover", south: "sørover",
      inH: m => `om ${fmtDur(m)}`, agoH: m => `for ${fmtDur(m)} siden`,
      below: "under horisonten",
      nextPass: (t, rel, el) => `Neste passering over Trondheim: ${t} (${rel}), opptil ${el}° over horisonten.`,
      overhead: el => `Over Trondheim nå, ${el}° over horisonten. Lytt på 435,141 MHz.`,
      noPass: "Ingen passering over Trondheim de neste 24 timene.",
      noLoad: "Posisjonen kunne ikke lastes her.",
      ocean: { arctic: "Nordishavet", southern: "Sørishavet", atlantic: "Atlanterhavet", indian: "Det indiske hav", pacific: "Stillehavet" },
      west: "V",
      locale: "nb-NO", region: "nb",
    },
  };

  /* ---------- palettes ---------- */
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const POLY = {
    inferno: [[0.0002189403691192265, 0.001651004631001012, -0.01948089843709184], [0.1065134194856116, 0.5639564367884091, 3.932712388889277], [11.60249308247187, -3.972853965665698, -15.9423941062914], [-41.70399613139459, 17.43639888205313, 44.35414519872813], [77.162935699427, -33.40235894210092, -81.80730925738993], [-71.31942824499214, 32.62606426397723, 73.20951985803202], [25.13112622477341, -12.24266895238567, -23.07032500287172]],
    magma: [[-0.002136485053939582, -0.000749655052795221, -0.005386127855323933], [0.2516605407371642, 0.6775232436837668, 2.494026599312351], [8.353717279216625, -3.577719514958484, 0.3144679030132573], [-27.66873308576866, 14.26473078096533, -13.64921318813922], [52.17613981234068, -27.94360607168351, 12.94416944238394], [-50.76852536473588, 29.04658282127291, 4.23415299384598], [18.65570506591883, -11.48977351997711, -5.601961508734096]],
  };
  const poly = (c, t) => [0, 1, 2].map(k => { let v = c[6][k]; for (let i = 5; i >= 0; i--) v = c[i][k] + t * v; return clamp01(v); });
  const inferno = t => poly(POLY.inferno, clamp01(t));
  const magma = t => poly(POLY.magma, clamp01(t));
  function turbo(x) {
    x = clamp01(x);
    const v4 = [1, x, x * x, x * x * x], v2 = [v4[2] * v4[2], v4[3] * v4[2]];
    const d = (a, b) => a[0] * v4[0] + a[1] * v4[1] + a[2] * v4[2] + a[3] * v4[3] + b[0] * v2[0] + b[1] * v2[1];
    return [d([0.13572138, 4.61539260, -42.66032258, 132.13108234], [-152.94239396, 59.28637943]),
      d([0.09140261, 2.19418839, 4.84296658, -14.18503333], [4.27729857, 2.82956604]),
      d([0.10667330, 12.64194608, -60.58204836, 110.36276771], [-89.90310912, 27.34824973])].map(clamp01);
  }
  const OIII = [[0, 0, 0], [0.01, 0.05, 0.22], [0.0, 0.42, 0.55], [0.25, 0.9, 0.82], [0.96, 1.0, 0.94]];
  function oiii(t) {
    const x = clamp01(t) * 4, i = Math.min(3, Math.floor(x)), f = x - i;
    return [0, 1, 2].map(k => OIII[i][k] + (OIII[i + 1][k] - OIII[i][k]) * f);
  }
  const css = (c, a) => a == null ? `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})` : `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${a})`;
  const gradient = (fn, a, b, n = 11) => "linear-gradient(90deg," + Array.from({ length: n }, (_, i) => `${css(fn(a + (b - a) * i / (n - 1)))} ${i * 100 / (n - 1)}%`).join(",") + ")";

  /* ---------- language ---------- */
  // The page's language is set by its route (/ or /no).
  let lang = document.getElementById("descent").dataset.lang === "no" ? "no" : "en";
  const S = () => STR[lang];
  const listeners = [];
  function extend(extra) { for (const l of ["en", "no"]) Object.assign(STR[l], extra[l]); }
  extend(json("textData"));
  function onLang(f) { listeners.push(f); }
  function setLang(l) { lang = l; render(); }

  // Water that isn't in a country: seas inside or beside the continents, as rough boxes (south, north, west,
  // east). Only asked when the point isn't in a country, so a box may overlap
  // land; where boxes overlap, the first wins. Without these, the ocean guess
  // called the Black Sea "the Pacific Ocean". Shared by the card (main.js)
  // and the tracker, so they never disagree.
  const SEAS = [
    [40.8, 46.8, 27.3, 41.8, { en: "the Black Sea", no: "Svartehavet" }],
    [36.5, 47.2, 46.5, 54.8, { en: "the Caspian Sea", no: "Det kaspiske hav" }],
    [23.8, 30.5, 47.5, 56.5, { en: "the Persian Gulf", no: "Persiabukta" }],
    [12.5, 30.0, 32.0, 43.5, { en: "the Red Sea", no: "Rødehavet" }],
    [30.0, 46.0, -6.0, 36.5, { en: "the Mediterranean Sea", no: "Middelhavet" }],
    [53.5, 66.0, 9.5, 30.5, { en: "the Baltic Sea", no: "Østersjøen" }],
    [51.0, 61.5, -4.5, 9.5, { en: "the North Sea", no: "Nordsjøen" }],
    [61.5, 72.0, -10.0, 16.0, { en: "the Norwegian Sea", no: "Norskehavet" }],
    [69.0, 80.0, 16.0, 60.0, { en: "the Barents Sea", no: "Barentshavet" }],
    [18.0, 31.0, -98.0, -80.5, { en: "the Gulf of Mexico", no: "Mexicogolfen" }],
    [9.0, 22.0, -88.0, -59.5, { en: "the Caribbean Sea", no: "Karibhavet" }],
    [51.0, 64.0, -95.0, -76.5, { en: "Hudson Bay", no: "Hudsonbukta" }],
    [34.0, 52.0, 127.0, 142.5, { en: "the Sea of Japan", no: "Japanhavet" }],
  ];
  function oceanName(lat, lon) {
    for (const [la0, la1, lo0, lo1, name] of SEAS) if (lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1) return name[lang];
    const o = S().ocean;
    if (lat > 66) return o.arctic;
    if (lat < -60) return o.southern;
    if (lat < -30 && lon > 20 && lon < 147) return o.indian;
    if (lon >= -70 && lon <= 20) return o.atlantic;
    if (lon > -100 && lon < -70 && lat > 8) return o.atlantic;
    if (lon > 20 && lon < 120 && lat < 25) return o.indian;
    return o.pacific;
  }

  /* ---------- experience ---------- */
  const FIRST = 2019, LAST = 2027;
  const toY = ([y, m]) => y + (m - 1) / 12;
  const today = new Date();
  const NOW = today.getFullYear() + today.getMonth() / 12;
  const pct = t => (t - FIRST) / (LAST - FIRST) * 100;
  const startOf = e => e.roles[e.roles.length - 1].start;
  function spans(e) {
    return e.roles.map((role, i) => {
      const newer = e.roles[i - 1];
      return { role, end: newer ? newer.start : e.end, from: toY(role.start),
        to: newer ? toY(newer.start) : e.end ? toY(e.end) + 1 / 12 : NOW,
        current: i === 0 && !e.end, first: i === e.roles.length - 1 };
    });
  }
  const period = (start, end) => end ? (start[0] === end[0] ? `${start[0]}` : `${start[0]}-${end[0]}`) : `${start[0]}-${S().nowWord}`;
  let barGradient = gradient(t => inferno(t), 0.3, 0.98);
  function slice(left, width) {
    const size = 100 / width * 100;
    const pos = width >= 100 ? 0 : left / (100 - width) * 100;
    return `background:${barGradient};background-size:${size}% 100%;background-position:${pos}% 0;`;
  }
  function renderChart(fig) {
    if (!fig) return;
    let html = `<div class="grid">`;
    for (let y = FIRST; y < LAST; y++) html += `<div class="yr" style="left:${pct(y)}%"><span>’${String(y).slice(2)}</span></div>`;
    html += `<div class="nowline" style="left:${pct(NOW)}%"><span>${S().nowWord}</span></div></div><ol>`;
    timeline.forEach(e => {
      const segs = spans(e);
      const left = pct(toY(startOf(e)));
      const right = pct(segs[0].to);
      const before = left > 100 - right;
      const label = (e.short || e.org)[lang];
      html += `<li>`;
      segs.forEach(({ from, to, current, first }) => {
        const l = pct(from), w = Math.max(pct(to) - l, 0.8);
        const cls = current ? "seg" : `seg past${!e.end ? " ongoing" : ""}`;
        const pos = first ? `left:${l}%;width:${w}%;` : `left:calc(${l}% + 3px);width:calc(${w}% - 3px);`;
        html += `<span class="${cls}" style="${pos}${slice(l, w)}"></span>`;
      });
      segs.forEach(({ from, first }) => {
        html += first ? `<span class="dot" style="left:${pct(from)}%"></span>` : `<span class="tick" style="left:calc(${pct(from)}% + 1px)"></span>`;
      });
      html += before
        ? `<span class="lab" style="right:calc(${100 - left}% + 10px)">${label}</span>`
        : `<span class="lab" style="left:calc(${right}% + 10px)">${label}</span>`;
      html += `</li>`;
    });
    fig.innerHTML = html + `</ol>`;
  }
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function renderRoles(ul) {
    if (!ul) return;
    ul.replaceChildren(...timeline.map(e => {
      const li = el("li");
      const org = el("div", "org");
      const name = el("strong");
      if (e.href) { const a = el("a", null, e.org[lang]); a.href = e.href; a.target = "_blank"; a.rel = "noopener"; name.append(a); }
      else name.textContent = e.org[lang];
      org.append(name, el("span", "when", period(startOf(e), e.end)));
      li.append(org);
      if (e.description) li.append(el("p", "desc", e.description[lang]));
      if (e.roles.length === 1) li.append(el("p", "role-one", e.roles[0].title[lang]));
      else {
        const sub = el("ul", "sub");
        spans(e).forEach(({ role, end }) => {
          const r = el("li");
          const row = el("div", "row");
          row.append(el("span", null, role.title[lang]), el("span", "when", period(role.start, end)));
          r.append(row);
          if (role.note) r.append(el("span", "note", role.note[lang]));
          sub.append(r);
        });
        li.append(sub);
      }
      return li;
    }));
  }

  function render() {
    const s = S();
    document.documentElement.lang = lang === "no" ? "nb" : "en";
    const keepUnits = v => v.replace(/(\d) (?=(km\/s|km|ms|kg|s|min|h|%)(?![\w]))/g, "$1\u00a0");   // as on the server
    document.querySelectorAll("[data-t]").forEach(n => { const v = s[n.dataset.t]; if (typeof v === "string") n.textContent = keepUnits(v); });
    const $ = id => document.getElementById(id);
    if ($("langBtn")) $("langBtn").textContent = s.other;
    if ($("trackerLink")) $("trackerLink").href = s.trackerHref;
    if ($("degrees")) $("degrees").replaceChildren(...s.degrees.map(d => el("li", null, d)));
    if ($("facts")) $("facts").replaceChildren(...s.facts.map(f => el("span", null, f)));
    renderChart($("chart"));
    renderRoles($("roles"));
    listeners.forEach(f => f(lang));
  }

  /* ---------- FramSat-1 globe ---------- */
  function createGlobe(opt) {
    const TLE = [
      "1 98914U 26203B   26267.74444959  .00002983  00000-0  22116-3 0  9990",
      "2 98914  97.4205 342.2551 0057654 211.8046 147.9693 15.02507306  2843"];
    const TRD = { lat: 63.4305, lon: 10.3951, h: 0.05 };
    const F0 = 435.141e6, C = 299792.458;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = opt.canvas;
    const $ = id => document.getElementById(id);
    const ok = !!(window.d3 && window.topojson && window.satellite);
    const ctx = cv.getContext("2d");
    let visible = false, rot = [-10, -40, 0], follow = true, dragging = false, needDraw = true;
    let offsetMin = 0, speed = 0, simBase = Date.now(), realBase = performance.now();
    let countries, dots = [], borders, satrec, iso = {};
    let lastText = 0, lastPass = -1e9, passCache = null;
    const font = opt.font || '"IBM Plex Mono", monospace';

    if (!ok) { if ($("live")) $("live").textContent = S().noLoad; return { frame() {}, refresh() {}, redraw() {} }; }

    const world = JSON.parse($("worldData").textContent);
    iso = JSON.parse($("isoData").textContent);
    countries = topojson.feature(world, world.objects.countries).features;
    const land = topojson.merge(world, world.objects.countries.geometries);
    borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
    satrec = satellite.twoline2satrec(TLE[0], TLE[1]);
    {
      const W = 720, H = 360, off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      const eq = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
      octx.fillStyle = "#fff"; octx.beginPath(); d3.geoPath(eq, octx)(land); octx.fill();
      const img = octx.getImageData(0, 0, W, H).data;
      const step0 = opt.dotStep || 1.6;
      for (let lat = -84; lat <= 84; lat += step0) {
        const step = step0 / Math.max(0.2, Math.cos(lat * Math.PI / 180));
        for (let lon = -180; lon < 180; lon += step) {
          const [x, y] = eq([lon, lat]);
          const i = ((Math.round(y) * W) + Math.round(x)) * 4;
          if (img[i + 3] > 120) {
            const heat = Math.pow(Math.cos(lat * Math.PI / 180), 1.6) * 0.82 + 0.1 + Math.sin(lon * 0.21) * Math.cos(lat * 0.17) * 0.04;
            dots.push([lon, lat, opt.landColor(clamp01(heat))]);
          }
        }
      }
    }

    const simNow = () => (speed ? simBase + (performance.now() - realBase) * speed : Date.now()) + offsetMin * 60000;
    function sat(date) {
      const pv = satellite.propagate(satrec, date);
      if (!pv || !pv.position) return null;
      const gmst = satellite.gstime(date);
      const gd = satellite.eciToGeodetic(pv.position, gmst);
      const v = pv.velocity;
      return { lat: satellite.degreesLat(gd.latitude), lon: satellite.degreesLong(gd.longitude), alt: gd.height,
        spd: Math.hypot(v.x, v.y, v.z), ecf: satellite.eciToEcf(pv.position, gmst) };
    }
    const obs = { latitude: TRD.lat * Math.PI / 180, longitude: TRD.lon * Math.PI / 180, height: TRD.h };
    function look(date) {
      const s = sat(date); if (!s) return null;
      const la = satellite.ecfToLookAngles(obs, s.ecf);
      return { el: la.elevation * 180 / Math.PI, range: la.rangeSat };
    }
    function subsolar(date) {
      const d = (date - Date.UTC(2000, 0, 1, 12)) / 864e5;
      const g = (357.529 + 0.98560028 * d) * Math.PI / 180;
      const q = 280.459 + 0.98564736 * d;
      const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
      const e = (23.439 - 0.00000036 * d) * Math.PI / 180;
      const dec = Math.asin(Math.sin(e) * Math.sin(L));
      const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * 180 / Math.PI;
      const gmst = ((18.697374558 + 24.06570982441908 * d) % 24) * 15;
      let lon = ra - gmst; lon = ((lon + 540) % 360) - 180;
      return [lon, dec * 180 / Math.PI];
    }
    function placeName(lat, lon) {
      const s = S();
      for (const f of countries) {
        if (d3.geoContains(f, [lon, lat])) {
          const a2 = iso[f.id];
          try { if (a2) return new Intl.DisplayNames([s.region], { type: "region" }).of(a2); } catch (_) {}
          return f.properties.name;
        }
      }
      return oceanName(lat, lon);
    }
    const fmtTime = ms => new Date(ms).toLocaleTimeString(S().locale, { hour: "2-digit", minute: "2-digit" });
    const fmtNum = (n, d) => n.toLocaleString(S().locale, { minimumFractionDigits: d, maximumFractionDigits: d });
    function findPass(from) {
      let prevEl = -90, aos = null, maxEl = -90;
      for (let i = 0; i <= 24 * 120; i++) {
        const ms = from + i * 30000;
        const l = look(new Date(ms)); if (!l) continue;
        if (aos === null && prevEl <= 0 && l.el > 0) aos = ms;
        if (aos !== null) { if (l.el > maxEl) maxEl = l.el; if (l.el <= 0 && ms > aos) return { aos, maxEl }; }
        prevEl = l.el;
      }
      return aos !== null ? { aos, maxEl } : null;
    }
    const setHTML = (id, h) => { const n = $(id); if (n) n.innerHTML = h; };
    const setText = (id, t) => { const n = $(id); if (n) n.textContent = t; };

    function updateText(force) {
      const now = simNow();
      if (!force && performance.now() - lastText < (speed ? 250 : 1000)) return;
      lastText = performance.now();
      const s = S(), d = new Date(now);
      const p = sat(d), p2 = sat(new Date(now + 10000));
      if (!p || !p2) return;
      const alt = Math.round(p.alt);
      const diff = (now - Date.now()) / 60000;
      setText("clock", new Date(now).toLocaleString(s.locale, { weekday: "short", hour: "2-digit", minute: "2-digit", second: speed ? undefined : "2-digit" }));
      setText("tLat", `${fmtNum(Math.abs(p.lat), 2)}° ${p.lat >= 0 ? "N" : "S"}`);
      setText("tLon", `${fmtNum(Math.abs(p.lon), 2)}° ${p.lon >= 0 ? "E" : s.west}`);
      setHTML("tAlt", `${alt} <small>km</small>`);
      setHTML("tSpd", `${fmtNum(p.spd, 2)} <small>km/s</small>`);
      const l1 = look(d), l2 = look(new Date(now + 1000));
      if (l1 && l2) {
        setHTML("tEl", l1.el > 0 ? `${fmtNum(l1.el, 1)}°` : `${fmtNum(l1.el, 0)}° <small>${s.below}</small>`);
        const shift = -F0 * (l2.range - l1.range) / C / 1000;
        setHTML("tDop", l1.el > 0 ? `${shift > 0 ? "+" : "−"}${fmtNum(Math.abs(shift), 2)} <small>kHz</small>` : `– <small>${s.below}</small>`);
        if (l1.el > 0) setText("pass", s.overhead(fmtNum(l1.el, 0)));
      }
      if (!l1 || l1.el <= 0) {
        if (force || Math.abs(now - lastPass) > 5 * 60000 || (passCache && passCache.aos < now)) { passCache = findPass(now); lastPass = now; }
        setText("pass", passCache ? s.nextPass(fmtTime(passCache.aos), s.inH((passCache.aos - now) / 60000), fmtNum(passCache.maxEl, 0)) : s.noPass);
      }
      if (opt.onState) opt.onState({ p, l1 });
    }

    let W = 0, H = 0;
    function resize() {
      const r = cv.getBoundingClientRect();
      const w = Math.max(10, Math.round(r.width * dpr)), h = Math.max(10, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      W = w; H = h;
    }
    const geometry = opt.geometry || ((w, h) => ({ cx: w / 2, cy: h / 2, R: Math.min(w, h) * 0.42 }));

    function draw() {
      resize();
      const now = simNow(), d = new Date(now);
      const p = sat(d);
      if (follow && p && !dragging) {
        const bias = opt.followBias ? opt.followBias() : [0, 0];
        const target = [-p.lon + bias[0], Math.max(-88, Math.min(88, -Math.max(-60, Math.min(60, p.lat * 0.75)) + bias[1]))];
        const dl = ((target[0] - rot[0] + 540) % 360) - 180;
        rot[0] += dl * 0.08; rot[1] += (target[1] - rot[1]) * 0.08;
      }
      const { cx, cy, R } = geometry(W, H);
      const proj = d3.geoOrthographic().translate([cx, cy]).scale(R).rotate(rot).clipAngle(90).precision(0.5);
      const path = d3.geoPath(proj, ctx);
      const center = [-rot[0], -rot[1]];
      ctx.clearRect(0, 0, W, H);

      const atm = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.16);
      opt.atmosphere.forEach(([o, c]) => atm.addColorStop(o, c));
      ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, Math.PI * 2); ctx.fill();
      const oc = ctx.createRadialGradient(cx - R * 0.16, cy - R * 0.24, R * 0.1, cx, cy, R);
      oc.addColorStop(0, opt.ocean[0]); oc.addColorStop(1, opt.ocean[1]);
      ctx.fillStyle = oc; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = opt.grid || "rgba(239,235,245,0.06)"; ctx.lineWidth = dpr * 0.6; ctx.beginPath(); path(d3.geoGraticule10()); ctx.stroke();

      const ds = Math.max(1.4, R / 150) * (opt.dotSize || 1);
      for (const [lon, lat, c] of dots) {
        if (d3.geoDistance([lon, lat], center) > 1.55) continue;
        const xy = proj([lon, lat]);
        if (xy[0] < -ds || xy[1] < -ds || xy[0] > W + ds || xy[1] > H + ds) continue;
        ctx.fillStyle = c;
        if (opt.roundDots) { ctx.beginPath(); ctx.arc(xy[0], xy[1], ds * 0.55, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(xy[0] - ds / 2, xy[1] - ds / 2, ds, ds);
      }
      ctx.strokeStyle = opt.borders || "rgba(239,235,245,0.10)"; ctx.lineWidth = dpr * 0.5; ctx.beginPath(); path(borders); ctx.stroke();

      const sun = subsolar(d);
      ctx.fillStyle = "rgba(0,0,6,0.55)"; ctx.beginPath(); path(d3.geoCircle().precision(1).center([sun[0] + 180, -sun[1]]).radius(90)()); ctx.fill();
      ctx.fillStyle = "rgba(0,0,6,0.25)"; ctx.beginPath(); path(d3.geoCircle().precision(1).center([sun[0] + 180, -sun[1]]).radius(96)()); ctx.fill();

      if (p) {
        ctx.lineWidth = dpr * (opt.trackWidth || 1.6); ctx.lineCap = "round";
        const pts = [];
        for (let m = -48; m <= 48; m += 1.5) { const q = sat(new Date(now + m * 60000)); if (q) pts.push([q.lon, q.lat, m]); }
        for (let i = 1; i < pts.length; i++) {
          const m = pts[i][2];
          ctx.strokeStyle = css(opt.trackColor((m + 48) / 96), m < 0 ? 0.45 : 0.95);
          ctx.beginPath(); path({ type: "LineString", coordinates: [pts[i - 1].slice(0, 2), pts[i].slice(0, 2)] }); ctx.stroke();
        }
        const rad = Math.acos(6371 / (6371 + p.alt)) * 180 / Math.PI;
        const fpCircle = d3.geoCircle().precision(1).center([p.lon, p.lat]).radius(rad)();
        ctx.fillStyle = opt.footprintFill || "rgba(70,220,203,0.06)"; ctx.beginPath(); path(fpCircle); ctx.fill();
        ctx.strokeStyle = opt.footprint || "rgba(70,220,203,0.55)"; ctx.lineWidth = dpr; ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath(); path(fpCircle); ctx.stroke(); ctx.setLineDash([]);
      }
      if (d3.geoDistance([TRD.lon, TRD.lat], center) < 1.55) {
        const [x, y] = proj([TRD.lon, TRD.lat]);
        ctx.strokeStyle = "rgba(239,235,245,0.9)"; ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(239,235,245,0.85)"; ctx.font = `500 ${10 * dpr}px ${font}`;
        ctx.fillText("TRONDHEIM", x + 8 * dpr, y + 3.5 * dpr);
      }
      if (p && d3.geoDistance([p.lon, p.lat], center) < 1.57) {
        const [x, y] = proj([p.lon, p.lat]);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 18 * dpr);
        g.addColorStop(0, "rgba(255,245,215,0.95)"); g.addColorStop(0.25, opt.satGlow || "rgba(249,142,9,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 2.6 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.font = `500 ${10.5 * dpr}px ${font}`;
        ctx.fillText("FRAMSAT-1", x + 10 * dpr, y - 8 * dpr);
      }
      needDraw = false;
    }

    function setSpeed(v) {
      const cur = simNow();
      if (v) { simBase = cur; realBase = performance.now(); offsetMin = 0; }
      else { offsetMin = (cur - Date.now()) / 60000; }
      speed = v;
      if ($("x60")) $("x60").setAttribute("aria-pressed", String(v === 60));
      if ($("x600")) $("x600").setAttribute("aria-pressed", String(v === 600));
      updateText(true);
    }
    const setFollow = v => { follow = v; if ($("followBtn")) $("followBtn").setAttribute("aria-pressed", String(v)); };

    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { draw(); updateText(true); } }, { rootMargin: "200px" }).observe(cv);
    $("scrub") && $("scrub").addEventListener("input", e => { speed = 0; setSpeedFlags(); offsetMin = +e.target.value; updateText(true); needDraw = true; });
    const setSpeedFlags = () => { $("x60") && $("x60").setAttribute("aria-pressed", "false"); $("x600") && $("x600").setAttribute("aria-pressed", "false"); };
    $("nowBtn") && $("nowBtn").addEventListener("click", () => { speed = 0; setSpeedFlags(); offsetMin = 0; if ($("scrub")) $("scrub").value = 0; setFollow(true); updateText(true); });
    $("x60") && $("x60").addEventListener("click", () => setSpeed(speed === 60 ? 0 : 60));
    $("x600") && $("x600").addEventListener("click", () => setSpeed(speed === 600 ? 0 : 600));
    $("followBtn") && $("followBtn").addEventListener("click", () => setFollow(!follow));
    let px = 0, py = 0;
    cv.addEventListener("pointerdown", e => { if (opt.canDrag && !opt.canDrag()) return; dragging = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging"); setFollow(false); });
    cv.addEventListener("pointermove", e => {
      if (!dragging) return;
      const R = geometry(W, H).R / dpr;
      const k = 180 / (R * Math.PI) * 0.9;
      rot[0] += (e.clientX - px) * k; rot[1] = Math.max(-85, Math.min(85, rot[1] - (e.clientY - py) * k));
      px = e.clientX; py = e.clientY; needDraw = true;
    });
    const end = () => { dragging = false; cv.classList.remove("dragging"); };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    window.addEventListener("resize", () => { needDraw = true; });
    onLang(() => { passCache = null; updateText(true); needDraw = true; });

    let lastDraw = 0;
    function frame(now) {
      if (!visible) { if (opt.alwaysText) updateText(false); return; }
      const interval = speed || follow ? 33 : 1000;
      if (needDraw || dragging || now - lastDraw >= interval) { lastDraw = now; draw(); }
      updateText(false);
      if (speed) {
        const off = (simNow() - Date.now()) / 60000;
        if (off > 1440) { setSpeed(0); offsetMin = 1440; }
        if ($("scrub")) $("scrub").value = Math.round(Math.max(-720, Math.min(1440, off)));
      }
    }
    return { frame, redraw: () => { needDraw = true; }, refresh: () => updateText(true) };
  }

  /* ---------- shared WebGL helpers ---------- */
  const GLSL_COMMON = `
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
  const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
  float fbm4(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=ROT*p*2.03+vec2(1.7,9.2); a*=0.5; } return s/0.9375; }
  float fbm6(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<6;i++){ s+=a*vnoise(p); p=ROT*p*2.01+vec2(5.3,1.1); a*=0.5; } return s/0.984375; }
  float ridge4(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ float n=1.0-abs(2.0*vnoise(p)-1.0); s+=a*n*n; p=ROT*p*2.07+vec2(3.1,7.7); a*=0.5; } return s/0.9375; }
  vec3 inferno(float t){ t = clamp(t,0.0,1.0);
    const vec3 c0=vec3(0.0002189403691192265,0.001651004631001012,-0.01948089843709184); const vec3 c1=vec3(0.1065134194856116,0.5639564367884091,3.932712388889277);
    const vec3 c2=vec3(11.60249308247187,-3.972853965665698,-15.9423941062914); const vec3 c3=vec3(-41.70399613139459,17.43639888205313,44.35414519872813);
    const vec3 c4=vec3(77.162935699427,-33.40235894210092,-81.80730925738993); const vec3 c5=vec3(-71.31942824499214,32.62606426397723,73.20951985803202);
    const vec3 c6=vec3(25.13112622477341,-12.24266895238567,-23.07032500287172);
    return clamp(c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6))))), 0.0, 1.0); }
  vec3 magma(float t){ t = clamp(t,0.0,1.0);
    const vec3 c0=vec3(-0.002136485053939582,-0.000749655052795221,-0.005386127855323933); const vec3 c1=vec3(0.2516605407371642,0.6775232436837668,2.494026599312351);
    const vec3 c2=vec3(8.353717279216625,-3.577719514958484,0.3144679030132573); const vec3 c3=vec3(-27.66873308576866,14.26473078096533,-13.64921318813922);
    const vec3 c4=vec3(52.17613981234068,-27.94360607168351,12.94416944238394); const vec3 c5=vec3(-50.76852536473588,29.04658282127291,4.23415299384598);
    const vec3 c6=vec3(18.65570506591883,-11.48977351997711,-5.601961508734096);
    return clamp(c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6))))), 0.0, 1.0); }
  vec3 turbo(float x){ x = clamp(x,0.0,1.0);
    vec4 v4=vec4(1.0,x,x*x,x*x*x); vec2 v2=v4.zw*v4.z;
    return clamp(vec3(dot(v4,vec4(0.13572138,4.61539260,-42.66032258,132.13108234))+dot(v2,vec2(-152.94239396,59.28637943)),
      dot(v4,vec4(0.09140261,2.19418839,4.84296658,-14.18503333))+dot(v2,vec2(4.27729857,2.82956604)),
      dot(v4,vec4(0.10667330,12.64194608,-60.58204836,110.36276771))+dot(v2,vec2(-89.90310912,27.34824973))), 0.0, 1.0); }
  vec3 oiii(float t){
    vec3 s0=vec3(0.0), s1=vec3(0.01,0.05,0.22), s2=vec3(0.0,0.42,0.55), s3=vec3(0.25,0.9,0.82), s4=vec3(0.96,1.0,0.94);
    float x = clamp(t,0.0,1.0)*4.0;
    if (x < 1.0) return mix(s0,s1,x); if (x < 2.0) return mix(s1,s2,x-1.0); if (x < 3.0) return mix(s2,s3,x-2.0); return mix(s3,s4,x-3.0); }
  vec3 starfield(vec2 px, float seed){
    vec3 s = vec3(0.0);
    vec2 cell = floor(px / 2.0);
    if (hash12(cell + seed) > 0.9968) s += vec3(0.72, 0.76, 0.92) * (0.15 + 0.85 * pow(hash12(cell + 19.1), 3.0));
    vec2 g = px / 38.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    if (hash12(id + 2.9 + seed) > 0.94) {
      vec2 o = vec2(hash12(id + 3.1), hash12(id + 8.7)) - 0.5;
      float r = length((f - o * 0.7) * 38.0);
      vec3 tint = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.86, 0.72), hash12(id + 2.2));
      s += tint * (exp(-r * r * 0.7) * 1.1 + exp(-r * 0.6) * 0.10) * (0.35 + 0.9 * pow(hash12(id + 5.5), 2.0));
    }
    return s; }`;

  // Minimal full-screen shader runner with adaptive resolution.
  function createField(canvas, fragBody, uniformNames, opts = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) return null;
    const src = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec2 uRes; uniform float uScale; uniform int uMode; uniform vec2 uProbe;
    ${GLSL_COMMON}
    ${fragBody}`;
    const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
      in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, src));
      gl.bindAttribLocation(prog, 0, "aPos");
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.error(e); return null; }
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    if (opts.texture) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, opts.texture.source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, opts.texture.name), 0);
    }
    const U = {};
    ["uRes", "uScale", "uMode", "uProbe"].concat(uniformNames).forEach(n => U[n] = gl.getUniformLocation(prog, n));

    // Resolution. The shader draws at the screen's full pixel density (up to
    // 2x) wherever the GPU keeps up. When frames get slow it tries a lower
    // resolution, and keeps it only if frames really get faster: slow frames
    // are often the 2D overlay, which a lower resolution doesn't help. While
    // the camera is moving (setMoving) it may go lower; at rest it returns to
    // the resolution it has learned for still frames, normally the full one.
    const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxScale = Math.min(dpr, opts.maxScale || 2);
    const minScale = Math.min(maxScale, coarse ? 0.75 : 0.6);
    const levels = { still: maxScale, moving: maxScale };
    let moving = false, scale = maxScale;
    let ema = 16, lastAdapt = 0, trial = null, cooldownUntil = 0;
    const born = performance.now();
    const level = () => (moving ? "moving" : "still");
    // A new size is applied at the start of the next draw, never after one:
    // resizing a canvas clears it, and clearing it after drawing showed a blank
    // frame (the flicker).
    let pending = false;
    function apply() { scale = Math.min(levels.still, levels[level()]); pending = true; }
    function adapt(now, dt) {
      if (document.hidden || dt > 0.25) return;            // a paused tab says nothing about the GPU
      ema = ema * 0.9 + dt * 1000 * 0.1;
      if (now - born < 2500 || now - lastAdapt < 1500) return;
      const k = level(), slow = moving ? 24 : 34;           // ms per frame: about 40 and 30 fps
      lastAdapt = now;
      if (trial) {
        if (ema > trial.before * 0.9) { levels[k] = trial.prev; cooldownUntil = now + 20000; apply(); }
        trial = null;
      } else if (ema > slow && levels[k] > minScale && now > cooldownUntil) {
        trial = { before: ema, prev: levels[k] };
        levels[k] = Math.max(minScale, levels[k] * 0.8); apply();
      } else if (ema < 18 && levels[k] < maxScale) {
        levels[k] = Math.min(maxScale, levels[k] * 1.1); apply();
      }
    }
    // Moving starts at once but only ends after the view has been still for
    // a moment, so the end of a scroll doesn't flip the resolution back and forth.
    let stillSince = 0;
    function setMoving(m) {
      const now = performance.now();
      if (m) stillSince = 0; else if (moving && !stillSince) stillSince = now;
      const next = m || (moving && now - stillSince < 400);
      if (next === moving) return;
      moving = next; trial = null; lastAdapt = now; apply();
    }
    function resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    resize();
    window.addEventListener("resize", () => { pending = true; });

    // optional probe target
    let fbo = null; const px = new Uint8Array(4);
    if (opts.probe) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function setU(vals) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uScale, scale);
      for (const k in vals) {
        const v = vals[k], loc = U[k];
        if (loc == null) continue;
        if (v instanceof Float32Array) gl.uniform1fv(loc, v);
        else if (Array.isArray(v)) v.length === 2 ? gl.uniform2f(loc, v[0], v[1]) : v.length === 4 ? gl.uniform4f(loc, v[0], v[1], v[2], v[3]) : gl.uniform3f(loc, v[0], v[1], v[2]);
        else if (typeof v === "object" && v && "i" in v) gl.uniform1i(loc, v.i);
        else gl.uniform1f(loc, v);
      }
    }
    function draw(vals, dt) {
      if (pending) { pending = false; resize(); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      setU(vals); gl.uniform1i(U.uMode, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      adapt(performance.now(), dt);
    }
    function probe(vals, cssX, cssY) {
      if (!fbo) return null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, 1, 1);
      setU(vals); gl.uniform1i(U.uMode, 1);
      gl.uniform2f(U.uProbe, cssX * scale, canvas.height - cssY * scale);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return [px[0] / 255, px[1] / 255, px[2] / 255];
    }
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    // A map for the shader. channels: 1 for greyscale maps (stored as one
    // channel, a quarter of the GPU memory), otherwise colour. Loading a
    // sharper version under the same name replaces the old one.
    const textures = {};
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    function texture(name, source, unit, channels = 4) {
      if (textures[name]) gl.deleteTexture(textures[name]);
      const t = textures[name] = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      if (channels === 1) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, source);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.useProgram(prog);
      gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    }
    // free a map's GPU memory (the shader must stop sampling it first)
    function drop(name) { if (textures[name]) { gl.deleteTexture(textures[name]); delete textures[name]; } }
    return { draw, probe, texture, drop, setMoving, maxTexture, get scale() { return scale; } };
  }

  return {
    get lang() { return lang; }, S, setLang, onLang, extend, render, oceanName,
    inferno, magma, turbo, oiii, css, gradient, clamp01, fmtDur,
    setBarGradient: g => { barGradient = g; },
    createGlobe, createField,
    reduceMotion: window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarse: window.matchMedia && matchMedia("(pointer: coarse)").matches,
  };
})();
