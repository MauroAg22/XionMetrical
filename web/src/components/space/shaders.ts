// Procedural GLSL for the landing-page space scene, written for this project (AI-assisted code,
// declared in the README). No textures, no image downloads and no third-party noise code: a small
// integer hash + value noise + fBm. Colors are display (sRGB) values: the canvas renders without
// tone mapping or color-space conversion, so the numbers below are what reaches the screen.
// Green, amber and red are reserved for health status in the UI; the planets avoid them.

const NOISE = /* glsl */ `
float xmHash(vec3 p) {
  uvec3 q = uvec3(ivec3(floor(p)) + 32768);
  uint h = (q.x * 73856093u) ^ (q.y * 19349663u) ^ (q.z * 83492791u);
  h ^= h >> 16u; h *= 0x7feb352du;
  h ^= h >> 15u; h *= 0x846ca68bu;
  h ^= h >> 16u;
  return float(h) * (1.0 / 4294967295.0);
}
float xmNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = xmHash(i);
  float b = xmHash(i + vec3(1.0, 0.0, 0.0));
  float c = xmHash(i + vec3(0.0, 1.0, 0.0));
  float d = xmHash(i + vec3(1.0, 1.0, 0.0));
  float e = xmHash(i + vec3(0.0, 0.0, 1.0));
  float g = xmHash(i + vec3(1.0, 0.0, 1.0));
  float h = xmHash(i + vec3(0.0, 1.0, 1.0));
  float k = xmHash(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float xmFbm(vec3 p, int octaves) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    s += a * xmNoise(p);
    p = p * 2.03 + vec3(17.1, 9.2, 3.7);
    a *= 0.5;
  }
  return s;
}
`;

/** Planet / halo vertex shader: world-space normal and position, object-space position for noise. */
export const PLANET_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vObj = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** Earth: procedural oceans, dry continents, ice caps, clouds, sun glint and a blue limb. */
export const EARTH_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform float uFade;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
void main() {
  vec3 p = normalize(vObj);
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, uSun);

  float h = xmFbm(p * 1.7 + vec3(4.3, 1.1, 7.7), 5) + 0.05 * (xmNoise(p * 16.0) - 0.5);
  float land = smoothstep(0.515, 0.535, h);
  float shelf = smoothstep(0.45, 0.515, h) * (1.0 - land);
  float lat = abs(p.y);
  float ice = smoothstep(0.80, 0.87, lat + 0.08 * (xmNoise(p * 9.0) - 0.5));

  vec3 ocean = mix(vec3(0.016, 0.060, 0.150), vec3(0.040, 0.150, 0.290), shelf);
  float t = xmFbm(p * 5.0 + 2.0, 4);
  vec3 ground = mix(vec3(0.43, 0.37, 0.26), vec3(0.26, 0.24, 0.17), smoothstep(0.35, 0.65, t));
  ground = mix(ground, vec3(0.58, 0.48, 0.33), smoothstep(0.55, 0.75, xmFbm(p * 2.6 + 9.0, 3)) * (1.0 - lat));
  vec3 albedo = mix(ocean, ground, land);
  albedo = mix(albedo, vec3(0.86, 0.90, 0.95), ice);

  float cloud = smoothstep(0.50, 0.74, xmFbm(p * 3.1 + vec3(1.7, 8.1, 2.9), 5));
  albedo = mix(albedo, vec3(0.93, 0.95, 0.98), cloud * 0.85);

  float diff = max(ndl, 0.0) * 0.88 + smoothstep(-0.12, 0.30, ndl) * 0.12;
  vec3 H = normalize(uSun + V);
  float spec = pow(max(dot(N, H), 0.0), 70.0) * (1.0 - land) * (1.0 - cloud) * 0.5 * step(0.0, ndl);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  vec3 limb = vec3(0.30, 0.56, 1.0) * fres * smoothstep(-0.25, 0.45, ndl) * 0.9;

  vec3 col = albedo * diff + vec3(1.0, 0.97, 0.92) * spec + limb + albedo * 0.012;
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

/** Mars: muted ochre and rust (kept apart from the amber/red status colors), dark regions, north cap. */
export const MARS_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform float uFade;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
void main() {
  vec3 p = normalize(vObj);
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, uSun);

  float dust = xmFbm(p * 5.5 + 3.0, 5);
  vec3 albedo = mix(vec3(0.60, 0.34, 0.20), vec3(0.74, 0.47, 0.29), dust);
  float dark = smoothstep(0.50, 0.64, xmFbm(p * 2.2 + vec3(5.2, 3.3, 1.1), 5));
  albedo = mix(albedo, vec3(0.33, 0.20, 0.14), dark * 0.75);
  float crater = smoothstep(0.62, 0.70, xmNoise(p * 26.0)) * 0.12;
  albedo *= 1.0 - crater;
  float cap = smoothstep(0.89, 0.93, p.y + 0.04 * (xmNoise(p * 12.0) - 0.5));
  albedo = mix(albedo, vec3(0.90, 0.89, 0.87), cap);

  float diff = max(ndl, 0.0) * 0.9 + smoothstep(-0.10, 0.25, ndl) * 0.10;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 haze = vec3(0.80, 0.56, 0.44) * fres * smoothstep(-0.2, 0.5, ndl) * 0.35;
  vec3 col = albedo * diff + haze + albedo * 0.010;
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

/** Atmosphere halo: a slightly larger back-face sphere, added on top, brightest at the planet's limb. */
export const HALO_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uColor;
uniform float uEdge;
uniform float uFade;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float k = smoothstep(0.0, uEdge, abs(dot(N, V)));
  k = k * k;
  float lit = smoothstep(-0.35, 0.55, dot(N, uSun));
  gl_FragColor = vec4(uColor * k * lit * uFade, 1.0);
}
`;

/** Sky: navy base plus a faint Milky Way band (brighter and warmer toward the galactic center). */
export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;

export const SKY_FRAG = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uGalN;
uniform vec3 uGalC;
uniform float uFade;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 d = normalize(vDir);
  float b = dot(d, uGalN);
  float c = dot(d, uGalC) * 0.5 + 0.5;
  float w = 0.10 + 0.10 * c;
  float band = exp(-(b * b) / (w * w));
  float clouds = xmFbm(d * 3.4 + 7.0, 5);
  float fine = xmFbm(d * 12.0 + 3.0, 3);
  float lane = smoothstep(0.50, 0.70, xmFbm(d * 6.0 + 19.0, 4)) * exp(-(b * b) / 0.0016);
  float glow = band * (0.25 + clouds * clouds * 1.1) * (0.45 + 0.85 * c * c) * (0.7 + 0.6 * fine);
  glow *= 1.0 - 0.7 * lane;
  vec3 tint = mix(vec3(0.52, 0.60, 0.82), vec3(0.88, 0.80, 0.68), c * c);
  gl_FragColor = vec4(uBase + tint * glow * 0.2 * uFade, 1.0);
}
`;

/** Stars: round soft points at infinity; each one lights up at its own moment during the intro. */
export const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aBright;
attribute float aDelay;
attribute vec3 aTint;
uniform float uIgnite;
uniform float uPixelRatio;
varying vec3 vColor;
void main() {
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
  float on = smoothstep(aDelay, aDelay + 0.22, uIgnite);
  vColor = aTint * aBright * on;
  gl_PointSize = aSize * uPixelRatio;
}
`;

export const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vColor * exp(-r2 * 3.2), 1.0);
}
`;

/** Transfer trajectory: the part already flown is solid, the rest is a faint dashed line. */
export const PATH_VERT = /* glsl */ `
attribute float aT;
varying float vT;
void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const PATH_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uProgress;
uniform float uDashes;
uniform float uFade;
varying float vT;
void main() {
  float a = vT <= uProgress ? 0.6 : 0.2 * step(0.5, fract(vT * uDashes));
  if (a <= 0.0) discard;
  gl_FragColor = vec4(uColor * a * uFade, 1.0);
}
`;

/** Ship marker: a small bright point with a soft glow. */
export const SHIP_VERT = /* glsl */ `
uniform float uSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}
`;

export const SHIP_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uFade;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float core = smoothstep(0.10, 0.0, r2);
  float glow = exp(-r2 * 5.0) * 0.55;
  gl_FragColor = vec4(uColor * (core + glow) * uFade, 1.0);
}
`;
