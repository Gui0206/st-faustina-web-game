/* Chapter VIII — The Dark Night. Prądnik sanatorium, 1938.
   The hold that goes unanswered. The verb breaks on purpose — and walking
   on anyway IS the prayer. At three o'clock, a bell. */

SCENES.ch8 = {
  id: 'ch8',
  enter() {
    this.t = 0;
    this.hero = new Walker(0, 812, { speed: 96, onStep: () => Audio.step(0.2) });
    this.hero.x = 0;
    this.worldEnd = 2400;
    this.flame = 0.06;           // nearly out
    this.flameAnswered = false;
    this.whispers = [];
    this.whisperT = 4;
    this.whisperPool = [
      'where is He now?', 'you imagined all of it', 'a cook — a prophet?',
      'no one believes you', 'the night has no far side', 'He has gone quiet, hasn’t He',
    ];
    this.coughT = 9;
    this.coughDim = 0;
    this.bellCount = 0;
    this.goldHorizon = 0;
    this.snowT = 0;
    this.benchSaid = false;
    Engine.grainAmt = 0.1;
    Audio.pad.set([['D2', 'A2', 'Eb3'], ['D2', 'Ab2', 'D3'], ['C#2', 'G2', 'C#3'], ['D2', 'A2', 'D3']], { level: 0.14, hold: 14, bright: 380 });
    Audio.channels.wind.set(0.34, 240);
    Audio.heartbeatStart(40, 0.22);
  },
  exit() {
    Audio.heartbeatStop();
    Audio.channels.wind.set(0);
  },

  script: function* (S) {
    const sc = SCENES.ch8;
    yield S.wait(2.4);
    yield S.text('The tuberculosis reached her lungs, then everything else. They sent her to the sanatorium at Prądnik.');
    yield S.text('And there, the visions stopped. The voice stopped. Heaven went dark and silent as this garden.');
    S.do(() => Hint.show('hold —', { ttl: 3.4 }));
    yield S.wait(4);
    S.do(() => Hint.show('…nothing answers. keep walking.', { ttl: 5 }));
    yield S.waitFor(() => sc.hero.x > sc.worldEnd * 0.5, { hint: '…nothing answers. keep walking.', hintAfter: 8 });
    S.do(() => { sc.benchSaid = true; });
    yield S.text('She kept a dry record of those weeks. No comfort in it — only this:');
    yield S.text('Suffering is a great grace; through suffering the soul becomes like the Savior; in suffering love becomes crystallized.', { quote: true, attr: 'Diary, 57' });
    yield S.waitFor(() => sc.hero.x > sc.worldEnd * 0.96, { hint: '…nothing answers. keep walking.', hintAfter: 8 });
    /* the bell */
    S.do(() => sc._bells());
    yield S.wait(6.4);
    yield S.text('As often as you hear the clock strike the third hour, immerse yourself completely in My mercy, adoring and glorifying it.', { voice: true, attr: 'Diary, 1572' });
    yield S.text('In this hour, I will refuse nothing to the soul that makes a request of Me in virtue of My Passion.', { voice: true, attr: 'Diary, 1320' });
    yield S.wait(0.5);
    yield S.text('The flame had not answered her holding. It returned anyway — not earned. Given.');
    yield S.text('The graces of My mercy are drawn by means of one vessel only, and that is — trust. The more a soul trusts, the more it will receive.', { voice: true, attr: 'Diary, 1578' });
    S.do(() => Engine.nextChapter());
  },

  _bells() {
    const toll = i => {
      Audio.bell('D3', 0.5, 2.2);
      Engine.shake(0.04);
      this.bellCount++;
      if (i === 2) {
        Tweens.to(this, { flame: 1 }, 4, { ease: Ease.inOutSine });
        Tweens.to(this, { goldHorizon: 1 }, 6, { ease: Ease.inOutSine });
        Audio.pad.set([['D2', 'A2', 'F#3', 'D4'], ['G2', 'D3', 'B3'], ['A2', 'E3', 'C#4'], ['D2', 'A2', 'D4']], { level: 0.4, hold: 11, bright: 880 });
        Audio.shimmer(0.4, 600);
        for (const w of this.whispers) w.dying = true;
        this.flameAnswered = true;
      }
    };
    toll(0);
    Engine.after(2300, () => toll(1));
    Engine.after(4600, () => toll(2));
  },

  onPress() {
    /* the broken verb: a tiny flicker of effort, then nothing */
    if (!this.flameAnswered) {
      Tweens.to(this, { flame: Math.min(this.flame + 0.05, 0.16) }, 0.3, {
        key: 'fl', onDone: () => { if (!this.flameAnswered) Tweens.to(this, { flame: 0.06 }, 1.6, { key: 'fl' }); },
      });
    }
  },

  update(dt) {
    this.t += dt;
    const dir = (Input.down || Input.axis() > 0) ? 1 : (Input.axis() < 0 ? -1 : 0);
    if (this.coughDim <= 0.35) this.hero.update(dt, dir);
    this.hero.x = clamp(this.hero.x, 0, this.worldEnd);
    Engine.cam.x = damp(Engine.cam.x, this.hero.x + 140, 3, dt);

    /* whispers born of walking */
    this.whisperT -= dt * (0.4 + this.hero.moving);
    if (this.whisperT <= 0 && !this.flameAnswered) {
      this.whisperT = rand(4, 7);
      this.whispers.push({
        text: pick(this.whisperPool),
        x: Engine.cam.x + View.W / 2 + 100, y: rand(300, 620),
        a: 0, life: 0, dying: false,
      });
    }
    for (let i = this.whispers.length - 1; i >= 0; i--) {
      const w = this.whispers[i];
      w.life += dt;
      w.x -= dt * (26 + this.hero.moving * 40);
      w.a = w.dying ? Math.max(0, w.a - dt * 0.8) : Math.min(0.34, w.a + dt * 0.12);
      if (w.life > 16 || (w.dying && w.a <= 0)) this.whispers.splice(i, 1);
    }
    /* cough */
    this.coughT -= dt * (0.5 + this.hero.moving * 0.7);
    if (this.coughT <= 0 && !this.flameAnswered) {
      this.coughT = rand(8, 13);
      this.coughDim = 1;
      if (AC) {
        blip(Audio.out(0.8, 0.1), 300, 0.16, 0.12, 'noise');
        setTimeout(() => blip(Audio.out(0.8, 0.1), 260, 0.13, 0.1, 'noise'), 240);
      }
      Engine.shake(0.05);
    }
    this.coughDim = Math.max(0, this.coughDim - dt * 0.8);
    /* snow */
    this.snowT -= dt;
    if (this.snowT <= 0) {
      this.snowT = 0.07;
      Particles.snow(Engine.cam.x, -20, View.W + 240);
    }
  },

  draw(ctx) {
    const t = this.t, gold = this.goldHorizon;
    /* near-black world */
    const g = ctx.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, '#040308');
    g.addColorStop(0.7, mixHex('#07060c', '#0d0a12', gold * 0.5));
    g.addColorStop(1, mixHex('#0a0810', '#241a14', gold));
    ctx.fillStyle = g; ctx.fillRect(View.left, 0, View.W + 2, 900);
    /* gold horizon thread at the answer */
    if (gold > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = gold * 0.6;
      const hg = ctx.createLinearGradient(0, 778, 0, 812);
      hg.addColorStop(0, 'rgba(255,196,110,0)');
      hg.addColorStop(0.5, 'rgba(255,196,110,0.5)');
      hg.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(View.left, 778, View.W + 2, 34);
      ctx.restore();
    }
    /* sanatorium far behind */
    ctx.fillStyle = '#06050b';
    ctx.fillRect(-700, 560, 560, 250);
    srand(55);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = rng() < 0.3 ? 'rgba(186,160,120,0.16)' : 'rgba(8,8,12,0.9)';
      ctx.fillRect(-660 + (i % 4) * 130, 600 + Math.floor(i / 4) * 90, 36, 52);
    }
    /* avenue of bare trees */
    for (let i = 0; i < 14; i++) {
      const tx = i * 360 - 200;
      if (tx < Engine.cam.x - View.W || tx > Engine.cam.x + View.W) continue;
      R.tree(ctx, tx, 816, 420 + (i % 3) * 60, 100 + i, '#060409');
    }
    /* ground */
    ctx.fillStyle = '#080710';
    ctx.fillRect(View.left, 806, View.W + 2, 100);
    ctx.fillStyle = 'rgba(223,230,242,0.04)';
    ctx.fillRect(View.left, 806, View.W + 2, 6);

    /* whispers */
    ctx.save();
    ctx.font = 'italic 19px "Iowan Old Style","Palatino Linotype",Georgia,serif';
    ctx.textAlign = 'center';
    for (const w of this.whispers) {
      ctx.globalAlpha = w.a * (0.7 + 0.3 * Math.sin(w.life * 1.4));
      ctx.fillStyle = '#8b8794';
      ctx.fillText(tr(w.text), w.x, w.y + Math.sin(w.life * 0.8) * 8);
    }
    ctx.restore();

    /* Faustina with her lantern-candle */
    R.nun(ctx, this.hero.x, 812, 240, { color: '#0b0910', walk: this.hero.phase, coif: 'rgba(180,172,158,0.5)' });
    const lampX = this.hero.x + 56, lampY = 700;
    R.candle(ctx, lampX, lampY + 26, 44, t, this.flame);
    lamp(ctx, lampX, lampY, 60 + this.flame * 200, 'rgba(255,180,100,0.5)', this.flame, t, 0.16);
    /* the answered flame sheds motes */
    if (this.flameAnswered && Math.random() < 0.25) Particles.mote(lampX + rand(-10, 10), lampY - rand(0, 30));

    /* cough dim */
    if (this.coughDim > 0.01) {
      ctx.fillStyle = `rgba(0,0,0,${this.coughDim * 0.5})`;
      ctx.fillRect(View.left, 0, View.W + 2, 900);
    }
  },
};
