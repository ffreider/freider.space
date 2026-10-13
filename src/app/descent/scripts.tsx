"use client";

import { useEffect } from "react";

// Starts the descent in the browser. core.js and main.js are plain scripts
// written against globals (d3, topojson, satellite, THREE), so this loads the
// libraries from npm, puts them on window, adds the world map they read from
// the page, and then runs the two scripts in order.

declare global {
  interface Window {
    __descentStarted?: boolean;
    d3?: unknown;
    topojson?: unknown;
    satellite?: unknown;
    THREE?: unknown;
  }
}

function jsonScript(id: string, text: string) {
  const el = document.createElement("script");
  el.type = "application/json";
  el.id = id;
  el.textContent = text;
  document.body.append(el);
}

function runScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.append(el);
  });
}

export function DescentScripts() {
  useEffect(() => {
    // Only once per page load, also when React runs effects twice in development.
    if (window.__descentStarted) return;
    window.__descentStarted = true;

    // Hold the page still while the cover is up (CSS stops scrolling; this
    // stops touch and wheel on browsers that scroll anyway). It lets go once
    // main.js opens the cover, or after 6 s whatever happens.
    const covered = () => {
      const c = document.getElementById("cover");
      return !!c && !c.classList.contains("open") && performance.now() < 6000;
    };
    const hold = (e: Event) => { if (covered()) e.preventDefault(); };
    window.addEventListener("touchmove", hold, { passive: false });
    window.addEventListener("wheel", hold, { passive: false });
    const release = () => {
      window.removeEventListener("touchmove", hold); window.removeEventListener("wheel", hold);
      document.getElementById("cover")?.classList.add("open");   // in case nothing else opened it
    };
    setTimeout(release, 6500);

    (async () => {
      const [d3, topojson, satellite, THREE, { GLTFLoader }, world, iso] = await Promise.all([
        import("d3-geo"),
        import("topojson-client"),
        import("satellite.js"),
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        fetch("/descent/countries.json").then((r) => r.text()),
        fetch("/descent/num2a2.json").then((r) => r.text()),
      ]);
      window.d3 = d3;
      window.topojson = topojson;
      window.satellite = satellite;
      window.THREE = { ...THREE, GLTFLoader };
      jsonScript("worldData", world);
      jsonScript("isoData", iso);
      await runScript("/descent/core.js");
      await runScript("/descent/main.js");
    })().catch((err) => {
      console.error(err);
      document.getElementById("cover")?.classList.add("open");   // never leave the page stuck under the cover
    });
  }, []);

  return null;
}
