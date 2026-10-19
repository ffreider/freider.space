"use client";

import styles from "./space.module.css";

// One measurement of the page per frame, shared by everything that follows
// the scroll: the story date, what covers the globe, the progress rail and
// the maps. One passive listener and one animation frame; every
// getBoundingClientRect is read first, then each subscriber is called, so
// whatever they write to the DOM can't force a second layout in the same
// frame. The story's markup (story.tsx) is the contract:
//   [data-beat]         a beat's section, whose last child is its text block
//   [data-act]          an act card
//   [data-cold-open]    the cold open
// and a beat's media that hides the globe behind it (a photo, a number, a
// comparison, a map) is a direct child of the section with the `bleed` class,
// other than the sound button and the act cards, which are see-through.

export type Box = { top: number; bottom: number; height: number };
export type Frame = {
  mid: number; // the middle of the screen
  height: number; // the screen's height
  beats: Box[]; // each beat's whole section, media included
  texts: Box[]; // each beat's text block alone
  acts: Box[];
  cold: Box | null;
  opaque: Box[]; // media blocks that hide the globe
  rects: Map<Element, Box>; // whatever else a subscriber asked to have measured
};

type Listener = (frame: Frame) => void;
type Lists = { beats: HTMLElement[]; texts: Element[]; acts: HTMLElement[]; cold: HTMLElement | null; opaque: Element[] };

const listeners = new Map<Listener, Element[]>();
let lists: Lists | null = null;
let frame = 0;
let fresh: Frame | null = null;
let attached = false;

const box = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, height: r.height };
};

function find(): Lists {
  const beats = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"));
  const sound = `.${CSS.escape(styles.sound)}`;
  const opaque: Element[] = [];
  for (const b of beats) {
    for (const child of b.children) {
      if (child.classList.contains(styles.bleed) && !child.querySelector(sound)) opaque.push(child);
    }
  }
  return {
    beats,
    texts: beats.map((b) => b.lastElementChild ?? b),
    acts: Array.from(document.querySelectorAll<HTMLElement>("[data-act]")),
    cold: document.querySelector<HTMLElement>("[data-cold-open]"),
    opaque,
  };
}

function measure(): Frame {
  lists ??= find();
  const rects = new Map<Element, Box>();
  for (const els of listeners.values()) for (const el of els) if (!rects.has(el)) rects.set(el, box(el));
  const f: Frame = {
    mid: innerHeight / 2,
    height: innerHeight,
    beats: lists.beats.map(box),
    texts: lists.texts.map(box),
    acts: lists.acts.map(box),
    cold: lists.cold ? box(lists.cold) : null,
    opaque: lists.opaque.map(box),
    rects,
  };
  fresh = f;
  queueMicrotask(() => {
    if (fresh === f) fresh = null;
  });
  return f;
}

function run() {
  frame = 0;
  const f = measure();
  for (const l of Array.from(listeners.keys())) l(f);
}

// Ask for a measurement on the next frame.
export function request() {
  if (!frame && listeners.size) frame = requestAnimationFrame(run);
}

const onResize = () => {
  lists = null;
  request();
};

// Call `listener` now and on every frame the page may have moved. Elements
// named here are measured with the rest and handed over in `rects`.
export function subscribe(listener: Listener, watch: Element[] = []): () => void {
  listeners.set(listener, watch);
  if (!attached) {
    attached = true;
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", onResize);
  }
  // Subscribers that mount together share one measurement.
  let f = fresh;
  if (!f || watch.some((el) => !f!.rects.has(el))) f = measure();
  listener(f);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      cancelAnimationFrame(frame);
      frame = 0;
      removeEventListener("scroll", request);
      removeEventListener("resize", onResize);
      attached = false;
      lists = null;
    }
  };
}
