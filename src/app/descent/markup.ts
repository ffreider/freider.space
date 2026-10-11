// The page markup and styles of the descent, from the redesign's
// page.template.html. It's rendered as plain HTML (not JSX) so the descent
// scripts in public/descent can drive it as they do in the standalone page.
// The styles sit inside the page rather than in globals.css, so they only
// apply while the descent is on screen.

export const DESCENT_CSS = String.raw`
/* Layout: a guided descent from the Moon to FramSat-1. Rendered Earth and Moon fill the screen; content sits on a polar-night haze on the left; a short route list on the right names each stop.
   Text layer: one family, Schibsted Grotesk (drawn for the Norwegian media group Schibsted), hierarchy by size and weight, sentence case, tabular figures for numbers. One accent, the amber the descent uses for FramSat-1. Corners: panels 12px, media inside them 8px, buttons fully round. */
:root {
  --void: #000000;
  --haze: 10, 18, 32;                       /* polar night, as r, g, b for the haze's alpha steps */
  --ink: #eef2f5;
  --ink-2: rgba(238, 242, 245, 0.78);
  --ink-3: #93a4b4;
  --ink-4: rgba(147, 164, 180, 0.6);
  --rule: rgba(147, 164, 180, 0.2);
  --fs: #ffb547;
  --panel: rgba(var(--haze), 0.6);
  --f-display: var(--font-schibsted), "Helvetica Neue", Arial, sans-serif;
  --f-body: var(--font-schibsted), "Helvetica Neue", Arial, sans-serif;
  --f-data: var(--font-schibsted), "Helvetica Neue", Arial, sans-serif;
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
.fade { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(90deg, rgba(var(--haze), .88) 0%, rgba(var(--haze), .6) 30%, rgba(var(--haze), 0) 58%); transition: opacity .6s; }
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
  background: var(--panel); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-radius: 12px;
}
.card h4 { margin: 0; display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font: 600 16px/1.3 var(--f-body); color: var(--ink); }
.card h4 .lv { color: var(--fs); display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
.card h4 .lv::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.card .cdesc { margin: 0; font: 400 14px/1.5 var(--f-body); color: var(--ink-2); }
.card #live { margin: 0; font: 500 15px/1.45 var(--f-body); color: var(--ink); }
#cardMap { display: block; width: 100%; aspect-ratio: 2 / 1; height: auto; border-radius: 8px; }
.card dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 5px 14px; }
.card dt { font: 400 13px/1.35 var(--f-data); color: var(--ink-3); }
.card dd { margin: 0; font: 500 14px/1.35 var(--f-data); color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
/* the card, short by default: one standout number, a few rows, the rest on request */
.stat { display: grid; gap: 2px; }
.stat:empty { display: none; }
.stat-v { font: 700 30px/1.05 var(--f-display); letter-spacing: -0.02em; color: var(--ink); }
.stat-k { font: 400 13px/1.3 var(--f-body); color: var(--ink-3); }
.card dl.more { padding-top: 8px; border-top: 1px solid var(--rule); }
.more-btn { justify-self: start; font: 500 13.5px/1 var(--f-body); color: var(--ink-2); background: none; border: 1px solid var(--rule); border-radius: 999px; padding: 8px 12px; cursor: pointer; }
.more-btn:hover { color: var(--ink); border-color: var(--ink-3); }
.card .foot { margin: 0; font: 400 12.5px/1.45 var(--f-data); color: var(--ink-3); }
.tip {
  position: fixed; z-index: 7; left: 0; top: 0; max-width: 340px; pointer-events: none; padding: 12px 14px;
  background: rgba(var(--haze), .92); border-radius: 12px; font: 400 14px/1.45 var(--f-data); color: var(--ink-2);
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
.top::before { content: ""; position: absolute; z-index: -1; left: calc(-1 * var(--gutter)); right: calc(-1 * var(--gutter)); top: calc(-16px - env(safe-area-inset-top, 0px)); height: calc(84px + env(safe-area-inset-top, 0px)); background: linear-gradient(rgba(var(--haze), .92) 40%, rgba(var(--haze), 0)); }
.mark { font: 600 15px/1 var(--f-body); color: var(--ink); pointer-events: auto; text-decoration: none; }
/* the other language: a plain link, like the rest */
.chip { pointer-events: auto; font: 500 15px/1 var(--f-body); color: var(--ink-2); padding: 8px 0; text-decoration: none; }
.chip:hover { color: var(--ink); }

/* route */
.route { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; transition: opacity .5s; }
.route button { all: unset; cursor: pointer; display: flex; gap: 10px; align-items: center; padding: 4px 0; text-align: left; width: 100%; }
.route .txt { display: flex; justify-content: space-between; gap: 10px; flex: 1; }
.route button:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.route .pip { flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--ink-3); transition: background .3s, border-color .3s; }
.route .nm { font: 500 14.5px/1.2 var(--f-data); color: var(--ink-3); transition: color .3s; white-space: nowrap; }
.route .km { font: 400 12.5px/1.3 var(--f-data); color: var(--ink-4); font-variant-numeric: tabular-nums; }
.route li.on .pip { background: var(--ink); border-color: var(--ink); }
.route li.on .nm { color: var(--ink); }
.route li.on .km { color: var(--ink-2); }
.route li.fs.on .pip { background: var(--fs); border-color: var(--fs); }
body.riding .route { display: none; }

main { position: relative; z-index: 2; }
section { padding-inline: var(--gutter); }
.col { max-width: 600px; }
@media (min-width: 901px) { main .col { max-width: min(600px, calc(100vw - min(340px, 32vw) - 3 * var(--gutter))); } }
.stop { font: 500 13px/1.5 var(--f-data); color: var(--ink-3); margin: 0 0 22px; max-width: 54ch; }
.stop b { color: var(--ink); font-weight: 500; display: block; margin-bottom: 4px; }
h2 { font-family: var(--f-display); font-weight: 800; font-size: clamp(40px, 5.2vw, 68px); line-height: .94; letter-spacing: -0.03em; margin: 0 0 22px; }
p { margin: 0; }

.hero { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding-block: 110px 80px; }
.name { font-family: var(--f-display); font-weight: 800; font-size: clamp(68px, 11vw, 176px); line-height: .86; letter-spacing: -0.045em; margin: 0 0 28px; }
.who { display: flex; gap: 18px; align-items: center; margin-bottom: 18px; }
.who img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.tagline { font-size: clamp(20px, 2vw, 25px); line-height: 1.35; font-weight: 500; max-width: 26ch; }
.links { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; font: 500 16px/1 var(--f-body); }
.hint { margin-top: 48px; font: 400 15px/1.5 var(--f-body); color: var(--ink-3); max-width: 40ch; }

.band { min-height: 140vh; display: flex; flex-direction: column; justify-content: center; padding-block: 25vh; }
.band.long { min-height: 0; padding-block: 35vh 45vh; }
.bio { font-size: clamp(19px, 1.8vw, 22px); line-height: 1.6; color: var(--ink-2); max-width: 36em; }

.chart-wrap { overflow-x: auto; margin: 0 -4px 10px; padding: 26px 4px 30px; }
.chart { position: relative; min-width: 560px; margin: 0; }
.chart .grid { position: absolute; inset: 0; pointer-events: none; }
.chart .yr { position: absolute; top: 0; bottom: 0; border-left: 1px solid rgba(241,241,238,.09); }
.chart .yr span { position: absolute; bottom: -22px; left: 4px; font: 400 12px/1 var(--f-data); color: var(--ink-3); font-variant-numeric: tabular-nums; }
.chart .nowline { position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--ink-3); }
.chart .nowline span { position: absolute; top: -20px; transform: translateX(-50%); font: 500 12px/1 var(--f-data); color: var(--fs); }
.chart ol { list-style: none; margin: 0; padding: 0; position: relative; }
.chart li { position: relative; height: 22px; }
.seg { position: absolute; top: 50%; height: 2px; transform: translateY(-50%); background: var(--ink) !important; }
.seg.past { opacity: .35; } .seg.past.ongoing { opacity: .55; }
.chart li:hover .seg.past { opacity: 1; }
.tick { position: absolute; top: 50%; width: 1px; height: 8px; transform: translateY(-50%); background: var(--ink-2); }
.dot { position: absolute; top: 50%; width: 5px; height: 5px; border-radius: 50%; transform: translate(-50%, -50%); background: var(--ink-2); }
.lab { position: absolute; top: 50%; transform: translateY(-50%); font: 400 12.5px/1 var(--f-data); color: var(--ink-2); white-space: nowrap; }
.roles { list-style: none; margin: 10px 0 0; padding: 0; display: grid; }
.roles > li { padding-block: 18px; border-top: 1px solid var(--rule); min-width: 0; }
.org { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.org strong { font-weight: 700; font-size: 19px; }
.when { font: 400 14px/1.4 var(--f-data); color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.desc { color: var(--ink-3); font-size: 15.5px; margin-top: 4px; }
.role-one { color: var(--ink-2); font-size: 16.5px; margin-top: 2px; }
.sub { list-style: none; margin: 10px 0 0; padding: 0 0 0 14px; border-left: 1px solid var(--rule); display: grid; gap: 8px; }
.sub li { font-size: 16px; color: var(--ink-2); }
.sub .row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.sub .note { color: var(--ink-3); font-size: 15px; display: block; }

.article { display: grid; gap: 12px; text-decoration: none; background: var(--panel); border-radius: 12px; overflow: hidden; padding: 0 0 22px; max-width: 480px; }
.article > *:not(img) { margin-inline: 20px; }
.article img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; object-position: 50% 30%; display: block; margin-bottom: 4px; }
.article .src { font: 500 14px/1 var(--f-body); color: var(--ink-3); }
.article:hover { background: rgba(var(--haze), .75); }
.article h3 { font-family: var(--f-display); font-weight: 800; letter-spacing: -0.02em; font-size: clamp(24px, 2.4vw, 32px); line-height: 1.08; margin-block: 0; overflow-wrap: break-word; text-wrap: balance; }
.article:hover h3 { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; }
.article .meta { font: 400 14px/1.5 var(--f-data); color: var(--ink-3); }
.article .byline { font-size: 14px; color: var(--ink-3); }
.article .cta { font: 600 15px/1 var(--f-body); color: var(--fs); }
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
.hud .k { display: flex; gap: 10px; align-items: center; font: 500 13px/1.3 var(--f-data); color: var(--fs); }
.hud .k::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
@keyframes pulse { 50% { opacity: .25; } }
.hud h2 { font-size: clamp(30px, 3.6vw, 46px); margin: 0; }
.hud .why a, .bio a { color: var(--ink); text-decoration-color: var(--fs); }
.hud .why { font-size: 16px; line-height: 1.55; color: var(--ink-2); max-width: 52ch; }
/* the sign-off: the last thing on the page */
.hud .sign { font-size: 16px; line-height: 1.55; color: var(--ink); max-width: 52ch; padding-top: 12px; border-top: 1px solid var(--rule); }
.hud .sign a { text-decoration-color: var(--fs); }
/* at the end the panel sits over the footer, so the privacy note moves into it */
.hud .fine { font-size: 13px; line-height: 1.5; color: var(--ink-3); max-width: 60ch; }
body.live-lock footer { visibility: hidden; }
.stats { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 16px; padding: 12px 0; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.stats dt { font: 400 11.5px/1.3 var(--f-data); color: var(--ink-3); }
.stats dd { margin: 2px 0 0; font: 500 15px/1.3 var(--f-data); color: var(--ink); font-variant-numeric: tabular-nums; }
.views { display: flex; flex-wrap: wrap; gap: 4px; }
.views button { font: 500 13.5px/1 var(--f-body); color: var(--ink-2); background: var(--panel); border: 1px solid var(--rule); border-radius: 999px; padding: 8px 12px; cursor: pointer; }
.views button:hover { color: var(--ink); }
.views button[aria-pressed="true"] { color: #140b00; background: var(--ink); border-color: var(--ink); }
.live { font-size: 18px; line-height: 1.45; min-height: 3em; color: var(--ink); text-shadow: 0 1px 12px rgba(0,0,0,.8); }
.hud-row { display: flex; flex-wrap: wrap; gap: 6px 18px; font: 500 15px/1.3 var(--f-data); color: var(--ink-2); font-variant-numeric: tabular-nums; }
.hud-actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
.hud-actions .hint { margin: 0; }
.primary { font: 600 15px/1 var(--f-body); color: #1a0f00; background: var(--fs); border: 0; border-radius: 999px; padding: 14px 20px; cursor: pointer; }
.primary:hover { background: #ffc875; }

/* tracker drawer */
.drawer {
  position: fixed; z-index: 8; top: 0; right: 0; bottom: 0; width: min(560px, 100vw);
  background: rgba(var(--haze), .95); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border-left: 1px solid var(--rule);
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
.clock { font: 500 15.5px/1 var(--f-data); font-variant-numeric: tabular-nums; margin-right: auto; }
.btn { font: 500 13.5px/1 var(--f-body); color: var(--ink-2); background: transparent; border: 1px solid var(--rule); border-radius: 999px; padding: 8px 12px; cursor: pointer; }
.btn:hover { color: var(--ink); border-color: var(--ink-3); }
.btn[aria-pressed="true"] { color: var(--fs); border-color: var(--fs); }
input[type="range"] { width: 100%; accent-color: var(--fs); }
.scale { position: relative; display: flex; justify-content: space-between; font: 400 12px/1 var(--f-data); color: var(--ink-3); }
.scale .mid { position: absolute; left: 33.33%; transform: translateX(-50%); }
.tele { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; margin: 0; }
.tele dt { font: 500 12px/1.3 var(--f-data); color: var(--ink-3); }
.tele dd { margin: 3px 0 0; font: 500 18px/1.3 var(--f-data); font-variant-numeric: tabular-nums; }
.tele dd small { font-size: 11px; color: var(--ink-3); font-weight: 400; }
.pass { font-size: 15px; color: var(--ink-2); border-top: 1px solid var(--rule); padding-top: 14px; }
.facts { display: flex; flex-wrap: wrap; gap: 4px 14px; font: 400 13px/1.5 var(--f-data); color: var(--ink-3); }
.note { font-size: 13.5px; color: var(--ink-3); }
.fs-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; font-size: 13.5px; color: var(--ink-3); }
.fs-foot a { font: 500 14px/1 var(--f-data); color: var(--fs); }
footer { position: relative; z-index: 2; padding: 0 var(--gutter) calc(20px + env(safe-area-inset-bottom, 0px)); color: var(--ink-3); font-size: 13px; line-height: 1.5; }
footer p { max-width: 60ch; }

.sheet-btn { display: none; }
/* Phones: the scene is a window across the top of the screen and the page
   scrolls on below it, so text never sits on the pictures. The card shrinks
   to one line at the window's foot and opens as a sheet. */
@media (max-width: 900px) {
  :root { --scene: 46svh; }
  body { background: rgb(var(--haze)); }
  #field, #overlay, #cube { height: var(--scene) !important; }
  #field { z-index: 3; }
  #overlay { z-index: 4; }
  #cube { z-index: 5 !important; }
  /* the window's lower edge: text scrolling up fades out under it */
  .fade, body.live-lock .fade { opacity: 1; inset: auto 0; top: calc(var(--scene) - 1px); height: 36px; z-index: 5; background: linear-gradient(rgb(var(--haze)), rgba(var(--haze), 0)); }
  .top { z-index: 7; }
  .top::before { background: linear-gradient(rgba(0, 0, 0, .75) 30%, rgba(0, 0, 0, 0)); }
  main { z-index: 1; }
  .hero { justify-content: flex-start; padding-block: calc(var(--scene) + 28px) 48px; }
  .name { font-size: clamp(52px, 15vw, 96px); margin-bottom: 22px; }
  .hint { margin-top: 28px; }
  .band, .band.long { min-height: 0; padding-block: 10svh 26svh; }
  .arrival { padding-block: 10svh 0; }
  h2 { font-size: clamp(36px, 10vw, 56px); }

  .side { left: var(--gutter); right: var(--gutter); width: auto; top: auto; bottom: calc(100svh - var(--scene) + 12px); z-index: 6; }
  .route { display: none; }
  body.riding .side { display: none; }
  .card { position: relative; margin: 0; padding: 11px 14px; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 14px; background: rgba(var(--haze), .78); }
  .card > * { grid-column: 1 / -1; }
  .card h4 { grid-column: 1; font-size: 15px; justify-content: flex-start; }
  .card h4 > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card .stat { grid-column: 2; }
  .side:not(.open) .card > :not(h4):not(.stat):not(.sheet-btn) { display: none !important; }
  .side:not(.open) .stat-k { display: none; }
  .side:not(.open) .stat-v { font-size: 17px; letter-spacing: -0.01em; }
  /* the whole one-line card is the button that opens it */
  .side:not(.open) .sheet-btn { display: block; position: absolute; inset: 0; opacity: 0; cursor: pointer; border: 0; border-radius: 12px; }
  .side:not(.open) .sheet-btn:focus-visible { opacity: 1; background: none; color: transparent; outline: 1px solid var(--ink); }
  .side.open { left: 0; right: 0; bottom: 0; z-index: 9; }
  .side.open .card { max-height: 74svh; padding: 18px var(--gutter) calc(18px + env(safe-area-inset-bottom, 0px)); gap: 12px 14px; border-radius: 16px 16px 0 0; background: rgba(var(--haze), .97); box-shadow: 0 -12px 40px rgba(0, 0, 0, .5); }
  .side.open .card h4 { font-size: 17px; }
  .side.open .card .stat { grid-column: 1 / -1; }
  .side.open .sheet-btn { display: block; order: 99; justify-self: start; font: 500 14px/1 var(--f-body); color: var(--ink); background: none; border: 1px solid var(--rule); border-radius: 999px; padding: 10px 16px; cursor: pointer; }

  .hud { width: auto; right: var(--gutter); max-height: calc(100svh - var(--scene) - 36px); }
}
@media (prefers-reduced-motion: reduce) { .drawer, .hud { transition: none; } .hud .k::before { animation: none; } }
/* The cover: a black screen that says hi while the scene loads, then opens
   like two doors, splitting the greeting across the seam (main.js adds .open
   when the first maps are in). Only transforms, so it costs next to nothing.
   Without JavaScript it steps aside on its own after a few seconds. */
.cover { position: fixed; inset: 0; z-index: 20; pointer-events: none; animation: cover-gone 0s 6s forwards; }
.door { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; background: rgb(var(--haze)); transition: transform .9s cubic-bezier(.7, 0, .2, 1); }
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
main, footer { text-shadow: none; }`;

export const DESCENT_BODY = String.raw`
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
    <p id="live" hidden></p>
    <canvas id="cardMap" hidden></canvas>
    <div class="views" id="views" hidden><div id="viewBtns" role="group" aria-label="View" style="display:flex;flex-wrap:wrap;gap:4px"></div></div>
    <div class="stat" id="cardStat"></div>
    <dl id="cardRows"></dl>
    <dl id="cardMoreRows" class="more" hidden></dl>
    <button class="more-btn" id="cardMore" type="button" aria-expanded="false" aria-controls="cardMoreRows" hidden></button>
    <p class="foot" id="cardFoot"></p>
    <button class="sheet-btn" id="cardSheet" type="button" aria-expanded="false" aria-controls="card"></button>
  </section>
</aside>
<div class="tip" id="tip" role="status"></div>

<main>
  <section class="hero" id="top" data-stop="0">
    <div class="col">
      <h1 class="name">Freider<br>Fløan</h1>
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
  <p class="sign" data-h="signHtml"></p>
  <div class="hud-actions">
    <button class="primary" id="openTracker" type="button" data-t="openTracker"></button>
    <p class="hint" data-t="lookHint"></p>
  </div>
  <p class="fine" data-t="privacy"></p>
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
