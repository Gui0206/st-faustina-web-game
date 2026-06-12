/* Chapter IX — Jezu, Ufam Tobie. Kraków-Łagiewniki, 5 October 1938.
   Breathe with her. Then the verb of the whole game inverts:
   the last hold is a letting-go. */

SCENES.ch9 = {
  id: 'ch9',
  enter() {
    this.t = 0;
    this.phase = 'breathe';        // breathe → finalhold → release → light
    this.cycle = 0;
    this.cyclesNeeded = 3;
    this.breath = 0;               // 0..1 within current inhale
    this.inhaled = false;
    this.dim = 0;                  // grows each cycle
    this.finalHold = 0;
    this.promptLetGo = false;
    this.released = false;
    this.raysI = 0;
    this.words = ['JEZU', 'UFAM', 'TOBIE'];
    this.wordsShown = 0;
    this.silence = false;
    Engine.grainAmt = 0.07;
    Audio.pad.set([['D2', 'A2', 'F3', 'D4'], ['Bb1', 'F3', 'D4'], ['G1', 'D3', 'Bb3'], ['A1', 'E3', 'A3']], { level: 0.3, hold: 13, bright: 520 });
  },
  exit() { Audio.channels.air.set(0); Audio.channels.choir.set(0); },

  script: function* (S) {
    const sc = SCENES.ch9;
    yield S.wait(2.6);
    yield S.textAuto('Kraków-Łagiewniki. The night of the fifth of October, 1938.', 4.6);
    yield S.textAuto('She was thirty-three — the age of her Lord.', 4.2);
    S.do(() => Hint.show('breathe with her — hold… and release', { ttl: 6 }));
    yield S.waitFor(() => sc.cycle >= 1, { hint: 'breathe with her — hold… and release', hintAfter: 7 });
    yield S.textAuto('The sisters knelt at the bed. The candle kept its small vigil.', 4.6);
    yield S.waitFor(() => sc.cycle >= 2, { hint: 'breathe with her — hold… and release', hintAfter: 8 });
    yield S.textAuto('You are the secretary of My mercy; I have chosen you for that office in this life and the next life.', 6, { voice: true, attr: 'Diary, 1605' });
    yield S.waitFor(() => sc.cycle >= sc.cyclesNeeded, { hint: 'breathe with her — hold… and release', hintAfter: 8 });
    S.do(() => { sc.phase = 'finalhold'; Hint.show('hold', { ttl: 4 }); });
    yield S.waitFor(() => sc.released, { hint: 'hold', hintAfter: 6 });
    /* the passage */
    yield S.wait(2.4);                                  // held black silence
    S.do(() => sc._light());
    yield S.wait(7);
    yield S.text('Jezu, ufam Tobie.', { quote: true });
    yield S.wait(0.4);
    S.do(() => {
      Engine.fade.color = '#fdf8ee';
      Tweens.to(Engine.fade, { alpha: 1 }, 3.4, { key: 'fade', ease: Ease.inOutSine, onDone: () => Engine.nextChapter() });
    });
    yield S.wait(5);
  },

  _light() {
    this.phase = 'light';
    Audio.celesta('D5', 0.4);
    Engine.after(1400, () => {
      Audio.pad.set([['D2', 'A2', 'D3', 'F#3', 'A3'], ['G2', 'D3', 'G3', 'B3'], ['A2', 'E3', 'A3', 'C#4'], ['D2', 'A2', 'F#4', 'D4']], { level: 0.6, hold: 9, bright: 1300 });
      Audio.channels.choir.set(0.3);
      Audio.motif({ final: true, bell: true, vel: 0.4, slow: true });
      Tweens.to(this, { raysI: 1 }, 6, { ease: Ease.inOutSine });
      Tweens.to(Engine.fade, { alpha: 0 }, 2.6, { key: 'fade', ease: Ease.inOutSine });
    });
    for (let i = 0; i < 60; i++) {
      Engine.after(1500 + i * 90, () => {
        Particles.spawn({
          x: rand(-500, 500), y: rand(300, 900),
          vx: rand(-6, 6), vy: rand(-70, -30), life: rand(3, 6),
          size: rand(1.5, 4), endSize: 0.4, color: pick(['#fff3d8', '#ffd9e0', '#dfe9ff']),
          alpha: rand(0.3, 0.7), additive: true, glow: true, wobble: rand(6, 16), fadeIn: 0.8,
        });
      });
    }
  },

  onPress() {},
  onRelease() {
    if (this.phase === 'breathe' && this.inhaled) {
      this.cycle++;
      this.inhaled = false;
      this.dim = clamp01(this.cycle / (this.cyclesNeeded + 1));
      Audio.channels.air.set(0.05, 480, 0.5);
      setTimeout(() => Audio.channels.air.set(0, undefined, 0.8), 700);
    } else if (this.phase === 'finalhold') {
      if (this.promptLetGo) {
        this.released = true;
        this.silence = true;
        this.phase = 'release';
        Hint.hide(); Text.clear();
        /* absolute quiet, absolute dark */
        Audio.pad.set(null);
        Audio.channels.air.set(0); Audio.channels.wind.set(0);
        Audio.heartbeatStop();
        Engine.fade.color = '#000000';
        Engine.fade.alpha = 1;
      } else {
        /* released too soon — the ring simply resets, no punishment */
        this.finalHold = 0;
      }
    }
  },

  update(dt) {
    this.t += dt;
    if (this.phase === 'breathe') {
      if (Input.down) {
        this.breath = clamp01(this.breath + dt / (1.4 + this.cycle * 0.5));
        if (this.breath >= 1) this.inhaled = true;
        Audio.channels.air.set(0.1 * this.breath, 540 + this.breath * 160, 0.2);
      } else {
        this.breath = Math.max(0, this.breath - dt * 1.4);
        if (this.breath <= 0) Audio.channels.air.set(0, undefined, 0.4);
      }
    } else if (this.phase === 'finalhold') {
      if (Input.down) {
        this.finalHold += dt;
        this.wordsShown = Math.min(3, Math.floor(this.finalHold / 1.1));
        if (this.finalHold > 3.6 && !this.promptLetGo) {
          this.promptLetGo = true;
          Hint.show('— let go', { ttl: 10 });
          Audio.shimmer(0.2, 500);
        }
        Audio.channels.air.set(0.06 + Math.min(this.finalHold * 0.02, 0.1), 520, 0.3);
      } else {
        this.wordsShown = 0;
      }
    }
  },

  draw(ctx) {
    const t = this.t;
    if (this.phase === 'release') return;            // pure black; the fade covers all
    if (this.phase === 'light') { this._drawLight(ctx); return; }
    const dim = this.dim;
    /* the cell, very dim, warm */
    const g = ctx.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, mixHex('#0b0810', '#070509', dim));
    g.addColorStop(1, mixHex('#120d14', '#0a070c', dim));
    ctx.fillStyle = g; ctx.fillRect(View.left, 0, View.W + 2, 900);
    /* small window, moonlit */
    ctx.fillStyle = 'rgba(60,72,110,0.5)';
    ctx.fillRect(-560, 220, 130, 180);
    ctx.strokeStyle = '#070509'; ctx.lineWidth = 8;
    ctx.strokeRect(-560, 220, 130, 180);
    lamp(ctx, -495, 310, 90, 'rgba(170,190,240,0.3)', 0.5 - dim * 0.3, t, 0.02);
    /* the bed — a modest convent cot, scaled to the sisters kneeling beside it */
    ctx.fillStyle = '#15101a';
    ctx.fillRect(-150, 660, 320, 92);
    ctx.fillStyle = '#1d1722';
    ctx.fillRect(-166, 632, 26, 130);
    ctx.fillStyle = '#241d2b';
    ctx.fillRect(160, 642, 26, 120);
    /* her form, white linen */
    const breathLift = this.phase === 'breathe' ? this.breath * 7 : Math.max(0, 4 - this.finalHold);
    ctx.fillStyle = mixHex('#c9bfae', '#8e887e', dim * 0.6);
    ctx.beginPath();
    ctx.moveTo(-128, 676);
    ctx.quadraticCurveTo(-92, 652 - breathLift, -16, 656 - breathLift);
    ctx.quadraticCurveTo(78, 662, 142, 672);
    ctx.lineTo(142, 700); ctx.lineTo(-128, 700);
    ctx.closePath(); ctx.fill();
    /* her face — only suggested: a pale oval turned upward */
    ctx.fillStyle = mixHex('#d8cdbb', '#a39a8c', dim * 0.5);
    ctx.beginPath(); ctx.ellipse(-102, 660 - breathLift, 14, 11, -0.2, 0, TAU); ctx.fill();
    /* kneeling sisters at the bedside, bowed against the lit linen */
    R.nun(ctx, -128, 816, 215, { kneel: true, bow: 0.5, color: '#0b0910' });
    R.nun(ctx, 86, 824, 228, { kneel: true, bow: 0.4, color: '#0b0910', flip: true });
    /* vigil candle */
    R.candle(ctx, 248, 660, 64, t, 0.85 - dim * 0.4);
    lamp(ctx, 248, 610, 110, 'rgba(255,180,100,0.45)', 0.7 - dim * 0.4, t);

    /* breath ring */
    if (this.phase === 'breathe') {
      drawRing(ctx, 0, 420, 60, this.breath, 0.75, '#ffeedd');
    } else if (this.phase === 'finalhold') {
      const k = clamp01(this.finalHold / 3.6);
      drawRing(ctx, 0, 420, 60 - k * 18, Input.down ? 0.65 + 0.3 * Math.sin(t * 2.4) : 0.2, 0.85, '#fff3e4');
      /* the three words assemble below the ring as the hold deepens */
      const shown = this.words.slice(0, this.wordsShown);
      if (shown.length) {
        ctx.globalAlpha = 0.9;
        spacedTextAt(ctx, shown.join(' · '), 0, 530, 19, 6, 'rgba(240,233,219,0.9)');
        ctx.globalAlpha = 1;
      }
    }
    /* deep dim vignette as life ebbs */
    if (dim > 0.01) {
      ctx.fillStyle = `rgba(0,0,0,${dim * 0.35})`;
      ctx.fillRect(View.left, 0, View.W + 2, 900);
    }
  },

  _drawLight(ctx) {
    const t = this.t;
    ctx.fillStyle = '#020204';
    ctx.fillRect(View.left, 0, View.W + 2, 900);
    R.stars(ctx, t, this.raysI * 0.5, 47);
    R.mercyRays(ctx, 0, 320, this.raysI, t, { len: 1600, spread: 0.62, width: 0.2, angle: Math.PI / 2 });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = this.raysI;
    R.glow(ctx, 0, 320, 180 + Math.sin(t * 0.9) * 30, '#fffaf0');
    ctx.restore();
  },
};
