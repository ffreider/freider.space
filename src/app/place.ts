"use client";

import type { Feature } from "geojson";
import { useEffect, useState } from "react";
import { loadCountries } from "./place-name";

export { placeName } from "./place-name";

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
