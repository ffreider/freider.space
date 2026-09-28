"use client";

import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import countryNames from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import nb from "i18n-iso-countries/langs/nb.json";
import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { Lang } from "./i18n";

// What the satellite is flying over: a country, or failing that an ocean,
// named in English or Norwegian.

countryNames.registerLocale(en);
countryNames.registerLocale(nb);

let loading: Promise<Feature[]> | null = null;

// The world map is the same file the globe uses, so it's only fetched once.
function loadCountries() {
  loading ??= import("world-atlas/countries-110m.json").then((mod) => {
    const topo = mod.default as unknown as Parameters<typeof feature>[0] & {
      objects: { countries: Parameters<typeof feature>[1] };
    };
    return (feature(topo, topo.objects.countries) as FeatureCollection).features;
  });
  return loading;
}

export function useCountries() {
  const [countries, setCountries] = useState<Feature[] | null>(null);
  useEffect(() => {
    let active = true;
    loadCountries().then((list) => active && setCountries(list));
    return () => {
      active = false;
    };
  }, []);
  return countries;
}

const OCEANS = {
  arctic: { en: "the Arctic Ocean", no: "Nordishavet" },
  southern: { en: "the Southern Ocean", no: "Sørishavet" },
  atlantic: { en: "the Atlantic Ocean", no: "Atlanterhavet" },
  indian: { en: "the Indian Ocean", no: "Det indiske hav" },
  pacific: { en: "the Pacific Ocean", no: "Stillehavet" },
};

// Rough ocean boundaries, good enough to say which one it's over.
function ocean(lat: number, lon: number) {
  if (lat > 66) return OCEANS.arctic;
  if (lat < -60) return OCEANS.southern;
  if (lon >= -70 && lon <= 20) return OCEANS.atlantic;
  if (lon > -100 && lon < -70 && lat > 8) return OCEANS.atlantic; // Caribbean, Gulf of Mexico
  if (lon > 20 && lon < 120 && lat < 25) return OCEANS.indian;
  return OCEANS.pacific;
}

export function placeName(countries: Feature[] | null, lat: number, lon: number, lang: Lang) {
  const country = countries?.find((c) => geoContains(c, [lon, lat]));
  if (!country) return ocean(lat, lon)[lang];
  const alpha2 = country.id ? countryNames.numericToAlpha2(String(country.id)) : undefined;
  const name = alpha2 && countryNames.getName(alpha2, lang === "no" ? "nb" : "en");
  return name || String(country.properties?.name ?? "");
}
