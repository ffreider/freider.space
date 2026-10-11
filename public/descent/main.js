(() => {
  "use strict";
  const C = window.Core;
  const $ = id => document.getElementById(id);

  /* ---------- vectors ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => mul(a, 1 / (len(a) || 1));
  const rad = x => x * Math.PI / 180, deg = x => x * 180 / Math.PI;
  const smooth = x => { x = C.clamp01(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function slerp(a, b, t) {
    const d = Math.max(-1, Math.min(1, dot(a, b)));
    if (d > 0.9995) return norm(add(mul(a, 1 - t), mul(b, t)));
    const th = Math.acos(d), s = Math.sin(th);
    return add(mul(a, Math.sin((1 - t) * th) / s), mul(b, Math.sin(t * th) / s));
  }
  const rotAround = (v, axis, ang) => add(add(mul(v, Math.cos(ang)), mul(cross(axis, v), Math.sin(ang))), mul(axis, dot(axis, v) * (1 - Math.cos(ang))));
  const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

  /* ---------- ephemerides ---------- */
  const RE = 6371, RM = 1737.4, MU = 398600.4418, J2000 = Date.UTC(2000, 0, 1, 12);
  const OBL = rad(23.439), ECL_N = [0, -Math.sin(OBL), Math.cos(OBL)];
  const days = ms => (ms - J2000) / 864e5;
  function sunEci(ms) {
    const d = days(ms), g = rad(357.529 + 0.98560028 * d), q = 280.459 + 0.98564736 * d;
    const L = rad(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    return norm([Math.cos(L), Math.cos(OBL) * Math.sin(L), Math.sin(OBL) * Math.sin(L)]);
  }
  function moonEci(ms) {
    const d = days(ms);
    const L = rad(218.316 + 13.176396 * d), M = rad(134.963 + 13.064993 * d), F = rad(93.272 + 13.229350 * d);
    const lon = L + rad(6.289) * Math.sin(M), lat = rad(5.128) * Math.sin(F);
    const r = 385001 - 20905 * Math.cos(M);
    const x = r * Math.cos(lat) * Math.cos(lon), y = r * Math.cos(lat) * Math.sin(lon), z = r * Math.sin(lat);
    return [x, Math.cos(OBL) * y - Math.sin(OBL) * z, Math.sin(OBL) * y + Math.cos(OBL) * z];
  }
  const hasSat = !!window.satellite;
  const gmst = ms => hasSat ? satellite.gstime(new Date(ms)) : rad((280.46061837 + 360.98564736629 * days(ms)) % 360);
  const inShadow = (r, sun) => { const d = dot(r, sun); return d < 0 && len(sub(r, mul(sun, d))) < RE; };

  /* ---------- spacecraft ---------- */
  const TLES = JSON.parse($("tleData").textContent);
  // The server adds FramSat-1's TLE from SatNOGS; this is the fallback.
  if (!TLES["FRAMSAT-1"]) TLES["FRAMSAT-1"] = ["1 98914U 26203B   26267.74444959  .00002983  00000-0  22116-3 0  9990",
                      "2 98914  97.4205 342.2551 0057654 211.8046 147.9693 15.02507306  2843"];
  const SAT = {};
  for (const k in TLES) if (hasSat) SAT[k] = satellite.twoline2satrec(TLES[k][0], TLES[k][1]);
  function sv(name, ms) {
    const rec = SAT[name]; if (!rec) return null;
    const pv = satellite.propagate(rec, new Date(ms));
    if (!pv || !pv.position) return null;
    return { r: [pv.position.x, pv.position.y, pv.position.z], v: [pv.velocity.x, pv.velocity.y, pv.velocity.z] };
  }
  const orbitCache = {};
  function orbit(name, ms, span = 1, n = 240) {
    const c = orbitCache[name];
    if (c && Math.abs(c.ms - ms) < 60000) return c.pts;
    const rec = SAT[name]; if (!rec) return [];
    const T = 2 * Math.PI / rec.no * 60000 * span;
    const pts = [];
    for (let i = 0; i <= n; i++) { const s = sv(name, ms + T * (i / n - 0.5)); if (s) pts.push(s.r); }
    orbitCache[name] = { ms, pts };
    return pts;
  }
  function elements(name) {
    const rec = SAT[name]; if (!rec) return null;
    const n = rec.no / 60, a = Math.cbrt(MU / (n * n));
    return { a, e: rec.ecco, inc: deg(rec.inclo), perigee: a * (1 - rec.ecco) - RE, apogee: a * (1 + rec.ecco) - RE, period: 2 * Math.PI / rec.no,
      rev0: parseInt(TLES[name][1].slice(63, 68), 10), epochMs: (rec.jdsatepoch - 2440587.5) * 864e5 + (rec.jdsatepochF || 0) * 864e5, revPerDay: rec.no * 1440 / (2 * Math.PI) };
  }
  function ring(radius, inc, raan, n = 180) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = 2 * Math.PI * i / n, x = Math.cos(u), y = Math.sin(u);
      pts.push([(x * Math.cos(raan) - y * Math.cos(inc) * Math.sin(raan)) * radius, (x * Math.sin(raan) + y * Math.cos(inc) * Math.cos(raan)) * radius, y * Math.sin(inc) * radius]);
    }
    return pts;
  }
  const GEO_RING = ring(RE + 35786, 0, 0);
  const GPS_PLANES = [0, 1, 2, 3, 4, 5].map(i => ring(RE + 20200, rad(55), rad(i * 60 + 17)));
  const GAL_PLANES = [0, 1, 2].map(i => ring(RE + 23222, rad(56), rad(i * 120 + 47)));
  const periodOf = r => 2 * Math.PI * Math.sqrt(r * r * r / MU) / 60;   // minutes

  /* ---------- reference data ---------- */
  const GEO_INFO = {
    "THOR 5": ["Space Norway", "TV and broadband for the Nordics and Central Europe.", "TV og bredbånd for Norden og Sentral-Europa."],
    "THOR 6": ["Space Norway", "TV and broadband for the Nordics and Central Europe.", "TV og bredbånd for Norden og Sentral-Europa."],
    "THOR 7": ["Space Norway", "TV, plus Ka-band broadband for ships at sea.", "TV, pluss Ka-bånd-bredbånd for skip på havet."],
    "GOES 16": ["NOAA", "US weather satellite. GOES-East until 2025, now held in reserve.", "Amerikansk værsatellitt. GOES-East frem til 2025, nå i reserve."],
    "GOES 18": ["NOAA", "GOES-West, watching weather over the Pacific and western Americas.", "GOES-West, følger været over Stillehavet og vestlige Amerika."],
    "GOES 19": ["NOAA", "GOES-East since 2025, watching the Atlantic and the Americas.", "GOES-East siden 2025, følger Atlanterhavet og Amerika."],
    "HIMAWARI 9": ["Japan Meteorological Agency", "Weather imagery for East Asia and the western Pacific.", "Værbilder for Øst-Asia og det vestlige Stillehavet."],
    "METEOSAT 11": ["EUMETSAT", "European weather satellite (MSG-4).", "Europeisk værsatellitt (MSG-4)."],
    "METEOSAT 10": ["EUMETSAT", "European weather satellite (MSG-3).", "Europeisk værsatellitt (MSG-3)."],
    "ASTRA 1N": ["SES", "Direct-to-home TV for Europe from the Astra 19.2° E position.", "TV rett hjem for Europa fra Astra-posisjonen 19,2° øst."],
    "EUTELSAT 9B": ["Eutelsat · ESA", "Carries EDRS-A, the first node of Europe’s laser data-relay network.", "Bærer EDRS-A, første node i Europas laserbaserte datarelénett."],
    "EDRS-C": ["ESA · Airbus", "Second node of the European Data Relay System, relaying Sentinel data by laser.", "Andre node i European Data Relay System, videresender Sentinel-data med laser."],
    "TDRS 13": ["NASA", "Tracking and Data Relay Satellite, relaying links for spacecraft in low orbit.", "Tracking and Data Relay Satellite, videresender forbindelser for romfartøy i lav bane."],
    "INMARSAT 5-F1": ["Inmarsat (Viasat)", "Global Xpress Ka-band broadband for ships and aircraft.", "Global Xpress Ka-bånd-bredbånd for skip og fly."],
    "ELEKTRO-L 2": ["Roscosmos", "Russian weather satellite.", "Russisk værsatellitt."],
  };
  const GEO_SATS = Object.keys(GEO_INFO).filter(k => TLES[k]);
  const GAL_SATS = Object.keys(TLES).filter(k => k.startsWith("GAL:"));
  const galName = k => k.slice(4);
  const launchYear = name => { const y = parseInt(TLES[name][0].slice(9, 11), 10); return y > 56 ? 1900 + y : 2000 + y; };

  // [name, lat, lon, diameter km, kind, en, no]
  const MOON_FEATURES = [
    ["Tycho", -43.31, -11.36, 85, "crater", "A young crater, about 108 million years old. Its bright rays reach across the near side.", "Et ungt krater, rundt 108 millioner år gammelt. De lyse strålene når over hele forsiden."],
    ["Copernicus", 9.62, -20.08, 93, "crater", "Terraced walls and central peaks, about 800 million years old.", "Terrasserte vegger og sentrale topper, rundt 800 millioner år gammelt."],
    ["Kepler", 8.12, -38.01, 31, "crater", "Small bright-rayed crater in the Ocean of Storms.", "Lite krater med lyse stråler i Stormenes hav."],
    ["Aristarchus", 23.73, -47.49, 40, "crater", "The brightest large feature on the Moon, easy to spot with binoculars.", "Det lyseste store landskapstrekket på Månen, lett å se i kikkert."],
    ["Plato", 51.62, -9.38, 101, "crater", "Lava-flooded crater with an unusually dark, flat floor.", "Lavafylt krater med uvanlig mørk og flat bunn."],
    ["Clavius", -58.37, -14.73, 225, "crater", "One of the largest near-side craters. Water molecules were detected here in 2020.", "Et av de største kraterne på forsiden. Vannmolekyler ble påvist her i 2020."],
    ["Mare Tranquillitatis", 8.5, 31.4, 873, "mare", "Sea of Tranquillity, where Apollo 11 landed.", "Stillhetens hav, der Apollo 11 landet."],
    ["Apollo 11", 0.674, 23.473, 0, "site", "First crewed landing, 20 July 1969.", "Første bemannede landing, 20. juli 1969."],
    ["Apollo 17", 20.19, 30.77, 0, "site", "The last crewed landing so far, December 1972.", "Den siste bemannede landingen så langt, desember 1972."],
    ["Mare Imbrium", 32.8, -15.6, 1146, "mare", "Sea of Showers, an enormous lava-flooded impact basin.", "Regnenes hav, et enormt lavafylt nedslagsbasseng."],
    ["Mare Serenitatis", 28.0, 17.5, 674, "mare", "Sea of Serenity. Apollo 17 landed on its eastern edge.", "Klarhetens hav. Apollo 17 landet på østkanten."],
    ["Mare Crisium", 17.0, 59.1, 556, "mare", "Sea of Crises, an isolated round mare near the eastern limb.", "Krisenes hav, et isolert rundt hav nær østkanten."],
    ["Oceanus Procellarum", 18.4, -57.4, 2568, "mare", "Ocean of Storms, the largest of the dark lava plains.", "Stormenes hav, den største av de mørke lavaslettene."],
    ["Grimaldi", -5.2, -68.6, 173, "crater", "Dark-floored basin near the western limb.", "Basseng med mørk bunn nær vestkanten."],
    ["Langrenus", -8.9, 61.0, 132, "crater", "Large crater with a central peak near the eastern limb.", "Stort krater med sentral topp nær østkanten."],
    ["Theophilus", -11.4, 26.4, 100, "crater", "Deep crater with a big central mountain group.", "Dypt krater med en stor sentral fjellgruppe."],
    ["Tsiolkovskiy", -20.38, 129.1, 185, "crater", "Far-side crater with a dark lava floor, rare on the far side.", "Krater på baksiden med mørk lavabunn, sjeldent på baksiden."],
    ["Mare Moscoviense", 27.3, 147.9, 277, "mare", "One of the few far-side maria, first seen in Luna 3’s photos in 1959.", "Et av få hav på baksiden, første gang sett på Luna 3-bildene i 1959."],
    ["Korolev", -4.44, -157.47, 437, "basin", "Far-side impact basin named after the Soviet chief rocket designer.", "Nedslagsbasseng på baksiden, oppkalt etter den sovjetiske rakettkonstruktøren."],
    ["Hertzsprung", 2.6, -129.2, 570, "basin", "Multi-ring basin on the far side.", "Flerringet basseng på baksiden."],
    ["Apollo basin", -36.1, -151.8, 537, "basin", "Double-ring basin inside the South Pole–Aitken basin.", "Dobbeltringet basseng inne i Sydpol–Aitken-bassenget."],
    ["Chang’e 6", -41.64, -153.99, 0, "site", "Brought back the first samples from the far side, June 2024.", "Hentet de første prøvene fra baksiden, juni 2024."],
    ["Von Kármán", -44.8, 175.9, 186, "crater", "Chang’e 4 made the first far-side landing here, January 2019.", "Chang’e 4 gjorde den første landingen på baksiden her, januar 2019."],
    ["Daedalus", -5.9, 179.4, 93, "crater", "Near the centre of the far side, shielded from Earth’s radio noise.", "Nær midten av baksiden, skjermet fra radiostøy fra Jorden."],
    ["South Pole–Aitken", -53, -169, 2500, "basin", "The Moon’s largest known impact basin, about 2,500 km across.", "Månens største kjente nedslagsbasseng, rundt 2500 km på tvers."],
    ["Shackleton", -89.67, 129.78, 21, "crater", "At the south pole, partly in permanent shadow. Its rim is a candidate Artemis landing area.", "Ved sydpolen, delvis i evig skygge. Kanten er et mulig landingsområde for Artemis."],
  ];

  const CITIES = [
    ["Trondheim", 63.43, 10.40], ["Oslo", 59.91, 10.75], ["Andøya", 69.29, 16.02], ["Tromsø", 69.65, 18.96], ["Longyearbyen", 78.22, 15.65],
    ["Kiruna", 67.86, 20.23], ["Stockholm", 59.33, 18.07], ["Helsinki", 60.17, 24.94], ["Copenhagen", 55.68, 12.57], ["Reykjavík", 64.15, -21.94],
    ["London", 51.51, -0.13], ["Paris", 48.86, 2.35], ["Berlin", 52.52, 13.40], ["Madrid", 40.42, -3.70], ["Rome", 41.90, 12.50],
    ["Moscow", 55.76, 37.62], ["Istanbul", 41.01, 28.98], ["Cairo", 30.04, 31.24], ["Lagos", 6.52, 3.38], ["Nairobi", -1.29, 36.82],
    ["Johannesburg", -26.20, 28.05], ["Cape Town", -33.92, 18.42], ["Dubai", 25.20, 55.27], ["Mumbai", 19.08, 72.88], ["Delhi", 28.61, 77.21],
    ["Bangkok", 13.76, 100.50], ["Singapore", 1.35, 103.82], ["Jakarta", -6.21, 106.85], ["Beijing", 39.90, 116.40], ["Shanghai", 31.23, 121.47],
    ["Tokyo", 35.68, 139.69], ["Seoul", 37.57, 126.98], ["Manila", 14.60, 120.98], ["Sydney", -33.87, 151.21], ["Perth", -31.95, 115.86],
    ["Auckland", -36.85, 174.76], ["Honolulu", 21.31, -157.86], ["Anchorage", 61.22, -149.90], ["Vancouver", 49.28, -123.12], ["Los Angeles", 34.05, -118.24],
    ["Denver", 39.74, -104.99], ["Houston", 29.76, -95.37], ["Chicago", 41.88, -87.63], ["New York", 40.71, -74.01], ["Miami", 25.76, -80.19],
    ["Mexico City", 19.43, -99.13], ["Bogotá", 4.71, -74.07], ["Lima", -12.05, -77.04], ["São Paulo", -23.55, -46.63], ["Rio de Janeiro", -22.91, -43.17],
    ["Buenos Aires", -34.60, -58.38], ["Santiago", -33.45, -70.67], ["Nuuk", 64.18, -51.72], ["Novosibirsk", 55.01, 82.93], ["Yakutsk", 62.03, 129.73],
    ["Ushuaia", -54.80, -68.30], ["McMurdo", -77.85, 166.67], ["Kourou", 5.16, -52.65], ["Baikonur", 45.96, 63.31], ["Cape Canaveral", 28.39, -80.60],
  ];
  // More places, labelled only where they don't crowd the ones above.
  const MORE_CITIES = [
    ["Bergen", 60.39, 5.32], ["Stavanger", 58.97, 5.73], ["Bodø", 67.28, 14.40], ["Kirkenes", 69.73, 30.05], ["Ny-Ålesund", 78.92, 11.93],
    ["Gothenburg", 57.71, 11.97], ["Aarhus", 56.16, 10.20], ["Tórshavn", 62.01, -6.77], ["Hamburg", 53.55, 9.99], ["Munich", 48.14, 11.58],
    ["Amsterdam", 52.37, 4.90], ["Brussels", 50.85, 4.35], ["Darmstadt", 49.87, 8.65], ["Zurich", 47.38, 8.54], ["Vienna", 48.21, 16.37],
    ["Prague", 50.08, 14.44], ["Warsaw", 52.23, 21.01], ["Budapest", 47.50, 19.04], ["Barcelona", 41.39, 2.17], ["Lisbon", 38.72, -9.14],
    ["Dublin", 53.35, -6.26], ["Edinburgh", 55.95, -3.19], ["Milan", 45.46, 9.19], ["Marseille", 43.30, 5.37], ["Toulouse", 43.60, 1.44],
    ["Athens", 37.98, 23.73], ["Kyiv", 50.45, 30.52], ["St Petersburg", 59.94, 30.31], ["Riga", 56.95, 24.11], ["Bucharest", 44.43, 26.10],
    ["Murmansk", 68.97, 33.08], ["Arkhangelsk", 64.54, 40.54], ["Ponta Delgada", 37.74, -25.67], ["Las Palmas", 28.12, -15.44],
    ["Casablanca", 33.57, -7.59], ["Algiers", 36.75, 3.06], ["Tunis", 36.81, 10.18], ["Dakar", 14.72, -17.47], ["Accra", 5.60, -0.19],
    ["Kano", 12.00, 8.52], ["Kinshasa", -4.44, 15.27], ["Luanda", -8.84, 13.23], ["Khartoum", 15.50, 32.56], ["Addis Ababa", 9.03, 38.74],
    ["Dar es Salaam", -6.79, 39.21], ["Antananarivo", -18.88, 47.51], ["Port Louis", -20.16, 57.50],
    ["Tel Aviv", 32.09, 34.78], ["Baghdad", 33.31, 44.36], ["Riyadh", 24.71, 46.68], ["Tehran", 35.69, 51.39], ["Karachi", 24.86, 67.01],
    ["Kabul", 34.56, 69.21], ["Tashkent", 41.30, 69.24], ["Almaty", 43.24, 76.89], ["Yekaterinburg", 56.84, 60.61], ["Omsk", 54.99, 73.37],
    ["Norilsk", 69.35, 88.20], ["Irkutsk", 52.29, 104.30], ["Vladivostok", 43.12, 131.89], ["Ulaanbaatar", 47.89, 106.91], ["Ürümqi", 43.83, 87.62],
    ["Lhasa", 29.65, 91.17], ["Kathmandu", 27.72, 85.32], ["Kolkata", 22.57, 88.36], ["Dhaka", 23.81, 90.41], ["Chennai", 13.08, 80.27],
    ["Bengaluru", 12.97, 77.59], ["Colombo", 6.93, 79.86], ["Malé", 4.18, 73.51], ["Yangon", 16.84, 96.17], ["Hanoi", 21.03, 105.85],
    ["Ho Chi Minh City", 10.82, 106.63], ["Kuala Lumpur", 3.14, 101.69], ["Hong Kong", 22.32, 114.17], ["Guangzhou", 23.13, 113.26],
    ["Chengdu", 30.57, 104.07], ["Taipei", 25.03, 121.57], ["Osaka", 34.69, 135.50], ["Sapporo", 43.06, 141.35],
    ["Melbourne", -37.81, 144.96], ["Brisbane", -27.47, 153.03], ["Adelaide", -34.93, 138.60], ["Darwin", -12.46, 130.84],
    ["Alice Springs", -23.70, 133.88], ["Wellington", -41.29, 174.78], ["Christchurch", -43.53, 172.64], ["Port Moresby", -9.44, 147.18],
    ["Suva", -18.14, 178.44], ["Nouméa", -22.27, 166.45], ["Papeete", -17.54, -149.57], ["Hanga Roa", -27.15, -109.43],
    ["Utqiaġvik", 71.29, -156.79], ["Fairbanks", 64.84, -147.72], ["Whitehorse", 60.72, -135.06], ["Yellowknife", 62.45, -114.37],
    ["Iqaluit", 63.75, -68.52], ["Pituffik", 76.53, -68.70], ["Seattle", 47.61, -122.33], ["San Francisco", 37.77, -122.42],
    ["Las Vegas", 36.17, -115.14], ["Phoenix", 33.45, -112.07], ["Salt Lake City", 40.76, -111.89], ["Calgary", 51.05, -114.07],
    ["Winnipeg", 49.90, -97.14], ["Minneapolis", 44.98, -93.27], ["Dallas", 32.78, -96.80], ["New Orleans", 29.95, -90.07],
    ["Atlanta", 33.75, -84.39], ["Washington", 38.91, -77.04], ["Boston", 42.36, -71.06], ["Toronto", 43.65, -79.38], ["Montreal", 45.50, -73.57],
    ["Monterrey", 25.69, -100.32], ["Guadalajara", 20.67, -103.35], ["Havana", 23.11, -82.37], ["Santo Domingo", 18.49, -69.93],
    ["San Juan", 18.47, -66.11], ["Guatemala City", 14.63, -90.51], ["Panama City", 8.98, -79.52], ["Caracas", 10.48, -66.90],
    ["Quito", -0.18, -78.47], ["Manaus", -3.12, -60.02], ["Recife", -8.05, -34.88], ["Brasília", -15.79, -47.88], ["La Paz", -16.49, -68.12],
    ["Asunción", -25.26, -57.58], ["Montevideo", -34.90, -56.16], ["Punta Arenas", -53.16, -70.91], ["Stanley", -51.70, -57.85],
  ];
  const ecefUnit = (lat, lon) => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat))];
  const ALL_CITIES = [...CITIES, ...MORE_CITIES];
  // Drawn in this order, so when labels would collide the earlier one wins:
  // home first, then the main list, then the rest.
  const CITY_V = ALL_CITIES.map(([n, la, lo], i) => [n, ecefUnit(la, lo), i < CITIES.length]);
  const TRD = { lat: 63.4305, lon: 10.3951, h: 0.05 };

  // the graticule as Earth-fixed unit vectors, and the countries for naming
  // the place below (the maps now show coastlines and borders well enough)
  let GRAT = [], COUNTRIES = [], ISO = {};
  if (window.d3 && window.topojson) {
    const world = JSON.parse($("worldData").textContent);
    ISO = JSON.parse($("isoData").textContent);
    COUNTRIES = topojson.feature(world, world.objects.countries).features;
    for (let la = -80; la <= 80; la += 10) { const l = []; for (let lo = -180; lo <= 180; lo += 3) l.push(ecefUnit(la, lo)); GRAT.push(l); }
    for (let lo = -180; lo < 180; lo += 10) { const l = []; for (let la = -80; la <= 80; la += 3) l.push(ecefUnit(la, lo)); GRAT.push(l); }
  }
  function placeName(lat, lon) {
    const s = C.S();
    if (window.d3) for (const f of COUNTRIES) if (d3.geoContains(f, [lon, lat])) {
      const a2 = ISO[f.id];
      try { if (a2) return new Intl.DisplayNames([s.region], { type: "region" }).of(a2); } catch (_) {}
      return f.properties.name;
    }
    return C.oceanName(lat, lon);
  }

  /* ---------- text ---------- */
  const fmtKm = n => Math.round(n).toLocaleString(C.S().locale);
  const fmtN = (n, d) => n.toLocaleString(C.S().locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtMin = m => { if (m < 1) return C.lang === "en" ? "under a minute" : "under ett minutt"; m = Math.round(m); const h = Math.floor(m / 60); return h ? `${h} h ${String(m % 60).padStart(2, "0")} min` : `${m} min`; };
  const fmtTime = ms => new Date(ms).toLocaleTimeString(C.S().locale, { hour: "2-digit", minute: "2-digit" });
  const latlon = (la, lo) => `${fmtN(Math.abs(la), 1)}° ${la >= 0 ? "N" : "S"}, ${fmtN(Math.abs(lo), 1)}° ${lo >= 0 ? "E" : C.S().west}`;
  C.extend({
    en: {
      whyShort: "A student satellite I worked on at Orbit NTNU. It launched on 5 September 2026, the first satellite to reach orbit from continental Europe.",
      liveTag: "FramSat-1, right now",
      riding: "Riding with FramSat-1",
      openTracker: "Open full tracker", close: "Close",
      lookHint: "Drag to fly around it",
      moreTracker: "Sky plot, receptions and the annotated TLE:",
      views: ["Behind", "Above", "In front", "Facing the Sun"],
      stops: [
        ["The Moon", d => `${d} km away right now. Drag to turn it, and hover the names to see what’s there. From here we head inward, past real spacecraft, to FramSat-1.`],
        ["ASBM-1 and ASBM-2", (pe, ap) => `Some of the coolest satellites Norway has, if you ask me: Space Norway’s two satellites for broadband in the Arctic. Their orbits take 16 hours and stretch from ${pe} km up to ${ap} km, so they spend most of their time high above the far north. Each one is on for about 10 hours near the top of its orbit, and the two overlap, which gives everything north of 65° N coverage around the clock. The cone is what the active one can see.`],
        ["The geostationary belt", () => "A stop for scale. 35,786 km up, one orbit takes as long as Earth takes to turn once, so these satellites stay above the same spot on the ground. Hover any of them. Space Norway’s Thor 5, 6 and 7 are near 1° West."],
        ["Galileo above Trondheim", () => "Over Trondheim, where I live. This is Europe’s own navigation system, 23,222 km up in three orbital planes, and the lines go to the Galileo satellites a phone here could use right now. Your phone works out where it is by timing their signals, which left them about 80 milliseconds ago."],
        ["The International Space Station", d => `About ${d} km up right now, with people on board. Through NASA HUNCH Norge, which I chair, Norwegian students build hardware for it. These numbers are live.`],
        ["FramSat-1", d => `Orbit NTNU’s 1U CubeSat, about 1 kg, testing a Norwegian sun sensor from Eidsvoll Electronics. It went up on Isar Aerospace’s second Spectrum rocket from Andøya, the first satellite launched into orbit from continental Europe.`],
      ],
      route: ["Moon", "ASBM", "GEO", "Galileo", "ISS", "FramSat-1"],
      labels: { moon: "Moon", fs: "FramSat-1 · 1U CubeSat", sensor: "Sun sensor (EIDEL)", gps: "GPS planes", gal: "Galileo planes", apo: "Apogee", peri: "Perigee", trd: "Trondheim", n65: "65° N · round-the-clock coverage", on: "on", off: "off", near: "Near side", far: "Far side", lit: "Sunlit", dark: "Night", kinds: { crater: "Crater", mare: "Mare", basin: "Impact basin", site: "Landing site" }, offFor: m => `switches on in ${fmtMin(m)}`, onFor: m => `on for another ${fmtMin(m)}`, sunAlt: a => a > 0 ? `${Math.round(a)}° above the horizon` : "below the horizon", visNow: "usable now", grav: "Plane", galTip: "Galileo satellite, part of the EU’s navigation system, run by EUSPA. Each carries hydrogen-maser and rubidium clocks and a search-and-rescue transponder that can tell a distress beacon that help is on the way." },
      k: { dist: "Distance", lit: "Illuminated", phase: "Phase", light: "Light time", size: "Size seen from Earth", here: "From here",
        alt: "Altitude", spd: "Speed", pos: "Position", over: "Over", sun: "Sunlight", orbit: "Orbit no.", period: "Period", inc: "Inclination",
        pa: "Perigee · apogee", pass: "Next pass, Trondheim", trd: "From Trondheim", gspd: "Ground speed", aboard: "Crewed since", sunrises: "Sunrises a day",
        days: "Days in orbit", lon: "Longitude", launched: "Launched", op: "Operator", shown: "Satellites shown", lst: "Local time below", rate: "Orbits a day",
        beta: "Sun angle to orbit (β)", shadowPct: "Time in shadow per orbit", sink: "Sinking from air drag", horizon: "Distance to horizon", seen: "Earth visible from here",
        fromTrd: "Seen from Trondheim", delay: "Signal delay", incl: "Inclination", swing: "Daily north–south swing", active: "Payload", cover: "Coverage",
        visible: "Usable from Trondheim", dop: "Geometry (PDOP)", nearest: "Nearest", side: "Side", sunNow: "Sun there now", type: "Type",
        payloads: "Payloads", ground: "Control", dist: "Distance" },
      sunlit: m => `Sunlit · shadow in ${fmtMin(m)}`, dark: m => `In Earth’s shadow · sunrise in ${fmtMin(m)}`,
      sunlitNow: "Sunlit", darkNow: "In Earth’s shadow",
      passFmt: (t, el, vis) => `${t}, ${el}° high${vis ? ", visible" : ""}`, noPass2: "None in 24 h",
      phases: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
      cardFoot: ["Drag to turn the Moon. Double-click to put it back.", "The coverage figures are Space Norway’s. The 10-hour window is my estimate.", "Hover a satellite for details. Most sit right on the line; a few older ones drift a little north and south.", "Galileo’s hydrogen maser clocks lose about a second every three million years. Norway hosts Galileo ground stations on Svalbard, on Jan Mayen and at Troll in Antarctica.", "Worked out in your browser from the latest orbit data.", "Worked out in your browser from its orbit data."],
      moonShown: "positions from a low-precision ephemeris",
    },
    no: {
      whyShort: "En studentsatellitt jeg jobbet med i Orbit NTNU, skutt opp 5. september 2026. Den første satellitten noensinne skutt opp i bane fra det kontinentale Europa.",
      liveTag: "FramSat-1, akkurat nå",
      riding: "Om bord hos FramSat-1",
      openTracker: "Åpne full sporing", close: "Lukk",
      lookHint: "Dra for å fly rundt den",
      moreTracker: "Himmelkart, mottak og forklart TLE:",
      views: ["Bak", "Over", "Foran", "Mot Solen"],
      stops: [
        ["Månen", d => `${d} km unna akkurat nå. Dra for å snu den, og hold over navnene for å se hva som er der. Herfra går turen innover, forbi ekte romfartøy, til FramSat-1.`],
        ["ASBM-1 og ASBM-2", (pe, ap) => `Noen av de kuleste satellittene Norge har, spør du meg: Space Norways to satellitter for bredbånd i Arktis. Banene tar 16 timer og strekker seg fra ${pe} km opp til ${ap} km, så de er mesteparten av tiden høyt over nord. Hver av dem er på i rundt 10 timer nær toppen av banen, og de to overlapper, så alt nord for 65° N har dekning hele døgnet. Kjeglen er det den aktive kan se.`],
        ["Det geostasjonære beltet", () => "Et stopp for å få perspektiv. 35 786 km opp tar ett omløp like lang tid som Jorden bruker på å snu seg én gang, så satellittene står over samme sted. Hold over hvilken som helst av dem. Space Norways Thor 5, 6 og 7 står nær 1° vest."],
        ["Galileo over Trondheim", () => "Over Trondheim, der jeg bor. Dette er Europas eget navigasjonssystem, 23 222 km opp i tre baneplan, og linjene går til Galileo-satellittene en mobil her kan bruke akkurat nå. Mobilen finner ut hvor den er ved å ta tiden på signalene, som forlot satellittene for rundt 80 millisekunder siden."],
        ["Den internasjonale romstasjonen", d => `Rundt ${d} km opp akkurat nå, med folk om bord. Gjennom NASA HUNCH Norge, der jeg er styreleder, bygger norske elever utstyr til den. Tallene her er direkte.`],
        ["FramSat-1", d => `Orbit NTNUs 1U-CubeSat på rundt 1 kg, som tester en norsk solsensor fra Eidsvoll Electronics. Den gikk opp med Isar Aerospaces andre Spectrum-rakett fra Andøya, den første satellitten skutt opp i bane fra det kontinentale Europa.`],
      ],
      route: ["Månen", "ASBM", "GEO", "Galileo", "ISS", "FramSat-1"],
      labels: { moon: "Månen", fs: "FramSat-1 · 1U-CubeSat", sensor: "Solsensor (EIDEL)", gps: "GPS-plan", gal: "Galileo-plan", apo: "Apogeum", peri: "Perigeum", trd: "Trondheim", n65: "65° N · dekning hele døgnet", on: "på", off: "av", near: "Forsiden", far: "Baksiden", lit: "I sollys", dark: "Natt", kinds: { crater: "Krater", mare: "Hav", basin: "Nedslagsbasseng", site: "Landingssted" }, offFor: m => `slås på om ${fmtMin(m)}`, onFor: m => `på i ${fmtMin(m)} til`, sunAlt: a => a > 0 ? `${Math.round(a)}° over horisonten` : "under horisonten", visNow: "brukbar nå", grav: "Plan", galTip: "Galileo-satellitt, del av EUs navigasjonssystem, drevet av EUSPA. Hver har hydrogenmaser- og rubidiumklokker og en søk-og-redning-transponder som kan si fra til en nødpeilesender at hjelp er på vei." },
      k: { dist: "Avstand", lit: "Belyst", phase: "Fase", light: "Lystid", size: "Størrelse sett fra Jorden", here: "Herfra",
        alt: "Høyde", spd: "Fart", pos: "Posisjon", over: "Over", sun: "Sollys", orbit: "Omløp nr.", period: "Omløpstid", inc: "Inklinasjon",
        pa: "Perigeum · apogeum", pass: "Neste passering, Trondheim", trd: "Fra Trondheim", gspd: "Bakkefart", aboard: "Bemannet siden", sunrises: "Soloppganger per døgn",
        days: "Dager i bane", lon: "Lengdegrad", launched: "Skutt opp", op: "Operatør", shown: "Satellitter vist", lst: "Lokal tid under", rate: "Omløp per døgn",
        beta: "Solvinkel mot banen (β)", shadowPct: "Tid i skygge per omløp", sink: "Synker av luftmotstand", horizon: "Avstand til horisonten", seen: "Synlig del av Jorden",
        fromTrd: "Sett fra Trondheim", delay: "Signalforsinkelse", incl: "Inklinasjon", swing: "Daglig svingning nord–sør", active: "Nyttelast", cover: "Dekning",
        visible: "Brukbare fra Trondheim", dop: "Geometri (PDOP)", nearest: "Nærmeste", side: "Side", sunNow: "Solen der nå", type: "Type",
        payloads: "Nyttelaster", ground: "Styring", dist: "Avstand" },
      sunlit: m => `I sollys · skygge om ${fmtMin(m)}`, dark: m => `I jordskyggen · soloppgang om ${fmtMin(m)}`,
      sunlitNow: "I sollys", darkNow: "I jordskyggen",
      passFmt: (t, el, vis) => `${t}, ${el}° høyt${vis ? ", synlig" : ""}`, noPass2: "Ingen innen 24 t",
      phases: ["Nymåne", "Voksende månesigd", "Første kvarter", "Voksende måne", "Fullmåne", "Minkende måne", "Siste kvarter", "Minkende månesigd"],
      cardFoot: ["Dra for å snu Månen. Dobbeltklikk for å sette den tilbake.", "Dekningstallene er Space Norways. Vinduet på 10 timer er mitt anslag.", "Hold over en satellitt for detaljer. De fleste står rett på linjen; noen eldre driver litt nord og sør.", "Galileos hydrogenmaser-klokker driver rundt ett sekund på tre millioner år. Norge har Galileo-bakkestasjoner på Svalbard, Jan Mayen og Troll i Antarktis.", "Regnet ut i nettleseren din fra de nyeste banedataene.", "Regnet ut i nettleseren din fra banedataene."],
      moonShown: "posisjoner fra en forenklet efemeride",
    },
  });

  /* ---------- live derived numbers ---------- */
  // where something is in the sky from a place on the ground
  function lookFrom(lat, lon, rEci, ms) {
    const e = rotZ(rEci, -gmst(ms)), up = ecefUnit(lat, lon), o = mul(up, RE);
    const d = sub(e, o), L = len(d), u = mul(d, 1 / L);
    const east = norm(cross([0, 0, 1], up)), north = cross(up, east);
    return { el: deg(Math.asin(dot(u, up))), az: (deg(Math.atan2(dot(u, east), dot(u, north))) + 360) % 360, range: L };
  }
  const azName = az => (C.lang === "en" ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] : ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"])[Math.round(az / 45) % 8];
  const skyText = l => l.el > 0 ? `${fmtN(l.el, 1)}° ${C.lang === "en" ? "up" : "opp"}, ${Math.round(l.az)}° ${azName(l.az)}` : (C.lang === "en" ? `below the horizon (${Math.round(l.el)}°)` : `under horisonten (${Math.round(l.el)}°)`);
  function tipHTML(title, subline, desc, rows) {
    return `<b>${title}</b>${subline ? `<span class="m">${subline}</span>` : ""}${desc ? `<p>${desc}</p>` : ""}${rows && rows.length ? `<dl>${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}`;
  }
  // orbit facts that are easy to compute and rarely shown
  function orbitExtras(name, ms) {
    const s = sv(name, ms), el = elements(name); if (!s || !el) return null;
    const r = len(s.r), h = norm(cross(s.r, s.v)), sun = sunEci(ms);
    const beta = Math.asin(Math.max(-1, Math.min(1, dot(h, sun))));
    const bStar = Math.asin(RE / r);
    const shadow = Math.abs(beta) >= bStar ? 0 : Math.acos(Math.min(1, Math.sqrt(r * r - RE * RE) / (r * Math.cos(beta)))) / Math.PI;
    const ndot2 = parseFloat(TLES[name][0].slice(33, 43)) || 0;            // half the mean-motion rate, rev/day²
    const sink = (2 / 3) * el.a * (2 * ndot2) / el.revPerDay * 1000;     // metres per day
    return { beta: deg(beta), shadow, sink, horizon: Math.sqrt(r * r - RE * RE), seen: (1 - RE / r) / 2 };
  }
  function meanAnomaly(name, ms) {
    const rec = SAT[name], el = elements(name); if (!rec || !el) return null;
    const M = rec.mo + rec.no * (ms - el.epochMs) / 60000;
    return ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }
  // ASBM satellites switch their payloads on for about 10 h of each 16 h orbit, around apogee
  const ASBM_HALF = Math.PI * 10 / 16;
  function asbmState(name, ms) {
    const M = meanAnomaly(name, ms), rec = SAT[name]; if (M === null) return null;
    const off = M - Math.PI;
    const active = Math.abs(off) < ASBM_HALF;
    const minutes = active ? (ASBM_HALF - off) / rec.no : (((Math.PI - ASBM_HALF) - M + 2 * Math.PI) % (2 * Math.PI)) / rec.no;
    return { active, minutes };
  }
  function pdop(vecs) {                                    // dilution of precision from unit line-of-sight vectors
    if (vecs.length < 4) return null;
    const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (const v of vecs) { const g = [-v[0], -v[1], -v[2], 1]; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) A[i][j] += g[i] * g[j]; }
    const M = A.map((r, i) => [...r, ...[0, 1, 2, 3].map(j => (i === j ? 1 : 0))]);
    for (let c = 0; c < 4; c++) {
      let p = c; for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c]; if (Math.abs(d) < 1e-12) return null;
      for (let j = 0; j < 8; j++) M[c][j] /= d;
      for (let r = 0; r < 4; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 8; j++) M[r][j] -= f * M[c][j]; }
    }
    return Math.sqrt(M[0][4] + M[1][5] + M[2][6]);
  }
  function gpsSky(ms) {
    const up = ecefUnit(TRD.lat, TRD.lon), east = norm(cross([0, 0, 1], up)), north = cross(up, east);
    const vis = [];
    for (const n of GAL_SATS) {
      const s = sv(n, ms); if (!s) continue;
      const l = lookFrom(TRD.lat, TRD.lon, s.r, ms);
      if (l.el > 10) {
        const e = rotZ(s.r, -gmst(ms)), d = norm(sub(e, mul(up, RE)));
        vis.push({ n, s, l, enu: [dot(d, east), dot(d, north), dot(d, up)] });
      }
    }
    return { vis, pdop: pdop(vis.map(v => v.enu)) };
  }
  const obs = { latitude: rad(TRD.lat), longitude: rad(TRD.lon), height: TRD.h };
  const trdEci = ms => mul(rotZ(ecefUnit(TRD.lat, TRD.lon), gmst(ms)), RE);
  function look(name, ms) {
    const s = sv(name, ms); if (!s) return null;
    const g = gmst(ms);
    const ecf = satellite.eciToEcf({ x: s.r[0], y: s.r[1], z: s.r[2] }, g);
    const la = satellite.ecfToLookAngles(obs, ecf);
    return { el: deg(la.elevation), range: la.rangeSat, s };
  }
  const passCache = {};
  function nextPass(name, ms) {
    const c = passCache[name];
    if (c && ms - c.at < 120000 && (!c.p || c.p.end > ms)) return c.p;
    let p = null, aos = null, maxEl = -90, best = null;
    for (let i = 0; i <= 2880; i++) {
      const t = ms + i * 30000, l = look(name, t); if (!l) break;
      if (aos === null && l.el > 10) aos = t;
      if (aos !== null) {
        if (l.el > maxEl) { maxEl = l.el; best = { t, l }; }
        if (l.el < 10) { p = { aos, maxEl, end: t, best }; break; }
      }
    }
    if (p) {
      const sun = sunEci(p.best.t), up = norm(trdEci(p.best.t));
      p.visible = !inShadow(p.best.l.s.r, sun) && dot(up, sun) < Math.sin(rad(-6));
    }
    passCache[name] = { at: ms, p };
    return p;
  }
  const shadowCache = {};
  function shadowChange(name, ms) {
    const c = shadowCache[name];
    if (c && c.t > ms && ms - c.at < 30000) return c;
    const s0 = sv(name, ms); if (!s0) return null;
    const state = inShadow(s0.r, sunEci(ms));
    let t = null;
    for (let i = 1; i <= 720; i++) { const tt = ms + i * 15000, s = sv(name, tt); if (s && inShadow(s.r, sunEci(tt)) !== state) { t = tt; break; } }
    const out = { at: ms, state, t: t || ms + 1e9 };
    shadowCache[name] = out;
    return out;
  }
  function geodetic(r, ms) {
    const gd = satellite.eciToGeodetic({ x: r[0], y: r[1], z: r[2] }, gmst(ms));
    return { lat: deg(gd.latitude), lon: ((deg(gd.longitude) + 540) % 360) - 180, h: gd.height };
  }
  // Altitude is always above the ellipsoid (as GPS and the tracker give it),
  // so every number on the page agrees. The lowest and highest point of the
  // current orbit are measured the same way, by sampling one lap.
  const altOf = (r, ms) => geodetic(r, ms).h;
  const rangeCache = {};
  function altRange(name, ms) {
    const key = `${name}:${Math.floor(ms / 6e5)}`;
    if (rangeCache[key]) return rangeCache[key];
    const el = elements(name); if (!el) return null;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < 120; i++) {
      const t = ms + el.period * 60000 * i / 120, s = sv(name, t); if (!s) continue;
      const h = altOf(s.r, t); lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
    return (rangeCache[key] = isFinite(lo) ? { lo, hi } : null);
  }
  const rangeText = (name, ms) => { const r = altRange(name, ms); return r ? `${fmtKm(r.lo)} · ${fmtKm(r.hi)} km` : "–"; };
  function satNumbers(name, ms) {
    const s = sv(name, ms); if (!s) return null;
    const el = elements(name), g = geodetic(s.r, ms), sun = sunEci(ms);
    const r = len(s.r), v = len(s.v);
    const orbitNo = el ? el.rev0 + Math.floor((ms - el.epochMs) / 864e5 * el.revPerDay) : null;
    const sh = shadowChange(name, ms);
    const lst = ((ms / 36e5 + g.lon / 15) % 24 + 24) % 24;
    return { s, r, v, alt: g.h, g, el, orbitNo, sh, gspd: v * RE / r, lst };
  }
  function moonNumbers(ms) {
    const m = moonEci(ms), sun = sunEci(ms), d = len(m), md = mul(m, 1 / d);
    const elong = Math.acos(Math.max(-1, Math.min(1, dot(md, sun))));
    const lit = (1 - Math.cos(elong)) / 2;
    const waxing = dot(cross(sun, md), ECL_N) > 0;
    const ang = waxing ? deg(elong) : 360 - deg(elong);
    const idx = Math.round(ang / 45) % 8;
    return { d, lit, idx, light: d / 299792.458, size: 2 * deg(Math.asin(RM / d)) };
  }

  /* ---------- renderer ---------- */
  const FRAG = `
  uniform vec3 uCam; uniform vec3 uF; uniform vec3 uR; uniform vec3 uU; uniform float uTanH; uniform float uShift;
  uniform vec3 uSun; uniform float uGmst; uniform float uFade; uniform float uLoaded; uniform float uNight;
  uniform vec3 uMoon; uniform float uMoonR; uniform vec3 uMX; uniform vec3 uMY; uniform vec3 uMZ;
  uniform sampler2D tDay; uniform sampler2D tNight; uniform sampler2D tWater; uniform sampler2D tClouds; uniform sampler2D tMoon;
  uniform sampler2D tMoonE; uniform sampler2D tMoonN;      // the Moon's relief: east and north tilt of the surface
  uniform sampler2D tDetail; uniform vec4 uDetailBox; uniform float uDetail;  // close-up imagery: west, north, width, height (rad)
  const float RELIEF = 1.5;                                 // relief exaggeration, so craters read from far away
  vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
  vec4 texSphere(sampler2D t, vec2 uv){
    vec2 uvB = vec2(fract(uv.x + 0.5) - 0.5, uv.y);
    vec2 dxA = dFdx(uv), dyA = dFdy(uv), dxB = dFdx(uvB), dyB = dFdy(uvB);
    bool useB = dot(dxB, dxB) + dot(dyB, dyB) < dot(dxA, dxA) + dot(dyA, dyA);
    return textureGrad(t, uv, useB ? dxB : dxA, useB ? dyB : dyA);
  }
  void main(){
    vec2 fc = gl_FragCoord.xy;
    float aspect = uRes.x / uRes.y;
    vec2 ndc = vec2((fc.x / uRes.x * 2.0 - 1.0) * aspect, fc.y / uRes.y * 2.0 - 1.0);
    vec3 rd = normalize(uF + uR * (ndc.x - uShift) * uTanH + uU * ndc.y * uTanH);
    vec3 ro = uCam;
    vec3 col = vec3(0.0);
    float b = dot(ro, rd), c = dot(ro, ro) - 1.0, h = b * b - c;
    float tE = (h > 0.0 && -b > 0.0) ? -b - sqrt(h) : 1e9;
    vec3 oc = ro - uMoon;
    float bm = dot(oc, rd), hm = bm * bm - (dot(oc, oc) - uMoonR * uMoonR);
    float tM = (hm > 0.0 && -bm > 0.0) ? -bm - sqrt(hm) : 1e9;
    if (tM < tE) {
      vec3 n = normalize(oc + rd * tM);
      float lon = atan(dot(n, uMY), dot(n, uMX)), lat = asin(clamp(dot(n, uMZ), -1.0, 1.0));
      vec2 uv = vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927);
      float alb = uLoaded > 0.5 ? toLin(texSphere(tMoon, uv).rrr).r : 0.12;
      vec3 nl = n;
      if (uLoaded > 0.5) {
        // tilt the surface by the elevation model: east and north of this point
        vec2 tilt = vec2(texSphere(tMoonE, uv).r, texSphere(tMoonN, uv).r) * 2.0 - 1.0;
        vec3 east = normalize(cross(uMZ, n) + vec3(1e-7)), north = cross(n, east);
        nl = normalize(n * sqrt(max(1.0 - dot(tilt, tilt), 0.0)) + (east * tilt.x + north * tilt.y) * RELIEF);
      }
      float mu0 = max(dot(nl, uSun), 0.0), mu = max(dot(n, -rd), 0.0);
      col = vec3(1.0, 0.985, 0.96) * alb * (mu0 / (mu0 + mu + 1e-4)) * 4.2;
      col += vec3(0.30, 0.38, 0.50) * alb * 0.03 * max(dot(n, normalize(-uMoon)), 0.0);   // earthshine
    } else if (tE < 1e8) {
      vec3 n = normalize(ro + rd * tE);
      float cg = cos(uGmst), sg = sin(uGmst);
      vec3 ne = vec3(cg * n.x + sg * n.y, -sg * n.x + cg * n.y, n.z);
      float lat = asin(clamp(ne.z, -1.0, 1.0)), lon = atan(ne.y, ne.x);
      vec2 uv = vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927);
      vec3 day = uLoaded > 0.5 ? toLin(texSphere(tDay, uv).rgb) : vec3(0.01, 0.03, 0.08);
      float lights = uLoaded > 0.5 ? smoothstep(0.24, 0.75, texSphere(tNight, uv).r) : 0.0;
      float water = uLoaded > 0.5 ? texSphere(tWater, uv).r : 1.0;
      float cloud = uLoaded > 0.5 ? texSphere(tClouds, uv).r : 0.0;
      // close-up imagery under the ISS or FramSat-1, faded out towards its edges
      float dw = 0.0;
      if (uDetail > 0.001) {
        vec2 d = vec2(fract((lon - uDetailBox.x) / 6.2831853 + 1.0) * 6.2831853 / uDetailBox.z, (uDetailBox.y - lat) / uDetailBox.w);
        float e = min(min(d.x, 1.0 - d.x), min(d.y, 1.0 - d.y));
        if (e > 0.0) {
          vec4 dt = texture(tDetail, d);
          dw = smoothstep(0.0, 0.12, e) * uDetail * dt.a;
          day = mix(day, toLin(dt.rgb), dw);
        }
      }
      // the maps run out of detail below ~10 km; add fractal detail that fades in only when close
      float near = uNight;
      if (near > 0.01) {
        vec2 q = ne.xy * 260.0 + ne.z * 173.0;
        float fine = fbm6(q) - 0.5;
        float edge = smoothstep(0.04, 0.45, cloud) * (1.0 - smoothstep(0.75, 1.0, cloud));
        cloud = clamp(cloud + fine * 0.55 * edge * near + (fbm4(q * 3.7) - 0.5) * 0.18 * cloud * near, 0.0, 1.0);
        float ter = fbm6(ne.xy * 420.0 + ne.z * 311.0);
        day *= mix(1.0, 0.82 + 0.36 * ter, (1.0 - water) * near * (1.0 - dw) * smoothstep(-0.05, 0.2, dot(n, uSun)));
      }
      float ndl = dot(n, uSun);
      float lit = smoothstep(-0.04, 0.12, ndl);
      float diff = max(ndl, 0.0);
      vec3 ground = day * (0.04 + 1.15 * diff);
      vec3 surf = mix(ground, vec3(0.95) * (0.03 + 1.05 * diff), cloud * 0.92);
      vec3 hv = normalize(uSun - rd);
      vec3 nw = n;
      if (near > 0.01) nw = normalize(n + (vec3(fbm4(ne.xy * 900.0), fbm4(ne.yz * 900.0 + 3.0), 0.0) - 0.5) * 0.06 * near);
      surf += vec3(1.0, 0.92, 0.80) * (pow(max(dot(nw, hv), 0.0), 120.0) * 0.55 + pow(max(dot(nw, hv), 0.0), 18.0) * 0.06) * water * (1.0 - cloud) * lit;
      // night: city lights, plus a faint lift so land and sea stay readable
      // night: city lights, and a faint cool starlight so land, sea and cloud stay apart
      float lum = dot(day, vec3(0.3, 0.55, 0.15));
      vec3 night = vec3(1.0, 0.72, 0.42) * lights * (1.0 - cloud * 0.8) * 1.2 + day * 0.002
                 + vec3(0.30, 0.42, 0.70) * (lum * 0.05 * (1.0 - water) + 0.012 * cloud) * uNight;
      surf = mix(night, surf, lit);
      float mu = clamp(dot(n, -rd), 0.0, 1.0);
      float rim = pow(1.0 - mu, 3.0);
      vec3 sky = mix(vec3(1.0, 0.45, 0.18), vec3(0.28, 0.52, 1.0), smoothstep(-0.02, 0.3, ndl)) * smoothstep(-0.25, 0.05, ndl);
      // aerial perspective: more blue haze the longer the line of sight through air
      float haze = (1.0 - exp(-pow(1.0 - mu, 4.0) * 3.0)) * (0.35 + 0.65 * near);
      float hazeLit = smoothstep(-0.12, 0.12, ndl);            // no glowing haze over the night side
      col = mix(surf, sky * 0.9, max(rim * 0.6, haze * 0.7) * mix(0.15, 1.0, hazeLit)) + sky * 0.08 * (1.0 - mu) * lit;
    } else if (-b > 0.0) {
      vec3 pc = ro + rd * (-b);
      float alt = max(length(pc) - 1.0, 0.0);
      float l = dot(normalize(pc), uSun);
      vec3 sky = mix(vec3(1.0, 0.45, 0.18), vec3(0.28, 0.52, 1.0), smoothstep(-0.02, 0.3, l)) * smoothstep(-0.25, 0.05, l);
      col += sky * (exp(-alt / 0.0075) * 0.75 + exp(-alt / 0.025) * 0.08);
      col += vec3(0.20, 0.85, 0.35) * exp(-pow((alt - 0.0149) / 0.003, 2.0)) * 0.08 * smoothstep(0.1, -0.2, l);
    }
    // The Sun, where it really is: a limb-darkened disk at its true size
    // (about 0.53 degrees, so a few pixels across), a corona and a soft bloom.
    // Drawn only where Earth and the Moon don't cover it, so eclipses come out
    // right. It's far enough to count as infinitely far from every stop.
    if (tE > 1e8 && tM > 1e8) {
      float sd = dot(rd, uSun);
      if (sd > 0.0) {
        float r = length(cross(rd, uSun)) / 0.004653;      // angle from its centre, in solar radii
        if (r < 1.0) col += vec3(1.0, 0.9, 0.76) * (1.0 - 0.6 * (1.0 - sqrt(1.0 - r * r))) * 9.0;
        else col += vec3(1.0, 0.84, 0.64) * (0.5 * pow(1.0 / r, 3.0) + 0.05 * pow(1.0 / r, 1.4));
        col += vec3(1.0, 0.96, 0.88) * pow(sd, 900.0) * 0.3;
      }
    }
    col *= uFade;
    col = col / (1.0 + col * 0.35);
    col = pow(col, vec3(1.0 / 2.2));
    col += (hash12(fc) - 0.5) / 255.0;
    outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }`;
  const canvas = $("field");
  const field = C.createField(canvas, FRAG,
    ["uCam", "uF", "uR", "uU", "uTanH", "uShift", "uSun", "uGmst", "uFade", "uLoaded", "uNight", "uMoon", "uMoonR", "uMX", "uMY", "uMZ",
     "uDetailBox", "uDetail"]);
  let loaded = 0, loadedAt = 0;

  /* ---------- maps, sharper in steps ----------
     Built by scripts/descent-textures.py from NASA's maps. A 2K set loads
     first so the page appears quickly; then each map is replaced in the
     background by a sharper one: 4K on phones and small GPUs, 8K on desktops
     (the Moon's relief stops at 4K, its elevation data's resolution). The
     Moon's maps go first while the page is on the Moon. With data saver on,
     it stays at 2K. Big uploads wait for a moment the camera is still. */
  const MAPS = [ // uniform, file, texture unit, channels, largest size
    // Only the day map and the Moon go to 8K. Night lights, the water mask
    // and clouds stop at 4K: soft anyway, the close-ups cover the low stops,
    // and each 8K greyscale map costs about 45 MB of GPU memory.
    ["tDay", "earth-day", 0, 4, 8192], ["tNight", "earth-night", 1, 1, 4096], ["tWater", "earth-water", 2, 1, 4096],
    ["tClouds", "earth-clouds", 3, 1, 4096], ["tMoon", "moon", 4, 1, 8192],
    ["tMoonE", "moon-tilt-east", 6, 1, 4096], ["tMoonN", "moon-tilt-north", 7, 1, 4096],
  ];
  const TAG = { 2048: "2k", 4096: "4k", 8192: "8k" };

  // The cover (markup.ts) opens once the first maps are on screen: no sooner
  // than COVER_MIN after the page started loading, so the greeting can be read,
  // and no later than COVER_MAX, slow connection or not.
  const COVER_MIN = 1200, COVER_MAX = 5000;
  let coverOpen = false;
  function openCover() {
    if (coverOpen) return;
    coverOpen = true;
    const cover = $("cover"); if (!cover) return;
    setTimeout(() => {
      cover.classList.add("open");
      setTimeout(() => cover.remove(), 1600);         // free its layers once it's gone
    }, Math.max(0, COVER_MIN - performance.now()));
  }
  setTimeout(openCover, Math.max(0, COVER_MAX - performance.now()));
  if (!field) openCover();
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const sharpest = !field || saveData ? 2048
    : !C.coarse && field.maxTexture >= 8192 && (navigator.deviceMemory || 8) >= 8 ? 8192 : 4096;
  // The load event, not img.decode(), which can stall in a background tab.
  function image(src, cors) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (cors) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }
  const mapUrl = (file, w) => `/descent/tex/${file}-${TAG[w]}.webp`;
  // A map decoded to an ImageBitmap, so its memory can be released (close())
  // as soon as it is on the GPU, rather than whenever the browser gets round
  // to it. An 8K map decoded is about 130 MB.
  async function bitmap(src) {
    if (!window.createImageBitmap) return image(src);
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Could not load ${src}`);
    return createImageBitmap(await res.blob(), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
  }
  const upload = (name, img, unit, channels) => { field.texture(name, img, unit, channels); if (img.close) img.close(); };
  const calm = () => new Promise(res => {
    const check = () => (Math.abs(yT - yS) < 2 && !dragging ? res() : setTimeout(check, 150));
    check();
  });
  if (field) {
    (async () => {
      const first = await Promise.all(MAPS.map(m => bitmap(mapUrl(m[1], 2048)).catch(() => null)));
      first.forEach((img, i) => { if (img) upload(MAPS[i][0], img, MAPS[i][2], MAPS[i][3]); });
      first.length = 0;
      loaded = 1; loadedAt = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(openCover));   // after a frame with the maps
      if (sharpest <= 2048) return;
      const moonFirst = curStop === 0;
      const order = [...MAPS].sort((a, b) => (a[1].startsWith("moon") === moonFirst ? -1 : 1) - (b[1].startsWith("moon") === moonFirst ? -1 : 1));
      for (const [name, file, unit, channels, largest] of order) {
        const w = Math.min(sharpest, largest);
        const img = await bitmap(mapUrl(file, w)).catch(() => null);
        if (!img) continue;
        await calm();
        upload(name, img, unit, channels);
      }
    })();
  }

  /* ---------- close-up imagery ----------
     At the ISS and FramSat-1 stops the camera is only a few hundred km up,
     where a world map can't be sharp. So the region under the spacecraft is
     put together from NASA GIBS map tiles (Blue Marble with shaded relief
     and bathymetry, about 1 km per pixel; 48 tiles, 36 x 27 degrees) and
     blended over the world map. It's rebuilt as the spacecraft moves on. */
  const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_ShadedRelief_Bathymetry/default/500m";
  const DETAIL_LEVEL = 6, TILE_DEG = 4.5, TILE_COLS = 80, TILE_ROWS = 40, BOX_COLS = 8, BOX_ROWS = 6;
  const detail = { box: null, sat: null, loading: false, fade: 0, ready: false };
  function subPoint(name, ms) {
    const s = sv(name, ms); if (!s) return null;
    const e = rotZ(s.r, -gmst(ms));
    return { lat: deg(Math.asin(e[2] / len(e))), lon: deg(Math.atan2(e[1], e[0])) };
  }
  async function buildDetail(sat, p) {
    detail.loading = true;
    const col0 = Math.floor((p.lon + 180) / TILE_DEG) - BOX_COLS / 2;
    const row0 = Math.max(0, Math.min(TILE_ROWS - BOX_ROWS, Math.floor((90 - p.lat) / TILE_DEG) - BOX_ROWS / 2));
    const canvas = document.createElement("canvas");
    canvas.width = BOX_COLS * 512; canvas.height = BOX_ROWS * 512;
    const g = canvas.getContext("2d");
    const jobs = [];
    for (let r = 0; r < BOX_ROWS; r++) for (let c = 0; c < BOX_COLS; c++) {
      const col = ((col0 + c) % TILE_COLS + TILE_COLS) % TILE_COLS, row = row0 + r;
      jobs.push(image(`${GIBS}/${DETAIL_LEVEL}/${row}/${col}.jpeg`, true).then(img => g.drawImage(img, c * 512, r * 512)).catch(() => {}));
    }
    await Promise.all(jobs);
    await calm();
    field.texture("tDetail", canvas, 5);
    canvas.width = canvas.height = 0;                       // the 50 MB canvas is no longer needed
    detail.box = { lat: 90 - (row0 + BOX_ROWS / 2) * TILE_DEG, lon: (col0 + BOX_COLS / 2) * TILE_DEG - 180,
      uniform: [rad(col0 * TILE_DEG - 180), rad(90 - row0 * TILE_DEG), rad(BOX_COLS * TILE_DEG), rad(BOX_ROWS * TILE_DEG)] };
    if (detail.sat !== sat) detail.fade = 0;
    detail.sat = sat; detail.ready = true; detail.loading = false;
  }
  function updateDetail(ms) {
    if (!field || !loaded || detail.loading) return;
    const stopNow = curStop;
    const sat = stopNow === 4 ? "ISS" : stopNow === 5 ? "FRAMSAT-1" : null;
    if (!sat) {
      // away from the low stops for 15 s: give the close-up's GPU memory back
      if (!detail.ready) return;
      detail.leftAt = detail.leftAt || ms;
      if (ms - detail.leftAt > 15000) { detail.ready = false; detail.box = null; detail.sat = null; detail.fade = 0; field.drop("tDetail"); }
      return;
    }
    detail.leftAt = 0;
    const p = subPoint(sat, ms); if (!p) return;
    const b = detail.box;
    const dLon = b ? Math.abs(((p.lon - b.lon + 540) % 360) - 180) : 1e9;
    if (detail.sat !== sat || !b || dLon > BOX_COLS * TILE_DEG * 0.25 || Math.abs(p.lat - b.lat) > BOX_ROWS * TILE_DEG * 0.25) buildDetail(sat, p);
  }

  /* ---------- camera ---------- */
  function lookAt(pos, target, upHint) {
    const F = norm(sub(target, pos));
    let R = cross(F, upHint);
    if (len(R) < 1e-6) R = cross(F, [1, 0, 0]);
    R = norm(R);
    return { F, U: cross(R, F) };
  }
  const tilt = (cam, ang) => ({ F: norm(add(mul(cam.F, Math.cos(ang)), mul(cam.U, Math.sin(ang)))), U: norm(add(mul(cam.U, Math.cos(ang)), mul(cam.F, -Math.sin(ang)))) });
  const narrow = () => innerWidth <= 900;
  // The scene's size. On phones it's a window across the top of the screen
  // (the canvases' CSS height), with the page scrolling on below it.
  const sceneEl = $("overlay");
  const VW = () => innerWidth, VH = () => sceneEl.clientHeight || innerHeight;
  const portrait = () => VH() > VW();
  const readTop = () => 0, readH = () => innerHeight;

  // interactive state
  const moonLook = { az: 0, el: 0, taz: 0, tel: 0 };
  let moonAxes = null;                 // the hero view's up and right, to turn the Moon around
  // The Moon turned by dragging, like spinning a globe: around the view's up
  // axis for left and right, around its right axis for up and down. The
  // sunlight stays where it is.
  function spinMoon(mf) {
    if (!moonAxes || (!moonLook.az && !moonLook.el)) return mf;
    const turn = v => rotAround(rotAround(v, moonAxes.U, moonLook.az), moonAxes.R, moonLook.el);
    return { ...mf, mx: turn(mf.mx), my: turn(mf.my), mz: turn(mf.mz) };
  }
  const ride = { yaw: 0, pitch: null, tyaw: 0, tpitch: null, preset: 0 };
  const RIDE_DIST = 2600, RIDE_PITCH = 0.8;

  function moonFrame(ms) {
    const moon = moonEci(ms), toEarth = norm(mul(moon, -1));
    const mx = norm(sub(toEarth, mul(ECL_N, dot(toEarth, ECL_N)))), my = cross(ECL_N, mx);
    return { moon, mx, my, mz: ECL_N };
  }

  function stop(i, ms, drift) {
    const aspect = VW() / VH();
    const sh = narrow() ? 0 : 0.22 * aspect;
    if (i === 0) {
      // Framed around the Sun: the camera looks at the Moon with the Sun just
      // past its top edge (clear of the name and the route list), so the Moon is lit from behind, whatever
      // the phase: near new Moon its face is the night side in earthshine
      // with the Sun's corona flaring round the rim, otherwise a thin bright
      // crescent along that edge. Dragging turns the Moon itself (spinMoon).
      const M = moonEci(ms), sun = sunEci(ms), D = 7900 + drift * 400;
      let U0 = sub(ECL_N, mul(sun, dot(ECL_N, sun)));
      U0 = len(U0) < 1e-3 ? norm(cross(sun, [1, 0, 0])) : norm(U0);
      const off = norm(sub(mul(U0, 0.97), mul(cross(sun, U0), 0.26)));   // where the Sun sits from the Moon's centre: up, a touch left
      const a = Math.asin(RM / D) * 1.04;                              // just past the edge
      const F = norm(sub(mul(sun, Math.cos(a)), mul(off, Math.sin(a))));
      const pos = sub(M, mul(F, D));
      const U = norm(sub(U0, mul(F, dot(U0, F))));
      moonAxes = { U, R: cross(F, U) };
      // The way out: back away from the Moon so it shrinks ahead of you,
      // then curve in towards Earth. The view turns round on the way (blend).
      const back = sub(pos, mul(F, 60000));
      const hop = [back, mul(back, 0.45)];
      return { pos, F, U, half: portrait() ? 30 : 21, shift: sh * 0.8, hop };
    }
    if (i === 1) {
      // face-on to the ASBM orbital plane so the true shape shows, apogee (the Arctic) at the top
      const s = sv("ASBM-1", ms);
      if (!s) return stop(2, ms, 0);
      const h = norm(cross(s.r, s.v));
      const pts = orbit("ASBM-1", ms);
      let apo = s.r, best = 0;
      for (const p of pts) { const r = len(p); if (r > best) { best = r; apo = p; } }
      const apoD = norm(apo);
      const el = elements("ASBM-1");
      const center = mul(apoD, el ? el.a * el.e : 18000);
      const side = norm(cross(apoD, h));
      const view = norm(add(add(mul(h, 0.94), mul([0, 0, 1], 0.18)), mul(side, 0.12 - 0.24 * drift)));
      const pos = add(center, mul(view, portrait() ? 150000 : 128000));
      const o = lookAt(pos, center, apoD);
      return { pos, ...o, half: portrait() ? 36 : 26, shift: sh * 0.45, tgt: center };
    }
    if (i === 2) {
      const t7 = sv("THOR 7", ms);
      const base = t7 ? Math.atan2(t7.r[1], t7.r[0]) : 0;
      const lon = base + rad(40) - rad(80) * drift;
      const dir = [Math.cos(lon) * Math.cos(rad(16)), Math.sin(lon) * Math.cos(rad(16)), Math.sin(rad(16))];
      const pos = mul(dir, 128000);
      const o = lookAt(pos, [0, 0, 0], [0, 0, 1]);
      return { pos, ...o, half: portrait() ? 36 : 24, shift: narrow() ? 0 : 0.42 * aspect };
    }
    if (i === 3) {
      // look past Trondheim out into the Galileo shell
      const g = gmst(ms) + rad(TRD.lon) + rad(18) - rad(36) * drift;
      const dir = [Math.cos(g) * Math.cos(rad(40)), Math.sin(g) * Math.cos(rad(40)), Math.sin(rad(40))];
      const pos = mul(dir, 74000);
      const o = lookAt(pos, mul(norm(trdEci(ms)), 4000), [0, 0, 1]);
      return { pos, ...o, half: portrait() ? 38 : 28, shift: sh };
    }
    if (i === 4) {
      const s = sv("ISS", ms) || { r: [RE + 420, 0, 0], v: [0, 7.66, 0] };
      const up = norm(s.r), fwd = norm(sub(s.v, mul(up, dot(s.v, up))));
      const pos = add(add(s.r, mul(up, 2600)), mul(fwd, -3200 + drift * 600));
      const tgt = add(s.r, mul(fwd, 1400));
      const o = lookAt(pos, tgt, up);
      return { pos, ...o, half: portrait() ? 38 : 30, shift: sh * 0.6, tgt };
    }
    // FramSat-1: a chase camera a few thousand km out, looking at the satellite with the ground below it
    const s = sv("FRAMSAT-1", ms) || { r: [RE + 560, 0, 0], v: [0, 7.6, 0] };
    const r = len(s.r), up = mul(s.r, 1 / r), fwd = norm(sub(s.v, mul(up, dot(s.v, up)))), side = cross(fwd, up);
    const half = portrait() ? 40 : 30;
    if (ride.pitch === null) { ride.pitch = ride.tpitch = RIDE_PITCH; }
    const cp = Math.cos(ride.pitch);
    const dir = norm(add(add(mul(fwd, -cp * Math.cos(ride.yaw)), mul(side, cp * Math.sin(ride.yaw))), mul(up, Math.sin(ride.pitch))));
    const pos = add(s.r, mul(dir, RIDE_DIST));
    const o = lookAt(pos, s.r, up);
    return { pos, ...o, half, shift: 0, frame: { up, fwd, side }, tgt: s.r, sat: s.r };
  }

  const aimOf = c => c.tgt || add(c.pos, mul(c.F, Math.min(len(c.pos) * 0.9, 400000)));
  function blend(A, B, t) {
    const ra = len(A.pos), rb = len(B.pos);
    const r = Math.exp(lerp(Math.log(ra), Math.log(rb), t));
    const dir = slerp(norm(A.pos), norm(B.pos), t);
    const arc = Math.acos(Math.max(-1, Math.min(1, dot(norm(A.pos), norm(B.pos)))));
    // only climb when hopping between two low stops on different sides of the planet
    const low = C.clamp01((30000 - Math.max(ra, rb)) / 20000);
    const lift = 1 + Math.sin(Math.PI * t) * Math.min(1.6, arc) * 0.9 * low;
    // leaving the Moon: the curve set out by A.hop (see stop 0), else the usual path
    const u = 1 - t;
    const pos = A.hop
      ? add(add(mul(A.pos, u * u * u), mul(A.hop[0], 3 * u * u * t)), add(mul(A.hop[1], 3 * u * t * t), mul(B.pos, t * t * t)))
      : mul(dir, Math.max(r * lift, RE + 150));
    // aim at a point that slides from one stop's subject to the next, so the view never swings past it
    const e = t * t * (3 - 2 * t);
    const aim = add(mul(aimOf(A), 1 - e), mul(aimOf(B), e));
    let F = norm(sub(aim, pos));
    if (A.hop) {
      // leaving the Moon the view may turn right round (from the Sun to Earth),
      // which aiming at a sliding point can't do: turn about an explicit axis
      let axis = cross(A.F, B.F);
      axis = len(axis) < 1e-3 ? A.U : norm(axis);
      F = rotAround(A.F, axis, Math.acos(Math.max(-1, Math.min(1, dot(A.F, B.F)))) * e);
    }
    if (!isFinite(F[0])) F = slerp(A.F, B.F, t);
    let U = slerp(A.U, B.U, t);
    U = sub(U, mul(F, dot(U, F)));
    U = len(U) < 1e-4 ? norm(sub(norm(pos), mul(F, dot(norm(pos), F)))) : norm(U);
    return { pos, F, U, half: lerp(A.half, B.half, t), shift: lerp(A.shift, B.shift, t), sat: B.sat || A.sat };
  }

  /* ---------- scroll ---------- */
  const sections = [...document.querySelectorAll("[data-stop]")];
  let holds = [], lockY = 0;
  function layout() {
    if (narrow()) return layoutPhone();
    const vh = readH();
    holds = sections.map((s, i) => {
      const top = s.offsetTop, h = s.offsetHeight;
      if (i === 0) return [0, vh * 0.8];
      if (i === 5) return [top + vh * 0.35, top + h - vh * 0.4];   // FramSat-1: a long hold to ride along
      return [top + vh * 0.55, Math.max(top + vh * 0.55, top + h - vh * 0.45)];
    });
    const s = sections[5];
    lockY = s.offsetTop + s.offsetHeight - innerHeight * 0.75;
  }
  // Phones: a stop holds while its view is on screen; the moves between
  // stops happen while the text is on screen and the scene is faded down.
  let textBlocks = [];
  function layoutPhone() {
    const H = innerHeight, views = [...document.querySelectorAll(".view")];
    const span = el => { const top = el.getBoundingClientRect().top + scrollY; return [top, top + el.offsetHeight]; };
    holds = views.map((v, i) => {
      const [top, bottom] = span(v);
      const a = top - 0.3 * H + H / 2, b = Math.max(a, bottom - 0.7 * H + H / 2);
      return [i === 0 ? 0 : a, i === 5 ? Infinity : b];
    });
    lockY = holds[5][0] + 0.3 * H;
    textBlocks = [...document.querySelectorAll("main .col, .hud")].map(span);
  }
  // how much of the screen is text: the scene fades down to a glow behind it
  const sceneEls = ["field", "overlay", "cube"].map($);
  let sceneDim = -1;
  function dimUnderText() {
    let k = 0;
    if (narrow()) {
      const H = innerHeight, y0 = scrollY, y1 = y0 + H;
      let cover = 0;
      for (const [a, b] of textBlocks) cover += Math.max(0, Math.min(b, y1) - Math.max(a, y0));
      k = smooth(C.clamp01(cover / H * 1.6));
    }
    const o = 1 - 0.84 * k;
    // the labels go further down than the picture: text reads over a glow, not over words
    if (Math.abs(o - sceneDim) > 0.01) { sceneDim = o; sceneEls.forEach((el, i) => { el.style.opacity = (i === 1 ? 1 - 0.95 * k : o).toFixed(2); }); }
  }
  // Where the page is: inside one stop's hold (i === j, with drift for the
  // slow movement within it), or between two (t, the progress from i to j).
  function where(y) {
    for (let i = 0; i < holds.length; i++) {
      const [a, b] = holds[i];
      if (y <= b || i === holds.length - 1) {
        if (y >= a || i === 0) return { i, j: i, t: 0, drift: C.clamp01((y - a) / Math.max(1, b - a)) };
        const pa = holds[i - 1][1];
        return { i: i - 1, j: i, t: smooth((y - pa) / Math.max(1, a - pa)), drift: 1 };
      }
    }
    return { i: holds.length - 1, j: holds.length - 1, t: 0, drift: 1 };
  }

  /* ---------- overlay ---------- */
  const ov = $("overlay"), og = ov.getContext("2d");
  const dprO = Math.min(devicePixelRatio || 1, 2);
  const sizeOverlay = () => { ov.width = Math.round(VW() * dprO); ov.height = Math.round(VH() * dprO); };
  sizeOverlay();
  const STARS = (() => {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = [];
    for (let i = 0; i < 1600; i++) {
      const z = rnd() * 2 - 1, t = rnd() * 2 * Math.PI, r = Math.sqrt(1 - z * z);
      out.push([[r * Math.cos(t), r * Math.sin(t), z], Math.pow(rnd(), 5) * 0.9 + 0.08, rnd()]);
    }
    return out;
  })();
  let hovers = [];
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  function projectDir(cam, d) {
    const z = dot(d, cam.F); if (z <= 1e-6) return null;
    const nx = dot(d, cam.R) / (z * cam.tanH) + cam.shift, ny = dot(d, cam.U) / (z * cam.tanH);
    const aspect = VW() / VH();
    return [(nx / aspect + 1) / 2 * VW(), (1 - ny) / 2 * VH(), z];
  }
  const project = (cam, X) => { const d = sub(X, cam.posKm); return dot(d, cam.F) <= 1 ? null : projectDir(cam, d); };
  function hidden(cam, X, body = [0, 0, 0], R = RE) {
    const d = sub(X, cam.posKm), L = len(d), u = mul(d, 1 / L);
    const oc = sub(cam.posKm, body), b = dot(oc, u), c = dot(oc, oc) - R * R, h = b * b - c;
    if (h <= 0) return false;
    const t = -b - Math.sqrt(h);
    return t > 0 && t < L * 0.9999;
  }
  function polyline(cam, pts, style, width, alpha, dash) {
    if (alpha <= 0.01) return;
    og.lineWidth = width; og.lineJoin = "round"; og.strokeStyle = style; og.setLineDash(dash || []);
    let drawing = false, prevHidden = null;
    og.beginPath();
    for (const p of pts) {
      const s = project(cam, p);
      const hid = s ? hidden(cam, p) : true;
      if (!s || hid !== prevHidden) {
        if (drawing) { og.globalAlpha = alpha * (prevHidden ? 0.16 : 1); og.stroke(); og.beginPath(); }
        drawing = false;
      }
      if (s) { drawing ? og.lineTo(s[0], s[1]) : og.moveTo(s[0], s[1]); drawing = true; }
      prevHidden = hid;
    }
    if (drawing) { og.globalAlpha = alpha * (prevHidden ? 0.16 : 1); og.stroke(); }
    og.globalAlpha = 1; og.setLineDash([]);
  }
  function marker(cam, X, label, alpha, color = "#f1f1ee", sub2 = "", hover = null, size = 3) {
    if (alpha <= 0.01) return;
    const s = project(cam, X); if (!s || hidden(cam, X)) return;
    if (s[0] < -40 || s[1] < -40 || s[0] > VW() + 40 || s[1] > VH() + 40) return;
    og.globalAlpha = alpha;
    og.fillStyle = color; og.beginPath(); og.arc(s[0], s[1], size, 0, Math.PI * 2); og.fill();
    og.strokeStyle = color; og.lineWidth = 1; og.beginPath(); og.arc(s[0], s[1], size + 4, 0, Math.PI * 2); og.stroke();
    if (label) haloText(label, s[0] + 12, s[1] - 6, color);
    if (sub2) haloText(sub2, s[0] + 12, s[1] + 8, "rgba(241,241,238,.7)", `400 10.5px ${MONO}`);
    og.globalAlpha = 1;
    if (hover && alpha > 0.5) hovers.push({ x: s[0], y: s[1], r: 14, html: hover });
  }

  // Earth-fixed line work, for knowing where you are
  function geoLines(cam, ms, w) {
    if (w <= 0.01) return;
    const g = gmst(ms), cg = Math.cos(g), sg = Math.sin(g);
    const c = cam.posKm, cn = len(c), horizon = RE * RE;
    const draw = (lines, style, width, alpha) => {
      og.strokeStyle = style; og.lineWidth = width; og.globalAlpha = alpha * w;
      og.beginPath();
      for (const line of lines) {
        let on = false;
        for (const v of line) {
          const P = [(cg * v[0] - sg * v[1]) * RE, (sg * v[0] + cg * v[1]) * RE, v[2] * RE];
          const vis = dot(P, c) > horizon * 1.0005;
          const s = vis ? project(cam, P) : null;
          if (s) { on ? og.lineTo(s[0], s[1]) : og.moveTo(s[0], s[1]); on = true; } else on = false;
        }
      }
      og.stroke(); og.globalAlpha = 1;
    };
    draw(GRAT, "rgba(160,200,255,1)", 0.6, 0.14);
    // cities
    og.font = `500 10.5px ${MONO}`;
    const taken = [];                                    // label boxes already drawn this frame
    for (const [n, v] of CITY_V) {
      const P = [(cg * v[0] - sg * v[1]) * RE, (sg * v[0] + cg * v[1]) * RE, v[2] * RE];
      if (dot(P, c) <= horizon * 1.001) continue;
      const s = project(cam, P); if (!s || s[0] < 0 || s[1] < 0 || s[0] > VW() || s[1] > VH()) continue;
      const isHome = n === "Trondheim" || n === "Andøya";
      const box = [s[0] - 4, s[1] - 16, s[0] + 10 + og.measureText(n).width, s[1] + 4];
      if (!isHome && taken.some(t => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
      taken.push(box);
      og.globalAlpha = w * (isHome ? 1 : 0.9);
      og.fillStyle = isHome ? "#ffb547" : "#f1f1ee";
      og.beginPath(); og.arc(s[0], s[1], isHome ? 3 : 2, 0, Math.PI * 2); og.fill();
      haloText(n, s[0] + 6, s[1] - 5, isHome ? "#ffb547" : "#f1f1ee", `500 10.5px ${MONO}`);
      if (w > 0.5) {
        const city = ALL_CITIES.find(x => x[0] === n), lk = lookFrom(city[1], city[2], c, ms), en = C.lang === "en";
        const sunUp = dot(norm(P), sunEci(ms)) > 0;
        hovers.push({ x: s[0], y: s[1], r: 8, html: tipHTML(n, `${fmtN(Math.abs(city[1]), 2)}° ${city[1] >= 0 ? "N" : "S"}, ${fmtN(Math.abs(city[2]), 2)}° ${city[2] >= 0 ? (en ? "E" : "Ø") : C.S().west}`,
          n === "Andøya" ? (en ? "Andøya Spaceport, where FramSat-1 was launched." : "Andøya Spaceport, der FramSat-1 ble skutt opp.") : n === "Trondheim" ? (en ? "Home, and Orbit NTNU’s ground station." : "Hjemme, og Orbit NTNUs bakkestasjon.") : "",
          [[C.S().k.dist, `${fmtKm(lk.range)} km`], [en ? "You, seen from there" : "Du, sett derfra", skyText(lk)], [en ? "Daylight there" : "Dagslys der", sunUp ? (en ? "Yes" : "Ja") : (en ? "No" : "Nei")]]) });
      }
    }
    og.globalAlpha = 1;
  }
  // FramSat-1's ground track ahead, painted on the ground with time ticks
  function groundTrack(cam, ms, w) {
    if (w <= 0.01 || !SAT["FRAMSAT-1"]) return;
    const g0 = gmst(ms), pts = [], ticks = [];
    for (let m = 0; m <= 40; m += 0.5) {
      const t = ms + m * 60000, s = sv("FRAMSAT-1", t); if (!s) continue;
      const e = rotZ(norm(s.r), -gmst(t));                // Earth-fixed sub-point
      const P = mul(rotZ(e, g0), RE);
      pts.push(P);
      if (m > 0 && m % 5 === 0) ticks.push([P, m]);
    }
    og.setLineDash([5, 5]); og.strokeStyle = "rgba(255,181,71,0.85)"; og.lineWidth = 1.4; og.globalAlpha = w;
    og.beginPath(); let on = false;
    for (const P of pts) {
      const vis = dot(P, cam.posKm) > RE * RE * 1.0005, s = vis ? project(cam, P) : null;
      if (s) { on ? og.lineTo(s[0], s[1]) : og.moveTo(s[0], s[1]); on = true; } else on = false;
    }
    og.stroke(); og.setLineDash([]);
    og.fillStyle = "#ffb547"; og.font = `500 10px ${MONO}`;
    for (const [P, m] of ticks) {
      if (dot(P, cam.posKm) <= RE * RE * 1.0005) continue;
      const s = project(cam, P); if (!s) continue;
      og.beginPath(); og.arc(s[0], s[1], 2.2, 0, Math.PI * 2); og.fill();
      haloText(`+${m} min`, s[0] + 6, s[1] + 12, "#ffb547", `500 10px ${MONO}`);
    }
    og.globalAlpha = 1;
  }

  /* ---------- text with a dark halo, so labels read over bright terrain ---------- */
  function haloText(t, x, y, color, font) {
    og.font = font || `500 11px ${MONO}`;
    og.lineJoin = "round"; og.lineWidth = 3.5; og.strokeStyle = "rgba(0,0,0,0.85)";
    og.strokeText(t, x, y);
    og.fillStyle = color; og.fillText(t, x, y);
  }

  /* ---------- FramSat-1, a 1U CubeSat, in front of the lens ---------- */
  function box(cx, cy, cz, hx, hy, hz, mat) {
    const v = (x, y, z) => [cx + x * hx, cy + y * hy, cz + z * hz];
    return [
      { n: [1, 0, 0], p: [v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1)], mat },
      { n: [-1, 0, 0], p: [v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), v(-1, -1, -1)], mat },
      { n: [0, 1, 0], p: [v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1)], mat },
      { n: [0, -1, 0], p: [v(-1, -1, 1), v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1)], mat },
      { n: [0, 0, 1], p: [v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)], mat },
      { n: [0, 0, -1], p: [v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1)], mat },
    ];
  }
  // geometry in units of 5 cm (half a CubeSat unit). +z carries the antenna board and the sun sensor.
  const CUBE = (() => {
    const polys = [];
    polys.push(...box(0, 0, 0, 0.93, 0.93, 0.97, "frame"));                        // structure behind the panels
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      polys.push(...box(sx * 0.9, sy * 0.9, 0, 0.085, 0.085, 1.0, "rail"));         // corner rails
      polys.push(...box(sx * 0.9, sy * 0.9, 1.06, 0.07, 0.07, 0.06, "railEnd"));    // rail feet that sit in the deployer
      polys.push(...box(sx * 0.9, sy * 0.9, -1.06, 0.07, 0.07, 0.06, "railEnd"));
    }
    const panel = (axis, sign) => {
      const P = (u, w, o = 0) => axis === "x" ? [sign * (0.945 + o), u, w] : [u, sign * (0.945 + o), w];
      const n = axis === "x" ? [sign, 0, 0] : [0, sign, 0];
      const out = [{ n, p: [P(-0.8, -0.92), P(0.8, -0.92), P(0.8, 0.92), P(-0.8, 0.92)], mat: "pcb" }];
      for (const k of [-1, 1]) {                                                 // two cells per side, cropped corners
        const a0 = -0.7, a1 = 0.7, b0 = k < 0 ? -0.84 : 0.05, b1 = k < 0 ? -0.05 : 0.84, c = 0.11;
        const q = [[a0 + c, b0], [a1 - c, b0], [a1, b0 + c], [a1, b1 - c], [a1 - c, b1], [a0 + c, b1], [a0, b1 - c], [a0, b0 + c]];
        out.push({ n, p: q.map(([u, w]) => P(u, w, 0.006)), mat: "cell", grid: true });
      }
      return out;
    };
    polys.push(...panel("x", 1), ...panel("x", -1), ...panel("y", 1), ...panel("y", -1));
    polys.push({ n: [0, 0, 1], p: [[-0.86, -0.86, 0.985], [0.86, -0.86, 0.985], [0.86, 0.86, 0.985], [-0.86, 0.86, 0.985]], mat: "board" });
    for (const [x, y] of [[0.62, 0], [-0.62, 0], [0, 0.62], [0, -0.62]]) polys.push(...box(x, y, 1.02, 0.1, 0.1, 0.035, "housing"));   // antenna burn-wire housings
    polys.push(...box(0.25, 0.25, 1.03, 0.17, 0.17, 0.045, "sensor"));                                                                  // EIDEL sun sensor
    polys.push({ n: [0, 0, -1], p: [[0.86, -0.86, -0.985], [-0.86, -0.86, -0.985], [-0.86, 0.86, -0.985], [0.86, 0.86, -0.985]], mat: "board" });
    // deployed tape antennas, cut into short pieces so the painter's sort can hide the parts behind the body
    const lines = [];
    for (const [x, y, ex, ey] of [[0.72, 0, 3.6, 0.2], [-0.72, 0, -3.6, -0.2], [0, 0.72, -0.2, 3.6], [0, -0.72, 0.2, -3.6]]) {
      const N = 10;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N;
        lines.push([[x + (ex - x) * t0, y + (ey - y) * t0, 1.04], [x + (ex - x) * t1, y + (ey - y) * t1, 1.04]]);
      }
    }
    return { polys, lines };
  })();
  const MATS = {   // r, g, b, specular
    frame: [0.06, 0.06, 0.07, 0.1], rail: [0.72, 0.73, 0.75, 0.6], railEnd: [0.82, 0.83, 0.85, 0.6], pcb: [0.05, 0.10, 0.07, 0.25],
    cell: [0.07, 0.09, 0.26, 1.0], board: [0.04, 0.05, 0.05, 0.3], housing: [0.85, 0.75, 0.40, 0.7], sensor: [0.02, 0.02, 0.03, 1.2],
  };
  /* ---------- NASA's generic 1U CubeSat model, rendered with three.js ---------- */
  let three = null;
  if (window.THREE && THREE.GLTFLoader) {
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: $("cube"), alpha: true, antialias: false, premultipliedAlpha: false });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
      const scene = new THREE.Scene();
      const camera3 = new THREE.PerspectiveCamera(60, 1, 0.0005, 50);
      const sunL = new THREE.DirectionalLight(0xfff3e2, 3.2); scene.add(sunL, sunL.target);
      const earthL = new THREE.DirectionalLight(0x86aaf0, 0.6); scene.add(earthL, earthL.target);
      scene.add(new THREE.AmbientLight(0x3a4252, 0.35));
      const holder = new THREE.Group(); scene.add(holder);
      three = { renderer, scene, camera3, sunL, earthL, holder, model: null, shown: true };
      fetch("/descent/cubesat-1u.glb").then(r => r.arrayBuffer()).then(buf => new THREE.GLTFLoader().parse(buf, "", gltf => {
        const m = gltf.scene, box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3());
        m.position.sub(c);
        m.traverse(o => { if (o.isMesh && o.material) { o.material.side = THREE.FrontSide; if (o.material.metalness > 0.6) o.material.metalness = 0.6; } });
        const wrap = new THREE.Group(); wrap.add(m); wrap.scale.setScalar(1 / 1.05);
        holder.add(wrap); three.model = wrap;
      }, err => { console.error(err); three = null; })).catch(err => { console.error(err); three = null; });
    } catch (e) { console.error(e); three = null; }
  }
  function drawCube3(cam, w, t) {
    const T = three; if (!T || !T.model) return null;
    const r = T.renderer, W = VW(), H = VH();
    const pr = r.getPixelRatio();
    // While the CubeSat is out of sight its canvas shrinks to a pixel, so it
    // holds no full-screen buffers for most of the page.
    if (w <= 0.01) { if (T.shown || r.domElement.width > 1) { r.setSize(1, 1, false); T.shown = false; } return { hidden: true }; }
    if (r.domElement.width !== Math.round(W * pr) || r.domElement.height !== Math.round(H * pr)) r.setSize(W, H, false);
    T.shown = true;
    T.camera3.fov = 2 * deg(Math.atan(cam.tanH)); T.camera3.aspect = W / H; T.camera3.updateProjectionMatrix();
    const aspect = W / H;
    let size;
    if (cam.sat) {
      // a symbol at the satellite's true position (the real thing would be far smaller than a pixel)
      const d = sub(cam.sat, cam.posKm);
      T.holder.position.set(dot(d, cam.R), dot(d, cam.U), -dot(d, cam.F));
      size = len(d) * 0.04 * cam.tanH * (0.55 + 0.45 * w);
      T.camera3.near = 5; T.camera3.far = 2e5; T.camera3.updateProjectionMatrix();
    } else {
      size = 0.065 * cam.tanH * (0.55 + 0.45 * w);
      T.holder.position.set(0.04 * cam.tanH * aspect, -0.22 * cam.tanH, -1);
      T.camera3.near = 0.0005; T.camera3.far = 50; T.camera3.updateProjectionMatrix();
    }
    T.holder.scale.setScalar(size);
    T.holder.rotation.set(0.7 + t * 0.04, t * 0.06, 0.45 + Math.sin(t * 0.03) * 0.35);
    const toC = v => new THREE.Vector3(dot(v, cam.R), dot(v, cam.U), -dot(v, cam.F));
    const at = cam.sat || cam.posKm, far = size * 20;
    const sunlit = !inShadow(at, cam.sun);
    T.sunL.position.copy(T.holder.position).add(toC(cam.sun).multiplyScalar(far)); T.sunL.target.position.copy(T.holder.position);
    T.sunL.intensity = sunlit ? 3.2 : 0;
    T.earthL.position.copy(T.holder.position).add(toC(mul(norm(at), -1)).multiplyScalar(far)); T.earthL.target.position.copy(T.holder.position);
    T.earthL.intensity = 0.12 + 0.9 * Math.max(0, dot(norm(at), cam.sun));      // sunlight reflected off the ground below
    r.domElement.style.opacity = String(w);
    r.render(T.scene, T.camera3);
    const p = T.holder.position.clone().project(T.camera3);
    const dist = Math.max(1e-6, -T.holder.position.z);
    return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, px: size / dist / cam.tanH * H / 2, sunlit };
  }
  function drawCube(cam, w, t) {
    const r3 = drawCube3(cam, w, t);
    if (!r3) return drawCubeFlat(cam, w, t);
    if (r3.hidden) return;
    const lab = C.S().labels.fs;
    og.font = `500 11px ${MONO}`;
    const tw = og.measureText(lab).width;
    const lx = Math.max(12, r3.x - r3.px * 2.2 - 24 - tw), ly = r3.y - r3.px * 2.0 - 10;
    og.globalAlpha = w;
    og.strokeStyle = "rgba(255,181,71,0.8)"; og.lineWidth = 1;
    og.beginPath(); og.moveTo(r3.x - r3.px * 0.8, r3.y - r3.px * 0.8); og.lineTo(lx + tw + 4, ly + 4); og.stroke();
    haloText(lab, lx, ly, "#ffb547");
    haloText(C.lang === "en" ? "Model: NASA generic 1U CubeSat" : "Modell: NASAs generiske 1U-CubeSat", lx, ly + 15, "rgba(241,241,238,.55)", `400 10px ${MONO}`);
    og.globalAlpha = 1;
    if (w > 0.5) hovers.push({ x: r3.x, y: r3.y, r: r3.px * 1.4, html: tipHTML("FramSat-1", "Orbit NTNU · 1U CubeSat · 1 kg", C.S().whyShort,
      [[C.S().k.payloads, C.lang === "en" ? "Experimental sun sensor (EIDEL)" : "Eksperimentell solsensor (EIDEL)"], [C.S().k.sun, r3.sunlit ? C.S().sunlitNow : C.S().darkNow]]) });
  }
  function drawCubeFlat(cam, w, t) {
    if (w <= 0.01) return;
    const aspect = VW() / VH();
    const toCam = v => [dot(v, cam.R), dot(v, cam.U), dot(v, cam.F)];
    const sunC = toCam(cam.sun);
    const earthC = toCam(mul(norm(cam.posKm), -1));
    const sunlit = !inShadow(cam.posKm, cam.sun);
    const base = [0.2 * cam.tanH * aspect * 0.55, -0.3 * cam.tanH, 1.0];
    const size = 0.11 * cam.tanH * (0.55 + 0.45 * w);
    const a1 = t * 0.07, a2 = t * 0.04 + 0.7, a3 = 0.5 + Math.sin(t * 0.03) * 0.4;
    const rot = v => {
      let [x, y, z] = v;
      [x, z] = [x * Math.cos(a1) + z * Math.sin(a1), -x * Math.sin(a1) + z * Math.cos(a1)];
      [y, z] = [y * Math.cos(a2) - z * Math.sin(a2), y * Math.sin(a2) + z * Math.cos(a2)];
      [x, y] = [x * Math.cos(a3) - y * Math.sin(a3), x * Math.sin(a3) + y * Math.cos(a3)];
      return [x, y, z];
    };
    const world = v => { const r = rot(v); return [base[0] + r[0] * size, base[1] + r[1] * size, base[2] + r[2] * size]; };
    const P = p => { const nx = p[0] / (p[2] * cam.tanH) + cam.shift, ny = p[1] / (p[2] * cam.tanH); return [(nx / aspect + 1) / 2 * VW(), (1 - ny) / 2 * VH()]; };
    const items = [];
    for (const f of CUBE.polys) {
      const n = rot(f.n), pts = f.p.map(world);
      const cen = mul(pts.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / pts.length);
      if (dot(n, cen) >= 0) continue;
      items.push({ kind: "face", f, n, pts, z: len(cen) });
    }
    for (const [a, b] of CUBE.lines) {
      const pa = world(a), pb = world(b);
      items.push({ kind: "line", pa, pb, z: len(mul(add(pa, pb), 0.5)) + size * 0.02 });
    }
    items.sort((p, q) => q.z - p.z);
    og.globalAlpha = w;
    for (const it of items) {
      if (it.kind === "line") {
        const a = P(it.pa), b = P(it.pb);
        const L = sunlit ? 0.55 + 0.45 * Math.max(0, sunC[1]) : 0.35;
        og.strokeStyle = `rgba(${230 * L | 0},${215 * L | 0},${170 * L | 0},0.95)`; og.lineWidth = 1.3; og.lineCap = "round";
        og.beginPath(); og.moveTo(a[0], a[1]); og.lineTo(b[0], b[1]); og.stroke();
        continue;
      }
      const m = MATS[it.f.mat];
      const ndl = sunlit ? Math.max(0, dot(it.n, sunC)) : 0;
      const ne = Math.max(0, dot(it.n, earthC));
      const viewDir = norm(mul(it.pts[0], -1));
      const refl = sub(mul(it.n, 2 * dot(it.n, sunC)), sunC);
      const spec = ndl > 0 ? Math.pow(Math.max(0, dot(refl, viewDir)), 40) * m[3] : 0;
      const L = 0.1 + 1.05 * ndl + 0.3 * ne;                                   // sun, light from Earth below, a little ambient
      const tint = [0.75, 0.85, 1.0];                                          // earthshine is bluish
      const col = [0, 1, 2].map(k => Math.min(255, Math.round((m[k] * (0.1 + 1.05 * ndl + 0.3 * ne * tint[k]) + spec) * 255)));
      const sp = it.pts.map(P);
      og.beginPath(); sp.forEach((p, k) => k ? og.lineTo(p[0], p[1]) : og.moveTo(p[0], p[1])); og.closePath();
      og.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; og.fill();
      if (!sunlit && (it.f.mat === "rail" || it.f.mat === "railEnd")) { og.strokeStyle = "rgba(150,170,210,0.35)"; og.lineWidth = 0.7; og.stroke(); }
      if (it.f.grid) {
        // silver busbars and fingers on each cell
        const A = it.f.p;
        og.strokeStyle = `rgba(200,205,215,${Math.min(0.75, 0.2 + 0.5 * L)})`; og.lineWidth = 0.5;
        for (const sx of [0.15, 0.32, 0.5, 0.68, 0.85]) {
          const p1 = P(world(A[0].map((v, k) => v + (A[5][k] - A[0][k]) * sx))), p2 = P(world(A[1].map((v, k) => v + (A[4][k] - A[1][k]) * sx)));
          og.beginPath(); og.moveTo(p1[0], p1[1]); og.lineTo(p2[0], p2[1]); og.stroke();
        }
      } else if (it.f.mat === "rail" || it.f.mat === "railEnd") {
        og.strokeStyle = "rgba(0,0,0,0.3)"; og.lineWidth = 0.5; og.stroke();
      } else if (it.f.mat === "sensor" && it.n[2] < -0.2) {
        const c = sp.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]).map(x => x / sp.length);
        const g = og.createRadialGradient(c[0] - 1.5, c[1] - 1.5, 0, c[0], c[1], 5);
        g.addColorStop(0, "rgba(190,215,255,0.85)"); g.addColorStop(1, "rgba(40,60,90,0)");
        og.fillStyle = g; og.beginPath(); og.arc(c[0], c[1], 4.5, 0, Math.PI * 2); og.fill();
      }
    }
    const anchor = P(world([0, 0, 0])), lab = C.S().labels.fs;
    const px = size / cam.tanH * VH() / 2;
    const lx = anchor[0] + px * 2.2 + 20, ly = anchor[1] - px * 1.8 - 10;
    og.strokeStyle = "rgba(255,181,71,0.8)"; og.lineWidth = 1;
    og.beginPath(); og.moveTo(anchor[0] + px * 0.6, anchor[1] - px * 0.6); og.lineTo(lx - 4, ly + 4); og.stroke();
    haloText(lab, lx, ly, "#ffb547");
    og.globalAlpha = 1;
    if (w > 0.5) hovers.push({ x: anchor[0], y: anchor[1], r: px * 1.2, html: tipHTML("FramSat-1", "Orbit NTNU · 1U CubeSat · 1 kg", C.S().whyShort,
      [[C.S().k.payloads, C.lang === "en" ? "Experimental sun sensor (EIDEL)" : "Eksperimentell solsensor (EIDEL)"], [C.S().k.sun, sunlit ? C.S().sunlitNow : C.S().darkNow]]) });
  }

  function moonFeatures(cam, mf, w, ms) {
    if (w <= 0.01) return;
    const s = C.S(), en = C.lang === "en", L = s.labels, sun = sunEci(ms);
    const shown = [];
    for (const f of MOON_FEATURES) {
      const [name, la, lo, dia, kind] = f;
      const n = add(add(mul(mf.mx, Math.cos(rad(la)) * Math.cos(rad(lo))), mul(mf.my, Math.cos(rad(la)) * Math.sin(rad(lo)))), mul(mf.mz, Math.sin(rad(la))));
      const P = add(mf.moon, mul(n, RM));
      const toCam = sub(cam.posKm, P);
      const facing = dot(n, norm(toCam));
      if (facing < 0.08) continue;
      const sp = project(cam, P); if (!sp) continue;
      const dist = len(toCam);
      const rpx = dia ? Math.max(3, Math.min(60, (dia / 2) / dist / cam.tanH * VH() / 2 * Math.sqrt(facing))) : 3;
      shown.push({ f, n, sp, rpx, facing });
    }
    shown.sort((a, b) => b.f[3] - a.f[3]);
    shown.forEach((o, k) => {
      const [name, la, lo, dia, kind, ten, tno] = o.f;
      const a = w * Math.min(1, (o.facing - 0.08) * 4);
      og.globalAlpha = a;
      og.strokeStyle = kind === "site" ? "#ffb547" : "rgba(255,255,255,0.9)"; og.lineWidth = 1.2;
      if (kind === "site") { og.beginPath(); og.moveTo(o.sp[0], o.sp[1] - 5); og.lineTo(o.sp[0] + 5, o.sp[1]); og.lineTo(o.sp[0], o.sp[1] + 5); og.lineTo(o.sp[0] - 5, o.sp[1]); og.closePath(); og.stroke(); }
      else if (kind === "crater") { og.strokeStyle = "rgba(0,0,0,0.6)"; og.lineWidth = 3; og.beginPath(); og.arc(o.sp[0], o.sp[1], o.rpx, 0, Math.PI * 2); og.stroke(); og.strokeStyle = "rgba(255,255,255,0.9)"; og.lineWidth = 1.2; og.stroke(); }
      else { og.fillStyle = "#fff"; og.beginPath(); og.arc(o.sp[0], o.sp[1], 2.5, 0, Math.PI * 2); og.fill(); }
      if (k < 9) haloText(name, o.sp[0] + Math.max(7, o.rpx * 0.75) + 3, o.sp[1] + 4, kind === "site" ? "#ffb547" : "#ffffff", `500 12px ${MONO}`);
      og.globalAlpha = 1;
      if (w > 0.5) {
        const sunAlt = deg(Math.asin(Math.max(-1, Math.min(1, dot(o.n, sun)))));
        const nearSide = dot(o.n, norm(mul(mf.moon, -1))) > 0;
        hovers.push({ x: o.sp[0], y: o.sp[1], r: Math.max(10, Math.min(30, o.rpx)), html: tipHTML(name,
          `${L.kinds[kind]}${dia ? ` · ${fmtKm(dia)} km` : ""} · ${fmtN(Math.abs(la), 2)}° ${la >= 0 ? "N" : "S"}, ${fmtN(Math.abs(lo), 2)}° ${lo >= 0 ? (en ? "E" : "Ø") : s.west}`,
          en ? ten : tno,
          [[s.k.side, nearSide ? L.near : L.far], [s.k.sunNow, L.sunAlt(sunAlt)], dia ? [en ? "Across, as seen from Earth" : "Bredde sett fra Jorden", `${fmtN(deg(dia / len(mf.moon)) * 3600, 0)}″`] : null]) });
      }
    });
  }

  // cone from a satellite down to its service area, the cap north of 65° N
  const RING65 = (() => { const out = [], R = RE * 1.002; for (let i = 0; i <= 120; i++) { const th = i / 120 * Math.PI * 2; out.push([R * Math.cos(rad(65)) * Math.cos(th), R * Math.cos(rad(65)) * Math.sin(th), R * Math.sin(rad(65))]); } return out; })();
  function cone(cam, satR, w, color) {
    const sp = project(cam, satR); if (!sp) return;
    const pts = RING65.map(p => ({ p, q: project(cam, p), vis: dot(p, cam.posKm) > RE * RE * 1.0005 }));
    // the cone's surface
    og.globalAlpha = w * 0.07; og.fillStyle = color;
    og.beginPath(); og.moveTo(sp[0], sp[1]);
    for (const o of pts) if (o.q && o.vis) og.lineTo(o.q[0], o.q[1]);
    og.closePath(); og.fill();
    // the covered cap
    og.globalAlpha = w * 0.12;
    og.beginPath(); let first = true;
    for (const o of pts) if (o.q && o.vis) { first ? og.moveTo(o.q[0], o.q[1]) : og.lineTo(o.q[0], o.q[1]); first = false; }
    og.closePath(); og.fill();
    // a few generator lines, and the two silhouette edges brighter
    og.strokeStyle = color; og.lineWidth = 0.8;
    let lo = null, hi = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const o = pts[i]; if (!o.q || !o.vis) continue;
      const ang = Math.atan2(o.q[1] - sp[1], o.q[0] - sp[0]);
      if (!lo || ang < lo.ang) lo = { ang, q: o.q };
      if (!hi || ang > hi.ang) hi = { ang, q: o.q };
      if (i % 10 === 0) { og.globalAlpha = w * 0.35; og.beginPath(); og.moveTo(sp[0], sp[1]); og.lineTo(o.q[0], o.q[1]); og.stroke(); }
    }
    og.globalAlpha = w * 0.8; og.lineWidth = 1.1;
    for (const e of [lo, hi]) if (e) { og.beginPath(); og.moveTo(sp[0], sp[1]); og.lineTo(e.q[0], e.q[1]); og.stroke(); }
    og.globalAlpha = 1;
  }

  function drawOverlay(cam, weights, ms, t, rideW) {
    og.setTransform(dprO, 0, 0, dprO, 0, 0);
    og.clearRect(0, 0, VW(), VH());
    hovers = [];
    const s = C.S(), L = s.labels, en = C.lang === "en", K = s.k;
    // stars
    const starDim = 1 - 0.6 * C.clamp01((deg(Math.asin(Math.min(1, RE / len(cam.posKm)))) - 15) / 50);
    const aspect = VW() / VH();
    for (const [d, mag, tw] of STARS) {
      const z = dot(d, cam.F); if (z <= 0.2) continue;
      const nx = dot(d, cam.R) / (z * cam.tanH) + cam.shift, ny = dot(d, cam.U) / (z * cam.tanH);
      const x = (nx / aspect + 1) / 2 * VW(), y = (1 - ny) / 2 * VH();
      if (x < 0 || y < 0 || x > VW() || y > VH()) continue;
      const far = add(cam.posKm, mul(d, 2e6));
      if (hidden(cam, far) || hidden(cam, far, cam.moonKm, RM)) continue;
      og.globalAlpha = Math.min(1, mag * starDim * (0.85 + 0.15 * Math.sin(t * 0.8 + tw * 40)));
      og.fillStyle = tw > 0.85 ? "#cfe0ff" : tw < 0.1 ? "#ffe2c4" : "#ffffff";
      og.beginPath(); og.arc(x, y, 0.5 + mag * 1.1, 0, Math.PI * 2); og.fill();
    }
    og.globalAlpha = 1;
    // crater names only while the Moon is big enough to carry them
    const moonDeg = deg(Math.asin(Math.min(1, RM / len(sub(cam.moonKm, cam.posKm)))));
    moonFeatures(cam, cam.mf, weights[0] * smooth((moonDeg - 3) / 4), ms);

    // ASBM: orbits, coverage cone of whichever is switched on, the 65° N line
    const wA = Math.max(weights[1], 0.12 * (weights[0] + weights[2]));
    if (weights[1] > 0.02) {
      const lat65 = RING65;
      polyline(cam, lat65, "#ffb547", 1.2, weights[1], [4, 4]);
      const lp = lat65.map(p => [p, project(cam, p)]).filter(([p, q]) => q && dot(p, cam.posKm) > RE * RE).sort((a, b) => a[1][1] - b[1][1]);
      if (lp.length) { og.globalAlpha = weights[1]; haloText(L.n65, lp[lp.length - 1][1][0] + 8, lp[lp.length - 1][1][1] + 16, "#ffb547"); og.globalAlpha = 1; }
      for (const n of ["ASBM-1", "ASBM-2"]) {
        const st = sv(n, ms), state = asbmState(n, ms);
        if (st && state && state.active) cone(cam, st.r, weights[1], "rgba(255,181,71,1)");
      }
    }
    for (const n of ["ASBM-1", "ASBM-2"]) {
      polyline(cam, orbit(n, ms), "rgba(241,241,238,0.6)", 1, wA);
      const st = sv(n, ms);
      if (st) {
        const g = geodetic(st.r, ms), state = asbmState(n, ms), lk = lookFrom(TRD.lat, TRD.lon, st.r, ms);
        marker(cam, st.r, `${n} · ${state && state.active ? L.on : L.off}`, wA, state && state.active ? "#ffb547" : "#f1f1ee", `${fmtKm(altOf(st.r, ms))} km`,
          tipHTML(n, `Space Norway · HEOSAT · ${en ? "launched 12 Aug 2024" : "skutt opp 12. aug. 2024"}`,
            en ? "Highly elliptical 16-hour orbit. It spends most of its time high over the Arctic, giving ships, planes and the military broadband where geostationary satellites are too low on the horizon."
               : "Svært elliptisk bane på 16 timer. Den tilbringer mesteparten av tiden høyt over Arktis og gir skip, fly og forsvaret bredbånd der geostasjonære satellitter står for lavt.",
            [[K.alt, `${fmtKm(altOf(st.r, ms))} km`], [K.spd, `${fmtN(len(st.v), 2)} km/s`], [K.pos, latlon(g.lat, g.lon)],
             state && [K.active, state.active ? L.onFor(state.minutes) : L.offFor(state.minutes)],
             [K.fromTrd, skyText(lk)],
             [K.payloads, en ? "Viasat GX10 Ka-band, Norwegian military X-band, US Space Force EPS-R" + (n === "ASBM-1" ? ", NORM radiation monitor" : "") : "Viasat GX10 Ka-bånd, norsk militært X-bånd, US Space Force EPS-R" + (n === "ASBM-1" ? ", NORM strålingsmåler" : "")],
             [K.ground, en ? "KSAT, Tromsø (backup Bardufoss)" : "KSAT, Tromsø (reserve Bardufoss)"]]));
      }
    }
    if (weights[1] > 0.05) {
      const el = elements("ASBM-1"), pts = orbit("ASBM-1", ms);
      if (el && pts.length) {
        let ap = pts[0], pe = pts[0];
        for (const p of pts) { if (len(p) > len(ap)) ap = p; if (len(p) < len(pe)) pe = p; }
        marker(cam, ap, `${L.apo} · ${fmtKm(el.apogee)} km`, weights[1] * 0.8, "rgba(241,241,238,.7)", "", null, 1.5);
        marker(cam, pe, `${L.peri} · ${fmtKm(el.perigee)} km`, weights[1] * 0.8, "rgba(241,241,238,.7)", "", null, 1.5);
      }
    }
    // GEO
    const wG = Math.max(weights[2], 0.15 * (weights[1] + weights[3]));
    polyline(cam, GEO_RING, "rgba(241,241,238,0.45)", 1, wG);
    for (const n of GEO_SATS) {
      const st = sv(n, ms); if (!st) continue;
      const g = geodetic(st.r, ms), info = GEO_INFO[n], el = elements(n);
      const isThor = n.startsWith("THOR");
      const pretty = n.replace("METEOSAT", "Meteosat").replace("HIMAWARI", "Himawari").replace("ELEKTRO", "Elektro").replace("EUTELSAT", "Eutelsat").replace("INMARSAT", "Inmarsat").replace("ASTRA", "Astra");
      const label = weights[2] > 0.5 ? (isThor ? (n === "THOR 7" ? "Thor 5 · 6 · 7" : "") : narrow() ? "" : pretty) : "";   // phones: only Norway's own names
      const sp0 = project(cam, st.r), textLimit = narrow() ? 0 : Math.min(innerWidth * 0.55, 720);
      const lk = lookFrom(TRD.lat, TRD.lon, st.r, ms);
      const lonTxt = `${fmtN(Math.abs(g.lon), 2)}° ${g.lon >= 0 ? (en ? "E" : "Ø") : s.west}`;
      const swing = el ? (RE + 35786) * Math.sin(rad(el.inc)) : 0;
      marker(cam, st.r, sp0 && sp0[0] < textLimit ? "" : label, wG * (weights[2] > 0.5 ? 1 : 0.5), isThor ? "#ffb547" : "#f1f1ee", "",
        tipHTML(pretty, `${info[0]} · ${en ? "launched" : "skutt opp"} ${launchYear(n)}`, en ? info[1] : info[2],
          [[K.lon, lonTxt], [K.alt, `${fmtKm(altOf(st.r, ms))} km`],
           el && [K.incl, `${fmtN(el.inc, 2)}°`], el && el.inc > 0.3 ? [K.swing, `± ${fmtKm(swing)} km`] : null,
           [K.fromTrd, skyText(lk)], lk.el > 0 ? [K.delay, `${fmtN(lk.range / 299.792458, 0)} ms`] : null]), 2.4);
    }
    // Galileo above Trondheim
    const wM = weights[3];
    if (wM > 0.01) {
      const trd = trdEci(ms), sky = gpsSky(ms);
      const visSet = new Set(sky.vis.map(v => v.n));
      const planeDone = new Set();
      for (const n of GAL_SATS) {
        const raan = Math.round(deg(SAT[n] ? SAT[n].nodeo : 0) / 30);
        if (!planeDone.has(raan)) { planeDone.add(raan); polyline(cam, orbit(n, ms), "rgba(160,200,255,0.45)", 0.9, wM * 0.6); }
        const st = sv(n, ms); if (!st) continue;
        const lk = lookFrom(TRD.lat, TRD.lon, st.r, ms), el = elements(n), vis = visSet.has(n);
        if (vis) {
          const a = project(cam, trd), b = project(cam, st.r);
          if (a && b && !hidden(cam, trd)) { og.globalAlpha = wM * 0.85; og.strokeStyle = "#ffb547"; og.lineWidth = 1; og.beginPath(); og.moveTo(a[0], a[1]); og.lineTo(b[0], b[1]); og.stroke(); og.globalAlpha = 1; }
        }
        const short = galName(n);
        marker(cam, st.r, vis ? short : "", wM * (vis ? 1 : 0.55), vis ? "#ffb547" : "rgba(160,200,255,1)", "",
          tipHTML(short, `EU · EUSPA · ${en ? "launched" : "skutt opp"} ${launchYear(n)}`, L.galTip,
            [[K.alt, `${fmtKm(altOf(st.r, ms))} km`], [K.spd, `${fmtN(len(st.v), 2)} km/s`], el && [K.incl, `${fmtN(el.inc, 1)}°`], el && [K.period, fmtMin(el.period)],
             [K.fromTrd, skyText(lk)], [K.delay, `${fmtN(lk.range / 299.792458, 1)} ms`]]), vis ? 2.6 : 2);
      }
      const tp = project(cam, trd);
      if (tp && !hidden(cam, trd)) { og.globalAlpha = wM; og.fillStyle = "#ffb547"; og.beginPath(); og.arc(tp[0], tp[1], 3.5, 0, Math.PI * 2); og.fill(); haloText("Trondheim", tp[0] + 9, tp[1] + 4, "#ffb547"); og.globalAlpha = 1; }
    }
    // ground lines while low
    geoLines(cam, ms, Math.max(weights[4] * 0.6, rideW));
    // ISS
    const wI = weights[4];
    polyline(cam, orbit("ISS", ms), "rgba(241,241,238,0.55)", 1, wI);
    const iss = sv("ISS", ms);
    if (iss) {
      const lk = lookFrom(TRD.lat, TRD.lon, iss.r, ms), ex = orbitExtras("ISS", ms);
      marker(cam, iss.r, "ISS", wI, "#f1f1ee", `${fmtKm(altOf(iss.r, ms))} km`,
        tipHTML("ISS", en ? "International Space Station · NASA, Roscosmos, ESA, JAXA, CSA" : "Den internasjonale romstasjonen · NASA, Roscosmos, ESA, JAXA, CSA",
          en ? "Crewed without a break since 2 November 2000. About the size of a football field and roughly 420 tonnes." : "Bemannet uten opphold siden 2. november 2000. Omtrent like stor som en fotballbane og rundt 420 tonn.",
          [[K.alt, `${fmtKm(altOf(iss.r, ms))} km`], [K.spd, `${fmtKm(len(iss.v) * 3600)} km/h`], ex && [K.sink, `${fmtN(ex.sink, 0)} m/${en ? "day" : "døgn"}`], [K.fromTrd, skyText(lk)]]));
    }
    // FramSat-1
    const fs = sv("FRAMSAT-1", ms);
    polyline(cam, orbit("FRAMSAT-1", ms), "rgba(255,181,71,0.75)", 1.2, weights[4] * 0.7 + (cam.mode !== "ride" ? weights[5] : 0));
    if (fs && cam.mode !== "ride" && cam.cube < 0.15) marker(cam, fs.r, "FramSat-1", Math.max(weights[4], weights[5]) * (1 - cam.cube / 0.15), "#ffb547", `${fmtKm(altOf(fs.r, ms))} km`, tipHTML("FramSat-1", "Orbit NTNU · 1U CubeSat", s.whyShort, []));
    groundTrack(cam, ms, rideW);
    drawCube(cam, cam.cube, t);
  }

  /* ---------- route, stop texts, card ---------- */
  const route = $("route");
  function buildRoute() {
    const s = C.S();
    route.replaceChildren(...s.route.map((nm, i) => {
      const li = document.createElement("li"); if (i === 5) li.className = "fs";
      const b = document.createElement("button"); b.type = "button";
      b.innerHTML = `<span class="pip" aria-hidden="true"></span><span class="txt"><span class="nm">${nm}</span><span class="km" id="rk${i}" aria-hidden="true"></span></span>`;
      b.addEventListener("click", () => {
        const [a, bb] = holds[i]; const y = (a + Math.min(bb, a + innerHeight * 0.4)) / 2;
        window.scrollTo({ top: Math.max(0, y - readTop() - readH() / 2), behavior: C.reduceMotion ? "auto" : "smooth" });
      });
      li.append(b); return li;
    }));
    buildViews();
  }
  const stopDesc = [];
  function stopTexts(ms) {
    const s = C.S();
    const moonD = fmtKm(len(moonEci(ms)));
    const iss = sv("ISS", ms), fs = sv("FRAMSAT-1", ms), a1 = sv("ASBM-1", ms), el = elements("ASBM-1");
    const vals = [[moonD], el ? [fmtKm(el.perigee), fmtKm(el.apogee)] : ["7,700", "44,000"], [], [], [iss ? fmtKm(altOf(iss.r, ms)) : "420"], [fs ? fmtKm(altOf(fs.r, ms)) : "560"]];
    s.stops.forEach(([title, fn], i) => { stopDesc[i] = { title, text: fn(...vals[i]) }; });
    const km = [moonD, a1 ? fmtKm(altOf(a1.r, ms)) : "", "35,786", "23,222", vals[4][0], vals[5][0]];
    km.forEach((k, i) => { const e = $("rk" + i); if (e) e.textContent = k ? `${k} km` : ""; });
  }

  const card = $("card");
  // A card's numbers as [label, value] pairs: the first is the standout
  // number, the next three show, the rest wait behind "More numbers".
  const rows = pairs => pairs.filter(Boolean);
  const dl = pairs => pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  // Phones: each stop's card sits in the page, at the start of the stop's
  // text (the .slot elements), so cards and text take turns instead of the
  // card covering the text. The cards are copies of the side panel's.
  const slotCards = [...document.querySelectorAll(".slot")].map(slot => {
    const c = card.cloneNode(true);
    c.removeAttribute("id");
    c.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
    c.querySelectorAll("[aria-controls]").forEach(e => e.removeAttribute("aria-controls"));
    slot.append(c);
    return [Number(slot.dataset.slot), c];
  });
  // "More numbers", on any card
  document.addEventListener("click", e => {
    const b = e.target.closest(".more-btn"); if (!b) return;
    const c = b.closest(".card"); c.dataset.open = c.dataset.open === "1" ? "" : "1"; lastCard = 0;
    setTimeout(layout, 600);                                  // a taller card moves the stops below it
  });
  function sunText(sn, ms) {
    const s = C.S(); if (!sn || !sn.sh) return "–";
    const m = (sn.sh.t - ms) / 60000;
    if (m > 600) return sn.sh.state ? s.darkNow : s.sunlitNow;
    return sn.sh.state ? s.dark(m) : s.sunlit(m);
  }
  function passText(name, ms) {
    const s = C.S(), p = nextPass(name, ms);
    if (!p) return s.noPass2;
    const dm = (p.aos - ms) / 60000;
    return s.passFmt(`${fmtTime(p.aos)} (${dm < 1 ? (C.lang === "en" ? "now" : "nå") : (C.lang === "en" ? "in " : "om ") + fmtMin(dm)})`, Math.round(p.maxEl), p.visible);
  }
  function updateCard(stopIdx, ms, root = card) {
    const q = c => root.querySelector("." + c), open = root.dataset.open === "1";
    const s = C.S(), k = s.k, title = s.route[stopIdx];
    let body = [], sub2 = "";
    if (stopIdx === 0) {
      const m = moonNumbers(ms);
      sub2 = s.moonShown;
      body = rows([[k.dist, `${fmtKm(m.d)} km`], [k.lit, `${Math.round(m.lit * 100)} %`], [k.phase, s.phases[m.idx]], [k.light, `${fmtN(m.light, 3)} s`], [k.size, `${fmtN(m.size, 3)}°`]]);
    } else if (stopIdx === 1) {
      const el = elements("ASBM-1");
      const a = satNumbers("ASBM-1", ms), b = satNumbers("ASBM-2", ms);
      const sa = asbmState("ASBM-1", ms), sb = asbmState("ASBM-2", ms), Lb = s.labels;
      body = rows([
        a && ["ASBM-1", `${fmtKm(a.alt)} km · ${sa && sa.active ? Lb.on : Lb.off}`], b && ["ASBM-2", `${fmtKm(b.alt)} km · ${sb && sb.active ? Lb.on : Lb.off}`],
        sa && [k.active + " 1", sa.active ? Lb.onFor(sa.minutes) : Lb.offFor(sa.minutes)], sb && [k.active + " 2", sb.active ? Lb.onFor(sb.minutes) : Lb.offFor(sb.minutes)],
        [k.cover, C.lang === "en" ? "North of 65° N, 24/7" : "Nord for 65° N, hele døgnet"],
        el && [k.pa, rangeText("ASBM-1", ms)], el && [k.period, fmtMin(el.period)], el && [k.inc, `${fmtN(el.inc, 1)}°`], [k.launched, "12 Aug 2024"]]);
    } else if (stopIdx === 2) {
      const t = satNumbers("THOR 7", ms);
      body = rows([[k.alt, "35,786 km"], [k.period, "23 h 56 min"], t && ["Thor 7", `${fmtN(Math.abs(t.g.lon), 2)}° ${t.g.lon >= 0 ? "E" : s.west}`], [k.shown, String(GEO_SATS.length)], [k.spd, "3.07 km/s"]]);
    } else if (stopIdx === 3) {
      const sky = gpsSky(ms);
      const nearest = sky.vis.length ? sky.vis.reduce((a, b) => a.l.range < b.l.range ? a : b) : null;
      const dopTxt = sky.pdop ? `${fmtN(sky.pdop, 1)} · ${sky.pdop < 2 ? (C.lang === "en" ? "excellent" : "utmerket") : sky.pdop < 4 ? (C.lang === "en" ? "good" : "god") : (C.lang === "en" ? "fair" : "middels")}` : "–";
      const gel = elements(GAL_SATS[0]);
      body = rows([[k.visible, `${sky.vis.length} ${C.lang === "en" ? "of" : "av"} ${GAL_SATS.length} ${C.lang === "en" ? "shown" : "vist"}`], [k.dop, dopTxt],
        nearest && [k.nearest, `${galName(nearest.n)} · ${fmtKm(nearest.l.range)} km`],
        nearest && [k.delay, `${fmtN(nearest.l.range / 299.792458, 1)} ms`],
        gel && [k.period, fmtMin(gel.period)], [k.incl, "56°"], ["E1 · E5a", "1575.42 · 1176.45 MHz"],
        [C.lang === "en" ? "Free accuracy" : "Gratis nøyaktighet", C.lang === "en" ? "≈ 20 cm with the High Accuracy Service" : "≈ 20 cm med High Accuracy Service"],
        [C.lang === "en" ? "Signal at the ground" : "Signal ved bakken", C.lang === "en" ? "≈ −128 dBm, below the noise" : "≈ −128 dBm, under støyen"]]);
    } else if (stopIdx === 5) {
      body = rows(fsRows(ms));
      // the live line from the same numbers as the rows, so they always agree
      const n = satNumbers("FRAMSAT-1", ms), later = sv("FRAMSAT-1", ms + 10000);
      if (n && later) {
        const north = geodetic(later.r, ms + 10000).lat >= n.g.lat;
        q("c-live").textContent = s.liveNow(fmtKm(n.alt), placeName(n.g.lat, n.g.lon), north ? s.north : s.south, fmtN(n.v, 1));
      }
    } else if (stopIdx === 4) {
      const n = satNumbers("ISS", ms);
      if (n) {
        const lk = look("ISS", ms);
        const crewDays = Math.floor((ms - Date.UTC(2000, 10, 2)) / 864e5);
        body = rows([
          [k.alt, `${fmtKm(n.alt)} km`], [k.over, placeName(n.g.lat, n.g.lon)], [k.pass, passText("ISS", ms)], [k.aboard, `2 Nov 2000 · ${fmtKm(crewDays)} ${C.lang === "en" ? "days" : "dager"}`],
          [k.spd, `${fmtN(n.v, 2)} km/s · ${fmtKm(n.v * 3600)} km/h`], [k.pos, latlon(n.g.lat, n.g.lon)],
          [k.sun, sunText(n, ms)], [k.lst, `${String(Math.floor(n.lst)).padStart(2, "0")}:${String(Math.floor((n.lst % 1) * 60)).padStart(2, "0")}`],
          n.orbitNo && [k.orbit, fmtKm(n.orbitNo)], n.el && [k.rate, fmtN(n.el.revPerDay, 2)], n.el && [k.pa, rangeText("ISS", ms)],
          n.el && [k.inc, `${fmtN(n.el.inc, 2)}°`], lk && [k.trd, `${fmtKm(lk.range)} km`],
          ...extrasRows("ISS", ms)]);
      }
    }
    const d = stopDesc[stopIdx] || { title, text: "" };
    q("c-title").innerHTML = `<span>${d.title}</span><span class="lv">${C.lang === "en" ? "Live" : "Direkte"}</span>`;
    if (q("c-desc").dataset.v !== d.text) { q("c-desc").textContent = d.text; q("c-desc").dataset.v = d.text; }
    const [hero, ...rest] = body, shown = rest.slice(0, 3), extra = rest.slice(3);
    q("c-stat").innerHTML = hero ? `<span class="stat-v">${hero[1]}</span><span class="stat-k">${hero[0]}</span>` : "";
    q("c-rows").innerHTML = dl(shown);
    q("c-more-rows").innerHTML = dl(extra);
    q("c-more-rows").hidden = !open || !extra.length;
    const more = q("more-btn"), en = C.lang === "en";
    more.hidden = !extra.length;
    more.setAttribute("aria-expanded", String(open));
    more.textContent = open ? (en ? "Fewer numbers" : "Færre tall") : (en ? `More numbers (${extra.length})` : `Flere tall (${extra.length})`);
    q("foot").textContent = `${s.cardFoot[stopIdx] || ""}${sub2 ? ` (${sub2})` : ""}`;
    const showMap = stopIdx >= 4;
    q("c-map").hidden = !showMap; q("c-live").hidden = stopIdx !== 5; q("views").hidden = stopIdx !== 5;
    root.dataset.view = stopIdx;
    if (showMap) drawMini(stopIdx === 4 ? "ISS" : "FRAMSAT-1", ms, q("c-map"));
  }
  function extrasRows(name, ms) {
    const k = C.S().k, x = orbitExtras(name, ms), en = C.lang === "en";
    if (!x) return [];
    return [[k.beta, `${fmtN(x.beta, 1)}°`], [k.shadowPct, `${Math.round(x.shadow * 100)} %`], [k.sink, `${fmtN(x.sink, 0)} m/${en ? "day" : "døgn"}`],
      [k.horizon, `${fmtKm(x.horizon)} km`], [k.seen, `${fmtN(x.seen * 100, 1)} %`]];
  }
  function fsRows(ms) {
    const s = C.S(), k = s.k, n = satNumbers("FRAMSAT-1", ms);
    if (!n) return [];
    const lk = look("FRAMSAT-1", ms);
    const daysUp = Math.floor((ms - Date.UTC(2026, 8, 5)) / 864e5);
    const cells = [
      [k.alt, `${fmtKm(n.alt)} km`], [k.over, placeName(n.g.lat, n.g.lon)], [k.pass, passText("FRAMSAT-1", ms)], [k.days, String(daysUp)],
      [k.spd, `${fmtN(n.v, 2)} km/s`], [k.gspd, `${fmtN(n.gspd, 2)} km/s`],
      [k.pos, latlon(n.g.lat, n.g.lon)], [k.lst, `${String(Math.floor(n.lst)).padStart(2, "0")}:${String(Math.floor((n.lst % 1) * 60)).padStart(2, "0")}`],
      [k.sun, sunText(n, ms)], [k.orbit, n.orbitNo ? fmtKm(n.orbitNo) : "–"],
      [k.pa, rangeText("FRAMSAT-1", ms)],
      [k.trd, lk ? `${fmtKm(lk.range)} km` : "–"],
      ...extrasRows("FRAMSAT-1", ms),
    ];
    return cells;
  }

  /* ---------- small world map for the low stops ---------- */
  let miniBase = null;
  function miniLand(W, H) {
    if (miniBase && miniBase.width === W) return miniBase;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#0a0d16"; g.fillRect(0, 0, W, H);
    if (window.d3 && COUNTRIES.length) {
      const eq = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
      const path = d3.geoPath(eq, g);
      g.fillStyle = "#2a2f3a"; g.beginPath(); COUNTRIES.forEach(f => path(f)); g.fill();
      g.strokeStyle = "rgba(241,241,238,0.18)"; g.lineWidth = 0.5; g.beginPath(); COUNTRIES.forEach(f => path(f)); g.stroke();
    }
    g.strokeStyle = "rgba(241,241,238,0.06)"; g.lineWidth = 1;
    for (let lo = -150; lo <= 150; lo += 30) { const x = (lo + 180) / 360 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    miniBase = c; return c;
  }
  function drawMini(name, ms, mini) {
    const mg = mini.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(mini.clientWidth * dpr) || 600, H = Math.round(W / 2);
    if (mini.width !== W) { mini.width = W; mini.height = H; }
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.drawImage(miniLand(W, H), 0, 0);
    const X = lo => (lo + 180) / 360 * W, Y = la => (90 - la) / 180 * H;
    // night
    const sun = sunEci(ms), sg = rotZ(sun, -gmst(ms));
    const slat = deg(Math.asin(sg[2])), slon = deg(Math.atan2(sg[1], sg[0]));
    mg.fillStyle = "rgba(0,0,8,0.55)"; mg.beginPath();
    const top = slat < 0 ? 0 : H;
    mg.moveTo(0, top);
    for (let x = 0; x <= W; x += 2) {
      const lo = x / W * 360 - 180;
      const la = deg(Math.atan(-Math.cos(rad(lo - slon)) / Math.tan(rad(slat || 0.01))));
      mg.lineTo(x, Y(la));
    }
    mg.lineTo(W, top); mg.closePath(); mg.fill();
    // ground track: last 45 min faint, next 90 min bright
    const pts = [];
    for (let m = -45; m <= 90; m += 1) { const s = sv(name, ms + m * 60000); if (!s) continue; const g = geodetic(s.r, ms + m * 60000); pts.push([X(g.lon), Y(g.lat), m]); }
    mg.lineWidth = 1.5 * dpr;
    for (let i = 1; i < pts.length; i++) {
      if (Math.abs(pts[i][0] - pts[i - 1][0]) > W / 2) continue;
      mg.strokeStyle = pts[i][2] <= 0 ? "rgba(255,181,71,0.3)" : "rgba(255,181,71,0.95)";
      mg.beginPath(); mg.moveTo(pts[i - 1][0], pts[i - 1][1]); mg.lineTo(pts[i][0], pts[i][1]); mg.stroke();
    }
    mg.font = `500 ${10 * dpr}px ${MONO}`;
    const dot2 = (lo, la, c, r, label) => { mg.fillStyle = c; mg.beginPath(); mg.arc(X(lo), Y(la), r * dpr, 0, Math.PI * 2); mg.fill(); if (label) { mg.fillText(label, X(lo) + 6 * dpr, Y(la) - 4 * dpr); } };
    dot2(TRD.lon, TRD.lat, "#f1f1ee", 2.5, "Trondheim");
    const s0 = sv(name, ms);
    if (s0) {
      const g = geodetic(s0.r, ms);
      // footprint radius on the ground, for 0° elevation
      const lam = deg(Math.acos(RE / len(s0.r)));
      mg.strokeStyle = "rgba(255,181,71,0.6)"; mg.lineWidth = 1 * dpr; mg.beginPath();
      for (let i = 0; i <= 64; i++) {
        const th = i / 64 * 2 * Math.PI;
        const la2 = deg(Math.asin(Math.sin(rad(g.lat)) * Math.cos(rad(lam)) + Math.cos(rad(g.lat)) * Math.sin(rad(lam)) * Math.cos(th)));
        const lo2 = g.lon + deg(Math.atan2(Math.sin(th) * Math.sin(rad(lam)) * Math.cos(rad(g.lat)), Math.cos(rad(lam)) - Math.sin(rad(g.lat)) * Math.sin(rad(la2))));
        const x = X(((lo2 + 540) % 360) - 180), y = Y(la2);
        i ? mg.lineTo(x, y) : mg.moveTo(x, y);
      }
      mg.stroke();
      mg.fillStyle = "rgba(255,181,71,0.25)"; mg.beginPath(); mg.arc(X(g.lon), Y(g.lat), 7 * dpr, 0, Math.PI * 2); mg.fill();
      dot2(g.lon, g.lat, "#ffb547", 3.5, name === "ISS" ? "ISS" : "FramSat-1");
    }
  }
  function buildViews() {
    const s = C.S();
    document.querySelectorAll(".view-btns").forEach(v => v.replaceChildren(...s.views.map((nm, i) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = nm;
      b.setAttribute("aria-pressed", String(i === ride.preset));
      b.addEventListener("click", () => setView(i));
      return b;
    })));
  }
  let lastFrame = null;
  function setView(i) {
    ride.preset = i;
    const fr = lastFrame;
    if (i === 0) { ride.tyaw = 0; ride.tpitch = RIDE_PITCH; }
    if (i === 1) { ride.tyaw = ride.yaw; ride.tpitch = 1.45; }
    if (i === 2) { ride.tyaw = Math.PI; ride.tpitch = RIDE_PITCH; }
    if (i === 3 && fr) {
      const sun = sunEci(Date.now());
      // put the camera on the far side from the Sun, so it looks past FramSat-1 toward it
      const back = dot(sun, fr.fwd), sd = -dot(sun, fr.side), u = -dot(sun, fr.up);
      ride.tyaw = Math.atan2(sd, back); ride.tpitch = Math.max(0.15, Math.min(1.45, Math.asin(Math.max(-1, Math.min(1, u)))));
    }
    document.querySelectorAll(".view-btns").forEach(v => [...v.children].forEach((b, k) => b.setAttribute("aria-pressed", String(k === i))));
  }

  /* ---------- tracker drawer ---------- */
  const globe = C.createGlobe({
    canvas: $("globe"),
    landColor: h => `rgba(241,241,238,${0.35 + 0.5 * h})`,
    ocean: ["#0b0f1c", "#030408"],
    atmosphere: [[0, "rgba(120,160,255,0.28)"], [0.35, "rgba(40,80,170,0.10)"], [1, "rgba(0,0,0,0)"]],
    trackColor: f => [1, 0.71 + 0.1 * f, 0.28],
    satGlow: "rgba(255,181,71,0.55)", footprint: "rgba(255,181,71,0.5)", footprintFill: "rgba(255,181,71,0.05)",
    font: MONO, alwaysText: true,
  });
  const drawer = $("drawer");
  function setTracker(open) {
    document.body.classList.toggle("tracker-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    if (open) { $("closeTracker").focus({ preventScroll: true }); globe.redraw(); globe.refresh(); }
    else $("openTracker").focus({ preventScroll: true });
  }
  $("openTracker").addEventListener("click", () => setTracker(true));
  $("closeTracker").addEventListener("click", () => setTracker(false));
  window.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("tracker-open")) setTracker(false); });

  /* ---------- pointer: drag to look, hover to learn ---------- */
  let curStop = 0, dragging = null, mouse = null;
  const draggable = () => curStop === 0 || curStop === 5;
  const blocked = el => el.closest("a, button, input, .hud, .drawer, .top, .side, .col p, .col h1, .col h2, .col h3, .col li, .who");
  window.addEventListener("pointerdown", e => {
    if (!draggable() || document.body.classList.contains("tracker-open") || blocked(e.target)) return;
    if (e.pointerType === "touch" && (curStop !== 5 || e.clientY > VH())) return;
    dragging = { x: e.clientX, y: e.clientY, az: moonLook.taz, el: moonLook.tel, yaw: ride.tyaw, pitch: ride.tpitch };
    document.body.classList.add("looking");
  });
  window.addEventListener("pointermove", e => {
    if (e.pointerType === "mouse") mouse = { x: e.clientX, y: e.clientY, target: e.target };
    if (!dragging) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y, k = 2.2 / innerHeight;
    if (curStop === 0) {
      moonLook.taz = dragging.az + dx * k * 1.3;
      moonLook.tel = Math.max(-1.35, Math.min(1.35, dragging.el + dy * k * 1.3));
    } else {
      ride.tyaw = dragging.yaw + dx * k;
      ride.tpitch = Math.max(0.12, Math.min(1.45, dragging.pitch + dy * k));
      if (ride.preset !== -1) { ride.preset = -1; document.querySelectorAll(".view-btns button").forEach(b => b.setAttribute("aria-pressed", "false")); }
    }
  });
  const endDrag = () => { dragging = null; document.body.classList.remove("looking"); };
  window.addEventListener("dblclick", e => {
    if (curStop !== 0 || blocked(e.target)) return;
    moonLook.taz = Math.round(moonLook.az / (2 * Math.PI)) * 2 * Math.PI; moonLook.tel = 0;
  });
  window.addEventListener("pointerup", endDrag); window.addEventListener("pointercancel", endDrag);
  document.addEventListener("pointerleave", () => { mouse = null; });
  const tip = $("tip");
  function updateHover() {
    let hit = null;
    if (mouse && !dragging && !document.body.classList.contains("tracker-open") && !(mouse.target && blocked(mouse.target))) {
      let best = 1e9;
      for (const h of hovers) { const d = Math.hypot(h.x - mouse.x, h.y - mouse.y); if (d < h.r + 6 && d < best) { best = d; hit = h; } }
    }
    if (hit) {
      if (tip.dataset.html !== hit.html) { tip.innerHTML = hit.html; tip.dataset.html = hit.html; }
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const x = Math.min(innerWidth - w - 12, mouse.x + 16), y = Math.min(innerHeight - h - 12, mouse.y + 16);
      tip.style.transform = `translate(${x}px, ${y}px)`;
      tip.classList.add("on");
    } else tip.classList.remove("on");
    document.body.classList.toggle("can-point", !!hit);
    document.body.classList.toggle("can-drag", !hit && draggable() && !!mouse && !(mouse.target && blocked(mouse.target)));
  }

  /* ---------- labels clear of the text ----------
     Scene labels and lines are thinned out where the text column is, so they
     never print through a paragraph: on desktop a band over the column that
     fades out at its edge, on phones (where the text spans the screen) a
     lighter veil over everything. Not in the hero (the Moon's names belong
     there) or while riding with FramSat-1. */
  let colRight = 0;
  const measureCol = () => { const c = document.querySelector("main .band .col"); colRight = c ? c.getBoundingClientRect().right : 0; };
  window.addEventListener("resize", measureCol);
  function fadeUnderText(stopIdx, rideW) {
    if (stopIdx === 0 || rideW > 0.5 || narrow()) return;     // phones: the text is below the scene
    if (!colRight) measureCol();
    og.save();
    og.globalCompositeOperation = "destination-out";
    if (narrow()) {
      og.fillStyle = "rgba(0,0,0,.82)"; og.fillRect(0, 0, VW(), VH());
    } else {
      const edge = colRight + 80, g = og.createLinearGradient(0, 0, edge, 0);
      g.addColorStop(0, "rgba(0,0,0,.85)"); g.addColorStop(colRight / edge, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,0)");
      og.fillStyle = g; og.fillRect(0, 0, edge, VH());
    }
    og.restore();
  }

  /* ---------- loop ---------- */
  let yS = 0, yT = 0;
  const onScroll = () => { yT = scrollY + readTop() + readH() / 2; };
  let last = performance.now(), clock = 0, lastText = 0, lastCard = 0;
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    clock += dt;
    const k = C.reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
    yS += (yT - yS) * k; if (Math.abs(yT - yS) < 0.3) yS = yT;
    moonLook.az += (moonLook.taz - moonLook.az) * k; moonLook.el += (moonLook.tel - moonLook.el) * k;
    if (ride.pitch !== null) { ride.yaw += angDiff(ride.yaw, ride.tyaw) * k; ride.pitch += (ride.tpitch - ride.pitch) * k; }
    const ms = Date.now();
    const w = where(yS);
    const a = w.i, b = w.j, t = w.t;
    curStop = t < 0.5 ? a : b;
    const A = stop(a, ms, w.drift), B = b !== a ? stop(b, ms, 0) : A;
    let cam = b !== a ? blend(A, B, t) : A;
    if (A.frame) lastFrame = A.frame; else if (B.frame) lastFrame = B.frame;
    const weights = [0, 0, 0, 0, 0, 0];
    weights[a] += 1 - t; weights[b] += t;
    const rideW = (a === 5 || b === 5) ? (a === 5 ? 1 : t) : 0;
    const locked = a === 5 && yS >= lockY;
    document.body.classList.toggle("live-lock", locked);
    document.body.classList.toggle("riding", rideW > 0.6);
    const U = norm(sub(cam.U, mul(cam.F, dot(cam.U, cam.F))));
    const R = cross(cam.F, U);
    const sun = sunEci(ms), mf = spinMoon(moonFrame(ms));
    const camFull = { posKm: cam.pos, F: cam.F, U, R, tanH: Math.tan(rad(cam.half)), shift: cam.shift, sun, moonKm: mf.moon, mf,
      mode: rideW > 0.98 ? "ride" : "", cube: smooth((rideW - 0.35) / 0.5), sat: cam.sat };
    if (field) {
      // from 0.35 before the maps are in up to full once they are, without dipping to black
      const fade = 0.35 + 0.65 * (loaded ? C.clamp01((now - loadedAt) / 900) : 0);
      field.draw({ uCam: mul(cam.pos, 1 / RE), uF: cam.F, uR: R, uU: U, uTanH: camFull.tanH, uShift: cam.shift,
        uSun: sun, uGmst: gmst(ms), uFade: smooth(fade), uLoaded: loaded, uNight: Math.max(rideW, weights[4]),
        uMoon: mul(mf.moon, 1 / RE), uMoonR: RM / RE, uMX: mf.mx, uMY: mf.my, uMZ: mf.mz,
        uDetailBox: detail.box ? detail.box.uniform : [0, 0, 1, 1], uDetail: detail.fade * Math.min(1, weights[4] + weights[5]) }, dt);
      // Let the renderer lower its resolution only while the view is moving.
      field.setMoving(a !== b || !!dragging || Math.abs(yT - yS) > 2);
      if (detail.ready) detail.fade = Math.min(1, detail.fade + dt / 1.2);
    }
    drawOverlay(camFull, weights, ms, clock, rideW);
    fadeUnderText(curStop, rideW);
    updateHover();
    [...route.children].forEach((li, i) => {
      if (li.classList.toggle("on", i === curStop) !== (li.dataset.on === "1")) {
        li.dataset.on = i === curStop ? "1" : "";
        li.firstChild.toggleAttribute("aria-current", i === curStop);
      }
    });
    if (now - lastText > 1000) { lastText = now; stopTexts(ms); updateDetail(ms); }
    dimUnderText();
    if (now - lastCard > 500) {
      lastCard = now;
      if (!narrow()) updateCard(curStop, ms);
      else for (const [i, c] of slotCards) { const r = c.getBoundingClientRect(); if (r.bottom > -200 && r.top < innerHeight + 400) updateCard(i, ms, c); }
    }
    globe.frame(now);
    requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { sizeOverlay(); layout(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); onScroll(); });
  const renderHtml = () => document.querySelectorAll("[data-h]").forEach(el => { el.innerHTML = C.S()[el.dataset.h]; });
  C.onLang(() => { buildRoute(); stopTexts(Date.now()); lastCard = 0; renderHtml(); });

  C.render(); renderHtml();
  slotCards.forEach(([i, c]) => updateCard(i, Date.now(), c));   // filled before layout, so the page doesn't jump later
  layout(); onScroll(); yS = yT;
  // a timeline wider than a phone starts at its recent end
  const chartWrap = document.querySelector(".chart-wrap");
  if (chartWrap) chartWrap.scrollLeft = chartWrap.scrollWidth;
  requestAnimationFrame(frame);
})();
