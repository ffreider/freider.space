// The page markup and styles of the descent, from the redesign's
// page.template.html. It's rendered as plain HTML (not JSX) so the descent
// scripts in public/descent can drive it as they do in the standalone page.
// The styles sit inside the page rather than in globals.css, so they only
// apply while the descent is on screen.

export const DESCENT_CSS = String.raw`
/* Layout: a guided descent from the Moon to FramSat-1. Rendered Earth and Moon fill the screen; content sits on a plain left-hand fade; a short route list on the right names each stop. */
:root {
  --void: #000000;
  --ink: #f1f1ee;
  --ink-2: rgba(241, 241, 238, 0.76);
  --ink-3: rgba(241, 241, 238, 0.52);
  --ink-4: rgba(241, 241, 238, 0.3);
  --rule: rgba(241, 241, 238, 0.16);
  --fs: #ffb547;
  --f-display: var(--font-schibsted), "Helvetica Neue", Arial, sans-serif;
  --f-body: var(--font-schibsted), "Helvetica Neue", Arial, sans-serif;
  --f-data: var(--font-plex-mono), ui-monospace, Menlo, monospace;
  --gutter: clamp(18px, 4.5vw, 72px);
  color-scheme: dark;
}
[hidden] { display: none !important; }
body { background: var(--void); color: var(--ink); font-family: var(--f-body); font-size: 17px; line-height: 1.55; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
a { color: inherit; text-decoration: underline; text-decoration-color: var(--ink-4); text-underline-offset: 4px; }
a:hover { text-decoration-color: var(--ink); }
:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

#field, #overlay { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }
#field { z-index: 0; }
#overlay { z-index: 1; pointer-events: none; }
.fade { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.55) 30%, rgba(0,0,0,0) 56%); transition: opacity .6s; }
body.live-lock .fade { opacity: .35; }
body.can-drag { cursor: grab; }
body.can-point { cursor: pointer; }
/* right side: the space stuff. route on top, a live card below */
.side {
  position: fixed; z-index: 4; right: var(--gutter); top: calc(70px + env(safe-area-inset-top, 0px)); bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  width: min(340px, 32vw); display: flex; flex-direction: column; gap: 14px; pointer-events: none;
}
.side > * { pointer-events: auto; }
#field, #overlay, #cube { -webkit-user-select: none; user-select: none; }
body.can-drag main { -webkit-user-select: none; user-select: none; }
.card {
  margin-top: auto; padding: 14px 16px 16px; display: grid; gap: 10px; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
  background: rgba(0,0,0,.58); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-top: 1px solid var(--rule);
}
.card h4 { margin: 0; display: flex; justify-content: space-between; gap: 10px; font: 500 11px/1.3 var(--f-data); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); }
.card h4 .lv { color: var(--fs); letter-spacing: .08em; display: inline-flex; align-items: center; gap: 6px; }
.card h4 .lv::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
.card .cdesc { margin: 0; font: 400 14px/1.5 var(--f-body); color: var(--ink-2); }
.card #live { margin: 0; font: 500 15px/1.45 var(--f-body); color: var(--ink); }
#cardMap { display: block; width: 100%; aspect-ratio: 2 / 1; height: auto; border: 1px solid var(--rule); }
.card dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 5px 14px; }
.card dt { font: 400 11px/1.35 var(--f-data); color: var(--ink-3); }
.card dd { margin: 0; font: 500 11.5px/1.35 var(--f-data); color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
.card .foot { margin: 0; font: 400 10.5px/1.45 var(--f-data); color: var(--ink-3); }
.tip {
  position: fixed; z-index: 7; left: 0; top: 0; max-width: 340px; pointer-events: none; padding: 12px 14px;
  background: rgba(0,0,0,.82); border: 1px solid var(--rule); font: 400 11.5px/1.45 var(--f-data); color: var(--ink-2);
  opacity: 0; transition: opacity .15s;
}
.tip.on { opacity: 1; }
.tip b { display: block; font: 500 12.5px/1.3 var(--f-body); color: var(--ink); margin-bottom: 3px; }
.tip .m { display: block; color: var(--ink-3); margin-bottom: 6px; }
.tip p { margin: 0 0 8px; font: 400 13px/1.45 var(--f-body); color: var(--ink-2); }
.tip dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; padding-top: 7px; border-top: 1px solid var(--rule); }
.tip dt { color: var(--ink-3); }
.tip dd { margin: 0; color: var(--ink); text-align: right; }
body.looking { cursor: grabbing; user-select: none; }

.top { position: fixed; z-index: 6; top: calc(16px + env(safe-area-inset-top, 0px)); left: var(--gutter); right: var(--gutter); display: flex; justify-content: space-between; align-items: center; pointer-events: none; }
.mark { font: 500 12px/1 var(--f-data); letter-spacing: .08em; color: var(--ink-2); pointer-events: auto; text-decoration: none; }
.chip { pointer-events: auto; font: 500 11px/1 var(--f-data); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-2); background: rgba(0,0,0,.4); border: 1px solid var(--rule); padding: 9px 11px; cursor: pointer; text-decoration: none; }
.chip:hover { color: var(--ink); border-color: var(--ink-3); }

/* route */
.route { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; transition: opacity .5s; }
.route button { all: unset; cursor: pointer; display: flex; gap: 10px; align-items: center; padding: 4px 0; text-align: left; width: 100%; }
.route .txt { display: flex; justify-content: space-between; gap: 10px; flex: 1; }
.route button:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.route .pip { flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--ink-3); transition: background .3s, border-color .3s; }
.route .nm { font: 500 12px/1.2 var(--f-data); letter-spacing: .04em; color: var(--ink-3); transition: color .3s; white-space: nowrap; }
.route .km { font: 400 10.5px/1.3 var(--f-data); color: var(--ink-4); font-variant-numeric: tabular-nums; }
.route li.on .pip { background: var(--ink); border-color: var(--ink); }
.route li.on .nm { color: var(--ink); }
.route li.on .km { color: var(--ink-2); }
.route li.fs.on .pip { background: var(--fs); border-color: var(--fs); }
body.riding .route { display: none; }

main { position: relative; z-index: 2; }
section { padding-inline: var(--gutter); }
.col { max-width: 600px; }
.stop { font: 500 11px/1.5 var(--f-data); letter-spacing: .02em; color: var(--ink-3); margin: 0 0 22px; max-width: 54ch; }
.stop b { color: var(--ink); font-weight: 500; letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: 4px; }
h2 { font-family: var(--f-display); font-weight: 800; font-size: clamp(40px, 5.2vw, 68px); line-height: .94; letter-spacing: -0.03em; margin: 0 0 22px; }
p { margin: 0; }

.hero { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding-block: 110px 80px; }
.name { font-family: var(--f-display); font-weight: 800; font-size: clamp(68px, 11vw, 176px); line-height: .86; letter-spacing: -0.045em; margin: 0 0 28px; }
.who { display: flex; gap: 18px; align-items: center; margin-bottom: 18px; }
.who img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.tagline { font-size: clamp(20px, 2vw, 25px); line-height: 1.35; font-weight: 500; max-width: 26ch; }
.links { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 22px; font: 500 12px/1 var(--f-data); letter-spacing: .1em; text-transform: uppercase; }
.hint { margin-top: 48px; font: 400 11px/1.4 var(--f-data); color: var(--ink-3); letter-spacing: .06em; }

.band { min-height: 140vh; display: flex; flex-direction: column; justify-content: center; padding-block: 25vh; }
.band.long { min-height: 0; padding-block: 35vh 45vh; }
.bio { font-size: clamp(19px, 1.8vw, 22px); line-height: 1.55; }

.chart-wrap { overflow-x: auto; margin: 0 -4px 10px; padding: 26px 4px 30px; }
.chart { position: relative; min-width: 560px; margin: 0; }
.chart .grid { position: absolute; inset: 0; pointer-events: none; }
.chart .yr { position: absolute; top: 0; bottom: 0; border-left: 1px solid rgba(241,241,238,.09); }
.chart .yr span { position: absolute; bottom: -22px; left: 4px; font: 400 10px/1 var(--f-data); color: var(--ink-3); }
.chart .nowline { position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--ink-3); }
.chart .nowline span { position: absolute; top: -20px; transform: translateX(-50%); font: 500 10px/1 var(--f-data); color: var(--ink-2); text-transform: uppercase; letter-spacing: .1em; }
.chart ol { list-style: none; margin: 0; padding: 0; position: relative; }
.chart li { position: relative; height: 22px; }
.seg { position: absolute; top: 50%; height: 2px; transform: translateY(-50%); background: var(--ink) !important; }
.seg.past { opacity: .35; } .seg.past.ongoing { opacity: .55; }
.chart li:hover .seg.past { opacity: 1; }
.tick { position: absolute; top: 50%; width: 1px; height: 8px; transform: translateY(-50%); background: var(--ink-2); }
.dot { position: absolute; top: 50%; width: 5px; height: 5px; border-radius: 50%; transform: translate(-50%, -50%); background: var(--ink-2); }
.lab { position: absolute; top: 50%; transform: translateY(-50%); font: 400 11px/1 var(--f-data); color: var(--ink-2); white-space: nowrap; }
.roles { list-style: none; margin: 10px 0 0; padding: 0; display: grid; }
.roles > li { padding-block: 18px; border-top: 1px solid var(--rule); min-width: 0; }
.org { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.org strong { font-weight: 700; font-size: 19px; }
.when { font: 400 11.5px/1.4 var(--f-data); color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.desc { color: var(--ink-3); font-size: 15.5px; margin-top: 4px; }
.role-one { color: var(--ink-2); font-size: 16.5px; margin-top: 2px; }
.sub { list-style: none; margin: 10px 0 0; padding: 0 0 0 14px; border-left: 1px solid var(--rule); display: grid; gap: 8px; }
.sub li { font-size: 16px; color: var(--ink-2); }
.sub .row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.sub .note { color: var(--ink-3); font-size: 15px; display: block; }

.article { display: grid; gap: 12px; text-decoration: none; background: rgba(0,0,0,.5); border: 1px solid var(--rule); padding: 0 0 20px; max-width: 480px; }
.article > *:not(img) { margin-inline: 20px; }
.article img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; object-position: 50% 30%; display: block; margin-bottom: 4px; }
.article .src { font: 500 10.5px/1 var(--f-data); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.article:hover { border-color: var(--ink-3); }
.article h3 { font-family: var(--f-display); font-weight: 800; letter-spacing: -0.02em; font-size: clamp(24px, 2.4vw, 32px); line-height: 1.08; margin-block: 0; overflow-wrap: break-word; text-wrap: balance; }
.article:hover h3 { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; }
.article .meta { font: 400 11.5px/1.5 var(--f-data); color: var(--ink-3); }
.article .byline { font-size: 14px; color: var(--ink-3); }
.article .cta { font: 500 11.5px/1 var(--f-data); letter-spacing: .1em; text-transform: uppercase; }
.degrees { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.degrees li { font-size: 19px; line-height: 1.35; padding-top: 12px; border-top: 1px solid var(--rule); }
.finishing { margin-top: 16px; color: var(--ink-2); }

.arrival { min-height: 260vh; padding-block: 30vh 0; }

/* riding along */
.hud {
  position: fixed; z-index: 5; left: var(--gutter); bottom: calc(var(--gutter) * .7 + env(safe-area-inset-bottom, 0px));
  width: min(520px, calc(100vw - 2 * var(--gutter) - 380px)); display: grid; gap: 14px; max-height: calc(100vh - 90px); overflow-y: auto;
  opacity: 0; transform: translateY(12px); pointer-events: none; transition: opacity .6s, transform .6s;
}
body.live-lock .hud { opacity: 1; transform: none; pointer-events: auto; cursor: auto; }
.hud .k { display: flex; gap: 10px; align-items: center; font: 500 11px/1.3 var(--f-data); letter-spacing: .12em; text-transform: uppercase; color: var(--fs); }
.hud .k::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
@keyframes pulse { 50% { opacity: .25; } }
.hud h2 { font-size: clamp(30px, 3.6vw, 46px); margin: 0; }
.hud .why a, .bio a { color: var(--ink); text-decoration-color: var(--fs); }
.hud .why { font-size: 16px; line-height: 1.55; color: var(--ink-2); max-width: 52ch; }
.stats { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 16px; padding: 12px 0; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.stats dt { font: 400 9.5px/1.3 var(--f-data); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.stats dd { margin: 2px 0 0; font: 500 12.5px/1.3 var(--f-data); color: var(--ink); font-variant-numeric: tabular-nums; }
.views { display: flex; flex-wrap: wrap; gap: 4px; }
.views button { font: 500 10.5px/1 var(--f-data); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); background: rgba(0,0,0,.35); border: 1px solid var(--rule); padding: 8px 10px; cursor: pointer; }
.views button:hover { color: var(--ink); }
.views button[aria-pressed="true"] { color: #140b00; background: var(--ink); border-color: var(--ink); }
.live { font-size: 18px; line-height: 1.45; min-height: 3em; color: var(--ink); text-shadow: 0 1px 12px rgba(0,0,0,.8); }
.hud-row { display: flex; flex-wrap: wrap; gap: 6px 18px; font: 500 12.5px/1.3 var(--f-data); color: var(--ink-2); font-variant-numeric: tabular-nums; }
.hud-actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
.hud-actions .hint { margin: 0; }
.primary { font: 500 12px/1 var(--f-data); letter-spacing: .1em; text-transform: uppercase; color: #140b00; background: var(--fs); border: 0; padding: 13px 16px; cursor: pointer; }
.primary:hover { background: #ffc875; }

/* tracker drawer */
.drawer {
  position: fixed; z-index: 8; top: 0; right: 0; bottom: 0; width: min(560px, 100vw);
  background: rgba(3,3,6,.92); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border-left: 1px solid var(--rule);
  transform: translateX(102%); transition: transform .45s cubic-bezier(.2,.7,.2,1); overflow-y: auto; overscroll-behavior: contain;
  padding: calc(18px + env(safe-area-inset-top, 0px)) 24px calc(28px + env(safe-area-inset-bottom, 0px));
  display: grid; gap: 18px; align-content: start;
}
body.tracker-open .drawer { transform: none; }
.drawer-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.drawer-head h3 { font-family: var(--f-display); font-weight: 800; font-size: 30px; letter-spacing: -0.02em; margin: 0; }
.globe-wrap { position: relative; aspect-ratio: 1; width: 100%; }
#globe { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
#globe.dragging { cursor: grabbing; }
.globe-tools { position: absolute; right: 2%; bottom: 2%; }
.time { display: grid; gap: 10px; }
.time-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.clock { font: 500 13px/1 var(--f-data); font-variant-numeric: tabular-nums; margin-right: auto; }
.btn { font: 500 11px/1 var(--f-data); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); background: transparent; border: 1px solid var(--rule); padding: 8px 10px; cursor: pointer; }
.btn:hover { color: var(--ink); border-color: var(--ink-3); }
.btn[aria-pressed="true"] { color: var(--fs); border-color: var(--fs); }
input[type="range"] { width: 100%; accent-color: var(--fs); }
.scale { position: relative; display: flex; justify-content: space-between; font: 400 10px/1 var(--f-data); color: var(--ink-3); }
.scale .mid { position: absolute; left: 33.33%; transform: translateX(-50%); }
.tele { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; margin: 0; }
.tele dt { font: 500 10px/1.3 var(--f-data); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.tele dd { margin: 3px 0 0; font: 500 15px/1.3 var(--f-data); font-variant-numeric: tabular-nums; }
.tele dd small { font-size: 11px; color: var(--ink-3); font-weight: 400; }
.pass { font-size: 15px; color: var(--ink-2); border-top: 1px solid var(--rule); padding-top: 14px; }
.facts { display: flex; flex-wrap: wrap; gap: 4px 14px; font: 400 11px/1.5 var(--f-data); color: var(--ink-3); }
.note { font-size: 13.5px; color: var(--ink-3); }
.fs-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; font-size: 13.5px; color: var(--ink-3); }
.fs-foot a { font: 500 11.5px/1 var(--f-data); letter-spacing: .1em; text-transform: uppercase; color: var(--fs); }
footer { position: relative; z-index: 2; padding: 0 var(--gutter) calc(14px + env(safe-area-inset-bottom, 0px)); color: var(--ink-4); font-size: 12px; text-align: right; }

@media (max-width: 900px) {
  .side { left: var(--gutter); width: auto; top: auto; max-height: 34vh; }
  .route, .card dl, .card .foot { display: none; }
  body.riding .side { display: none; }
  .hud { width: auto; right: var(--gutter); }
  .fade { background: linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.4)); }
}
@media (prefers-reduced-motion: reduce) { .drawer, .hud { transition: none; } .hud .k::before { animation: none; } }
/* The cover: a black screen that says hi while the scene loads, then opens
   like two doors, splitting the greeting across the seam (main.js adds .open
   when the first maps are in). Only transforms, so it costs next to nothing.
   Without JavaScript it steps aside on its own after a few seconds. */
.cover { position: fixed; inset: 0; z-index: 20; pointer-events: none; animation: cover-gone 0s 6s forwards; }
.door { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; background: var(--void); transition: transform .9s cubic-bezier(.7, 0, .2, 1); }
.door.up { top: 0; }
.door.down { bottom: 0; }
.door span { position: absolute; left: 0; right: 0; text-align: center; white-space: nowrap; font-family: var(--f-display); font-weight: 800; font-size: clamp(44px, 9vw, 140px); line-height: 1; letter-spacing: -0.04em; color: var(--ink); animation: hi .7s ease-out .1s backwards; }
.door.up span { bottom: 0; transform: translateY(50%); }
.door.down span { top: 0; transform: translateY(-50%); }
.cover.open .door.up { transform: translateY(-101%); }
.cover.open .door.down { transform: translateY(101%); }
@keyframes hi { from { opacity: 0; } }
@keyframes cover-gone { to { visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  .cover .door, .cover .door span { transition: none !important; }
  .cover { transition: opacity .3s; }
  .cover.open { opacity: 0; }
}
/* globals.css gives the light pages' text a glow; not wanted here */
main, footer { text-shadow: none; }
/* ===================== Style studies =====================
   Two looks for everything but the descent itself, picked by data-style on
   #descent (set from ?style= before the first paint, see the top of the
   markup). The rules above are the shared layout. */

/* ---------- Polar night (the default) ----------
   A Trondheim winter night: polar-night blue instead of black, cool snow
   white, frost grey, ice for lines, sodium streetlight orange for links and
   FramSat-1, aurora green once, on the Ø. Schibsted Grotesk (made for the
   Norwegian media group Schibsted) for names and interface, Newsreader for
   reading, sentence case throughout, no monospace outside the descent. */
#descent[data-style="polar"] {
  --night: #0a1220; --snow: #e9eef2; --frost: #8fa3b5; --ice: #24364a; --sodium: #f2a541; --aurora: #6fe3b4;
  --ink: var(--snow); --ink-2: rgba(233, 238, 242, 0.8); --ink-3: var(--frost); --ink-4: rgba(143, 163, 181, 0.62);
  --rule: rgba(143, 163, 181, 0.22); --fs: var(--sodium);
  --f-read: var(--font-newsreader), Georgia, serif;
  --panel: rgba(10, 18, 32, 0.66);
}
#descent[data-style="polar"] a { text-decoration-color: rgba(242, 165, 65, 0.55); text-underline-offset: 5px; text-decoration-thickness: 1px; }
#descent[data-style="polar"] a:hover { text-decoration-color: var(--sodium); }
#descent[data-style="polar"] .fade { background: linear-gradient(90deg, rgba(10, 18, 32, 0.88) 0%, rgba(10, 18, 32, 0.6) 30%, rgba(10, 18, 32, 0) 58%); }
#descent[data-style="polar"] .mark { font: 600 15px/1 var(--f-body); letter-spacing: -0.01em; color: var(--ink); }
#descent[data-style="polar"] .chip { font: 500 14px/1 var(--f-body); letter-spacing: 0; text-transform: none; color: var(--ink-2); background: var(--panel); border-color: var(--ice); border-radius: 999px; padding: 9px 14px; }
#descent[data-style="polar"] .route .nm { font: 500 14px/1.25 var(--f-body); letter-spacing: 0; }
#descent[data-style="polar"] .route .km { font: 400 13px/1.3 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="polar"] .route button { padding: 5px 0; }
#descent[data-style="polar"] .card { background: var(--panel); border: 1px solid var(--ice); border-radius: 14px; padding: 16px 18px 18px; gap: 12px; }
#descent[data-style="polar"] .card h4 { font: 600 17px/1.25 var(--f-body); letter-spacing: -0.01em; text-transform: none; }
#descent[data-style="polar"] .card h4 .lv { font-size: 0; }
#descent[data-style="polar"] .card h4 .lv::before { width: 8px; height: 8px; margin-top: 6px; }
#descent[data-style="polar"] .card .cdesc { font: 400 16px/1.5 var(--f-read); color: var(--ink-2); }
#descent[data-style="polar"] .card #live { font: 500 17px/1.4 var(--f-read); }
#descent[data-style="polar"] .card dl { gap: 6px 16px; }
#descent[data-style="polar"] .card dt { font: 400 13px/1.35 var(--f-body); color: var(--ink-3); }
#descent[data-style="polar"] .card dd { font: 500 13px/1.35 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="polar"] .card .foot { font: 400 13px/1.45 var(--f-read); font-style: italic; color: var(--ink-3); }
#descent[data-style="polar"] #cardMap { border-color: var(--ice); border-radius: 8px; }
#descent[data-style="polar"] .tip { background: rgba(10, 18, 32, 0.9); border-color: var(--ice); border-radius: 10px; font: 400 13px/1.45 var(--f-body); }
#descent[data-style="polar"] .tip b { font: 600 15px/1.3 var(--f-body); }
#descent[data-style="polar"] .tip p { font: 400 15px/1.45 var(--f-read); }
#descent[data-style="polar"] h2 { letter-spacing: -0.035em; }
#descent[data-style="polar"] .tagline { font: 400 clamp(22px, 2.2vw, 28px)/1.3 var(--f-read); max-width: 24ch; }
#descent[data-style="polar"] .links { font: 500 16px/1 var(--f-body); letter-spacing: 0; text-transform: none; gap: 24px; }
#descent[data-style="polar"] .hint { font: 400 16px/1.5 var(--f-read); color: var(--ink-3); letter-spacing: 0; max-width: 38ch; }
#descent[data-style="polar"] .bio { font: 400 clamp(20px, 1.9vw, 23px)/1.6 var(--f-read); }
#descent[data-style="polar"] .chart .yr span, #descent[data-style="polar"] .lab { font: 400 12px/1 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="polar"] .chart .nowline span { font: 600 12px/1 var(--f-body); text-transform: none; letter-spacing: 0; color: var(--sodium); }
#descent[data-style="polar"] .org strong { font-size: 20px; letter-spacing: -0.01em; }
#descent[data-style="polar"] .when { font: 400 14px/1.4 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="polar"] .desc { font: 400 17px/1.5 var(--f-read); }
#descent[data-style="polar"] .role-one, #descent[data-style="polar"] .sub li { font: 400 17.5px/1.45 var(--f-read); }
#descent[data-style="polar"] .sub .note { font: 400 15.5px/1.45 var(--f-read); font-style: italic; }
#descent[data-style="polar"] .article { background: var(--panel); border-color: var(--ice); border-radius: 14px; overflow: hidden; }
#descent[data-style="polar"] .article .src { font: 500 14px/1 var(--f-body); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
#descent[data-style="polar"] .article .meta { font: 400 14px/1.5 var(--f-body); }
#descent[data-style="polar"] .article p:not(.src):not(.meta):not(.byline) { font: 400 18px/1.5 var(--f-read); }
#descent[data-style="polar"] .article .byline { font: 400 15px/1.45 var(--f-read); font-style: italic; }
#descent[data-style="polar"] .article .cta { font: 600 16px/1 var(--f-body); letter-spacing: 0; text-transform: none; color: var(--sodium); }
#descent[data-style="polar"] .meta { font-family: var(--f-body); }
#descent[data-style="polar"] .degrees li { font: 400 21px/1.4 var(--f-read); }
#descent[data-style="polar"] .finishing { font: 400 18px/1.5 var(--f-read); font-style: italic; }
#descent[data-style="polar"] .hud .k { font: 600 15px/1.3 var(--f-body); letter-spacing: 0; text-transform: none; }
#descent[data-style="polar"] .hud .why { font: 400 18px/1.55 var(--f-read); }
#descent[data-style="polar"] .views button, #descent[data-style="polar"] .btn { font: 500 13.5px/1 var(--f-body); letter-spacing: 0; text-transform: none; border-color: var(--ice); border-radius: 999px; padding: 9px 13px; background: var(--panel); }
#descent[data-style="polar"] .views button[aria-pressed="true"] { color: var(--night); background: var(--snow); }
#descent[data-style="polar"] .primary { font: 600 15px/1 var(--f-body); letter-spacing: 0; text-transform: none; color: var(--night); border-radius: 999px; padding: 14px 20px; }
#descent[data-style="polar"] .stats dt, #descent[data-style="polar"] .tele dt { font: 400 12.5px/1.3 var(--f-body); letter-spacing: 0; text-transform: none; }
#descent[data-style="polar"] .stats dd, #descent[data-style="polar"] .tele dd, #descent[data-style="polar"] .clock, #descent[data-style="polar"] .hud-row { font-family: var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="polar"] .scale, #descent[data-style="polar"] .facts { font: 400 12.5px/1.5 var(--f-body); }
#descent[data-style="polar"] .pass, #descent[data-style="polar"] .note { font-family: var(--f-read); }
#descent[data-style="polar"] .fs-foot a { font: 600 15px/1 var(--f-body); letter-spacing: 0; text-transform: none; }
#descent[data-style="polar"] .drawer { background: rgba(10, 18, 32, 0.95); border-left-color: var(--ice); }
#descent[data-style="polar"] footer { font: 400 13.5px/1.4 var(--f-read); font-style: italic; color: var(--ink-4); }
#descent[data-style="polar"] .door { background: var(--night); }

/* The Ø of Fløan as a live orbit: a ring (aurora green) crossed by the
   slash at 97.4°, FramSat-1's inclination, and a sodium dot for FramSat-1
   at its real place in its orbit (main.js moves it). The letter itself stays
   in the text, invisible, so it's still read, copied and indexed as ø. */
.oe { position: relative; display: inline-block; }
.oe-s { display: none; }
#descent[data-style="polar"] .oe-t { color: transparent; }
#descent[data-style="polar"] .oe-s { display: block; position: absolute; left: -0.02em; right: -0.02em; bottom: 0.02em; width: auto; aspect-ratio: 1; overflow: visible; }
.oe-ring { fill: none; stroke: var(--aurora, #6fe3b4); stroke-width: 12; }
.oe-slash { stroke: var(--ink); stroke-width: 12; stroke-linecap: butt; }
.oe-sat { fill: var(--sodium, #f2a541); }

/* ---------- Ground station (?style=station) ----------
   The interface as Orbit NTNU's own mission paperwork: each section a sheet
   with a title block (document number, title, revision), condensed technical
   capitals for document headings only, plain Barlow for reading, steel on a
   console blue, one signal red for anything live. */
#descent[data-style="station"] {
  --console: #0c131a; --steel: #cdd6dd; --steel-2: #8e9ba6; --line: #3a4652; --signal: #ff5b3a;
  --ink: var(--steel); --ink-2: rgba(205, 214, 221, 0.82); --ink-3: var(--steel-2); --ink-4: rgba(142, 155, 166, 0.6);
  --rule: var(--line); --fs: var(--signal);
  --f-display: var(--font-barlow-cond), "Arial Narrow", sans-serif;
  --f-body: var(--font-barlow), "Helvetica Neue", Arial, sans-serif;
  --f-read: var(--font-barlow), "Helvetica Neue", Arial, sans-serif;
  --panel: rgba(12, 19, 26, 0.84);
  counter-reset: doc;
}
#descent[data-style="station"] .fade { background: linear-gradient(90deg, rgba(12, 19, 26, 0.9) 0%, rgba(12, 19, 26, 0.6) 32%, rgba(12, 19, 26, 0) 58%); }
#descent[data-style="station"] a { text-decoration-color: var(--signal); text-underline-offset: 4px; }
#descent[data-style="station"] .mark { font: 600 15px/1 var(--f-display); letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink); }
#descent[data-style="station"] .chip { font: 600 14px/1 var(--f-display); letter-spacing: 0.08em; background: var(--panel); border-color: var(--line); }
#descent[data-style="station"] .route .nm { font: 600 15px/1.2 var(--f-display); letter-spacing: 0.04em; text-transform: uppercase; }
#descent[data-style="station"] .route .km { font: 400 13px/1.3 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="station"] .route .pip { border-radius: 0; }
#descent[data-style="station"] .card { background: var(--panel); border: 1px solid var(--line); border-top: 3px solid var(--signal); }
#descent[data-style="station"] .card h4 { font: 700 18px/1.2 var(--f-display); letter-spacing: 0.05em; }
#descent[data-style="station"] .card h4 .lv { color: var(--signal); }
#descent[data-style="station"] .card h4 .lv::before { border-radius: 0; animation: none; }
#descent[data-style="station"] .card .cdesc { font: 400 15.5px/1.5 var(--f-read); }
#descent[data-style="station"] .card dl { border-top: 1px solid var(--line); padding-top: 8px; }
#descent[data-style="station"] .card dt { font: 500 13px/1.35 var(--f-body); }
#descent[data-style="station"] .card dd { font: 500 13.5px/1.35 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="station"] .card .foot { font: 400 12.5px/1.45 var(--f-body); }
#descent[data-style="station"] .tip { background: rgba(12, 19, 26, 0.94); border-color: var(--line); font: 400 13px/1.45 var(--f-body); }
#descent[data-style="station"] .tip b { font: 700 16px/1.2 var(--f-display); letter-spacing: 0.04em; text-transform: uppercase; }
#descent[data-style="station"] h2 { font: 700 clamp(44px, 5.6vw, 76px)/0.92 var(--f-display); letter-spacing: 0.01em; text-transform: uppercase; }
#descent[data-style="station"] .name { font: 700 clamp(76px, 12vw, 190px)/0.84 var(--f-display); letter-spacing: 0.005em; text-transform: uppercase; }
#descent[data-style="station"] .tagline { font: 400 clamp(21px, 2vw, 26px)/1.35 var(--f-read); }
#descent[data-style="station"] .links { font: 600 16px/1 var(--f-display); letter-spacing: 0.08em; }
#descent[data-style="station"] .hint { font: 400 14.5px/1.5 var(--f-body); letter-spacing: 0; }
#descent[data-style="station"] .bio { font: 400 clamp(19px, 1.8vw, 22px)/1.6 var(--f-read); }
/* every section a sheet, with a title block: document number and revision */
#descent[data-style="station"] main .col { position: relative; background: var(--panel); border: 1px solid var(--line); padding: 54px 28px 28px; }
#descent[data-style="station"] main section { counter-increment: doc; }
#descent[data-style="station"] main .col::before {
  content: "Doc FF-" counter(doc, decimal-leading-zero) "\00a0\00a0\00a0Rev 11 Oct 2026\00a0\00a0\00a0Released";
  position: absolute; top: 0; left: 0; right: 0; padding: 9px 28px; border-bottom: 1px solid var(--line);
  font: 600 13px/1.2 var(--f-display); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); word-spacing: 0.2em;
}
#descent[data-style="station"] .hero .col { padding-top: 60px; }
#descent[data-style="station"] .chart .yr span, #descent[data-style="station"] .lab { font: 500 12px/1 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="station"] .chart .nowline span { font: 700 12px/1 var(--f-display); color: var(--signal); }
#descent[data-style="station"] .seg { height: 3px; }
#descent[data-style="station"] .org strong { font: 700 21px/1.2 var(--f-display); letter-spacing: 0.03em; text-transform: uppercase; }
#descent[data-style="station"] .when { font: 500 14px/1.4 var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="station"] .desc, #descent[data-style="station"] .role-one, #descent[data-style="station"] .sub li { font-family: var(--f-read); font-size: 16.5px; }
#descent[data-style="station"] .article { background: var(--panel); border-color: var(--line); }
#descent[data-style="station"] .article .src, #descent[data-style="station"] .article .cta { font: 600 14px/1 var(--f-display); letter-spacing: 0.1em; }
#descent[data-style="station"] .article .meta { font: 400 13.5px/1.5 var(--f-body); }
#descent[data-style="station"] .article h3 { font: 700 clamp(28px, 2.8vw, 38px)/1 var(--f-display); letter-spacing: 0.01em; text-transform: uppercase; }
#descent[data-style="station"] .degrees li { font: 400 19px/1.4 var(--f-read); }
#descent[data-style="station"] .hud .k { font: 700 15px/1.3 var(--f-display); letter-spacing: 0.1em; }
#descent[data-style="station"] .hud .k::before { border-radius: 0; }
#descent[data-style="station"] .views button, #descent[data-style="station"] .btn, #descent[data-style="station"] .primary { font: 600 14px/1 var(--f-display); letter-spacing: 0.08em; }
#descent[data-style="station"] .primary { background: var(--signal); color: #12080a; }
#descent[data-style="station"] .stats dt, #descent[data-style="station"] .tele dt { font: 600 12.5px/1.3 var(--f-display); letter-spacing: 0.08em; }
#descent[data-style="station"] .stats dd, #descent[data-style="station"] .tele dd, #descent[data-style="station"] .clock, #descent[data-style="station"] .hud-row, #descent[data-style="station"] .scale, #descent[data-style="station"] .facts { font-family: var(--f-body); font-variant-numeric: tabular-nums; }
#descent[data-style="station"] .drawer { background: rgba(12, 19, 26, 0.96); border-left: 3px solid var(--signal); }
#descent[data-style="station"] .drawer-head h3 { font: 700 34px/1 var(--f-display); letter-spacing: 0.02em; text-transform: uppercase; }
#descent[data-style="station"] footer { font: 400 13px/1.4 var(--f-body); }
#descent[data-style="station"] .door { background: var(--console); }
#descent[data-style="station"] .oe { display: inline; }   /* plain text here, so the face's own kerning holds */
#descent[data-style="station"] .door span { font: 700 clamp(48px, 10vw, 150px)/1 var(--f-display); letter-spacing: 0.02em; text-transform: uppercase; }
`;

export const DESCENT_BODY = String.raw`
<script>(function () { var s = new URLSearchParams(location.search).get("style"); document.getElementById("descent").dataset.style = s === "station" ? "station" : "polar"; })();</script>
<div class="cover" id="cover" aria-hidden="true"><div class="door up"><span>__HI__</span></div><div class="door down"><span>__HI__</span></div></div>
<canvas id="field" aria-hidden="true"></canvas>
<canvas id="cube" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none"></canvas>
<canvas id="overlay" aria-hidden="true"></canvas>
<div class="fade" aria-hidden="true"></div>

<div class="top">
  <a class="mark" href="#top">freider.space</a>
  <a class="chip" id="langBtn" href="/no" hreflang="nb">Norsk</a>
</div>

<aside class="side" id="side" aria-label="What you are passing">
  <ol class="route" id="route" aria-label="Stops"></ol>
  <section class="card" id="card">
    <h4 id="cardTitle"></h4>
    <p class="cdesc" id="cardDesc"></p>
    <p id="live" aria-live="polite" hidden></p>
    <canvas id="cardMap" hidden></canvas>
    <div class="views" id="views" hidden><div id="viewBtns" role="group" aria-label="View" style="display:flex;flex-wrap:wrap;gap:4px"></div></div>
    <dl id="cardRows"></dl>
    <p class="foot" id="cardFoot"></p>
  </section>
</aside>
<div class="tip" id="tip" role="status"></div>

<main>
  <section class="hero" id="top" data-stop="0">
    <div class="col">
      <h1 class="name">Freider<br>Fl<span class="oe"><span class="oe-t">ø</span><svg class="oe-s" viewBox="-50 -50 100 100" aria-hidden="true"><ellipse class="oe-ring" cx="0" cy="0" rx="34" ry="29" transform="rotate(29.6)"/><line class="oe-slash" x1="-30" y1="40" x2="30" y2="-40"/><circle class="oe-sat" id="oeSat" cx="34" cy="0" r="8"/></svg></span>an</h1>
      <div class="who">
        <img src="/descent/portrait.jpg" alt="Freider Fløan" width="420" height="420">
        <p class="tagline" data-t="tagline"></p>
      </div>
      <div class="links">
        <a href="https://www.linkedin.com/in/freider/" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://github.com/ffreider" target="_blank" rel="noopener">GitHub</a>
        <a href="https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB" target="_blank" rel="noopener">Spacepodden</a>
      </div>
      <p class="hint" data-t="hint"></p>
    </div>
  </section>

  <section class="band" data-stop="1">
    <div class="col">
      <h2 data-t="about"></h2>
      <p class="bio" data-t="bio"></p>
    </div>
  </section>

  <section class="band long" data-stop="2">
    <div class="col">
      <h2 data-t="experience"></h2>
      <div class="chart-wrap"><figure class="chart" id="chart"></figure></div>
      <ul class="roles" id="roles"></ul>
    </div>
  </section>

  <section class="band" data-stop="3">
    <div class="col">
      <p class="meta" data-t="featured" style="margin-bottom:14px"></p>
      <a class="article" href="https://trondheim.com/journal/the-extracurricular-that-left-earth" target="_blank" rel="noopener">
        <img src="/descent/article.jpg" alt="Freider Fløan, photographed for Trondheim.com" width="1000" height="600">
        <p class="src">trondheim.com</p>
        <h3>The extracurricular that left Earth</h3>
        <p class="meta" data-t="articleMeta"></p>
        <p data-t="articleSummary"></p>
        <p class="byline" data-t="articleByline"></p>
        <span class="cta" data-t="articleCta"></span>
      </a>
    </div>
  </section>

  <section class="band" data-stop="4">
    <div class="col">
      <h2 data-t="education"></h2>
      <ul class="degrees" id="degrees"></ul>
      <p class="finishing" data-t="finishing"></p>
    </div>
  </section>

  <section class="arrival" id="framsat" data-stop="5">
    <div class="col">
      <h2 data-t="joining"></h2>
      <p class="bio" data-h="whyHtml"></p>
    </div>
  </section>
</main>
<footer><p data-t="privacy"></p></footer>

<div class="hud" id="hud">
  <p class="k" data-t="liveTag"></p>
  <h2 data-t="riding"></h2>
  <p class="why" data-h="whyHtml"></p>
  <div class="hud-actions">
    <button class="primary" id="openTracker" type="button" data-t="openTracker"></button>
    <p class="hint" data-t="lookHint"></p>
  </div>
</div>

<aside class="drawer" id="drawer" aria-label="FramSat-1 tracker" aria-hidden="true">
  <div class="drawer-head"><h3>FramSat-1</h3><button class="btn" id="closeTracker" type="button" data-t="close"></button></div>
  <div class="globe-wrap">
    <canvas id="globe" aria-label="Globe showing FramSat-1's position and ground track. Drag to turn it."></canvas>
    <div class="globe-tools"><button class="btn" id="followBtn" type="button" aria-pressed="true" data-t="follow"></button></div>
  </div>
  <div class="time">
    <div class="time-row">
      <span class="clock" id="clock"></span>
      <button class="btn" id="nowBtn" type="button" data-t="now"></button>
      <button class="btn" id="x60" type="button" aria-pressed="false">60×</button>
      <button class="btn" id="x600" type="button" aria-pressed="false">600×</button>
    </div>
    <input type="range" id="scrub" min="-720" max="1440" step="1" value="0" aria-label="Time offset in minutes">
    <div class="scale"><span>−12 h</span><span class="mid" data-t="nowShort"></span><span>+24 h</span></div>
  </div>
  <dl class="tele">
    <div><dt data-t="lat"></dt><dd id="tLat">–</dd></div>
    <div><dt data-t="lon"></dt><dd id="tLon">–</dd></div>
    <div><dt data-t="alt"></dt><dd id="tAlt">–</dd></div>
    <div><dt data-t="speed"></dt><dd id="tSpd">–</dd></div>
    <div><dt data-t="elev"></dt><dd id="tEl">–</dd></div>
    <div><dt data-t="doppler"></dt><dd id="tDop">–</dd></div>
  </dl>
  <p class="pass" id="pass"></p>
  <p class="facts" id="facts"></p>
  <p class="note" data-t="computed"></p>
  <div class="fs-foot"><span data-t="moreTracker"></span><a id="trackerLink" href="/framsat" target="_blank" rel="noopener" data-t="tracker"></a></div>
</aside>
`;
