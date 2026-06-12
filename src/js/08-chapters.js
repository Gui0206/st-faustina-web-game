/* Chapter registry + helpers shared across scenes. */

const CHAPTERS = [
  { id: 'ch1', num: 'I',    title: 'A Voice in the Night', place: 'Głogowiec · 1912' },
  { id: 'ch2', num: 'II',   title: 'The Dance',            place: 'Łódź · 1924' },
  { id: 'ch3', num: 'III',  title: 'The Doors',            place: 'Warsaw · 1925' },
  { id: 'ch4', num: 'IV',   title: 'Small Things',         place: 'The Convent · 1926–1930' },
  { id: 'ch5', num: 'V',    title: 'Paint an Image',       place: 'Płock · 22 February 1931' },
  { id: 'ch6', num: 'VI',   title: 'The Chaplet',          place: 'Vilnius · September 1935' },
  { id: 'ch7', num: 'VII',  title: 'The Gate',             place: 'Kraków · 1937' },
  { id: 'ch8', num: 'VIII', title: 'The Dark Night',       place: 'Prądnik Sanatorium · 1938' },
  { id: 'ch9', num: 'IX',   title: 'Jezu, Ufam Tobie',     place: 'Kraków-Łagiewniki · 5 October 1938' },
  { id: 'epilogue', num: '', title: 'The Spark',           place: '1938 — today', menuTitle: 'The Spark (epilogue)' },
];

const SCENES = {};

/* hold-to-pray bloom: the game's recurring verb.
   rises while held, ebbs gently when released; drives light + pad swell. */
class PrayBloom {
  constructor(opts = {}) {
    this.v = 0;
    this.riseTime = opts.riseTime || 2.6;   // seconds of holding to reach 1
    this.fall = opts.fall || 0.12;          // per second when released
    this.muted = opts.muted || false;       // ch8: the hold that "doesn't answer"
    this.onFull = opts.onFull || null;
    this._wasFull = false;
  }
  update(dt) {
    if (Input.down && !Menu.open) {
      const gain = this.muted ? 0.012 : 1 / this.riseTime;
      this.v = clamp01(this.v + gain * dt);
    } else {
      this.v = clamp01(this.v - this.fall * dt);
    }
    if (this.v >= 1 && !this._wasFull) { this._wasFull = true; if (this.onFull) this.onFull(); }
    if (this.v < 0.85) this._wasFull = false;
    return this.v;
  }
}

/* a figure that walks toward a target x while input held (or arrow keys) */
class Walker {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.speed = opts.speed || 120;
    this.phase = 0;
    this.moving = 0;
    this.face = 1;
    this.stepT = 0;
    this.onStep = opts.onStep || null;
  }
  update(dt, dir) {
    const want = clamp(dir, -1, 1);
    this.moving = damp(this.moving, want !== 0 ? 1 : 0, 8, dt);
    if (want !== 0) this.face = want;
    this.x += want * this.speed * dt;
    if (this.moving > 0.2) {
      this.phase += dt * 7 * this.moving;
      this.stepT -= dt;
      if (this.stepT <= 0) { this.stepT = 0.42; if (this.onStep) this.onStep(); }
    }
  }
}

/* soft radial light pool (lamps, windows). breathing intensity */
function lamp(ctx, x, y, r, color, intensity, t, flickerAmt = 0.08) {
  const fl = 1 + wobble(t * 9 + x) * flickerAmt;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp01(intensity);
  R.glow(ctx, x, y, r * fl, color);
  ctx.restore();
}

/* breathing/cadence ring used by the chaplet + final scene */
function drawRing(ctx, x, y, baseR, pulse01, alpha, color = '#ffeec9') {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, baseR * (0.82 + pulse01 * 0.3), 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.3;
  R.glow(ctx, x, y, baseR * 0.5, color);
  ctx.restore();
}

/* shared painting store (set in ch5, used in epilogue keepsake) */
const Painting = {
  strokes: [],          // {kind:'garment'|'ray_red'|'ray_pale', pts:[{x,y}]} unit space
  sigProgress: 0,
  load() {
    try {
      const s = Save.data.strokes;
      if (!Array.isArray(s)) return false;
      this.strokes = s
        .filter(o => o && typeof o.k === 'string' && Array.isArray(o.p))
        .map(o => ({
          kind: o.k,
          pts: o.p.filter(p => Array.isArray(p) && p.length >= 2).map(([x, y]) => ({ x: +x || 0, y: +y || 0 })),
        }))
        .filter(o => o.pts.length > 1);
      this.sigProgress = 1;
      return this.strokes.length > 0;
    } catch (e) { this.strokes = []; return false; }
  },
  /* render the player's painting into ctx within rect (x,y,w,h); unit coords map to rect */
  render(ctx, x, y, w, h, opts = {}) {
    const P = u => ({ x: x + u.x * w, y: y + u.y * h });
    const glowAmt = opts.glow !== undefined ? opts.glow : 1;
    /* garment strokes: stacked soft light */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.strokes) {
      if (s.kind !== 'garment') continue;
      for (let i = 0; i < s.pts.length; i += 2) {
        const p = P(s.pts[i]);
        ctx.globalAlpha = 0.075 * glowAmt;
        R.glow(ctx, p.x, p.y, w * 0.1, '#f4ead2');
      }
    }
    /* rays: soft fans of light along the player's own path */
    for (const s of this.strokes) {
      if (s.kind !== 'ray_red' && s.kind !== 'ray_pale') continue;
      const col = s.kind === 'ray_red' ? '#e8364c' : '#cfdcff';
      const core = s.kind === 'ray_red' ? '#ff8a98' : '#f4f8ff';
      const pts = s.pts.map(P);
      drawTaperedPath(ctx, pts, w * 0.2, col, 0.13 * glowAmt);     // wide halo
      drawTaperedPath(ctx, pts, w * 0.1, col, 0.22 * glowAmt);     // body
      drawTaperedPath(ctx, pts, w * 0.038, core, 0.3 * glowAmt);   // gentle core
    }
    ctx.restore();
    /* signature */
    if (this.sigProgress > 0.01) {
      ctx.save();
      const fs = h * 0.052;
      ctx.font = `italic ${fs}px "Iowan Old Style","Palatino Linotype",Georgia,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tx = x + w / 2, ty = y + h * 0.91;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, ty - fs, w * this.sigProgress, fs * 2);
      ctx.clip();
      ctx.fillStyle = `rgba(238,228,205,${0.92 * (opts.alpha === undefined ? 1 : opts.alpha)})`;
      ctx.shadowColor = 'rgba(255,238,200,0.6)'; ctx.shadowBlur = 12 * glowAmt;
      ctx.fillText('Jezu, ufam Tobie', tx, ty);
      ctx.restore();
      ctx.restore();
    }
  },
};

function drawTaperedPath(ctx, pts, maxW, color, alpha) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  const n = pts.length;
  for (let i = 1; i < n; i++) {
    const t = i / (n - 1);
    ctx.globalAlpha = alpha * (1 - t * 0.25);
    ctx.lineWidth = maxW * (0.35 + 0.65 * t);   // widens away from the heart
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

/* smooth a recorded polyline (moving average, then resample) */
function smoothPath(pts, passes = 2) {
  let p = pts.slice();
  for (let k = 0; k < passes; k++) {
    const out = [p[0]];
    for (let i = 1; i < p.length - 1; i++) {
      out.push({ x: (p[i - 1].x + p[i].x * 2 + p[i + 1].x) / 4, y: (p[i - 1].y + p[i].y * 2 + p[i + 1].y) / 4 });
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
