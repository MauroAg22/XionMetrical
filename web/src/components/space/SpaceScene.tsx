"use client";
// WebGL background for the landing page (direction A, "Trajectory"): Milky Way, stars, Earth, Mars and
// the transfer trajectory. The camera follows the mission clock in ./journey (scroll → mission day), so
// scrolling the page flies from Earth (hero) to Mars (end). Renders on demand only: during the 3-second
// intro and while the camera is still settling after a scroll. Loaded lazily by SpaceBackdrop.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ARRIVAL_DAY, journey, transitProgress } from "./journey";
import * as GLSL from "./shaders";

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);
const SUN = v3(1, 0.32, 0.5).normalize();
const BASE = v3(4 / 255, 9 / 255, 20 / 255); // #040914, the page background
const EARTH_TILT = (23.4 * Math.PI) / 180;
const MARS = v3(40, 4, -22);
const MARS_R = 0.53;
// Milky Way plane chosen so the band (and its brighter core) crosses the view during the cruise.
const GAL_N = v3(0.806, -0.403, 0.434).normalize();
const GAL_C = v3(0.38, -0.21, -0.9).projectOnPlane(GAL_N).normalize();

// Transfer trajectory: leaves Earth, arcs "up" and away, and reaches Mars from the camera side.
const PATH = new THREE.CatmullRomCurve3(
  [v3(1.25, 0.35, 0.5), v3(9, 4.4, -0.5), v3(22, 6.6, -8), v3(33.5, 6, -16.5), MARS.clone().add(v3(-0.9, 0.25, 0.5))],
  false,
  "centripetal",
);

// ---- Camera keyframes (mission day → pose). `at` frames the subject to the right of the text column;
// `atP` (portrait screens) keeps it nearer the center. -------------------------------------------------
interface Key {
  day: number;
  pos: THREE.Vector3;
  at: THREE.Vector3;
  atP: THREE.Vector3;
}

/** Camera above Earth looking `beta` degrees above Earth's center: the limb becomes a horizon arc. */
function horizon(dist: number, betaDeg: number, dir: THREE.Vector3) {
  const pos = dir.clone().normalize().multiplyScalar(dist);
  const toC = pos.clone().negate().normalize();
  const upP = UP.clone().sub(toC.clone().multiplyScalar(UP.dot(toC))).normalize();
  const b = (betaDeg * Math.PI) / 180;
  const look = toC.multiplyScalar(Math.cos(b)).add(upP.multiplyScalar(Math.sin(b)));
  return { pos, at: pos.clone().add(look.multiplyScalar(4)) };
}

/** Camera near Mars on its sunlit side; `side` > 0 puts Mars right of center. */
function nearMars(azDeg: number, dist: number, height: number, side: number) {
  const a = (azDeg * Math.PI) / 180;
  const pos = MARS.clone().add(v3(Math.sin(a) * dist, height, Math.cos(a) * dist));
  const fwd = MARS.clone().sub(pos).normalize();
  const right = fwd.clone().cross(UP).normalize();
  return { pos, at: MARS.clone().sub(right.clone().multiplyScalar(side)), atP: MARS.clone().sub(right.multiplyScalar(side * 0.15)) };
}

const HERO = horizon(1.42, 57, v3(0.25, 0.5, 1));
const HERO_P = horizon(1.5, 61, v3(0.25, 0.5, 1));
const INTRO_FROM = horizon(1.1, 44, v3(0.12, 0.42, 1));
const ARRIVE = nearMars(-8, 3.4, 0.8, 1.2);
const STAY = nearMars(28, 3.2, 1.0, 1.15);
const LATE = nearMars(58, 3.6, 1.2, 1.1);

const KEYS: Key[] = [
  { day: 1, pos: HERO.pos, at: HERO.at, atP: HERO_P.at },
  { day: 20, pos: v3(-1.4, 2.3, 4.8), at: v3(-2.2, 0.9, 0), atP: v3(-0.4, 0.5, 0) },
  { day: 45, pos: v3(1, 17, 27), at: v3(12, 2.5, -7), atP: v3(10, 2.5, -6) },
  { day: 75, pos: v3(7, 27, 34), at: v3(19, 3, -11), atP: v3(20, 3, -11) },
  { day: 115, pos: v3(21, 19, 21), at: v3(32, 4, -16), atP: v3(34, 4, -18) },
  { day: 140, pos: v3(30, 11, 6), at: v3(37.5, 4.2, -19), atP: v3(38.5, 4.2, -20.5) },
  { day: 160, pos: v3(35.5, 6.4, -10), at: v3(39.1, 4.2, -21.3), atP: v3(39.6, 4.1, -21.8) },
  { day: ARRIVAL_DAY, pos: ARRIVE.pos, at: ARRIVE.at, atP: ARRIVE.atP },
  { day: 300, pos: STAY.pos, at: STAY.at, atP: STAY.atP },
  { day: 409, pos: LATE.pos, at: LATE.at, atP: LATE.atP },
];
const POS = new THREE.CatmullRomCurve3(KEYS.map((k) => k.pos), false, "centripetal");
const AT = new THREE.CatmullRomCurve3(KEYS.map((k) => k.at), false, "centripetal");
const AT_P = new THREE.CatmullRomCurve3(KEYS.map((k) => k.atP), false, "centripetal");

function curveParam(day: number): number {
  let i = 0;
  while (i < KEYS.length - 2 && day > KEYS[i + 1].day) i++;
  const t = THREE.MathUtils.clamp((day - KEYS[i].day) / (KEYS[i + 1].day - KEYS[i].day), 0, 1);
  return (i + t) / (KEYS.length - 1);
}

// ---- Scene pieces ------------------------------------------------------------------------------------
type Uniforms = Record<string, THREE.IUniform>;

function shader(vertexShader: string, fragmentShader: string, uniforms: Uniforms, extra: THREE.ShaderMaterialParameters = {}) {
  return new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, ...extra });
}

function makeStars(count: number) {
  const pos = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const bright = new Float32Array(count);
  const delay = new Float32Array(count);
  let seed = 20261115;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let i = 0;
  while (i < count) {
    const z = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const b = x * GAL_N.x + y * GAL_N.y + z * GAL_N.z;
    if (rnd() > 0.32 + 0.68 * Math.exp(-(b * b) / 0.03)) continue; // denser along the Milky Way
    pos.set([x * 50, y * 50, z * 50], i * 3);
    const m = Math.pow(rnd(), 7);
    size[i] = 1.4 + m * 3;
    bright[i] = Math.min(1.2, 0.22 + 0.7 * Math.pow(rnd(), 2.4) + m * 0.7);
    delay[i] = rnd() * 0.9;
    const w = rnd();
    tint.set(w < 0.6 ? [0.8, 0.87, 1] : w < 0.9 ? [1, 0.98, 0.94] : [1, 0.88, 0.74], i * 3);
    i++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aBright", new THREE.BufferAttribute(bright, 1));
  g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  return g;
}

function useWorld(mobile: boolean, pixelRatio: number) {
  return useMemo(() => {
    const fade = { value: 0 };
    const sun = { value: SUN };

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(100, 48, 32),
      shader(GLSL.SKY_VERT, GLSL.SKY_FRAG, { uBase: { value: BASE }, uGalN: { value: GAL_N }, uGalC: { value: GAL_C }, uFade: fade }, {
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    );
    sky.renderOrder = -2;
    sky.frustumCulled = false;

    const ignite = { value: 0 };
    const stars = new THREE.Points(
      makeStars(mobile ? 2400 : 4600),
      shader(GLSL.STAR_VERT, GLSL.STAR_FRAG, { uIgnite: ignite, uPixelRatio: { value: pixelRatio } }, {
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
      }),
    );
    stars.renderOrder = -1;
    stars.frustumCulled = false;

    const skyGroup = new THREE.Group();
    skyGroup.add(sky, stars);

    const halo = (scale: number, color: THREE.Vector3) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 64),
        shader(GLSL.PLANET_VERT, GLSL.HALO_FRAG, { uSun: sun, uColor: { value: color }, uEdge: { value: Math.sqrt(1 - 1 / (scale * scale)) }, uFade: fade }, {
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
        }),
      );
      m.scale.setScalar(scale);
      return m;
    };

    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 100), shader(GLSL.PLANET_VERT, GLSL.EARTH_FRAG, { uSun: sun, uFade: fade }));
    const earthTilt = new THREE.Group();
    earthTilt.rotation.z = EARTH_TILT;
    earthTilt.add(earth);
    earthTilt.add(halo(1.06, v3(0.22, 0.46, 1)));

    const mars = new THREE.Mesh(new THREE.SphereGeometry(MARS_R, 112, 72), shader(GLSL.PLANET_VERT, GLSL.MARS_FRAG, { uSun: sun, uFade: fade }));
    const marsGroup = new THREE.Group();
    marsGroup.position.copy(MARS);
    marsGroup.rotation.z = (25.2 * Math.PI) / 180;
    const marsHalo = halo(1.035, v3(0.42, 0.3, 0.24));
    marsHalo.scale.setScalar(MARS_R * 1.035);
    marsGroup.add(mars, marsHalo);

    const pts = PATH.getSpacedPoints(320);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
    pathGeo.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(pts.map((_, i) => i / (pts.length - 1))), 1));
    const progress = { value: 0 };
    const path = new THREE.Line(
      pathGeo,
      shader(GLSL.PATH_VERT, GLSL.PATH_FRAG, { uColor: { value: v3(0.62, 0.76, 1) }, uProgress: progress, uDashes: { value: 160 }, uFade: fade }, {
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );

    const shipGeo = new THREE.BufferGeometry();
    shipGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const shipFade = { value: 0 };
    const ship = new THREE.Points(
      shipGeo,
      shader(GLSL.SHIP_VERT, GLSL.SHIP_FRAG, { uColor: { value: v3(0.86, 0.92, 1) }, uSize: { value: 14 * pixelRatio }, uFade: shipFade }, {
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    ship.frustumCulled = false;

    return { fade, ignite, progress, shipFade, skyGroup, earth, earthTilt, marsGroup, mars, path, ship };
  }, [mobile, pixelRatio]);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function Rig({ intro, onReady }: { intro: boolean; onReady: () => void }) {
  const { camera, size, gl, invalidate, scene } = useThree();
  const mobile = size.width < 768;
  const world = useWorld(mobile, gl.getPixelRatio());
  const state = useRef({ day: journey.day, start: -1, last: 0, ready: false });
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), at: new THREE.Vector3(), atP: new THREE.Vector3(), ship: new THREE.Vector3() }), []);

  useEffect(() => {
    const { skyGroup, earthTilt, marsGroup, path, ship } = world;
    scene.add(skyGroup, earthTilt, marsGroup, path, ship);
    invalidate();
    return () => {
      scene.remove(skyGroup, earthTilt, marsGroup, path, ship);
      for (const o of [skyGroup, earthTilt, marsGroup, path, ship]) {
        o.traverse((n) => {
          const m = n as THREE.Mesh;
          m.geometry?.dispose();
          (m.material as THREE.Material | undefined)?.dispose();
        });
      }
    };
  }, [world, scene, invalidate]);

  useEffect(() => journey.subscribe(() => invalidate()), [invalidate]);
  // A resize clears the drawing buffer: draw again (frames are on demand only).
  useEffect(() => invalidate(), [size.width, size.height, invalidate]);

  useFrame(() => {
    const s = state.current;
    const now = performance.now();
    // Frame-rate independent smoothing (also catches up quickly on slow devices).
    const dt = s.last ? Math.min((now - s.last) / 1000, 0.25) : 1 / 60;
    s.last = now;
    if (s.start < 0) s.start = now;
    const k = intro ? Math.min(1, (now - s.start) / 3000) : 1;

    // Mission day, smoothed so the camera glides after each scroll step.
    const target = journey.day;
    s.day += (target - s.day) * (1 - Math.exp(-dt * 4.5));
    if (Math.abs(target - s.day) < 0.01) s.day = target;

    const cam = camera as THREE.PerspectiveCamera;
    const portrait = size.width < size.height;
    const fov = portrait ? 58 : 40;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const u = curveParam(s.day);
    POS.getPoint(u, tmp.pos);
    (portrait ? AT_P : AT).getPoint(u, tmp.at);
    if (k < 1) {
      const e = smooth(k);
      tmp.pos.lerpVectors(INTRO_FROM.pos, tmp.pos, e);
      tmp.at.lerpVectors(INTRO_FROM.at, tmp.at, e);
    }
    cam.position.copy(tmp.pos);
    cam.lookAt(tmp.at);

    world.skyGroup.position.copy(cam.position);
    world.fade.value = intro ? smooth(Math.min(1, k / 0.4)) : 1;
    world.ignite.value = intro ? k * 1.3 : 2;
    world.earth.rotation.y = 2.3 + s.day * 0.012;
    world.mars.rotation.y = 0.8 + s.day * 0.01;

    const p = transitProgress(s.day);
    world.progress.value = p;
    PATH.getPointAt(p, tmp.ship);
    (world.ship.geometry.getAttribute("position") as THREE.BufferAttribute).setXYZ(0, tmp.ship.x, tmp.ship.y, tmp.ship.z).needsUpdate = true;
    world.shipFade.value = world.fade.value * smooth(THREE.MathUtils.clamp((s.day - 6) / 10, 0, 1)) * smooth(THREE.MathUtils.clamp((ARRIVAL_DAY - 4 - s.day) / 12, 0, 1));

    if (!s.ready) {
      s.ready = true;
      requestAnimationFrame(() => onReady());
    }
    if (k < 1 || s.day !== target) invalidate();
  });

  return null;
}

export default function SpaceScene({ intro, onReady, onFail }: { intro: boolean; onReady: () => void; onFail: () => void }) {
  const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return (
    <Canvas
      frameloop="demand"
      flat
      linear
      dpr={[1, mobile ? 1.25 : 1.5]}
      gl={{ antialias: !mobile, alpha: false, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 40, near: 0.02, far: 500, position: [0, 1, 2] }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color().setRGB(BASE.x, BASE.y, BASE.z), 1);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Rig intro={intro} onReady={onReady} />
    </Canvas>
  );
}
