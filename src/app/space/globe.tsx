"use client";

import { useEffect, useRef, useState } from "react";
import { bunchElements, GEO_RADIUS, poseFor, sunBelow, toward, type Pose } from "@/lib/space/camera";
import type { SpaceObject } from "@/lib/space/catalogue";
import { elements, positionAt } from "@/lib/space/orbits";
import { BELT_FRAG, BELT_VERT, DOTS_FRAG, DOTS_VERT, EARTH_FRAG, EARTH_VERT, HALO_FRAG, RING_FRAG, RING_VERT, SKY_FRAG, SKY_VERT, STARS_FRAG, STARS_VERT } from "./shaders";
import styles from "./space.module.css";
import type { Shot } from "./types";

// The globe behind the story: Earth, and every catalogued object that is in
// orbit on the story day, moving along its orbit, seen by a camera that has a
// shot for each beat (shots.ts): from space at some distance and angle, or
// standing on the ground at a place and looking up at a twilight sky. The
// camera eases from shot to shot and never cuts; the orbits turn under it as
// the Earth spins, sped up so low orbits visibly race and geostationary ones
// hang still. With reduced motion the camera jumps, nothing moves, and the
// scene is drawn only when something has changed.
//
// What is real and what is staged: the objects, their kinds, the shape and
// tilt of their orbits and their dates are the catalogue's. The camera, the
// sky's colour, the sun's place in the ground shots, the stars' orientation
// and the orbits' orientation (hashed from the NORAD number, see orbits.ts)
// are illustrative.

const RE = 6378.137; // km
const SPEED = 60; // story seconds per second on screen
const SPIN = 7.2921159e-5; // Earth's rotation, rad/s
const NEVER = 1e9; // decay day for objects still up
const EASE = 2.4; // camera easing rate per second; applied twice, for a soft start
const SPREAD_MS = 10_000; // a break-up's cloud spreads out over this long
const STAR_RADIUS = 90; // inside the far plane (200), outside the sky dome (50)
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

type Place = { lat: number; lon: number };
type Props = {
  objs: SpaceObject[] | null;
  day: number;
  shot: Shot;
  highlight?: number[];
  // The day a break-up shot's cloud appears on, for the spread.
  spreadDay?: number;
  // Nothing is drawn while the stage is faded out.
  paused?: boolean;
};

// The sun's declination on a story day (days since 4 October 1957).
function declination(day: number) {
  const d = day - 15429.5; // days from J2000
  const g = rad(357.529 + 0.98560028 * d);
  const L = rad(280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  return Math.asin(Math.sin(rad(23.439)) * Math.sin(L)) * (180 / Math.PI);
}

export function Globe({ objs, day, shot, highlight, spreadDay, paused }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const want = useRef({ day, shot, highlight, spreadDay, paused });
  const [engine, setEngine] = useState<{ setObjects(objs: SpaceObject[]): void; setHighlight(ids: number[]): void; invalidate(): void } | null>(null);
  const [failed, setFailed] = useState(false);

  // Whatever changes, with reduced motion the next frame is the only one
  // drawn, so ask for it.
  useEffect(() => {
    want.current = { day, shot, highlight, spreadDay, paused };
    engine?.invalidate();
  });

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

      // With reduced motion the loop runs only when asked to; otherwise it
      // asks for itself every frame.
      let frame = 0;
      let tick: (now: number) => void = () => {};
      const invalidate = () => {
        if (!frame && !dead) frame = requestAnimationFrame((now) => tick(now));
      };

      // Earth and its glow.
      const tex = new THREE.TextureLoader();
      const sun = new THREE.Vector3(1, 0, 0);
      const earthMat = new THREE.ShaderMaterial({
        uniforms: { tDay: { value: tex.load("/descent/tex/earth-day-2k.webp", invalidate) }, tNight: { value: tex.load("/descent/tex/earth-night-2k.webp", invalidate) }, uSun: { value: sun } },
        vertexShader: EARTH_VERT,
        fragmentShader: EARTH_FRAG,
      });
      const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMat);
      scene.add(earth);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.06, 64, 48),
        new THREE.ShaderMaterial({ uniforms: { uSun: { value: sun } }, vertexShader: EARTH_VERT, fragmentShader: HALO_FRAG, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      );
      scene.add(halo);

      // The ground shots' sky: a dome that follows the camera, and the stars.
      // Both fade in as the camera comes down from space.
      const up = new THREE.Vector3(0, 1, 0); // the camera's local vertical
      const skyUniforms = { uUp: { value: up }, uSunDir: { value: sun }, uDusk: { value: 1 }, uFade: { value: 0 } };
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(50, 32, 24),
        new THREE.ShaderMaterial({ uniforms: skyUniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false }),
      );
      dome.renderOrder = -1;
      dome.frustumCulled = false;
      dome.visible = false;
      scene.add(dome);

      // The objects turn with the stars; the camera turns with the ground.
      const sky = new THREE.Group();
      scene.add(sky);

      const starUniforms = { uPx: { value: px }, uUp: { value: up }, uDusk: skyUniforms.uDusk, uFade: skyUniforms.uFade };
      let stars: { visible: boolean } | null = null;
      let starsAsked = false;
      // The catalogue is about 100 kB, so it is only fetched once a ground
      // shot is wanted.
      const loadStars = () => {
        starsAsked = true;
        import("../postcard/stars.json")
          .then((m) => {
            if (dead) return;
            const list = m.default as [number, number, number, number][];
            const pos = new Float32Array(list.length * 3), mag = new Float32Array(list.length * 2);
            list.forEach(([ra, dec, m_, bv], k) => {
              const x = Math.cos(rad(dec)) * Math.cos(rad(ra)), y = Math.cos(rad(dec)) * Math.sin(rad(ra)), z = Math.sin(rad(dec));
              pos.set([x * STAR_RADIUS, z * STAR_RADIUS, -y * STAR_RADIUS], k * 3); // inertial z is the scene's y
              mag.set([m_, bv], k * 2);
            });
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            g.setAttribute("mag", new THREE.BufferAttribute(mag, 2));
            const p = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: starUniforms, vertexShader: STARS_VERT, fragmentShader: STARS_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
            p.frustumCulled = false;
            p.visible = false;
            stars = p;
            sky.add(p);
            invalidate();
          })
          .catch((err) => console.error(err));
      };

      // The geostationary ring, a faint guide line: with only a few objects
      // up there in the early years it wouldn't otherwise read as a ring.
      const ringUniforms = { uColor: { value: new THREE.Color(0.42, 0.58, 0.9) }, uAmount: { value: 0 }, uUp: { value: up }, uSky: { value: 0 } };
      const geoPoints: number[] = [];
      for (let k = 0; k < 256; k++) geoPoints.push(Math.cos((k / 256) * 2 * Math.PI) * GEO_RADIUS, 0, Math.sin((k / 256) * 2 * Math.PI) * GEO_RADIUS);
      const geoGeometry = new THREE.BufferGeometry();
      geoGeometry.setAttribute("position", new THREE.Float32BufferAttribute(geoPoints, 3));
      const geo = new THREE.LineLoop(geoGeometry, new THREE.ShaderMaterial({ uniforms: ringUniforms, vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      geo.frustumCulled = false;
      geo.visible = false;
      scene.add(geo);

      // The Van Allen belts: two faint shells round the equator, the inner
      // one about 1.2 to 2 Earth radii out, the outer 3 to 6. A model of
      // where the particles are, not a measurement.
      const belts = new THREE.Group();
      belts.visible = false;
      const beltColor = { value: new THREE.Color(0.7, 0.72, 0.98) };
      const shells: { amount: { value: number }; gain: number }[] = [];
      for (const [major, minor, gain] of [[1.6, 0.4, 1.4], [4.5, 1.5, 0.8]]) {
        const uniforms = { uColor: beltColor, uAmount: { value: 0 } };
        shells.push({ amount: uniforms.uAmount, gain });
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(major, minor, 28, 72),
          new THREE.ShaderMaterial({ uniforms, vertexShader: BELT_VERT, fragmentShader: BELT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        );
        mesh.rotation.x = Math.PI / 2; // the torus's axis along the Earth's
        belts.add(mesh);
      }
      scene.add(belts);

      const bunch = new THREE.Vector3(0, 0, 0);
      const dotUniforms = (scale: number, ring: number) => ({
        uTime: { value: 0 }, uDay: { value: 0 }, uPx: { value: px }, uScale: { value: scale }, uRing: { value: ring },
        uSky: { value: 0 }, uSun: { value: sun }, uUp: { value: up },
        uSpread: { value: 1 }, uSpreadDay: { value: -1 }, uSpreadT0: { value: 0 }, uBunch: { value: bunch },
      });
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
          invalidate();
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
            invalidate();
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
          invalidate();
        },
        invalidate,
      };

      // Size, with the globe set to the right of the text on wide screens.
      let shifted = false;
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        shifted = w >= 900;
        if (shifted) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
        invalidate();
      };
      const watch = new ResizeObserver(resize);
      watch.observe(el);
      resize();

      // The camera director. Each shot gives a pose (where, looking at what,
      // which way is up, how wide a lens); the camera follows it through two
      // easing steps, which gives a soft start and a soft stop. Position
      // moves as a direction and a distance, so a flight between two places
      // goes over the Earth, never through it; orientation as a quaternion.
      type Rig = { dir: InstanceType<typeof THREE.Vector3>; r: number; q: InstanceType<typeof THREE.Quaternion>; fov: number };
      const rig = (): Rig => ({ dir: new THREE.Vector3(1, 0, 0), r: 7, q: new THREE.Quaternion(), fov: 36 });
      const goal = rig(), mid = rig(), cam = rig();
      const m4 = new THREE.Matrix4(), eye = new THREE.Vector3(), aim = new THREE.Vector3(), tilt = new THREE.Vector3();
      const aim_at = (p: Pose) => {
        eye.set(...p.eye);
        goal.r = eye.length();
        goal.dir.copy(eye).normalize();
        aim.set(...p.target);
        tilt.set(...p.up);
        m4.lookAt(eye, aim, tilt);
        goal.q.setFromRotationMatrix(m4);
        goal.fov = p.fov;
      };
      const copyRig = (to: Rig, from: Rig) => {
        to.dir.copy(from.dir);
        to.r = from.r;
        to.q.copy(from.q);
        to.fov = from.fov;
      };
      const follow = (from: Rig, to: Rig, k: number) => {
        const cos = clamp(from.dir.dot(to.dir), -1, 1);
        const th = Math.acos(cos);
        if (th < 1e-4 || th > Math.PI - 1e-3) from.dir.copy(to.dir);
        else from.dir.multiplyScalar(Math.sin((1 - k) * th) / Math.sin(th)).addScaledVector(to.dir, Math.sin(k * th) / Math.sin(th));
        from.r += (to.r - from.r) * k;
        from.q.slerp(to.q, k);
        from.fov += (to.fov - from.fov) * k;
      };

      let placed = false;
      let lastFocus: Place = { lat: 20, lon: 40 };
      let dusk = 1, depression = 10; // the sky's light, eased between ground shots
      let beltAmount = 0, geoAmount = 0;
      let simTime = 0;
      let last = performance.now();
      let lastShot: Shot | null = null;
      let lastAll: SpaceObject[] | null = null;
      let spreadStart = 0;

      // A break-up's pieces start bunched at one point over the beat's place
      // (as the ground stood at that moment), on an orbit of the cloud's
      // tilt, and spread out over SPREAD_MS to where they really are.
      const startSpread = (now: number, shot: Shot, spreadDay: number | undefined) => {
        spreadStart = now;
        if (shot.kind !== "orbit" || !shot.spread || spreadDay === undefined) return;
        const tilts = all.filter((o) => o.kind === 2 && Math.abs(o.launchDay - spreadDay) < 0.5).map((o) => o.inclinationDeg).sort((a, b) => a - b);
        const f = shot.focus ?? lastFocus;
        const [wx, wy, wz] = toward(f.lat, f.lon);
        const th = simTime * SPIN; // the objects' frame is the world's turned by this
        const lx = wx * Math.cos(th) + wz * Math.sin(th), lz = -wx * Math.sin(th) + wz * Math.cos(th);
        const { raan, argp, m } = bunchElements([lx, -lz, wy], rad(tilts.length ? tilts[tilts.length >> 1] : 60));
        bunch.set(raan, argp, m);
        dotsMat.uniforms.uSpreadT0.value = ringMat.uniforms.uSpreadT0.value = simTime;
      };

      tick = (now: number) => {
        frame = 0;
        const instant = reduce.matches;
        const dt = instant ? 0 : Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!instant) simTime += dt * SPEED;
        const ease = (rate: number) => (instant ? 1 : 1 - Math.exp(-dt * rate));

        const { day: d, shot: s, spreadDay: sd, paused: hold } = want.current;
        if (s.kind === "orbit" && s.focus) lastFocus = s.focus;
        if (s.kind === "sky" && !starsAsked) loadStars();

        // Camera.
        aim_at(poseFor(s, { day: d, aspect: camera.aspect, shifted, fallback: lastFocus }));
        if (!placed || instant) {
          copyRig(mid, goal);
          copyRig(cam, goal);
          placed = true;
        } else {
          follow(mid, goal, ease(EASE));
          follow(cam, mid, ease(EASE));
        }
        const alt = cam.r - 1;
        const ground = 1 - smooth(0.004, 0.35, alt); // 1 on the ground, 0 from space
        camera.position.copy(cam.dir).multiplyScalar(cam.r);
        camera.quaternion.copy(cam.q);
        camera.fov = cam.fov;
        camera.near = clamp(alt * 0.5, 0.0001, 0.1); // close enough to the ground to stand on it, without clipping the Earth from afar
        camera.updateProjectionMatrix();
        up.copy(cam.dir);

        // The light of a ground shot.
        if (s.kind === "sky") {
          dusk += ((s.light === "dusk" ? 1 : 0) - dusk) * ease(1.5);
          depression += ((s.light === "dusk" ? 10 : 18) - depression) * ease(1.5);
        }
        const spin = simTime * SPIN;
        const lat = deg(Math.asin(clamp(cam.dir.y, -1, 1))), lon = deg(Math.atan2(-cam.dir.z, cam.dir.x));
        const dec = declination(d);
        // Earth spins under the orbits; in the views from space the sun keeps
        // to the afternoon side of the view at the season's declination, and
        // on the ground it stands below the horizon at dusk or night.
        sky.rotation.y = -spin;
        const [ox, oy, oz] = toward(dec, lon + 35 - deg(spin));
        const [gx, gy, gz] = sunBelow(lat, lon, dec, depression);
        sun.set(ox + (gx - ox) * ground, oy + (gy - oy) * ground, oz + (gz - oz) * ground).normalize();

        earth.visible = halo.visible = alt > 0.012;
        dome.visible = ground > 0.001;
        dome.position.copy(camera.position);
        skyUniforms.uFade.value = ground;
        skyUniforms.uDusk.value = dusk;
        if (stars) stars.visible = ground > 0.001;

        // Extras: the belts for their beat, the geostationary ring where it helps.
        beltAmount += ((s.kind === "orbit" && s.belts ? 1 : 0) - beltAmount) * ease(1.2);
        belts.visible = beltAmount > 0.003;
        for (const shell of shells) shell.amount.value = beltAmount * shell.gain;
        const wantRing = s.kind === "sky" ? 0.5 : s.view === "polar" || s.view === "edge" ? 0.3 : 0;
        geoAmount += (wantRing - geoAmount) * ease(1.2);
        geo.visible = geoAmount > 0.003;
        ringUniforms.uAmount.value = geoAmount;
        ringUniforms.uSky.value = ground;

        // The spread of a break-up's cloud, from when its beat comes in.
        if (s !== lastShot || all !== lastAll) {
          lastShot = s;
          lastAll = all;
          startSpread(now, s, sd);
        }
        const spreading = s.kind === "orbit" && s.spread && sd !== undefined && !instant;
        const progress = spreading ? clamp((now - spreadStart) / SPREAD_MS, 0, 1) : 1;

        for (const m of [dotsMat, ringMat]) {
          m.uniforms.uTime.value = simTime;
          m.uniforms.uDay.value = d;
          m.uniforms.uSky.value = ground;
          m.uniforms.uScale.value = (m === ringMat ? 5 : 1) * (1 + (m === ringMat ? 0.4 : 1.4) * ground); // bigger dots in the sky
          m.uniforms.uSpread.value = 1 - (1 - progress) ** 3;
          m.uniforms.uSpreadDay.value = sd ?? -1;
        }
        for (const l of lines) l.line.visible = l.launch <= d && d < l.decay && ground < 0.5;
        if (!hold) renderer.render(scene, camera);
        if (!instant) invalidate();
      };

      const wake = () => invalidate();
      reduce.addEventListener("change", wake);
      invalidate();
      setEngine(api);

      stop = () => {
        cancelAnimationFrame(frame);
        reduce.removeEventListener("change", wake);
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
