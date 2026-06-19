/* View (virtual coordinates, resize) + R (draw helpers: glows, skies, grain,
   vignette, rays, and the parametric silhouette figures that are the game's cast). */

const View = {
  canvas: null, ctx: null,
  dpr: 1, pixW: 0, pixH: 0,
  H: 900, W: 1600,          // world units; H fixed, W follows aspect
  scale: 1,
  left: -800, right: 800, top: 0, bottom: 900,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.pixW = Math.round(innerWidth * this.dpr);
    this.pixH = Math.round(innerHeight * this.dpr);
    this.canvas.width = this.pixW; this.canvas.height = this.pixH;
    /* fit height, but never show less than 1180 world units of width —
       narrow/portrait screens letterbox vertically instead of cropping scenes */
    this.scale = Math.min(this.pixH / this.H, this.pixW / 1180);
    this.W = this.pixW / this.scale;
    R.onResize();
  },
  /* camera transform; cam = {x, y, zoom, shakeX, shakeY} with (x,y) at canvas center */
  apply(cam) {
    const S = this.scale * cam.zoom;
    this.ctx.setTransform(S, 0, 0, S,
      this.pixW / 2 - (cam.x + cam.shakeX) * S,
      this.pixH / 2 - (cam.y + cam.shakeY) * S);
    this.left = cam.x - this.pixW / 2 / S;
    this.right = cam.x + this.pixW / 2 / S;
    this.top = cam.y - this.pixH / 2 / S;
    this.bottom = cam.y + this.pixH / 2 / S;
  },
  toWorld(clientX, clientY) {
    const cam = Engine.cam;
    const S = this.scale * cam.zoom;
    return {
      x: (clientX * this.dpr - (this.pixW / 2 - (cam.x + cam.shakeX) * S)) / S,
      y: (clientY * this.dpr - (this.pixH / 2 - (cam.y + cam.shakeY) * S)) / S,
    };
  },
};

const R = {
  _glowCache: new Map(),
  _gradCache: new Map(),
  _grainTiles: [],
  _vignette: null,

  onResize() { this._vignette = null; },

  /* ---------- cached soft glow disc ---------- */
  glow(ctx, x, y, r, color) {
    let c = this._glowCache.get(color);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, color);
      grad.addColorStop(0.28, rgbaFromAny(color, 0.42));
      grad.addColorStop(0.65, rgbaFromAny(color, 0.1));
      grad.addColorStop(1, rgbaFromAny(color, 0));
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      this._glowCache.set(color, c);
    }
    ctx.drawImage(c, x - r, y - r, r * 2, r * 2);
  },

  /* a small stylized rose seen face-on: a ring of outer petals, a lighter
     inner whorl, and a coiled eye. drawn at (x,y), radius r, spun by rot.
     radially symmetric, so it reads right at any orientation. */
  rose(ctx, x, y, r, rot, color) {
    if (r < 0.6) return;
    const light = mixHex(color, '#ffd9e0', 0.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * TAU);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.58, r * 0.46, r * 0.34, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = light;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * TAU + 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.3, r * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = mixHex(color, '#3a0a14', 0.35);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, TAU); ctx.fill();
    ctx.restore();
  },

  /* ---------- sky / backdrop gradient (cached per key) ---------- */
  sky(ctx, key, stops, x, y, w, h, horizontal = false) {
    let g = this._gradCache.get(key);
    if (!g) {
      g = horizontal ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
      for (const [p, c] of stops) g.addColorStop(p, c);
      this._gradCache.set(key, g);
    }
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  },

  /* ---------- film grain ---------- */
  initGrain() {
    if (this._grainTiles.length) return;
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('canvas'); c.width = c.height = 192;
      const g = c.getContext('2d');
      const img = g.createImageData(192, 192);
      for (let j = 0; j < img.data.length; j += 4) {
        const v = 100 + Math.random() * 90 | 0;
        img.data[j] = img.data[j + 1] = img.data[j + 2] = v;
        img.data[j + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      this._grainTiles.push(c);
    }
  },
  grain(ctx, amount) {
    if (amount <= 0.001) return;
    this.initGrain();
    const tile = this._grainTiles[(Math.random() * 3) | 0];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amount;
    const ox = (Math.random() * 192) | 0, oy = (Math.random() * 192) | 0;
    const size = 192 * Math.max(1, View.dpr);
    for (let x = -ox; x < View.pixW; x += size)
      for (let y = -oy; y < View.pixH; y += size)
        ctx.drawImage(tile, x, y, size, size);
    ctx.restore();
  },

  vignette(ctx, strength = 0.6) {
    if (!this._vignette) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512 * View.pixH / Math.max(View.pixW, 1);
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.36, c.width / 2, c.height / 2, c.height * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
      this._vignette = c;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = strength;
    ctx.drawImage(this._vignette, 0, 0, View.pixW, View.pixH);
    ctx.restore();
  },

  letterbox(ctx, amount) {
    if (amount <= 0.001) return;
    const h = View.pixH * 0.09 * amount;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, View.pixW, h);
    ctx.fillRect(0, View.pixH - h, View.pixW, h);
    ctx.restore();
  },

  /* ---------- the two rays (the game's leitmotif) ----------
     From a source point: red ray toward viewer-left, pale toward viewer-right.
     intensity 0..1; t animates shimmer. */
  mercyRays(ctx, x, y, intensity, t, opts = {}) {
    if (intensity <= 0.004) return;
    const len = opts.len || 900;
    const baseAngle = opts.angle !== undefined ? opts.angle : Math.PI / 2; // downward
    const spread = opts.spread || 0.34;
    const beams = [
      { off: -spread / 2 - 0.06, color: '#ff4d5e', core: '#ffb3bb' },   // blood
      { off: spread / 2 + 0.06, color: '#dfe9ff', core: '#ffffff' },    // water
    ];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of beams) {
      const ang = baseAngle + b.off;
      const w = (opts.width || 0.17) + Math.sin(t * 0.8 + b.off * 10) * 0.012;
      for (let i = 0; i < 3; i++) {
        const ww = w * (1 + i * 0.85);
        const a = intensity * [0.34, 0.14, 0.06][i] * (1 + 0.12 * Math.sin(t * 1.7 + i * 2 + b.off * 5));
        ctx.globalAlpha = clamp01(a);
        ctx.fillStyle = i === 0 ? b.core : b.color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang - ww) * len, y + Math.sin(ang - ww) * len);
        ctx.lineTo(x + Math.cos(ang + ww) * len, y + Math.sin(ang + ww) * len);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = clamp01(intensity * 0.85);
    this.glow(ctx, x, y, 70 + 26 * Math.sin(t * 1.3), '#fff6e8');
    ctx.restore();
  },

  /* ---------- figures (all silhouettes; no faces, ever) ---------- */

  /* a nun in habit. opts: {kneel, bow(0..1), walk(phase), flip, color, veil} */
  nun(ctx, x, y, h, opts = {}) {
    const c = opts.color || '#100c14';
    const bow = opts.bow || 0;
    const kneel = opts.kneel ? 1 : 0;
    const ph = opts.walk || 0;
    const bobY = opts.walk !== undefined ? Math.sin(ph * 2) * h * 0.012 : 0;
    const H = h * (1 - kneel * 0.34);
    const sway = opts.walk !== undefined ? Math.sin(ph) * h * 0.02 : 0;
    /* kneeling: legs fold away and the habit spreads wide on the floor, so the
       lower bell flares out into a low triangle instead of a short standing column */
    const kw = 1 + kneel * 0.75;
    ctx.save();
    ctx.translate(x, y + bobY);
    if (opts.flip) ctx.scale(-1, 1);
    ctx.fillStyle = c;
    const headR = H * 0.075;
    const headX = bow * H * 0.13, headY = -H * 0.86 + bow * H * 0.06;
    /* habit: bell silhouette (skirt pools wide when kneeling) */
    ctx.beginPath();
    ctx.moveTo(-H * 0.17 * kw + sway * 0.4, 0);
    ctx.bezierCurveTo(-H * 0.20 * kw + sway, -H * 0.42, -H * 0.115 * kw, -H * 0.62, -H * 0.105 + headX * 0.5, -H * 0.76);
    ctx.lineTo(H * 0.105 + headX * 0.5, -H * 0.76);
    ctx.bezierCurveTo(H * 0.115 * kw, -H * 0.62, H * 0.20 * kw + sway, -H * 0.42, H * 0.17 * kw + sway * 0.4, 0);
    ctx.closePath(); ctx.fill();
    /* head */
    ctx.beginPath(); ctx.arc(headX, headY, headR, 0, TAU); ctx.fill();
    /* veil falling behind head to shoulders */
    ctx.beginPath();
    ctx.moveTo(headX - headR * 1.15, headY - headR * 0.4);
    ctx.quadraticCurveTo(headX, headY - headR * 1.75, headX + headR * 1.15, headY - headR * 0.4);
    ctx.quadraticCurveTo(headX + headR * 1.7, headY + headR * 2.6, headX + headR * 1.2, -H * 0.72);
    ctx.lineTo(headX - headR * 1.2, -H * 0.72);
    ctx.quadraticCurveTo(headX - headR * 1.7, headY + headR * 2.6, headX - headR * 1.15, headY - headR * 0.4);
    ctx.closePath(); ctx.fill();
    if (kneel) { /* skirt pooled wide on the floor */
      ctx.beginPath(); ctx.ellipse(0, 0, H * 0.30 * kw, H * 0.07, 0, 0, TAU); ctx.fill();
    }
    /* pale band of the coif framing the face (tiny accent of light) */
    ctx.fillStyle = opts.coif || 'rgba(228,220,205,0.85)';
    ctx.beginPath();
    ctx.ellipse(headX + headR * 0.32, headY, headR * 0.62, headR * 0.78, 0, -1.2, 1.2);
    ctx.fill();
    ctx.restore();
  },

  /* a child in a shawl, kneeling or standing */
  child(ctx, x, y, h, opts = {}) {
    const c = opts.color || '#15101a';
    const kneel = opts.kneel ? 1 : 0;
    const H = h * (1 - kneel * 0.3);
    ctx.save(); ctx.translate(x, y);
    if (opts.flip) ctx.scale(-1, 1);
    ctx.fillStyle = c;
    const headR = H * 0.105;
    ctx.beginPath();
    ctx.moveTo(-H * 0.2, 0);
    ctx.bezierCurveTo(-H * 0.22, -H * 0.5, -H * 0.12, -H * 0.68, 0, -H * 0.7);
    ctx.bezierCurveTo(H * 0.12, -H * 0.68, H * 0.22, -H * 0.5, H * 0.2, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -H * 0.8, headR, 0, TAU); ctx.fill();
    /* shawl over head */
    ctx.beginPath();
    ctx.moveTo(-headR * 1.3, -H * 0.78);
    ctx.quadraticCurveTo(0, -H * 0.8 - headR * 1.9, headR * 1.3, -H * 0.78);
    ctx.quadraticCurveTo(headR * 1.1, -H * 0.62, 0, -H * 0.6);
    ctx.quadraticCurveTo(-headR * 1.1, -H * 0.62, -headR * 1.3, -H * 0.78);
    ctx.fill();
    if (opts.kneel) { ctx.beginPath(); ctx.ellipse(0, 0, H * 0.24, H * 0.05, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },

  /* a young woman in a dress — Helena before the convent.
     opts: {kneel, flip, color, walk(phase)} */
  maiden(ctx, x, y, h, opts = {}) {
    const c = opts.color || '#241420';
    const kneel = opts.kneel ? 1 : 0;
    const H = h * (1 - kneel * 0.32);
    const ph = opts.walk || 0;
    const bobY = opts.walk !== undefined ? Math.sin(ph * 2) * H * 0.012 : 0;
    const sway = opts.walk !== undefined ? Math.sin(ph) * H * 0.025 : 0;
    ctx.save();
    ctx.translate(x, y + bobY);
    if (opts.flip) ctx.scale(-1, 1);
    ctx.fillStyle = c;
    const headR = H * 0.062;
    const headY = -H * 0.875;
    /* skirt: waist flaring to hem */
    ctx.beginPath();
    ctx.moveTo(-H * 0.175 + sway * 0.5, 0);
    ctx.bezierCurveTo(-H * 0.13 + sway, -H * 0.28, -H * 0.055, -H * 0.42, -H * 0.05, -H * 0.5);
    ctx.lineTo(H * 0.05, -H * 0.5);
    ctx.bezierCurveTo(H * 0.055, -H * 0.42, H * 0.13 + sway, -H * 0.28, H * 0.175 + sway * 0.5, 0);
    ctx.closePath(); ctx.fill();
    /* bodice */
    ctx.beginPath();
    ctx.moveTo(-H * 0.055, -H * 0.49);
    ctx.bezierCurveTo(-H * 0.075, -H * 0.62, -H * 0.085, -H * 0.7, -H * 0.07, -H * 0.77);
    ctx.quadraticCurveTo(0, -H * 0.81, H * 0.07, -H * 0.77);
    ctx.bezierCurveTo(H * 0.085, -H * 0.7, H * 0.075, -H * 0.62, H * 0.055, -H * 0.49);
    ctx.closePath(); ctx.fill();
    /* head + low bun */
    ctx.beginPath(); ctx.arc(0, headY, headR, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-headR * 0.75, headY + headR * 0.42, headR * 0.55, 0, TAU); ctx.fill();
    if (kneel) { ctx.beginPath(); ctx.ellipse(0, 0, H * 0.24, H * 0.05, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },

  /* generic cloaked figure (the poor at the gate, passersby) */
  cloaked(ctx, x, y, h, opts = {}) {
    const c = opts.color || '#0e0b11';
    const hunch = opts.hunch || 0;
    ctx.save(); ctx.translate(x, y);
    if (opts.flip) ctx.scale(-1, 1);
    ctx.fillStyle = c;
    const headR = h * 0.08;
    ctx.beginPath();
    ctx.moveTo(-h * 0.16, 0);
    ctx.bezierCurveTo(-h * 0.2, -h * 0.45, -h * 0.1 - hunch * h * 0.06, -h * 0.66, hunch * h * 0.1, -h * 0.78 + hunch * h * 0.1);
    ctx.bezierCurveTo(h * 0.14, -h * 0.7, h * 0.19, -h * 0.4, h * 0.15, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(hunch * h * 0.12, -h * 0.82 + hunch * h * 0.12, headR, 0, TAU); ctx.fill();
    /* hood */
    ctx.beginPath();
    ctx.arc(hunch * h * 0.12, -h * 0.83 + hunch * h * 0.12, headR * 1.35, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.restore();
  },

  /* a waltzing couple, abstracted — two leaning silhouettes joined at the base */
  dancers(ctx, x, y, h, phase, opts = {}) {
    const c = opts.color || '#19121f';
    const lean = Math.sin(phase) * 0.16;
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean * 0.4);
    ctx.fillStyle = c;
    for (const s of [-1, 1]) {
      const hh = h * (s === 1 ? 1 : 0.94);
      ctx.save();
      ctx.rotate(s * (0.1 + lean * s * 0.3));
      ctx.beginPath();
      ctx.moveTo(s * -h * 0.02 - h * 0.13, 0);
      ctx.bezierCurveTo(s * h * 0.02 - h * 0.16, -hh * 0.5, s * h * 0.05 - h * 0.07, -hh * 0.72, s * h * 0.06, -hh * 0.78);
      ctx.bezierCurveTo(s * h * 0.06 + h * 0.07, -hh * 0.72, s * h * 0.04 + h * 0.16, -hh * 0.5, s * h * 0.02 + h * 0.13, 0);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(s * h * 0.055, -hh * 0.85, hh * 0.062, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },

  /* Christ — only ever light. A luminous vertical presence; never a detailed face.
     opts: {rays(0..1), t, raise(0..1) right hand of blessing, h} */
  lumen(ctx, x, y, h, t, opts = {}) {
    const I = opts.intensity !== undefined ? opts.intensity : 1;
    if (I <= 0.004) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const breathe = 1 + Math.sin(t * 0.7) * 0.03;
    /* aura columns — soft, never clipping to solid white */
    ctx.globalAlpha = I * 0.34;
    this.glow(ctx, x, y - h * 0.48, h * 0.9 * breathe, 'rgba(255,243,222,0.5)');
    ctx.globalAlpha = I * 0.4;
    this.glow(ctx, x, y - h * 0.6, h * 0.42 * breathe, 'rgba(255,250,238,0.6)');
    /* body of light: a veiled robe, brightest at the shoulders, dissolving down */
    ctx.globalAlpha = I * 0.6;
    const grd = ctx.createLinearGradient(0, y - h, 0, y);
    grd.addColorStop(0, 'rgba(255,251,240,0.6)');
    grd.addColorStop(0.35, 'rgba(255,246,226,0.42)');
    grd.addColorStop(0.8, 'rgba(255,238,205,0.12)');
    grd.addColorStop(1, 'rgba(255,236,200,0.0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.115, y);
    ctx.bezierCurveTo(x - h * 0.14, y - h * 0.5, x - h * 0.085, y - h * 0.72, x - h * 0.07, y - h * 0.8);
    ctx.quadraticCurveTo(x, y - h * 0.855, x + h * 0.07, y - h * 0.8);
    ctx.bezierCurveTo(x + h * 0.085, y - h * 0.72, x + h * 0.14, y - h * 0.5, x + h * 0.115, y);
    ctx.closePath(); ctx.fill();
    /* sleeves: two faint falling folds */
    ctx.globalAlpha = I * 0.22;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.07, y - h * 0.72);
    ctx.quadraticCurveTo(x - h * 0.19, y - h * 0.52, x - h * 0.165, y - h * 0.34);
    ctx.lineTo(x - h * 0.1, y - h * 0.42);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + h * 0.07, y - h * 0.72);
    ctx.quadraticCurveTo(x + h * 0.16, y - h * 0.56, x + h * 0.12, y - h * 0.44);
    ctx.lineTo(x + h * 0.075, y - h * 0.52);
    ctx.closePath(); ctx.fill();
    /* head of light, distinct above the shoulders */
    ctx.globalAlpha = I * 0.85;
    this.glow(ctx, x, y - h * 0.9, h * 0.1, '#fffdf6');
    ctx.globalAlpha = I * 0.3;
    this.glow(ctx, x, y - h * 0.9, h * 0.2, 'rgba(255,242,210,0.6)');
    /* raised right hand (viewer-left) — a small star of light */
    const raise = opts.raise !== undefined ? opts.raise : 1;
    if (raise > 0.01) {
      ctx.globalAlpha = I * raise;
      this.glow(ctx, x - h * 0.17, y - h * 0.62 - raise * h * 0.1, h * 0.075, '#fff9ec');
    }
    /* left hand at the heart */
    ctx.globalAlpha = I * 0.9;
    this.glow(ctx, x + h * 0.045, y - h * 0.52, h * 0.06, '#fff3da');
    ctx.restore();
    /* the rays from the heart */
    if (opts.rays > 0.004) {
      this.mercyRays(ctx, x + h * 0.01, y - h * 0.5, opts.rays * I, t, {
        len: opts.rayLen || h * 1.9, angle: Math.PI / 2, spread: 0.5, width: 0.14,
      });
    }
  },

  /* candle with live flame. lit 0..1, t for flicker */
  candle(ctx, x, y, s, t, lit = 1, opts = {}) {
    ctx.save();
    /* stick */
    ctx.fillStyle = opts.wax || '#d8cdb4';
    ctx.fillRect(x - s * 0.07, y - s * 0.5, s * 0.14, s * 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + s * 0.02, y - s * 0.5, s * 0.05, s * 0.5);
    if (lit > 0.01) {
      const fl = wobble(t * 7) * 0.5 + wobble(t * 23, 2, 5, 9) * 0.5;
      const fh = s * (0.30 + 0.06 * fl) * (0.35 + lit * 0.65);
      const fx = x + fl * s * 0.03;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = lit * 0.85;
      this.glow(ctx, fx, y - s * 0.56 - fh * 0.4, s * (1.5 + 0.25 * fl) * lit, 'rgba(255,196,110,0.6)');
      /* flame teardrop */
      ctx.globalAlpha = Math.min(1, lit * 1.2);
      const g = ctx.createLinearGradient(0, y - s * 0.52 - fh, 0, y - s * 0.5);
      g.addColorStop(0, '#fff8e0'); g.addColorStop(0.45, '#ffd27a'); g.addColorStop(1, 'rgba(255,140,40,0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx, y - s * 0.52 - fh);
      ctx.bezierCurveTo(fx + fh * 0.34, y - s * 0.5 - fh * 0.45, fx + fh * 0.22, y - s * 0.5, fx, y - s * 0.49);
      ctx.bezierCurveTo(fx - fh * 0.22, y - s * 0.5, fx - fh * 0.34, y - s * 0.5 - fh * 0.45, fx, y - s * 0.52 - fh);
      ctx.fill();
      ctx.globalAlpha = lit;
      this.glow(ctx, fx, y - s * 0.55 - fh * 0.55, fh * 0.30, '#fffdf2');
    }
    ctx.restore();
  },

  /* bare winter tree, deterministic per seed, cached */
  _treeCache: new Map(),
  tree(ctx, x, y, h, seed, color = '#0a070c') {
    const key = seed + '_' + color;
    let c = this._treeCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.strokeStyle = color; g.lineCap = 'round';
      srand(seed);
      const branch = (bx, by, ang, len, w, depth) => {
        if (depth <= 0 || len < 4) return;
        const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
        g.lineWidth = w;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
        const n = 2 + (rng() * 2 | 0);
        for (let i = 0; i < n; i++) {
          branch(ex, ey, ang + (rng() - 0.5) * 1.5, len * (0.6 + rng() * 0.18), w * 0.6, depth - 1);
        }
      };
      branch(128, 256, -Math.PI / 2 + (rng() - 0.5) * 0.2, 70, 9, 6);
      this._treeCache.set(key, c);
    }
    ctx.drawImage(c, x - h / 2, y - h, h, h);
  },

  /* low rolling hill silhouette */
  hills(ctx, baseY, amp, color, seed, t = 0, drift = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(View.left - 50, View.bottom + 50);
    ctx.lineTo(View.left - 50, baseY);
    const w = View.right - View.left + 100;
    for (let i = 0; i <= 24; i++) {
      const px = View.left - 50 + (i / 24) * w;
      srand(seed + i * 7 + Math.floor(drift));
      const py = baseY - Math.abs(wobble((i + drift) * 0.9 + seed)) * amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(View.right + 50, View.bottom + 50);
    ctx.closePath(); ctx.fill();
  },

  stars(ctx, t, alpha = 1, seed = 7) {
    srand(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) {
      const x = View.left + rng() * (View.right - View.left);
      const y = View.top + rng() * View.H * 0.55;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.4 + rng() * 1.2) + rng() * TAU);
      ctx.globalAlpha = alpha * (0.12 + 0.5 * rng()) * tw;
      const r = 0.8 + rng() * 1.6;
      ctx.fillStyle = '#e8edff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
};

function rgbaFromAny(color, a) {
  if (color.startsWith('#')) return rgba(color, a);
  const m = /rgba?\(([\d.]+),([\d.]+),([\d.]+)/.exec(color.replace(/\s/g, ''));
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return color;
}
