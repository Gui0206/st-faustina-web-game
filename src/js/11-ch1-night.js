/* Chapter I — A Voice in the Night. Głogowiec, 1912.
   The toy: hold to pray. The candle answers. Teaches the game's verb. */

SCENES.ch1 = {
  id: 'ch1',
  enter() {
    this.t = 0;
    this.bloom = new PrayBloom({
      riseTime: 3.4, fall: 0.1,
      onFull: () => {
        if (!this.bloomed) {
          this.bloomed = true;
          Audio.shimmer(0.5, 900);
          Audio.bell('D5', 0.18, 0.7);
          Particles.burst(this.childX, 560, 26, () => ({
            x: this.childX + rand(-40, 40), y: rand(420, 600),
            vx: rand(-8, 8), vy: rand(-46, -20), life: rand(2, 4),
            size: rand(2, 4.5), endSize: 0.4, color: '#ffeec4', alpha: 0.6,
            additive: true, glow: true, wobble: rand(6, 14), fadeIn: 0.4,
          }));
        }
      },
    });
    this.bloomed = false;
    this.childX = -20;
    this.fireT = 0;
    this.crackleT = 0;
    Engine.grainAmt = 0.075;
    Audio.pad.set([['D2', 'D3', 'A3', 'F4'], ['Bb1', 'F3', 'D4', 'Bb3'], ['G1', 'D3', 'Bb3', 'G4'], ['A1', 'E3', 'C#4', 'A3']], { level: 0.34, hold: 13, bright: 700 });
    Audio.channels.wind.set(0.1, 260);
  },
  exit() { Audio.heartbeatStop(); },

  script: function* (S) {
    const sc = SCENES.ch1;
    yield S.wait(2.4);
    yield S.text('Głogowiec, central Poland. A farmhouse with ten children and never quite enough bread.');
    yield S.text('The third child, Helena, woke in the night. Something was calling her by name.');
    /* one gate, not two: the candle blooming full IS the goal, and the hint
       comes back whenever the player lets go and waits */
    yield S.waitFor(() => sc.bloomed, { hint: 'hold — and stay awhile', hintAfter: 2.5 });
    yield S.wait(2.2);
    yield S.text('It was in the seventh year of my life that, for the first time, I heard God’s voice in my soul; that is, an invitation to a more perfect life.', { quote: true, attr: 'Diary, 7' });
    yield S.text('She was seven. For years she would try to outgrow it, the way one outgrows a dress.');
    yield S.text('The voice did not outgrow her.');
    yield S.wait(0.8);
    S.do(() => Engine.nextChapter());
  },

  onPress() {},
  update(dt) {
    this.t += dt;
    const b = this.bloom.update(dt);
    /* pad swells with the hold */
    Audio.pad.targetLevel = 0.34 + b * 0.3;
    /* candle crackle */
    this.crackleT -= dt;
    if (this.crackleT <= 0 && b > 0.1) {
      this.crackleT = rand(0.15, 0.6) / (0.4 + b);
      if (AC) blip(Audio.out(0.5, 0.1), rand(2400, 5200), 0.012 + b * 0.02, 0.02, 'noise');
    }
    /* fireflies through the window once blooming */
    this.fireT -= dt;
    if (this.fireT <= 0 && b > 0.25) {
      this.fireT = rand(0.3, 0.9) / b;
      Particles.spawn({
        x: this.childX + rand(60, 320), y: rand(360, 620),
        vx: rand(-10, 10), vy: rand(-16, -4), life: rand(2, 5),
        size: rand(1.4, 3), endSize: 0.3, color: '#d8ffba', alpha: rand(0.25, 0.55),
        additive: true, glow: true, wobble: rand(10, 24), wobbleF: rand(0.8, 2), fadeIn: 0.8,
      });
    }
    if (Input.down && Math.random() < 0.1 * b) Particles.mote(this.childX + rand(-30, 30), rand(480, 620));
  },

  draw(ctx) {
    const t = this.t, b = this.bloom.v;
    /* the dark room */
    R.sky(ctx, 'ch1-room', [[0, '#070509'], [0.7, '#0b0710'], [1, '#0d0911']], View.left, 0, View.W + 2, 900);
    /* window: tall arch on the right of the child, night sky through it */
    const wx = 120, wy = 250, ww = 360, wh = 430;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh);
    ctx.lineTo(wx, wy + 80);
    ctx.quadraticCurveTo(wx + ww / 2, wy - 70, wx + ww, wy + 80);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.closePath();
    ctx.clip();
    R.sky(ctx, 'ch1-night', [[0, '#0a1026'], [0.6, '#131a36'], [1, '#1d2440']], wx, wy - 70, ww, wh + 70);
    R.stars(ctx, t, 0.6 + b * 0.5, 23);
    /* moon */
    lamp(ctx, wx + ww * 0.7, wy + 90, 90 + b * 30, 'rgba(214,226,255,0.5)', 0.8 + b * 0.3, t, 0.02);
    ctx.fillStyle = '#e6edff';
    ctx.beginPath(); ctx.arc(wx + ww * 0.7, wy + 90, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0e142c';
    ctx.beginPath(); ctx.arc(wx + ww * 0.7 - 12, wy + 84, 22, 0, TAU); ctx.fill();
    /* far fields */
    R.hills(ctx, wy + wh - 60, 26, '#0a0d1f', 31, t);
    ctx.restore();
    /* window frame */
    ctx.strokeStyle = '#050308'; ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + 80);
    ctx.quadraticCurveTo(wx + ww / 2, wy - 70, wx + ww, wy + 80);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy - 16); ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + 170); ctx.lineTo(wx + ww, wy + 170);
    ctx.lineWidth = 9; ctx.stroke();

    /* light shaft through window onto the child, grows with prayer */
    if (b > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sh = b * (0.16 + 0.04 * Math.sin(t * 0.8));
      const grad = ctx.createLinearGradient(wx + ww * 0.5, wy, this.childX, 760);
      grad.addColorStop(0, `rgba(214,226,255,${sh})`);
      grad.addColorStop(1, 'rgba(214,226,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(wx + 60, wy + 60);
      ctx.lineTo(wx + ww - 40, wy + 30);
      ctx.lineTo(this.childX + 170, 800);
      ctx.lineTo(this.childX - 150, 800);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /* floorline */
    ctx.fillStyle = '#080509';
    ctx.fillRect(View.left, 760, View.W + 2, 140);

    /* candle on the sill */
    R.candle(ctx, wx + ww + 90, 700, 90, t, 0.35 + b * 0.65);
    lamp(ctx, wx + ww + 90, 640, 120 + b * 160, 'rgba(255,184,98,0.5)', 0.25 + b * 0.75, t);

    /* the child, kneeling toward the window */
    R.child(ctx, this.childX, 762, 264, { kneel: true });
    /* her shadow cast away from the window light */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(this.childX - 30, 766, 90, 10, 0, 0, TAU);
    ctx.fill();

    /* warmth wash as the prayer holds */
    if (b > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = b * 0.5;
      ctx.fillStyle = '#ffd9a0';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },
};
