/* Pooled particles. Two draw passes: normal (snow, ash) and additive (light). */

const MAX_PARTICLES = 900;

const Particles = {
  pool: [],
  active: [],

  spawn(opts) {
    if (this.active.length >= MAX_PARTICLES) return null;
    const p = this.pool.pop() || {};
    p.x = opts.x || 0; p.y = opts.y || 0;
    p.vx = opts.vx || 0; p.vy = opts.vy || 0;
    p.ax = opts.ax || 0; p.ay = opts.ay || 0;
    p.drag = opts.drag !== undefined ? opts.drag : 1;
    p.life = p.maxLife = opts.life || 1;
    p.size = opts.size || 3;
    p.endSize = opts.endSize !== undefined ? opts.endSize : p.size * 0.2;
    p.color = opts.color || '#ffffff';
    p.alpha = opts.alpha !== undefined ? opts.alpha : 1;
    p.additive = !!opts.additive;
    p.glow = !!opts.glow;             // draw using cached glow sprite (soft)
    p.wobble = opts.wobble || 0;      // sideways sine drift
    p.wobbleF = opts.wobbleF || rand(0.5, 1.6);
    p.wobbleT = rand(0, TAU);
    p.fadeIn = opts.fadeIn || 0;
    p.spin = opts.spin || 0;
    p.rot = rand(0, TAU);
    p.shape = opts.shape || 'dot';    // dot | petal | streak
    this.active.push(p);
    return p;
  },

  burst(x, y, n, optsFn) {
    for (let i = 0; i < n; i++) this.spawn(optsFn(i));
  },

  update(dt) {
    const A = this.active;
    for (let i = A.length - 1; i >= 0; i--) {
      const p = A[i];
      p.life -= dt;
      if (p.life <= 0) { this.pool.push(p); A.splice(i, 1); continue; }
      p.vx += p.ax * dt; p.vy += p.ay * dt;
      if (p.drag !== 1) { const d = Math.pow(p.drag, dt * 60); p.vx *= d; p.vy *= d; }
      p.wobbleT += dt * p.wobbleF;
      p.x += (p.vx + Math.sin(p.wobbleT) * p.wobble) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  },

  draw(ctx, additivePass) {
    for (const p of this.active) {
      if (p.additive !== additivePass) continue;
      const t = 1 - p.life / p.maxLife;
      let a = p.alpha * (p.life / p.maxLife);
      if (p.fadeIn > 0) {
        const elapsed = p.maxLife - p.life;
        if (elapsed < p.fadeIn) a = p.alpha * (elapsed / p.fadeIn);
      }
      if (a <= 0.004) continue;
      const size = lerp(p.size, p.endSize, t);
      if (size <= 0.1) continue;
      ctx.globalAlpha = a;
      if (p.glow) {
        R.glow(ctx, p.x, p.y, size, p.color);
      } else if (p.shape === 'streak') {
        ctx.strokeStyle = p.color; ctx.lineWidth = size * 0.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); ctx.stroke();
      } else if (p.shape === 'petal') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.45, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  clear() { for (const p of this.active) this.pool.push(p); this.active.length = 0; },

  /* ------- presets ------- */
  dust(x, y, color = '#ffe9c0') {
    return this.spawn({
      x, y, vx: rand(-6, 6), vy: rand(-14, -4), life: rand(2, 4.5),
      size: rand(1, 2.6), endSize: 0.4, color, alpha: rand(0.18, 0.42),
      additive: true, glow: true, wobble: rand(4, 12), fadeIn: 0.8,
    });
  },
  snow(x, y, w) {
    return this.spawn({
      x: x + rand(-w / 2, w / 2), y, vy: rand(34, 72), vx: rand(-10, 8),
      life: rand(7, 12), size: rand(1.6, 3.4), endSize: 1.4,
      color: '#e6ecf6', alpha: rand(0.4, 0.85), wobble: rand(10, 26), fadeIn: 0.8,
    });
  },
  ember(x, y, color = '#ffc77d') {
    return this.spawn({
      x, y, vx: rand(-10, 10), vy: rand(-46, -22), life: rand(0.7, 1.6),
      size: rand(1.4, 3), endSize: 0.2, color, alpha: rand(0.5, 0.9),
      additive: true, glow: true, wobble: rand(6, 16), drag: 0.985,
    });
  },
  mote(x, y, color = '#fff3d8') {
    /* slow rising light-mote — prayer made visible */
    return this.spawn({
      x, y, vx: rand(-4, 4), vy: rand(-30, -12), life: rand(2.5, 5),
      size: rand(2, 5), endSize: 0.5, color, alpha: rand(0.3, 0.6),
      additive: true, glow: true, wobble: rand(6, 14), fadeIn: 0.6, drag: 0.992,
    });
  },
  spark(x, y, color = '#ffe9b0') {
    return this.spawn({
      x, y, vx: rand(-70, 70), vy: rand(-70, 70), life: rand(0.3, 0.9),
      size: rand(1.5, 3.2), endSize: 0, color, alpha: 0.9,
      additive: true, glow: true, drag: 0.94,
    });
  },
};
