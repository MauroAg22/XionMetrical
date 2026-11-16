/* XionMetrical — video stage, 1920×1080. ONE clock: window.seek(t) draws the exact frame at t seconds
   (everything is derived from t: no timers, no CSS animations, seeded randomness only).
   AI-ASSISTED ANIMATION (Claude Opus 5.5 in Claude Code) — declared in docs/registro-video.md.
   Faceless silhouette that floats (microgravity). No NASA branding is drawn: the official NASA Space Apps
   Challenge logo is an <img> shown unmodified at its natural size (opacity fade only); the NASA insignia is
   not used. "AI-assisted animation" stays visible the whole video. */
(() => {
  "use strict";
  const TL = window.TIMELINE;
  const LIVE = new URLSearchParams(location.search).get("app") === "live";
  const E = {};
  document.querySelectorAll("[id]").forEach((el) => (E[el.id] = el));

  // ---------- helpers ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
  const easeIO = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const fade = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(ease(ramp(t, a, a + fi)), 1 - ease(ramp(t, b - fo, b)));
  const n2 = (x) => (Math.round(x * 100) / 100).toString();
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixC = (a, b, u) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(",")})`; };
  const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.001 ? "visible" : "hidden"; };
  const rise = (el, o, dy) => { show(el, o); el.style.transform = `translateY(${n2((1 - o) * dy)}px)`; };
  const tr = (el, s) => el.setAttribute("transform", s);

  const SC = TL.scenes, AL = TL.app.alert, MO = TL.app.montage, SHOTS = TL.shots;
  const V = Object.fromEntries(TL.voice.map((l) => [l.id, l]));
  const [R0, R1] = SC.rewind;
  const PUSH0 = AL.start + 0.75, PUSH1 = AL.start + 1.75; // camera push into the tablet screen
  const ALERT_RECT = { x: 192, y: 52, w: 1536, h: 864 };
  const MONT_RECT = { x: 248, y: 126, w: 1424, h: 801 };

  // ---------- static, seeded decoration ----------
  const twinkle = [];
  (() => {
    const r = rng(7);
    let s = "";
    for (let i = 0; i < 300; i++) {
      const x = r() * 2160, y = r() * 1080, rad = 0.5 + Math.pow(r(), 3) * 1.9, o = 0.2 + r() * 0.7;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" opacity="${o.toFixed(2)}"/>`;
      twinkle.push({ o, f: 0.3 + r() * 1.3, p: r() * 6.283 });
    }
    E.starfield.innerHTML = s;
    twinkle.forEach((st, i) => (st.el = E.starfield.children[i]));
    const w = rng(11);
    let ws = "";
    for (let i = 0; i < 46; i++) {
      const x = 1155 + w() * 270, y = 285 + w() * 270, rad = 0.6 + w() * w() * 1.6, o = 0.3 + w() * 0.7;
      ws += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" opacity="${o.toFixed(2)}"/>`;
    }
    E.winStars.innerHTML = ws;
    let b = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      b += `<circle cx="${(1290 + Math.cos(a) * 158).toFixed(1)}" cy="${(420 + Math.sin(a) * 158).toFixed(1)}" r="4.5"/>`;
    }
    E.bolts.innerHTML = b;
  })();
  const LEDS = [...E.leds.querySelectorAll("circle")];
  const LED_CALM = LEDS.map((_, i) => (i % 3 === 2 ? "#8db8ff" : "#4c8dff"));

  // ---------- astronaut: 2-bone limbs, two key poses, one story clock ----------
  const SH_A = [-58, -146], SH_B = [58, -146], HIP_A = [-27, 82], HIP_B = [27, 82];
  const UPPER = 115, FORE = 120, THIGH = 150;
  const POSE_A = { armA: [36, 30], armB: [-72, -16], legA: [8, -14, 1], legB: [-7, 17, 1], head: 12 }; // calm, holding the tablet
  const POSE_B = { armA: [30, -145], armB: [-122, -40], legA: [26, -52, 0.72], legB: [-21, 47, 0.74], head: -16 }; // hand to chest, curled, floating
  const REL = 0.95; // story time when the tablet slips away
  const BODY0 = { x: 720, y: 584, s: 0.84 };
  const GRIP = [-90, 30]; // hand position in tablet units
  const dir = (deg, L) => { const r = (deg * Math.PI) / 180; return [-L * Math.sin(r), L * Math.cos(r)]; };
  const handLocal = (sh, a1, a2) => { const e = dir(a1, UPPER), h = dir(a1 + a2, FORE); return [sh[0] + e[0] + h[0], sh[1] + e[1] + h[1]]; };
  const toWorld = (b, p) => { const r = (b.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), x = p[0] * b.s, y = p[1] * b.s; return [b.x + x * c - y * s, b.y + x * s + y * c]; };
  const lerpArr = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));

  // tau = story time of the alarm scene (runs backwards in the rewind); fc = float clock; damp = idle amount
  function story(tau, fc, damp) {
    const hand = easeIO(ramp(tau, 0.25, 1.15)), head = easeIO(ramp(tau, 0.35, 1.4)), free = easeIO(ramp(tau, REL, 2.7));
    const curl = easeIO(ramp(tau, 0.5, 2.7)), drift = easeIO(ramp(tau, 0.3, 4));
    const pose = {
      armA: lerpArr(POSE_A.armA, POSE_B.armA, hand),
      armB: lerpArr(POSE_A.armB, POSE_B.armB, free),
      legA: lerpArr(POSE_A.legA, POSE_B.legA, curl),
      legB: lerpArr(POSE_A.legB, POSE_B.legB, curl),
      head: lerp(POSE_A.head, POSE_B.head, head),
    };
    pose.armA[0] += Math.sin(fc * 1.1) * 3 * damp;
    pose.armB[1] += Math.sin(fc * 0.9 + 0.7) * 2 * damp;
    const body = {
      x: BODY0.x + 36 * drift + Math.sin(fc * 0.7 + 1) * 4 * damp,
      y: BODY0.y - 30 * drift + Math.sin(fc * 1.25) * 7 * damp,
      rot: 10 * drift + Math.sin(fc * 0.8) * 1.4 * damp,
      s: BODY0.s,
    };
    return { pose, body };
  }
  function tabletHeld(hand, body) {
    const rot = body.rot * 0.5, k = body.s, r = (rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), gx = GRIP[0] * k, gy = GRIP[1] * k;
    return { x: hand[0] - (gx * c - gy * s), y: hand[1] - (gx * s + gy * c), rot, k };
  }
  function alarmPulse(x) {
    const half = TL.sfx.alarm.period / 2, k = Math.floor(x / half), w = x - k * half;
    return (k % 2 === 0 ? 1 : 0.45) * Math.exp(-w / 0.16);
  }
  function heartPulse(x) {
    const h = TL.sfx.heartFast;
    if (x < h.start || x > h.end + 0.4) return 0;
    const ph = (x - h.start) % h.period;
    return Math.exp(-ph / 0.09) + (ph > 0.16 ? 0.7 * Math.exp(-(ph - 0.16) / 0.08) : 0);
  }

  // ---------- cabin (alarm → rewind → calm → push into the tablet) ----------
  let push = null;
  function cabin(t, fr) {
    if (t >= PUSH1) {
      push = null;
      show(E.cabin, 0);
      for (const id of ["tintRed", "flashRed", "tintAmber", "winGlow"]) show(E[id], 0);
      show(E.vig, 0.45);
      return;
    }
    let tau, fc, alarm, rew = 0;
    if (t < R0) { tau = t; fc = t; alarm = 1; }
    else if (t < R1) { tau = 4 * (1 - easeIO(ramp(t, R0 + 0.12, R1 - 0.38))); fc = tau; alarm = 1 - ease(ramp(t, R1 - 0.85, R1 - 0.15)); rew = fade(t, R0, R1, 0.06, 0.2); }
    else { tau = 0; fc = t - R1; alarm = 0; }
    const p = t < R1 ? 0 : easeIO(ramp(t, PUSH0, PUSH1));
    const cabVis = 1 - ease(ramp(p, 0.55, 1));
    show(E.cabin, cabVis);

    const { pose, body } = story(tau, fc, 1 - p);
    tr(E.astro, `translate(${n2(body.x)} ${n2(body.y)}) rotate(${n2(body.rot)}) scale(${body.s})`);
    tr(E.armA, `translate(${SH_A}) rotate(${n2(pose.armA[0])})`);
    tr(E.elbowA, `translate(0 ${UPPER}) rotate(${n2(pose.armA[1])})`);
    tr(E.armB, `translate(${SH_B}) rotate(${n2(pose.armB[0])})`);
    tr(E.elbowB, `translate(0 ${UPPER}) rotate(${n2(pose.armB[1])})`);
    for (const [k, hip] of [["A", HIP_A], ["B", HIP_B]]) {
      const L = pose["leg" + k];
      tr(E["leg" + k], `translate(${hip}) rotate(${n2(L[0])})`);
      tr(E["thigh" + k], `scale(1 ${L[2].toFixed(3)})`);
      tr(E["knee" + k], `translate(0 ${n2(THIGH * L[2])}) rotate(${n2(L[1])})`);
    }
    tr(E.head, `rotate(${n2(pose.head)} 0 -178)`);

    const held = tau < REL;
    const hand = toWorld(body, handLocal(SH_B, pose.armB[0], pose.armB[1]));
    let tab;
    if (held) tab = tabletHeld(hand, body);
    else {
      const s0 = story(REL, REL, 1);
      const a = tabletHeld(toWorld(s0.body, handLocal(SH_B, s0.pose.armB[0], s0.pose.armB[1])), s0.body);
      const d = tau - REL;
      tab = { x: a.x + 72 * d + 7 * d * d, y: a.y - 52 * d - 5 * d * d, rot: a.rot - 15 * d - 2.5 * d * d, k: a.k * (1 - 0.05 * d) };
    }
    tr(E.tablet, `translate(${n2(tab.x)} ${n2(tab.y)}) rotate(${n2(tab.rot)}) scale(${tab.k.toFixed(4)})`);
    show(E.thumb, held ? 1 : 0);
    if (held) { E.thumb.setAttribute("cx", n2(hand[0] + 4)); E.thumb.setAttribute("cy", n2(hand[1] - 3)); E.thumb.setAttribute("r", n2(13 * body.s)); }

    // camera: exponential zoom that lands the tablet screen exactly on the app frame
    let camS = 1, camX = 0, camY = 0;
    push = null;
    if (p > 0) {
      camS = Math.exp(Math.log(ALERT_RECT.w / (176 * tab.k)) * p);
      const cx = lerp(tab.x, ALERT_RECT.x + ALERT_RECT.w / 2, p), cy = lerp(tab.y, ALERT_RECT.y + ALERT_RECT.h / 2, p);
      camX = cx - camS * tab.x;
      camY = cy - camS * tab.y;
      const r = (tab.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), lx = -88 * tab.k, ly = -49.5 * tab.k;
      push = { x: camX + camS * (tab.x + lx * c - ly * s), y: camY + camS * (tab.y + lx * s + ly * c), rot: tab.rot, sc: (camS * 176 * tab.k) / 1920, p };
    }
    const jx = rew ? (rng(fr * 7919 + 1)() - 0.5) * 14 * rew : 0;
    tr(E.cam, `translate(${n2(camX + jx)} ${n2(camY)}) scale(${camS.toFixed(5)})`);

    // lighting: red alarm (beeps drive the strobe; it follows story time, so it reverses in the rewind)
    const ap = alarmPulse(tau);
    E.lightStrip.style.fill = mixC("#fff2d6", "#ff4040", alarm);
    E.beaconDome.style.fill = mixC("#4a3434", "#ff5050", alarm * (0.5 + 0.5 * ap));
    show(E.beam, alarm * (0.5 + 0.45 * ap));
    tr(E.beam, `rotate(${n2(48 * Math.sin(2 * Math.PI * 0.8 * tau))} 960 182)`);
    LEDS.forEach((l, i) => (l.style.fill = alarm > 0.5 ? ((fr + i * 3) % 8 < 4 ? "#ff4d4d" : "#5a1f1f") : LED_CALM[i]));
    E.monEcg.style.stroke = mixC("#4c8dff", "#ff5c5c", alarm);
    show(E.earthTag, t < R0 ? fade(t, 1.3, R0 - 0.05, 0.4, 0.3) : 0);
    show(E.tintRed, 0.6 * alarm * cabVis);
    show(E.flashRed, (0.1 + 0.32 * ap) * alarm * cabVis);
    show(E.tintAmber, 0.2 * (1 - alarm) * cabVis);
    show(E.winGlow, 0.6 * (1 - alarm) * cabVis);
    show(E.vig, 0.45 + 0.3 * cabVis + 0.22 * (t < R0 ? heartPulse(t) : 0));

    // tape effects during the rewind
    if (rew > 0) {
      const r = rng(fr * 31 + 5);
      const d = 4 + 5 * r();
      E.chromaR.setAttribute("dx", n2(d));
      E.chromaGB.setAttribute("dx", n2(-d));
      E.cam.setAttribute("filter", "url(#chroma)");
      E.cabin.style.filter = `contrast(1.12) saturate(1.25) brightness(${n2(0.95 + 0.18 * r())})`;
    } else {
      E.cam.removeAttribute("filter");
      E.cabin.style.filter = "";
    }
  }

  // ---------- app frame (placeholder, or the real /video-scene/ page with ?app=live) ----------
  let appO = 0;
  const rectTr = (r, k = 1, dy = 0) => {
    const w = r.w * k, h = r.h * k;
    return `translate(${n2(r.x + (r.w - w) / 2)}px, ${n2(r.y + (r.h - h) / 2 + dy)}px) scale(${(w / 1920).toFixed(5)})`;
  };
  function app(t) {
    let o = 0, transform = "", scene = null, local = 0;
    if (t >= PUSH0 && t < AL.end) {
      scene = "alert";
      local = t - AL.start;
      if (t < PUSH1) {
        if (push) {
          o = ease(ramp(push.p, 0.08, 0.45));
          transform = `translate(${n2(push.x)}px, ${n2(push.y)}px) rotate(${n2(push.rot)}deg) scale(${push.sc.toFixed(5)})`;
        }
      } else {
        const out = ease(ramp(t, AL.end - 0.3, AL.end));
        o = 1 - out;
        transform = rectTr(ALERT_RECT, 1 + 0.014 * ramp(t, PUSH1, AL.end) - 0.06 * out);
      }
    } else if (t >= MO.start && t < MO.end) {
      scene = "montage";
      local = t - MO.start;
      const out = ease(ramp(t, MO.end - 0.25, MO.end));
      o = Math.min(ease(ramp(t, MO.start, MO.start + 0.3)), 1 - out);
      let k = 1 + 0.008 * ramp(t, MO.start, MO.end) - 0.05 * out;
      for (const s of SHOTS.slice(1)) if (t >= s) k += 0.014 * Math.exp(-(t - s) / 0.14);
      transform = rectTr(MONT_RECT, k, 50 * (1 - easeOut(ramp(t, MO.start, MO.start + 0.45))));
    }
    appO = o;
    show(E.appwrap, o);
    if (!scene || o <= 0.001) return;
    E.appwrap.style.transform = transform;
    if (LIVE) liveSeek(scene, local);
    else placeholder(scene, local);
  }
  const SHOT_NAMES = ["Body figure · 10 indicators · status colors", "Indicator panel · reference limit + source", "Guidance in 4 layers · cited source", "Emergency button · first steps"];
  function placeholder(scene, local) {
    E.phScene.textContent = `APP SCENE · ${scene}`;
    E.phT.textContent = `local t = ${local.toFixed(2)} s`;
    if (scene === "alert") {
      const day = Math.round(lerp(AL.dayFrom, AL.dayTo, ramp(local, AL.dayStart, AL.dayEnd)));
      E.phMain.textContent = `Day ${day}`;
      E.phCard.textContent = "Resting heart rate above your baseline · 3 days";
      show(E.phCard, ease(ramp(local, AL.flagAt, AL.flagAt + 0.3)));
      E.phSub.textContent = local >= AL.panelAt ? "Heart rate panel: baseline band + trend" : day >= AL.dayTo ? "Heart zone turns yellow" : "All indicators normal";
    } else {
      const k = Math.max(0, MO.shots.filter((s) => local >= s).length - 1);
      E.phMain.textContent = `Shot ${k + 1}`;
      E.phSub.textContent = SHOT_NAMES[k];
      show(E.phCard, 0);
    }
  }
  const frames = {};
  function liveSeek(scene, local) {
    for (const k of Object.keys(frames)) frames[k].style.visibility = k === scene ? "visible" : "hidden";
    const w = frames[scene]?.contentWindow;
    if (w && typeof w.__seek === "function") w.__seek(local);
  }
  async function initLive() {
    E.appPh.remove();
    for (const scene of ["alert", "montage"]) {
      const f = document.createElement("iframe");
      f.src = `/video-scene/?scene=${scene}`;
      f.setAttribute("scrolling", "no");
      E.appwrap.appendChild(f);
      frames[scene] = f;
    }
    const t0 = performance.now();
    while (!Object.values(frames).every((f) => f.contentWindow && f.contentWindow.__sceneReady === true)) {
      if (performance.now() - t0 > 60000) throw new Error("video-scene not ready");
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // ---------- name card ----------
  const TAG_IN = V.v3 ? V.v3.start + 1.25 : SC.brand[0] + 1.4;
  let ECG_LEN = 2000;
  function brand(t) {
    const [b0, b1] = SC.brand;
    const o = t >= b0 && t < b1 ? 1 - ease(ramp(t, b1 - 0.22, b1)) : 0;
    show(E.brand, o);
    if (!o) return;
    const u = easeOut(ramp(t, b0, b0 + 0.75));
    E.wordmark.style.opacity = ease(ramp(t, b0 + 0.02, b0 + 0.28)).toFixed(3);
    E.wordmark.style.transform = `scale(${lerp(1.07, 1, u).toFixed(4)})`;
    E.wordmark.style.letterSpacing = `${lerp(0.14, 0.015, u).toFixed(4)}em`;
    E.wordmark.style.setProperty("--sweep", `${lerp(120, -20, ease(ramp(t, b0 + 0.2, b0 + 1.3))).toFixed(1)}%`);
    rise(E.tagline, ease(ramp(t, TAG_IN, TAG_IN + 0.45)), 18);
    E.ecgLine.style.strokeDashoffset = n2(ECG_LEN * (1 - easeOut(ramp(t, b0, b0 + 0.6))));
    const ph = ((t - (b0 + 0.6)) / 1.8) % 1;
    E.ecgPulse.style.opacity = t > b0 + 0.6 ? "1" : "0";
    E.ecgPulse.style.strokeDashoffset = n2(160 - ph * (ECG_LEN + 160));
    E.brandGlow.style.opacity = (0.35 + 0.65 * Math.exp(-(t - b0) / 0.4)).toFixed(3);
  }

  // ---------- credits ----------
  function credits(t) {
    const c0 = SC.credits[0];
    show(E.credits, t >= c0 ? 1 : 0);
    if (t < c0) return;
    rise(E.next, ease(ramp(t, (V.v5a ? V.v5a.start : c0) + 0.05, (V.v5a ? V.v5a.start : c0) + 0.45)), 16);
    rise(E.team, ease(ramp(t, c0 + 0.75, c0 + 1.15)), 16);
    E.names.querySelectorAll("span").forEach((s, i) => rise(s, ease(ramp(t, c0 + 1.05 + i * 0.09, c0 + 1.45 + i * 0.09)), 10));
    E.logos.style.opacity = ease(ramp(t, c0 + 0.05, c0 + 0.5)).toFixed(3); // fade only: the image itself is untouched
  }

  // ---------- titles, OSD, captions, labels ----------
  let DAY_W = 600, DAY_H = 140;
  function dayCounter(t) {
    let v = 118, big = 0, o;
    if (t < R0) o = ease(ramp(t, 0.15, 0.5));
    else if (t < R1) {
      o = 1;
      big = Math.min(easeIO(ramp(t, R0, R0 + 0.3)), 1 - easeIO(ramp(t, R1 - 0.45, R1 - 0.1)));
      v = 118 - 3 * easeIO(ramp(t, R0 + 0.3, R1 - 0.62));
    } else {
      o = 1 - ease(ramp(t, PUSH0 - 0.25, PUSH0 + 0.05));
      v = 115;
    }
    show(E.day, o);
    if (o <= 0.001) return;
    const x = lerp(64, 960 - DAY_W / 2, big), y = lerp(46, 300 - DAY_H / 2, big), s = lerp(0.34, 1, big);
    E.day.style.transform = `translate(${n2(x)}px, ${n2(y)}px) scale(${s.toFixed(4)})`;
    E.strip.style.transform = `translateY(${(-(v - 110)).toFixed(4)}em)`;
  }
  function noiseBars(fr, k) {
    const r = rng(fr * 104729 + 3);
    let s = "";
    for (let b = 0; b < 3; b++) {
      const y = ((fr * 37 + b * 380) % 1240) - 80, h = 26 + r() * 50;
      s += `<rect x="0" y="${n2(y)}" width="1920" height="${n2(h)}" fill="#fff" opacity="${n2((0.06 + r() * 0.1) * k)}"/>`;
      for (let i = 0; i < 26; i++) s += `<rect x="${n2(r() * 1920)}" y="${n2(y + r() * h)}" width="${n2(20 + r() * 140)}" height="${n2(1.5 + r() * 3)}" fill="#fff" opacity="${n2((0.25 + r() * 0.5) * k)}"/>`;
    }
    E.noise.innerHTML = s;
  }
  function overlays(t, fr) {
    const l1 = fade(t, 0.35, R0 - 0.05, 0.4, 0.3), l2 = fade(t, 1.1, R0 - 0.05, 0.4, 0.3);
    rise(E.t1a, l1, 18);
    rise(E.t1b, l2, 18);
    show(E.lowband, Math.max(l1, l2) * 0.9);

    const rew = t >= R0 && t < R1 + 0.2 ? fade(t, R0, R1 + 0.15, 0.06, 0.25) : 0;
    show(E.osdRew, rew * (fr % 20 < 13 ? 1 : 0.3));
    show(E.scan, rew * 0.6);
    show(E.noise, rew);
    if (rew > 0) noiseBars(fr, rew);
    else if (E.noise.childElementCount) E.noise.innerHTML = "";
    const q = V.v1 ? fade(t, V.v1.start - 0.08, R1 + 0.1, 0.22, 0.3) : 0;
    show(E.question, q);
    show(E.qband, q * 0.85);
    if (V.v1) E.question.style.transform = `scale(${lerp(0.97, 1, easeOut(ramp(t, V.v1.start - 0.08, V.v1.start + 0.5))).toFixed(4)})`;
    dayCounter(t);

    show(E.montTitle, fade(t, MO.start + 0.15, MO.end - 0.05, 0.35, 0.25));
    show(E.refChip, fade(t, SHOTS[1] + 0.12, SHOTS[2] + 0.05, 0.25, 0.2));

    const c = TL.captions.find((x) => t >= x.start - 0.06 && t < x.end);
    if (c) {
      if (E.caption.textContent !== c.text) E.caption.textContent = c.text;
      show(E.caption, Math.min(ease(ramp(t, c.start - 0.06, c.start + 0.08)), 1 - ease(ramp(t, c.end - 0.14, c.end))));
    } else show(E.caption, 0);

    show(E.proto, appO);
    E.wm.style.bottom = `${n2(lerp(22, 194, ease(ramp(t, SC.credits[0] + 0.05, SC.credits[0] + 0.5))))}px`;

    let fl = 0;
    if (t >= R0 && t < R0 + 0.4) fl = Math.max(fl, 0.3 * Math.exp(-(t - R0) / 0.07));
    if (t >= R1 && t < R1 + 0.4) fl = Math.max(fl, 0.18 * Math.exp(-(t - R1) / 0.09));
    const b0 = SC.brand[0];
    if (t >= b0 && t < b0 + 0.6) fl = Math.max(fl, 0.55 * Math.exp(-(t - b0) / 0.1));
    show(E.flash, fl);
  }

  function space(t) {
    E.starfield.setAttribute("transform", `translate(${n2(-6 * t)} 0)`);
    for (let i = 0; i < twinkle.length; i += 2) {
      const s = twinkle[i];
      s.el.setAttribute("opacity", (s.o * (0.6 + 0.4 * Math.sin(6.283 * s.f * t + s.p))).toFixed(3));
    }
  }

  // ---------- the single clock ----------
  function seek(t) {
    t = clamp(t, 0, TL.total);
    const fr = Math.round(t * TL.fps);
    space(t);
    cabin(t, fr);
    app(t);
    brand(t);
    credits(t);
    overlays(t, fr);
    return true;
  }
  window.seek = seek;

  (async () => {
    await document.fonts.ready;
    try { await E.logo.decode(); } catch { /* still shown when loaded */ }
    ECG_LEN = E.ecgLine.getTotalLength();
    E.ecgLine.style.strokeDasharray = `${ECG_LEN} ${ECG_LEN}`;
    E.ecgPulse.style.strokeDasharray = `160 ${ECG_LEN + 400}`;
    E.day.style.transform = "none";
    const b = E.day.getBoundingClientRect();
    DAY_W = b.width;
    DAY_H = b.height;
    if (LIVE) await initLive();
    seek(0);
    window.__stageReady = true;
  })();
})();
