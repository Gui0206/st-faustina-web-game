/* Chapter II — The Dance. Łódź, Wenecja Park, 1924.
   The one scene with a score — and the score is what you give up.
   Tap to dance: the combo climbs, the music plays, and Someone is waiting. */

SCENES.ch2 = {
  id: 'ch2',
  enter() {
    this.t = 0;
    this.state = 'dance';        // dance → vision → after → cathedral
    this.combo = 0;
    this.comboPop = 0;
    this.comboAlpha = 1;
    this.lean = 0; this.leanTarget = 0;
    this.gray = 0;               // 0 warm party → 1 drained
    this.freeze = 0;
    this.glimpse = 0;
    this.visionI = 0;            // the suffering Christ figure
    this.brightPulse = 0;
    this.lanternFlare = 0;
    this.heroX = -260;
    this.walker = new Walker(-260, 800, { speed: 130, onStep: () => Audio.step(0.12) });
    this.exitGlow = 0;
    this.cath = { bloom: new PrayBloom({ riseTime: 2.6 }), candles: [] };
    for (let i = 0; i < 14; i++) {
      this.cath.candles.push({ x: rand(-560, -300) * (i % 2 ? -1 : 1) + rand(-40, 40), y: rand(560, 680), s: rand(28, 52) });
    }
    this.dancers = [];
    for (let i = 0; i < 7; i++) {
      this.dancers.push({
        /* fixed world coords — camera always re-centers on scene enter */
        x: lerp(-620, 620, (i + 0.5) / 7) + rand(-40, 40),
        depth: rand(0, 1), phase: rand(0, TAU), drift: rand(-14, 14),
      });
    }
    Engine.grainAmt = 0.07;
    if (AC) { Audio.pad.set(null); Audio.waltz.start(0.4); }
  },
  exit() {
    Audio.waltz.stop(1);
    Audio.heartbeatStop();
  },

  script: function* (S) {
    const sc = SCENES.ch2;
    yield S.wait(2.2);
    yield S.textAuto('Łódź. Twelve years later.', 3.4);
    yield S.textAuto('Her sister begged her to come — one evening of music in Wenecja Park.', 4.5);
    yield S.textAuto('Helena wore her one good dress.', 3.8);
    S.do(() => Hint.show('tap with the music', { ttl: 5 }));
    yield S.waitFor(() => sc.combo >= 18);
    /* ---- the vision ---- */
    S.do(() => sc._beginVision());
    yield S.wait(3.4);
    yield S.text('The music kept playing. The dancers kept turning.');
    yield S.text('But Helena saw only Him — racked with pain, stripped of His clothing, covered in wounds.');
    yield S.text('How long shall I put up with you and how long will you keep putting Me off?', { voice: true, attr: 'Diary, 9' });
    S.do(() => sc._burnScore());
    yield S.wait(2.6);
    S.do(() => { sc.state = 'after'; Hint.show('there is nothing here — hold, and walk away', { ttl: 6 }); });
    yield S.waitFor(() => sc.walker.x > View.right - 140);
    /* ---- the cathedral ---- */
    S.do(() => sc._toCathedral());
    yield S.wait(2.8);
    yield S.textAuto('The Cathedral of Saint Stanislaus Kostka. She did not remember walking there.', 4.6);
    yield S.text('She fell prostrate before the Blessed Sacrament and asked what He wanted of her.');
    yield S.holdTotal(2.6, { hint: 'hold', hintAfter: 4 });
    yield S.waitFor(() => sc.cath.bloom.v > 0.95);
    yield S.wait(1.4);
    yield S.text('Go at once to Warsaw; you will enter a convent there.', { voice: true, attr: 'Diary, 10' });
    yield S.text('She went home only to pack a small bag, and asked her sister to say goodbye for her.');
    yield S.text('She was nineteen, and she had stopped pretending.');
    S.do(() => Engine.nextChapter());
  },

  _beginVision() {
    this.state = 'vision';
    Audio.waltz.setWarp(1);
    Audio.waltz.setLevel(0.1, 3);
    Engine.after(2600, () => Audio.waltz.stop(3));
    Audio.heartbeatStart(46, 0.3);
    Tweens.to(this, { gray: 1 }, 4, { ease: Ease.inOutSine });
    Tweens.to(this, { visionI: 1 }, 5, { ease: Ease.inOutSine, delay: 1 });
    Engine.shake(0.18);
    Audio.thunder(0.12);
  },
  _burnScore() {
    Tweens.to(this, { comboAlpha: 0 }, 2.2, { ease: Ease.inOutSine });
    const y = 120;
    for (let i = 0; i < 26; i++) {
      Particles.spawn({
        x: rand(-110, 110), y: y + rand(-12, 12),
        vx: rand(-10, 10), vy: rand(8, 40), ay: 26,
        life: rand(1.4, 2.8), size: rand(1, 2.6), endSize: 0.2,
        color: pick(['#8a8276', '#a39685', '#6e675e']), alpha: 0.7,
        wobble: rand(4, 12), fadeIn: 0.2,
      });
    }
    Audio.swish(0.16);
  },
  _toCathedral() {
    Audio.heartbeatStop();
    Engine.fade.color = '#000000';
    Tweens.to(Engine.fade, { alpha: 1 }, 1.6, {
      key: 'fade', ease: Ease.inOutQuad, onDone: () => {
        this.state = 'cathedral';
        this.t = 0;
        Audio.pad.set([['D2', 'A2', 'F3', 'D4'], ['G1', 'D3', 'Bb3', 'G3'], ['A1', 'E3', 'A3', 'C#4'], ['D2', 'A2', 'D3', 'F3']], { level: 0.42, hold: 12, bright: 620 });
        Audio.bell('A2', 0.22, 1.4);
        Tweens.to(Engine.fade, { alpha: 0 }, 2.4, { key: 'fade' });
      },
    });
  },

  onPress(p) {
    if (this.state === 'dance') {
      this.combo++;
      this.comboPop = 1;
      Tweens.to(this, { comboPop: 0 }, 0.5, { key: 'pop', ease: Ease.outCubic });
      this.leanTarget = this.leanTarget >= 0 ? -1 : 1;
      Tweens.to(this, { lean: this.leanTarget }, 0.4, { key: 'lean', ease: Ease.outBack });
      this.brightPulse = 1;
      this.lanternFlare = 1;
      Tweens.to(this, { lanternFlare: 0 }, 0.7, { key: 'flare' });
      const scale = ['D4', 'E4', 'F4', 'G4', 'A4', 'C5', 'D5', 'E5'];
      Audio.pluck(scale[this.combo % scale.length], 0.22);
      Particles.burst(this.heroX, 815, 7, () => ({
        x: this.heroX + rand(-26, 26), y: 815 + rand(-6, 6),
        vx: rand(-50, 50), vy: rand(-60, -10), life: rand(0.4, 0.9),
        size: rand(1.5, 3), endSize: 0, color: '#ffd9a0', alpha: 0.8,
        additive: true, glow: true, drag: 0.93,
      }));
      this.gray = clamp01(this.combo / 22);
      Audio.waltz.setWarp(this.combo / 20);
      if (this.combo === 7 || this.combo === 13) {
        this.freeze = 0.16;
        this.glimpse = 1;
        Tweens.to(this, { glimpse: 0 }, 1.6, { key: 'glimpse', ease: Ease.inOutSine });
        Audio.thunder(0.05);
      }
    } else if (this.state === 'after') {
      if (AC) blip(Audio.out(0.7, 0.1), 130, 0.1, 0.07, 'sine');   // dead, dull
    }
  },

  update(dt) {
    this.t += dt;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    if (this.state === 'dance' || this.state === 'vision') {
      const spin = this.state === 'dance' ? 1 : 0.06;
      for (const d of this.dancers) {
        d.phase += dt * 1.6 * spin;
        d.x += d.drift * dt * spin;
        if (d.x < View.left + 80) d.drift = Math.abs(d.drift);
        if (d.x > View.right - 80) d.drift = -Math.abs(d.drift);
      }
      this.brightPulse = Math.max(0, this.brightPulse - dt * 1.4);
      this.lean *= Math.pow(0.4, dt);
    }
    if (this.state === 'after') {
      const dir = Input.down ? 1 : (Input.axis() || 0);
      this.walker.x = Math.max(this.walker.x, this.heroX);
      this.walker.update(dt, dir > 0 || Input.down ? 1 : 0);
      this.heroX = this.walker.x;
      this.exitGlow = damp(this.exitGlow, 1, 0.8, dt);
    }
    if (this.state === 'cathedral') {
      this.cath.bloom.update(dt);
      Audio.pad.targetLevel = 0.42 + this.cath.bloom.v * 0.26;
      if (Input.down && Math.random() < 0.12) Particles.mote(rand(-80, 80), rand(500, 700));
    }
  },

  draw(ctx) {
    if (this.state === 'cathedral') { this._drawCathedral(ctx); return; }
    const t = this.t, g = this.gray;
    /* park night sky — warm amber dusk before it drains */
    R.sky(ctx, 'ch2-sky', [[0, '#150c18'], [0.55, '#33182a'], [1, '#4e2326']], View.left, 0, View.W + 2, 900);
    ctx.save();
    ctx.globalAlpha = g * 0.92;
    R.sky(ctx, 'ch2-gray', [[0, '#0b0a10'], [0.6, '#121119'], [1, '#16141d']], View.left, 0, View.W + 2, 900);
    ctx.restore();
    /* ground */
    ctx.fillStyle = mixHex('#33201f', '#0e0d13', g);
    ctx.fillRect(View.left, 760, View.W + 2, 140);
    /* trees framing */
    R.tree(ctx, View.left + 90, 800, 460, 17, mixHex('#160d16', '#0a090e', g));
    R.tree(ctx, View.right - 70, 790, 520, 29, mixHex('#160d16', '#0a090e', g));

    /* lantern strings: two sagging catenaries */
    const warm = 1 - g * 0.85;
    const sagY = fx => 178 + Math.sin(fx * Math.PI) * 76;
    ctx.strokeStyle = 'rgba(16,10,14,0.9)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = lerp(View.left, View.right, i / 40);
      i ? ctx.lineTo(x, sagY(i / 40)) : ctx.moveTo(x, sagY(i / 40));
    }
    ctx.stroke();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const fx = (i + 0.5) / n;
      const x = lerp(View.left, View.right, fx);
      const y = sagY(fx) + 17;
      const I = (0.72 + this.lanternFlare * 0.4 + this.brightPulse * 0.25) * warm + 0.04;
      lamp(ctx, x, y, 74 + this.lanternFlare * 30, 'rgba(255,176,92,0.75)', I, t + i);
      ctx.fillStyle = `rgba(255,212,148,${0.45 + warm * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill();
      /* warm pools on the ground beneath */
      lamp(ctx, x, 808, 120, 'rgba(255,160,80,0.35)', I * 0.5, t + i * 2, 0.05);
    }

    /* dancers (depth-sorted) */
    const ds = this.dancers.slice().sort((a, b) => a.depth - b.depth);
    for (const d of ds) {
      const h = lerp(150, 240, d.depth);
      const y = lerp(740, 800, d.depth);
      const shade = mixHex(mixHex('#241522', '#3d2030', d.depth), '#0d0c12', g);
      R.dancers(ctx, d.x, y, h, d.phase, { color: shade });
    }

    /* the suffering Christ — seen only by her */
    if (this.glimpse > 0.01 || this.visionI > 0.01) {
      const I = Math.max(this.glimpse * 0.35, this.visionI);
      const vx = Math.min(300, View.right - 220), vy = 800, vh = 330;
      R.lumen(ctx, vx, vy, vh, t, { intensity: I * 0.66, raise: 0, rays: 0 });
      /* the wounds: small red embers at hands and side */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = I * 0.9;
      R.glow(ctx, vx - vh * 0.17, vy - vh * 0.58, vh * 0.05, '#ff4252');
      R.glow(ctx, vx + vh * 0.17, vy - vh * 0.56, vh * 0.05, '#ff4252');
      R.glow(ctx, vx + vh * 0.06, vy - vh * 0.42, vh * 0.04, '#e83a48');
      ctx.restore();
      if (this.visionI > 0.4 && Math.random() < 0.06) {
        Particles.spawn({
          x: vx + rand(-30, 30), y: vy - rand(80, 240),
          vx: rand(-4, 4), vy: rand(4, 16), life: rand(1.5, 3),
          size: rand(1.5, 2.6), endSize: 0.2, color: '#ff6471', alpha: 0.5,
          additive: true, glow: true, fadeIn: 0.5,
        });
      }
    }

    /* Helena */
    ctx.save();
    ctx.translate(this.heroX, this.state === 'after' ? this.walker.y : 800);
    ctx.rotate(this.lean * 0.12);
    const dress = mixHex('#6b3148', '#221d28', g * 0.8);
    R.maiden(ctx, 0, 0, 280, {
      color: dress,
      walk: this.state === 'after' ? this.walker.phase : (this.lean * 1.6),
    });
    ctx.restore();
    if (this.state === 'after' && this.exitGlow > 0.01) {
      lamp(ctx, View.right - 40, 520, 280, 'rgba(140,170,255,0.4)', this.exitGlow * 0.8, t, 0.03);
    }

    /* warm pulse on tap */
    if (this.brightPulse > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = this.brightPulse * 0.5 * warm;
      ctx.fillStyle = '#ffbe78';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }

    /* the combo — the evening's little glory */
    if (this.combo > 0 && this.comboAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.comboAlpha * 0.9;
      const s = 1 + this.comboPop * 0.18;
      ctx.translate(0, 120); ctx.scale(s, s);
      spacedText(ctx, 'THE EVENING', 0, -14, 13, 7, `rgba(232,201,138,${0.7 * this.comboAlpha})`);
      spacedText(ctx, '× ' + this.combo, 0, 24, 30, 4, `rgba(240,233,219,${0.9 * this.comboAlpha})`);
      ctx.restore();
    }
  },

  _drawCathedral(ctx) {
    const t = this.t, b = this.cath.bloom.v;
    R.sky(ctx, 'ch2-cath', [[0, '#060410'], [0.5, '#0a0716'], [1, '#0e0a18']], View.left, 0, View.W + 2, 900);
    /* great window */
    const wy = 110, ww = 240, wh = 420;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-ww / 2, wy + wh);
    ctx.lineTo(-ww / 2, wy + 110);
    ctx.quadraticCurveTo(0, wy - 60, ww / 2, wy + 110);
    ctx.lineTo(ww / 2, wy + wh);
    ctx.closePath(); ctx.clip();
    R.sky(ctx, 'ch2-glass', [[0, '#16224d'], [0.5, '#1d2c5e'], [1, '#27355f']], -ww / 2, wy - 60, ww, wh + 60);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + b * 0.45;
    R.glow(ctx, 0, wy + 170, 190, 'rgba(120,150,255,0.55)');
    ctx.restore();
    /* mullions */
    ctx.strokeStyle = '#040308'; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-ww / 2, wy + wh); ctx.lineTo(-ww / 2, wy + 110);
    ctx.quadraticCurveTo(0, wy - 60, ww / 2, wy + 110);
    ctx.lineTo(ww / 2, wy + wh);
    ctx.moveTo(0, wy + 4); ctx.lineTo(0, wy + wh);
    ctx.stroke();
    /* columns */
    for (const s of [-1, 1]) {
      const g = ctx.createLinearGradient(s * 520 - 70, 0, s * 520 + 70, 0);
      g.addColorStop(0, 'rgba(4,3,8,0)'); g.addColorStop(0.5, 'rgba(10,8,18,0.9)'); g.addColorStop(1, 'rgba(4,3,8,0)');
      ctx.fillStyle = g;
      ctx.fillRect(s * 520 - 70, 0, 140, 900);
    }
    /* candle banks */
    for (const c of this.cath.candles) {
      R.candle(ctx, c.x, c.y, c.s, t + c.x, 0.5 + b * 0.5);
    }
    lamp(ctx, -420, 600, 200, 'rgba(255,176,96,0.4)', 0.4 + b * 0.5, t);
    lamp(ctx, 420, 600, 200, 'rgba(255,176,96,0.4)', 0.4 + b * 0.5, t, 0.1);
    /* altar light */
    lamp(ctx, 0, wy + wh + 40, 130 + b * 120, 'rgba(255,220,160,0.5)', 0.4 + b * 0.6, t, 0.04);
    /* floor */
    ctx.fillStyle = '#07050c';
    ctx.fillRect(View.left, 780, View.W + 2, 120);
    /* Helena prostrate */
    R.maiden(ctx, 0, 812, 250, { kneel: true, color: '#2b1c2c' });
    /* God-light from the window when prayer holds */
    if (b > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(0, wy + 100, 0, 830);
      grad.addColorStop(0, `rgba(170,195,255,${0.2 * b})`);
      grad.addColorStop(1, 'rgba(170,195,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-ww / 2 + 30, wy + 100);
      ctx.lineTo(ww / 2 - 30, wy + 100);
      ctx.lineTo(190, 830); ctx.lineTo(-190, 830);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  },
};
