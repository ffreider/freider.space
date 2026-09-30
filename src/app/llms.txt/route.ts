// /llms.txt: a plain-text summary of the site for AI assistants and their
// crawlers (see llmstxt.org). Keep it in step with the homepage.

export const dynamic = "force-static";

const text = `# Freider Fløan

> Freider Fløan (also written Freider Floan) is a Norwegian student of electronic systems design and space systems at NTNU in Trondheim, co-founder and President of NORSTEC, and host of the space podcast Spacepodden.

Personal website: https://freider.space (English), https://freider.space/no (Norwegian)

## Current roles

- NORSTEC (Norwegian Space Technology Collective), co-founder and President, since February 2024. An umbrella organization for 10 Norwegian student space and rocketry organizations with more than 550 members. https://norstec.no
- NORSTEC Summit, co-founder and chair, since September 2024. Norway's annual space conference, first held in March 2026 in Trondheim. https://norstec.no/summit
- Spacepodden, host, since October 2024. A weekly Norwegian-language podcast about space. https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB
- NASA HUNCH Norge, chair of the board, since August 2025. https://nasahunch.no
- Meso Manufacturing, since 2026: working on this new startup. https://www.mesomanufacturing.com/
- Tekna Romfart, board member, since March 2024.

## Earlier experience

- Orbit NTNU, 2021 to 2026: program director for the student satellites SelfieSat, FramSat-1/1.5 and BioSat, project manager and head of finance. https://orbitntnu.com/
- Kongsberg Defence & Aerospace: project liaison (2023 to 2024), then summer intern (2024).
- KSAT (Kongsberg Satellite Services): summer intern in Tromsø, 2023, satellite communication and orbital mechanics.
- NTNU: satellite operations intern, 2022.
- Norwegian Armed Forces, 2019 to 2020: smoke diver and team leader at NATO Joint Warfare Centre.

## Education

- MSc, Electronic Systems Design (space systems), NTNU.
- BSc, Economics and Business Administration, NTNU Business School.

## FramSat-1

FramSat-1 is a student satellite from Orbit NTNU, launched on 5 September 2026 (NORAD catalogue number 98914). It orbits every 95.8 minutes, 516 to 596 km up, in a polar orbit inclined 97.4°, with a downlink on 435.141 MHz. The website has a live tracker at https://freider.space/framsat (Norwegian: https://freider.space/no/framsat): its position on a globe computed from its orbital elements with the SGP4 model, upcoming passes over Trondheim, Doppler shift, recent receptions by SatNOGS ground stations and the annotated TLE. Project page: https://orbitntnu.com/projects/FramSat-1

## Press

- "The extracurricular that left Earth", Trondheim.com, 3 September 2026, by McKenna Starck: https://trondheim.com/journal/the-extracurricular-that-left-earth

## Profiles

- LinkedIn: https://www.linkedin.com/in/freider/
- GitHub: https://github.com/ffreider
`;

export function GET() {
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
