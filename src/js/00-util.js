/* Math, easing, tweens, RNG, color. Everything here is engine-agnostic. */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a, b, t) => a + (b - a) * t;
const remap = (v, a0, a1, b0, b1) => b0 + (b1 - b0) * clamp01((v - a0) / (a1 - a0));
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
/* frame-rate independent exponential approach */
const damp = (cur, target, k, dt) => lerp(cur, target, 1 - Math.exp(-k * dt));

/* deterministic-ish rng with reseed (kept simple; date-seeding not needed here) */
let _rngState = 1234567;
function srand(seed) { _rngState = seed >>> 0 || 1; }
function rng() {
  _rngState ^= _rngState << 13; _rngState >>>= 0;
  _rngState ^= _rngState >> 17;
  _rngState ^= _rngState << 5; _rngState >>>= 0;
  return _rngState / 4294967296;
}
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randSign = () => Math.random() < 0.5 ? -1 : 1;
const pick = arr => arr[(Math.random() * arr.length) | 0];

/* ---------- easing ---------- */
const Ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
};

/* ---------- tween manager ---------- */
const Tweens = {
  list: [],
  /* tween(obj, {prop: target,...}, dur, {ease, delay, onDone, key}) — key replaces */
  to(obj, props, dur, opts = {}) {
    const key = opts.key;
    if (key) this.kill(key);
    const tw = {
      obj, dur: Math.max(dur, 0.0001), t: -(opts.delay || 0),
      ease: opts.ease || Ease.outCubic, onDone: opts.onDone, key,
      from: {}, to: props, started: false, dead: false,
    };
    this.list.push(tw);
    return tw;
  },
  kill(key) {
    for (const tw of this.list) if (tw.key === key) tw.dead = true;
  },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const tw = L[i];
      if (tw.dead) { L.splice(i, 1); continue; }
      tw.t += dt;
      if (tw.t < 0) continue;
      if (!tw.started) {
        tw.started = true;
        for (const k in tw.to) tw.from[k] = tw.obj[k];
      }
      const p = clamp01(tw.t / tw.dur);
      const e = tw.ease(p);
      for (const k in tw.to) tw.obj[k] = lerp(tw.from[k], tw.to[k], e);
      if (p >= 1) {
        L.splice(i, 1);
        if (tw.onDone) tw.onDone();
      }
    }
  },
  clear() { this.list.length = 0; },
};

/* ---------- color ---------- */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mixHex(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

/* smooth value-noise-ish wobble: cheap layered sines, good for drift/flicker */
function wobble(t, f1 = 1, f2 = 2.7, f3 = 6.1) {
  return Math.sin(t * f1) * 0.55 + Math.sin(t * f2 + 1.3) * 0.3 + Math.sin(t * f3 + 4.1) * 0.15;
}
