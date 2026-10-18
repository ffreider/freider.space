// Shaders for the story's globe (globe.tsx). The scene is in Earth radii,
// in three.js axes: x toward 0° longitude, y toward the north pole, z toward
// 90° west, so that three's own sphere UVs line up with an equirectangular
// map centred on Greenwich.

// Earth: the day map lit by the sun, city lights on the night side, a thin
// blue rim where the atmosphere would be.
export const EARTH_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vPos; varying vec2 vUv;
void main() {
  vN = normalize(position); vPos = position; vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const EARTH_FRAG = /* glsl */ `
uniform sampler2D tDay; uniform sampler2D tNight; uniform vec3 uSun;
varying vec3 vN; varying vec3 vPos; varying vec2 vUv;
void main() {
  float l = dot(vN, uSun);
  vec3 day = texture2D(tDay, vUv).rgb * (0.18 + 0.9 * max(l, 0.0));
  vec3 night = texture2D(tNight, vUv).rgb * vec3(1.0, 0.82, 0.58) * 1.1 + vec3(0.006, 0.01, 0.02);
  vec3 col = mix(night, day, smoothstep(-0.1, 0.16, l));
  float facing = max(dot(vN, normalize(cameraPosition - vPos)), 0.0);
  col += vec3(0.32, 0.52, 0.9) * pow(1.0 - facing, 3.0) * (0.15 + 0.85 * smoothstep(-0.25, 0.35, l));
  gl_FragColor = vec4(col, 1.0);
}`;

// A faint glow just beyond the limb.
export const HALO_FRAG = /* glsl */ `
uniform vec3 uSun;
varying vec3 vN; varying vec3 vPos; varying vec2 vUv;
void main() {
  float facing = dot(vN, normalize(cameraPosition - vPos));
  float glow = pow(clamp(1.0 + facing, 0.0, 1.0), 6.0);
  float lit = 0.25 + 0.75 * smoothstep(-0.3, 0.4, dot(vN, uSun));
  gl_FragColor = vec4(vec3(0.32, 0.55, 1.0) * glow * lit * 0.55, 1.0);
}`;

// Every object as a point. Its orbit (in Earth radii and radians, mean
// motion in rad per story second) comes in as attributes; the shader solves
// Kepler's equation for the story time and hides the object outside
// [launch, decay) at the story day.
export const DOTS_VERT = /* glsl */ `
attribute vec4 orbA; // a, e, i, raan
attribute vec4 orbB; // argp, m0, n, kind
attribute vec2 life; // launch day, decay day
uniform float uTime; uniform float uDay; uniform float uPx; uniform float uScale;
varying vec3 vColor; varying float vAlpha;
void main() {
  float a = orbA.x, e = orbA.y, inc = orbA.z, raan = orbA.w, argp = orbB.x;
  float M = mod(orbB.y + orbB.z * uTime, 6.2831853);
  float E = M + e * sin(M);
  for (int k = 0; k < 3; k++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  float xp = a * (cos(E) - e), yp = a * sqrt(1.0 - e * e) * sin(E);
  float cO = cos(raan), sO = sin(raan), cw = cos(argp), sw = sin(argp), ci = cos(inc), si = sin(inc);
  vec3 eci = vec3(
    (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp,
    (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp,
    sw * si * xp + cw * si * yp);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(eci.x, eci.z, -eci.y, 1.0);

  float kind = orbB.w;
  bool alive = life.x <= uDay && uDay < life.y;
  float size = kind < 0.5 ? 3.0 : kind < 1.5 ? 2.5 : 1.5;
  gl_PointSize = size * uPx * uScale;
  // Some GPUs draw a zero-size point at one pixel, so objects not in orbit
  // on the story day are moved outside the view instead.
  if (!alive) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vColor = kind < 0.5 ? vec3(0.663, 0.839, 1.0) : kind < 1.5 ? vec3(0.722, 0.671, 0.596) : vec3(0.42, 0.48, 0.56);
  vAlpha = kind < 0.5 ? 0.95 : kind < 1.5 ? 0.8 : 0.55;
}`;

export const DOTS_FRAG = /* glsl */ `
uniform float uRing;
varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = uRing > 0.5 ? smoothstep(0.5, 0.42, d) * smoothstep(0.3, 0.38, d) : smoothstep(0.5, 0.25, d);
  gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
}`;
