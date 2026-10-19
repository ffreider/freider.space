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
//
// uSky is 0 in the views from space and 1 for the shots from the ground. In
// the sky the shader also drops what the sun doesn't reach (inside Earth's
// shadow, a cylinder away from the sun), dims what is near the horizon and
// hides what is below it, since there the Earth itself is not drawn.
//
// uSpread is how far a break-up's cloud has spread: pieces whose launch day
// is uSpreadDay start (at 0) on one orbit through one point, all at the same
// place along it, and slide to their own orbits and places as it goes to 1.
// uBunch is that shared start (ascending node, argument of perigee, anomaly)
// as it was at story time uSpreadT0.
export const DOTS_VERT = /* glsl */ `
attribute vec4 orbA; // a, e, i, raan
attribute vec4 orbB; // argp, m0, n, kind
attribute vec2 life; // launch day, decay day
uniform float uTime; uniform float uDay; uniform float uPx; uniform float uScale;
uniform float uSky; uniform vec3 uSun; uniform vec3 uUp;
uniform float uSpread; uniform float uSpreadDay; uniform float uSpreadT0; uniform vec3 uBunch;
varying vec3 vColor; varying float vAlpha;
const float TAU = 6.2831853;
float wrapPi(float x) { return mod(x + 3.1415927, TAU) - 3.1415927; }
void main() {
  vAlpha = 0.0; vColor = vec3(0.0);
  gl_PointSize = 1.0;
  // Some GPUs draw a zero-size point at one pixel, so objects not in orbit
  // on the story day are moved outside the view instead, before any maths.
  if (!(life.x <= uDay && uDay < life.y)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

  float a = orbA.x, e = orbA.y, inc = orbA.z, raan = orbA.w, argp = orbB.x;
  float kind = orbB.w;
  float M = orbB.y + orbB.z * uTime;
  if (uSpread < 1.0 && kind > 1.5 && kind < 2.5 && abs(life.x - uSpreadDay) < 0.5) {
    // The shared start moves along with the orbit's own pace, so the bunch
    // travels as one while it opens up.
    float bunched = uBunch.z + orbB.z * (uTime - uSpreadT0);
    raan = uBunch.x + uSpread * wrapPi(raan - uBunch.x);
    argp = uBunch.y + uSpread * wrapPi(argp - uBunch.y);
    M = bunched + uSpread * wrapPi(M - bunched);
  }
  M = mod(M, TAU);
  // Newton's method; from pi when the orbit is very eccentric, where
  // starting at M converges slowly.
  float E = e > 0.8 ? 3.1415927 : M + e * sin(M);
  for (int k = 0; k < 5; k++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  float xp = a * (cos(E) - e), yp = a * sqrt(1.0 - e * e) * sin(E);
  float cO = cos(raan), sO = sin(raan), cw = cos(argp), sw = sin(argp), ci = cos(inc), si = sin(inc);
  vec3 eci = vec3(
    (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp,
    (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp,
    sw * si * xp + cw * si * yp);
  vec4 world = modelMatrix * vec4(eci.x, eci.z, -eci.y, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;

  // Lit by the sun? Not if behind the Earth, inside its shadow cylinder.
  float along = dot(world.xyz, uSun);
  vec3 across = world.xyz - uSun * along;
  float lit = (along < 0.0 && dot(across, across) < 1.0) ? 0.0 : 1.0;
  float above = smoothstep(-0.02, 0.07, dot(normalize(world.xyz - cameraPosition), uUp));
  float seen = mix(1.0, lit * above, uSky);

  float size = kind < 0.5 ? 3.0 : kind < 1.5 ? 2.5 : 1.5;
  gl_PointSize = size * uPx * uScale;
  vColor = kind < 0.5 ? vec3(0.663, 0.839, 1.0) : kind < 1.5 ? vec3(0.722, 0.671, 0.596) : vec3(0.42, 0.48, 0.56);
  // From the ground, debris is mostly too faint to see, so it is dimmed hard
  // and the sky reads as satellites and rocket stages.
  float faint = kind > 1.5 && kind < 2.5 ? mix(1.0, 0.08, uSky) : 1.0;
  vAlpha = (kind < 0.5 ? 0.95 : kind < 1.5 ? 0.8 : 0.55) * seen * faint;
}`;

export const DOTS_FRAG = /* glsl */ `
uniform float uRing;
varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5 || vAlpha <= 0.0) discard;
  float a = uRing > 0.5 ? smoothstep(0.5, 0.42, d) * smoothstep(0.3, 0.38, d) : smoothstep(0.5, 0.25, d);
  gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
}`;

// The sky for the shots from the ground: a large sphere around the camera,
// seen from inside. Above the horizon, twilight blue near it and fading to
// near-black overhead at dusk, almost black all the way at night; below it,
// dark ground. uUp is the local vertical, uSunDir (below the horizon) pulls
// a little warmth into the west at dusk, uDusk is 1 at dusk and 0 at night
// and uFade lets it in as the camera comes down from space.
export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const SKY_FRAG = /* glsl */ `
uniform vec3 uUp; uniform vec3 uSunDir; uniform float uDusk; uniform float uFade;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = dot(d, uUp);
  float t = clamp(h, 0.0, 1.0);
  vec3 night = mix(vec3(0.022, 0.036, 0.066), vec3(0.003, 0.005, 0.011), smoothstep(0.0, 0.45, t));
  vec3 dusk = mix(vec3(0.14, 0.25, 0.46), vec3(0.006, 0.010, 0.026), pow(smoothstep(0.0, 0.8, t), 0.55));
  vec3 flatSun = normalize(uSunDir - uUp * dot(uSunDir, uUp));
  float toSun = max(dot(d, flatSun), 0.0);
  dusk += vec3(0.30, 0.15, 0.08) * pow(toSun, 5.0) * exp(-t * 7.0);
  vec3 sky = mix(night, dusk, uDusk);
  vec3 ground = mix(vec3(0.006, 0.008, 0.014), vec3(0.002, 0.003, 0.006), smoothstep(0.0, 0.25, -h));
  vec3 col = mix(ground, sky, smoothstep(-0.003, 0.004, h));
  gl_FragColor = vec4(col, uFade);
}`;

// The stars (src/app/postcard/stars.json): direction on the celestial sphere
// from right ascension and declination, size and brightness from magnitude,
// colour from B-V. Fainter near the horizon, and at dusk only the brightest
// show high up.
export const STARS_VERT = /* glsl */ `
attribute vec2 mag; // magnitude, B-V
uniform float uPx; uniform vec3 uUp; uniform float uDusk; uniform float uFade;
varying vec3 vColor; varying float vAlpha;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float h = dot(normalize(world.xyz), uUp);
  float bright = pow(10.0, -0.4 * (mag.x - 1.0));
  float dim = mix(1.0, smoothstep(0.05, 0.6, h) * mix(0.3, 1.0, smoothstep(4.5, 1.5, mag.x)), uDusk);
  gl_Position = projectionMatrix * viewMatrix * world;
  gl_PointSize = uPx * (1.2 + clamp((5.8 - mag.x) * 0.5, 0.0, 2.6));
  float bv = clamp(mag.y, -0.3, 1.6);
  vColor = mix(vec3(0.62, 0.72, 1.0), vec3(1.0, 0.62, 0.42), smoothstep(-0.3, 1.6, bv));
  vColor = mix(vColor, vec3(1.0), 0.35);
  vAlpha = clamp(0.28 + 0.42 * pow(bright, 0.45), 0.0, 1.0) * smoothstep(-0.02, 0.08, h) * dim * uFade;
}`;

export const STARS_FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.1, d) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}`;

// The Van Allen belts as faint shells: brighter where the surface turns away
// from the viewer, so the torus reads as a glow rather than a solid.
export const BELT_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vPos;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal); vPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const BELT_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAmount;
varying vec3 vN; varying vec3 vPos;
void main() {
  float facing = abs(dot(vN, normalize(cameraPosition - vPos)));
  float a = (0.035 + 0.22 * pow(1.0 - facing, 2.2)) * uAmount;
  gl_FragColor = vec4(uColor * a, a);
}`;

// A thin line, such as the geostationary ring: hidden below the horizon when
// seen from the ground, where the Earth isn't drawn to hide it.
export const RING_VERT = /* glsl */ `
uniform vec3 uUp; uniform float uSky;
varying float vSeen;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float above = smoothstep(-0.02, 0.06, dot(normalize(world.xyz - cameraPosition), uUp));
  vSeen = mix(1.0, above, uSky);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const RING_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAmount;
varying float vSeen;
void main() {
  float a = uAmount * vSeen;
  gl_FragColor = vec4(uColor * a, a);
}`;
