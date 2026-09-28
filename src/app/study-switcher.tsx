"use client";

import { useEffect, useState } from "react";

// Temporary: flips the page between the design studies (see the
// [data-study] blocks in globals.css). The choice is kept in ?study= so a
// study can be linked to directly. Remove once a direction is chosen.

const STUDIES = [
  ["current", "Current"],
  ["mission", "Mission"],
  ["ground", "Ground station"],
  ["nordic", "Nordic"],
] as const;
type Study = (typeof STUDIES)[number][0];

function apply(study: Study) {
  const root = document.documentElement;
  if (study === "current") delete root.dataset.study;
  else root.dataset.study = study;
}

export function StudySwitcher() {
  const [study, setStudy] = useState<Study>("current");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("study");
    const initial = STUDIES.some(([id]) => id === fromUrl) ? (fromUrl as Study) : "current";
    apply(initial);
    // Sync the buttons with the study read from the URL after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudy(initial);
  }, []);

  const choose = (next: Study) => {
    setStudy(next);
    apply(next);
    const url = new URL(window.location.href);
    if (next === "current") url.searchParams.delete("study");
    else url.searchParams.set("study", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="study-switcher" role="group" aria-label="Design study">
      {STUDIES.map(([id, name]) => (
        <button key={id} type="button" aria-pressed={study === id} onClick={() => choose(id)}>
          {name}
        </button>
      ))}
    </div>
  );
}
