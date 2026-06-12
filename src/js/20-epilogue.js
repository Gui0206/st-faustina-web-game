/* Epilogue — The Spark. 1938 → today.
   A dark world; one point of light in Poland; history passes over it.
   Ends on the player's own painting as a keepsake. */

SCENES.epilogue = {
  id: 'epilogue',
  enter() {
    this.t = 0;
    this.lights = [{ x: 0.52, y: 0.36, a: 0, born: 0, main: true }];   // Łagiewniki
    this.lightTarget = 1;
    this.warShadow = 0;
    this.dimAll = 0;
    this.worldGlow = 0;
    this.meridian = -0.2;
    this.meridianOn = false;
    this.keepsakeShown = false;
    this.globeR = 330;
    if (!Painting.load() || !Painting.strokes.length) this._defaultPainting();
    Engine.grainAmt = 0.07;
    Audio.pad.set([['D2', 'A2', 'D3', 'F#3'], ['G2', 'D3', 'G3', 'B3'], ['Bb1', 'F3', 'Bb3', 'D4'], ['A2', 'E3', 'A3', 'C#4']], { level: 0.42, hold: 12, bright: 760 });
  },
  exit() {
    UI.els.keepsake.classList.remove('on');
    UI.els.keepsake.innerHTML = '';
    document.getElementById('app').classList.remove('show-cursor');
  },

  script: function* (S) {
    const sc = SCENES.epilogue;
    yield S.wait(2.6);
    yield S.textAuto('She was buried in the convent garden at Łagiewniki.', 4.6, { small: true });
    S.do(() => { sc.lights[0].a = 0.001; });
    yield S.wait(1);
    yield S.textAuto('1939. A year later, the darkness she had been shown swept out of the same sky.', 5.4);
    S.do(() => Tweens.to(sc, { warShadow: 1 }, 5, { ease: Ease.inOutSine }));
    yield S.wait(4.5);
    yield S.textAuto('But in hidden chapels, the Image was copied, and copied again.', 5);
    S.do(() => sc._spread(26, 0.18));
    yield S.wait(4.5);
    yield S.textAuto('1959. Rome — misled by a faulty translation of her Diary — silenced the devotion.', 5.6);
    S.do(() => Tweens.to(sc, { dimAll: 0.78 }, 3.4, { ease: Ease.inOutSine }));
    yield S.wait(4.5);
    yield S.textAuto('The archbishop of Kraków would not let her rest in obscurity: Karol Wojtyła.', 5.4);
    S.do(() => { sc.lights[0].pulse = true; });
    yield S.wait(4.2);
    yield S.textAuto('1978. The ban was lifted. Six months later the world learned the archbishop’s new name — John Paul II.', 6);
    S.do(() => {
      Tweens.to(sc, { dimAll: 0, warShadow: 0 }, 4, { ease: Ease.inOutSine });
      sc._spread(60, 0.5);
      Audio.shimmer(0.4, 800);
    });
    yield S.wait(5);
    yield S.textAuto('30 April 2000. Helena Kowalska — Sister Faustina — was declared a saint: the first of the Great Jubilee.', 6.2);
    S.do(() => { Audio.bell('D4', 0.34, 1.6); Audio.bell('A4', 0.2, 1.6); });
    yield S.wait(3);
    yield S.textAuto('And the Church received a new feast: the Second Sunday of Easter — Divine Mercy Sunday.', 5.8);
    S.do(() => {
      Tweens.to(sc, { worldGlow: 1 }, 5, { ease: Ease.inOutSine });
      sc._spread(90, 1);
      Audio.channels.choir.set(0.18);
    });
    yield S.wait(5);
    yield S.textAuto('Somewhere on earth, it is always three o’clock.', 6, { small: true });
    S.do(() => { sc.meridianOn = true; Audio.bell('D3', 0.3, 2); });
    yield S.wait(6.5);
    yield S.textAuto('And the image you painted in Vilnius —', 4.4);
    yield S.wait(1);
    S.do(() => sc._keepsake());
  },

  /* if the player reached the epilogue without painting (chapter select),
     give the keepsake a gentle hand-drawn-feeling default */
  _defaultPainting() {
    Painting.strokes = [];
    for (let s = 0; s < 5; s++) {
      const pts = [];
      const x0 = 0.38 + s * 0.06;
      for (let i = 0; i <= 16; i++) {
        const tt = i / 16;
        pts.push({ x: x0 + Math.sin(tt * 3 + s) * 0.025, y: 0.16 + tt * 0.62 });
      }
      Painting.strokes.push({ kind: 'garment', pts });
    }
    const ray = (kind, ex) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const tt = i / 14;
        pts.push({ x: lerp(0.5, ex, Ease.inQuad(tt)) + Math.sin(tt * 5) * 0.008, y: lerp(0.42, 0.94, tt) });
      }
      Painting.strokes.push({ kind, pts });
    };
    ray('ray_red', 0.28); ray('ray_pale', 0.72);
    Painting.sigProgress = 1;
  },

  _spread(n, brightness) {
    for (let i = 0; i < n; i++) {
      Engine.after(i * rand(80, 220), () => {
        /* lights cluster near Poland early, then wander the world */
        const wide = this.lights.length > 20;
        const cx = wide ? Math.random() : 0.52 + rand(-0.16, 0.16);
        const cy = wide ? Math.random() : 0.36 + rand(-0.12, 0.14);
        const r = Math.hypot(cx - 0.5, cy - 0.5);
        if (r > 0.46) return;
        this.lights.push({ x: cx, y: cy, a: 0, born: this.t, b: brightness * rand(0.5, 1) });
        if (Math.random() < 0.3) Audio.pluck(pick(['D5', 'A5', 'F5', 'D6']), 0.07);
      });
    }
  },

  _keepsake() {
    if (this.keepsakeShown) return;
    this.keepsakeShown = true;
    Save.data.done = true; Save.write();
    const holder = UI.els.keepsake;
    holder.innerHTML = `
      <div id="ksframe"><canvas width="660" height="880"></canvas></div>
      <div class="ks-caption">${tr('Jezu, ufam Tobie — Jesus, I trust in You')}
        <small id="ks-sub">${tr('painted by your hand · Vilnius, 1934')}</small></div>
      <div style="display:flex;gap:14px">
        <button class="ks-btn" id="ks-title">${tr('Return')}</button>
      </div>`;
    this.ksCanvas = holder.querySelector('canvas');
    this.ksFade = 0;            // 0 player's painting → 1 the real image
    this.ksT = 0;
    this.ksCaptioned = false;
    this.mercy = new Image();
    this.mercyReady = false;
    this.mercy.onload = () => { this.mercyReady = true; };
    this.mercy.src = MERCY_IMG;
    this._renderKeepsake(this.ksCanvas, 0);
    holder.querySelector('#ks-title').addEventListener('click', e => {
      e.stopPropagation();
      Engine.go('title');
    });
    for (const b of holder.querySelectorAll('button')) {
      b.addEventListener('pointerdown', e => e.stopPropagation());
    }
    holder.classList.add('on');
    document.getElementById('app').classList.add('show-cursor');
    Audio.motif({ final: true, vel: 0.36, slow: true });
  },

  _renderKeepsake(cv, fade = 0) {
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#100d18'); grd.addColorStop(1, '#0a0810');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    /* soft halo behind — swells as the real image arrives */
    const rad = g.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, w * (0.7 + fade * 0.2));
    rad.addColorStop(0, `rgba(255,238,200,${0.16 + fade * 0.1})`);
    rad.addColorStop(1, 'rgba(255,238,200,0)');
    g.fillStyle = rad; g.fillRect(0, 0, w, h);
    const pw = w * 0.78, ph = h * 0.75, px = (w - pw) / 2, py = h * 0.06;
    /* the player's painting, letting go */
    if (fade < 1) {
      g.save();
      g.globalAlpha = 1 - fade;
      Painting.render(g, px, py, pw, ph, { glow: 1.15 * (1 - fade * 0.6) });
      g.restore();
    }
    /* the real image — Kazimirowski's original, contained in the same frame */
    if (fade > 0 && this.mercyReady) {
      const iw = this.mercy.width, ih = this.mercy.height;
      const s = Math.min(pw / iw, ph / ih);
      const dw = iw * s, dh = ih * s;
      g.save();
      g.globalAlpha = fade;
      g.drawImage(this.mercy, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
      g.restore();
    }
    /* caption */
    g.textAlign = 'center';
    g.fillStyle = 'rgba(232,201,138,0.9)';
    g.font = `${Math.round(w * 0.040)}px Georgia,serif`;
    g.fillText('F A U S T Y N A', w / 2, h * 0.875);
    g.fillStyle = 'rgba(236,229,216,0.75)';
    g.font = `italic ${Math.round(w * 0.032)}px Georgia,serif`;
    /* long translations wrap to a second line rather than shrinking */
    const lines = [''];
    for (const word of tr('“Not in the beauty of the color, nor of the brush… but in My grace.”').split(' ')) {
      const probe = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
      if (g.measureText(probe).width > w * 0.9 && lines[lines.length - 1]) lines.push(word);
      else lines[lines.length - 1] = probe;
    }
    const qy = lines.length > 1 ? 0.92 : 0.94;
    lines.forEach((ln, i) => g.fillText(ln, w / 2, h * (qy + i * 0.04)));
    g.fillStyle = 'rgba(236,229,216,0.5)';
    g.font = `${Math.round(w * 0.022)}px Georgia,serif`;
    g.fillText(tr('Diary, 313'), w / 2, h * 0.985);
  },

  onPress() {},
  update(dt) {
    this.t += dt;
    /* the keepsake transfiguration: her hand's work resolves into the real canvas */
    if (this.keepsakeShown && this.ksCanvas) {
      this.ksT += dt;
      if (this.ksT > 2.2 && this.mercyReady && this.ksFade < 1) {
        if (this.ksFade === 0) { Audio.shimmer(0.5, 800); Audio.bell('D4', 0.28, 1.8); }
        this.ksFade = Math.min(1, this.ksFade + dt / 4.5);
        this._renderKeepsake(this.ksCanvas, Ease.inOutSine(this.ksFade));
        if (this.ksFade >= 1 && !this.ksCaptioned) {
          this.ksCaptioned = true;
          const sub = UI.els.keepsake.querySelector('#ks-sub');
          if (sub) sub.textContent = tr('— became this one, by Eugeniusz Kazimirowski · Vilnius, 1934');
          Audio.celesta('D5', 0.35);
        }
      }
    }
    for (const L of this.lights) {
      const target = (L.main ? 1 : (L.b || 0.5)) * (1 - this.dimAll * (L.main ? 0.55 : 1)) * this.lightTarget;
      L.a = damp(L.a, target, 0.9, dt);
    }
    if (this.meridianOn) {
      this.meridian += dt * 0.05;
      if (this.meridian > 1.3) this.meridian = -0.3;
    }
    if (this.worldGlow > 0.3 && Math.random() < 0.12) {
      Particles.mote(rand(-this.globeR, this.globeR), 450 + rand(-this.globeR, this.globeR) * 0.8, '#ffe9c0');
    }
  },

  draw(ctx) {
    const t = this.t, R0 = this.globeR;
    R.sky(ctx, 'ep-sky', [[0, '#04030a'], [0.6, '#070613'], [1, '#0b0916']], View.left, 0, View.W + 2, 900);
    R.stars(ctx, t, 0.7, 91);
    const cx = 0, cy = 440;
    /* the dark world */
    ctx.save();
    const dg = ctx.createRadialGradient(cx - 80, cy - 90, 60, cx, cy, R0);
    dg.addColorStop(0, '#171426');
    dg.addColorStop(1, '#0b0915');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TAU); ctx.fill();
    /* meridian arcs */
    ctx.strokeStyle = 'rgba(160,160,200,0.07)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(R0 * Math.sin(i * 0.42)) + 0.001, R0, 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const yy = cy - R0 + (2 * R0 * i) / 4;
      const half = Math.sqrt(Math.max(R0 * R0 - (yy - cy) * (yy - cy), 0));
      ctx.beginPath(); ctx.moveTo(cx - half, yy); ctx.lineTo(cx + half, yy); ctx.stroke();
    }
    /* war shadow: a dark tide crossing the globe — at full sweep the whole
       earth goes black, leaving only the lights drawn after it */
    if (this.warShadow > 0.01) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TAU); ctx.clip();
      const trail = 200;
      const front = cx - R0 + (R0 * 2 + trail + 60) * this.warShadow;
      ctx.globalAlpha = Math.min(1, this.warShadow * 3) * 0.94;
      ctx.fillStyle = 'rgba(16,3,7,1)';
      if (front - trail > cx - R0) ctx.fillRect(cx - R0, cy - R0, (front - trail) - (cx - R0), R0 * 2);
      const wg = ctx.createLinearGradient(front - trail, 0, front, 0);
      wg.addColorStop(0, 'rgba(16,3,7,1)');
      wg.addColorStop(0.5, 'rgba(34,7,11,0.8)');
      wg.addColorStop(1, 'rgba(20,4,8,0)');
      ctx.fillStyle = wg;
      ctx.fillRect(front - trail, cy - R0, trail, R0 * 2);
      ctx.restore();
    }
    /* the lights */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (const L of this.lights) {
      if (L.a < 0.005) continue;
      const lx = cx + (L.x - 0.5) * 2 * R0;
      const ly = cy + (L.y - 0.5) * 2 * R0;
      const pulse = L.pulse ? 1 + 0.4 * Math.sin(t * 2.4) : 1;
      ctx.globalAlpha = clamp01(L.a) * (L.main ? 1 : 0.75);
      R.glow(ctx, lx, ly, (L.main ? 26 : 12) * pulse, L.main ? '#ffe9b8' : '#f3d9a4');
      ctx.globalAlpha = clamp01(L.a);
      ctx.fillStyle = '#fff3d8';
      ctx.beginPath(); ctx.arc(lx, ly, L.main ? 3 : 1.6, 0, TAU); ctx.fill();
    }
    /* world glow at Divine Mercy Sunday */
    if (this.worldGlow > 0.01) {
      ctx.globalAlpha = this.worldGlow * 0.3;
      R.glow(ctx, cx, cy, R0 * 1.25, 'rgba(255,222,160,0.6)');
    }
    /* the three-o'clock meridian sweeping forever */
    if (this.meridianOn) {
      const mx = cx + (this.meridian - 0.5) * 2 * R0;
      const half = Math.sqrt(Math.max(R0 * R0 - (mx - cx) * (mx - cx), 0.001));
      ctx.globalAlpha = 0.7;
      const mg = ctx.createLinearGradient(mx - 40, 0, mx + 6, 0);
      mg.addColorStop(0, 'rgba(255,238,200,0)');
      mg.addColorStop(1, 'rgba(255,238,200,0.34)');
      ctx.fillStyle = mg;
      ctx.fillRect(mx - 40, cy - half, 46, half * 2);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(255,246,224,0.6)';
      ctx.fillRect(mx + 4, cy - half, 1.6, half * 2);
    }
    ctx.restore();
    /* rim light */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.16 + this.worldGlow * 0.2;
    ctx.strokeStyle = '#cfd6ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TAU); ctx.stroke();
    ctx.restore();
  },
};
