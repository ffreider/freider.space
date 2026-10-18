"use client";

import { useEffect, useRef, useState } from "react";
import type { SpaceObject } from "@/lib/space/catalogue";
import { elements, positionAt } from "@/lib/space/orbits";
import { DOTS_FRAG, DOTS_VERT, EARTH_FRAG, EARTH_VERT, HALO_FRAG } from "./shaders";
import styles from "./space.module.css";

// The globe behind the story: Earth, and every catalogued object that is in
// orbit on the story day, moving along its orbit. The camera stays fixed
// to the ground and turns to each beat's place; the orbits turn under it as
// the Earth spins, sped up so low orbits visibly race and geostationary
// ones hang still. With reduced motion nothing moves.

const RE = 6378.137; // km
const SPEED = 60; // story seconds per second on screen
const SPIN = 7.2921159e-5; // Earth's rotation, rad/s
// Camera distance in Earth radii: close while everything is in low orbit,
// far enough for geostationary orbit (6.6) once Syncom 2 is up.
const NEAR = 7;
const FAR = 17;
const WIDE_FROM = 2121; // 26 July 1963, days since Sputnik
const NEVER = 1e9; // decay day for objects still up
const rad = (deg: number) => (deg * Math.PI) / 180;

type Place = { lat: number; lon: number };
type Props = { objs: SpaceObject[] | null; day: number; focus?: Place; highlight?: number[] };

// Unit vector toward a place on the ground, in the scene's axes.
const toward = (lat: number, lon: number) => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.sin(rad(lat)), -Math.cos(rad(lat)) * Math.sin(rad(lon))];

// The sun's declination on a story day (days since 4 October 1957).
function declination(day: number) {
  const d = day - 15429.5; // days from J2000
  const g = rad(357.529 + 0.98560028 * d);
  const L = rad(280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  return Math.asin(Math.sin(rad(23.439)) * Math.sin(L)) * (180 / Math.PI);
}

export function Globe({ objs, day, focus, highlight }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const want = useRef({ day, focus, highlight });
  useEffect(() => {
    want.current = { day, focus, highlight };
  });
  const [engine, setEngine] = useState<{ setObjects(objs: SpaceObject[]): void; setHighlight(ids: number[]): void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop = () => {};
    let dead = false;
    (async () => {
      if (new URLSearchParams(location.search).has("nogl")) return setFailed(true);
      const THREE = await import("three");
      const el = host.current;
      if (dead || !el) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        setFailed(true);
        return;
      }
      const px = Math.min(devicePixelRatio || 1, 2);
      renderer.setPixelRatio(px);
      renderer.setClearColor(0x000000, 0);
      el.append(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)");

      // Earth and its glow.
      const tex = new THREE.TextureLoader();
      const sun = new THREE.Vector3(1, 0, 0);
      const earthMat = new THREE.ShaderMaterial({
        uniforms: { tDay: { value: tex.load("/descent/tex/earth-day-2k.webp") }, tNight: { value: tex.load("/descent/tex/earth-night-2k.webp") }, uSun: { value: sun } },
        vertexShader: EARTH_VERT,
        fragmentShader: EARTH_FRAG,
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMat));
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.06, 64, 48),
        new THREE.ShaderMaterial({ uniforms: { uSun: { value: sun } }, vertexShader: EARTH_VERT, fragmentShader: HALO_FRAG, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      );
      scene.add(halo);

      // The objects turn with the stars; the camera turns with the ground.
      const sky = new THREE.Group();
      scene.add(sky);
      const dotUniforms = (scale: number, ring: number) => ({ uTime: { value: 0 }, uDay: { value: 0 }, uPx: { value: px }, uScale: { value: scale }, uRing: { value: ring } });
      const dotMaterial = (scale: number, ring: number) =>
        new THREE.ShaderMaterial({ uniforms: dotUniforms(scale, ring), vertexShader: DOTS_VERT, fragmentShader: DOTS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const dotsMat = dotMaterial(1, 0);
      const ringMat = dotMaterial(5, 1);

      // three.js is untyped here (src/types/three.d.ts); these are the parts used.
      type Drawn = { geometry: { dispose(): void }; visible: boolean };
      let all: SpaceObject[] = [];
      let dots: Drawn | null = null;
      let rings: Drawn | null = null;
      const lines: { line: Drawn; launch: number; decay: number }[] = [];

      const pointsFor = (list: SpaceObject[], mat: unknown): Drawn => {
        const n = list.length;
        const orbA = new Float32Array(n * 4), orbB = new Float32Array(n * 4), life = new Float32Array(n * 2);
        list.forEach((o, k) => {
          const el = elements(o);
          orbA.set([el.a / RE, el.e, el.i, el.raan], k * 4);
          orbB.set([el.argp, el.m0, el.n, o.kind], k * 4);
          life.set([o.launchDay, o.decayDay ?? NEVER], k * 2);
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        g.setAttribute("orbA", new THREE.BufferAttribute(orbA, 4));
        g.setAttribute("orbB", new THREE.BufferAttribute(orbB, 4));
        g.setAttribute("life", new THREE.BufferAttribute(life, 2));
        const p = new THREE.Points(g, mat);
        p.frustumCulled = false;
        return p;
      };

      const api = {
        setObjects(list: SpaceObject[]) {
          all = list;
          if (dots) {
            sky.remove(dots);
            dots.geometry.dispose();
          }
          dots = pointsFor(list, dotsMat);
          sky.add(dots);
        },
        setHighlight(ids: number[]) {
          if (rings) {
            sky.remove(rings);
            rings.geometry.dispose();
          }
          for (const l of lines.splice(0)) {
            sky.remove(l.line);
            l.line.geometry.dispose();
          }
          const pick = new Set(ids);
          const list = all.filter((o) => pick.has(o.norad));
          if (!list.length) {
            rings = null;
            return;
          }
          rings = pointsFor(list, ringMat);
          sky.add(rings);
          // Each named object's orbit, drawn once round.
          const lineMat = new THREE.LineBasicMaterial({ color: 0xa9d6ff, transparent: true, opacity: list.length > 8 ? 0.12 : 0.35, depthWrite: false });
          for (const o of list) {
            const T = o.periodMin > 0 ? o.periodMin * 60 : (2 * Math.PI) / elements(o).n;
            const pts: number[] = [];
            for (let k = 0; k <= 180; k++) {
              const [x, y, z] = positionAt(o, (k / 180) * T);
              pts.push(x / RE, z / RE, -y / RE);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
            const line = new THREE.Line(g, lineMat);
            sky.add(line);
            lines.push({ line, launch: o.launchDay, decay: o.decayDay ?? NEVER });
          }
        },
      };

      // Size, with the globe set to the right of the text on wide screens.
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        if (w >= 900) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      };
      const watch = new ResizeObserver(resize);
      watch.observe(el);
      resize();

      // The camera's place above the ground, eased toward each beat's focus.
      const look = { lat: 20, lon: 40, distance: NEAR };
      let simTime = 0;
      let last = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!reduce.matches) simTime += dt * SPEED;

        const { day: d, focus: f } = want.current;
        if (f) {
          const target = { lat: 8 + f.lat * 0.6, lon: f.lon };
          const k = reduce.matches ? 1 : 1 - Math.exp(-dt * 1.6);
          let dl = target.lon - look.lon;
          dl = ((dl + 540) % 360) - 180;
          look.lat += (target.lat - look.lat) * k;
          look.lon += dl * k;
        }
        const far = d >= WIDE_FROM ? FAR : NEAR;
        look.distance += (far - look.distance) * (reduce.matches ? 1 : 1 - Math.exp(-dt * 1.2));
        const [cx, cy, cz] = toward(look.lat, look.lon);
        camera.position.set(cx * look.distance, cy * look.distance, cz * look.distance);
        camera.lookAt(0, 0, 0);

        // Earth spins under the orbits; the sun keeps to the afternoon side
        // of the view at the season's declination.
        const spin = simTime * SPIN;
        sky.rotation.y = -spin;
        const [sx, sy, sz] = toward(declination(d), look.lon + 35 - (spin * 180) / Math.PI);
        sun.set(sx, sy, sz);

        for (const m of [dotsMat, ringMat]) {
          m.uniforms.uTime.value = simTime;
          m.uniforms.uDay.value = d;
        }
        for (const l of lines) l.line.visible = l.launch <= d && d < l.decay;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);
      setEngine(api);

      stop = () => {
        cancelAnimationFrame(frame);
        watch.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setFailed(true));
    return () => {
      dead = true;
      stop();
    };
  }, []);

  useEffect(() => {
    if (engine && objs) engine.setObjects(objs);
  }, [engine, objs]);

  const ids = (highlight ?? []).join(",");
  useEffect(() => {
    if (engine && objs) engine.setHighlight(ids ? ids.split(",").map(Number) : []);
  }, [engine, objs, ids]);

  return (
    <div ref={host} className={styles.globe}>
      {failed && <p className={styles.fallback}>The globe needs WebGL, which this browser doesn&rsquo;t offer. The story reads the same without it.</p>}
    </div>
  );
}
