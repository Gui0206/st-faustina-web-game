/* Chapter III — The Doors. Warsaw, 1925.
   Persistence as a mechanic: knock, be refused, walk on. The last door asks
   a different question. */

SCENES.ch3 = {
  id: 'ch3',
  enter() {
    this.t = 0;
    this.state = 'street';      // street → chapel-beat (inline) → accepted → enter
    this.hero = new Walker(80, 800, { speed: 150, onStep: () => Audio.step(0.16) });
    this.doors = [
      { x: 560,  asked: false, done: false, lampI: 1, reply: 'We have no place for you.' },
      { x: 1240, asked: false, done: false, lampI: 1, reply: 'No dowry? Then no.' },
      { x: 1920, asked: false, done: false, lampI: 1, reply: 'We do not take in maids.' },
      { x: 2700, asked: false, done: false, lampI: 1, final: true },
    ];
    this.worldEnd = 3100;
    this.snowT = 0;
    this.breathT = 0;
    this.kneeling = false;
    this.bloom = new PrayBloom({ riseTime: 2.8 });
    this.accepted = 0;
    this.doorOpen = 0;
    this.knockAnim = 0;
    this.canKnock = false;
    this.knockCount = 0;
    Engine.grainAmt = 0.08;
    Audio.pad.set([['A1', 'E3', 'A3', 'C4'], ['F1', 'C3', 'F3', 'A3'], ['G1', 'D3', 'G3', 'B3'], ['E1', 'B2', 'E3', 'G#3']], { level: 0.36, hold: 12, bright: 640 });
    Audio.channels.wind.set(0.3, 380);
  },
  exit() { Audio.channels.wind.set(0, 300); },

  script: function* (S) {
    const sc = SCENES.ch3;
    yield S.wait(2.2);
    yield S.textAuto('Warsaw. She arrived with one bag and no one waiting.', 4.4);
    S.do(() => Hint.show('hold to walk — knock at the doors', { ttl: 6 }));
    yield S.waitFor(() => sc.doors[0].done, { hint: 'hold to walk — knock at the doors', hintAfter: 7 });
    yield S.textAuto('There was another door.', 3.2);
    yield S.waitFor(() => sc.doors[1].done, { hint: 'hold to walk — knock at the doors', hintAfter: 8 });
    yield S.textAuto('And another.', 2.8);
    yield S.waitFor(() => sc.doors[2].done, { hint: 'hold to walk — knock at the doors', hintAfter: 8 });
    yield S.text('She knocked on many doors that summer. The answer learned her face.');
    yield S.textAuto('One door remained — Żytnia Street: the Sisters of Our Lady of Mercy.', 5);
    yield S.waitFor(() => sc.doors[3].asked, { hint: 'hold to walk — knock at the doors', hintAfter: 8 });
    yield S.wait(1.6);
    yield S.text('The superior, Mother Michael, studied the small girl in the worn dress.');
    yield S.text('“Go and ask the Lord of the house whether He will accept you.”');
    S.do(() => { sc.kneeling = true; Hint.show('hold — and ask', { ttl: 5 }); });
    yield S.waitFor(() => sc.bloom.v > 0.95, { hint: 'hold — and ask', hintAfter: 5 });
    yield S.wait(1.2);
    S.do(() => {
      Audio.shimmer(0.5); Audio.bell('F4', 0.3);
      Tweens.to(sc, { accepted: 1 }, 3, { ease: Ease.inOutSine });
    });
    yield S.text('I do accept; you are in My Heart.', { voice: true, attr: 'Diary, 14' });
    yield S.text('Accepted — on one condition. She must earn the clothes she would renounce.');
    yield S.text('A year in service at Ostrówek: other people’s laundry, other people’s children, coin by coin.');
    S.do(() => {
      sc.kneeling = false;
      Tweens.to(sc, { doorOpen: 1 }, 2.6, { ease: Ease.inOutSine });
      Audio.bell('D4', 0.26, 1.3);
    });
    yield S.text('On the first of August, 1925, the door on Żytnia Street opened to her.');
    S.do(() => Hint.show('walk in', { ttl: 4 }));
    yield S.waitFor(() => sc.hero.x > sc.doors[3].x - 16, { hint: 'walk in', hintAfter: 6 });
    S.do(() => {
      Engine.fade.color = '#fff7e8';
      Tweens.to(Engine.fade, { alpha: 1 }, 1.8, { key: 'fade', ease: Ease.inOutQuad, onDone: () => Engine.nextChapter() });
    });
    yield S.wait(3);
  },

  _activeDoor() {
    for (const d of this.doors) {
      if (!d.done && Math.abs(this.hero.x - d.x) < 90) return d;
    }
    return null;
  },

  onPress() {
    const d = this._activeDoor();
    if (d && !this.kneeling && this.doorOpen < 0.1) {
      if (d.asked) return;
      this.knockAnim = 1;
      Tweens.to(this, { knockAnim: 0 }, 0.5, { key: 'knock' });
      Audio.knock(0.7);
      setTimeout(() => Audio.knock(0.55), 190);
      Engine.shake(0.07);
      d.asked = true;
      if (!d.final) {
        Engine.after(900, () => {
          Text.show(d.reply, { small: true, auto: 3, passthrough: true });
          Tweens.to(d, { lampI: 0.18 }, 1.6, { ease: Ease.inOutSine });
          Audio.pluck('E3', 0.2);
          Engine.after(1400, () => { d.done = true; });
        });
      }
    }
  },

  update(dt) {
    this.t += dt;
    /* walking (blocked while kneeling / final dialogue) */
    if (!this.kneeling) {
      const d = this._activeDoor();
      const wantWalk = Input.down && !(d && !d.asked && Math.abs(this.hero.x - d.x) < 60);
      const dir = wantWalk || Input.axis() > 0 ? 1 : (Input.axis() < 0 ? -1 : 0);
      if (!(d && d.final && d.asked && this.doorOpen < 0.9)) {
        this.hero.update(dt, dir);
      }
      this.hero.x = clamp(this.hero.x, 60, this.doorOpen > 0.5 ? this.doors[3].x : this.worldEnd - 300);
    } else {
      this.bloom.update(dt);
      Audio.pad.targetLevel = 0.36 + this.bloom.v * 0.26;
      if (Input.down && Math.random() < 0.1) Particles.mote(this.hero.x + rand(-30, 30), rand(560, 760));
    }
    /* camera follows */
    Engine.cam.x = damp(Engine.cam.x, clamp(this.hero.x + 120, View.W / 2 - 380, this.worldEnd), 3.2, dt);
    /* snow */
    this.snowT -= dt;
    if (this.snowT <= 0) {
      this.snowT = 0.05;
      Particles.snow(Engine.cam.x, -20, View.W + 200);
    }
    /* breath in the cold */
    this.breathT -= dt;
    if (this.breathT <= 0 && this.hero.moving > 0.4) {
      this.breathT = rand(1.6, 2.6);
      Particles.spawn({
        x: this.hero.x + 24, y: 800 - 232, vx: rand(14, 26), vy: rand(-10, -2),
        life: 1.4, size: 5, endSize: 14, color: '#cfd6e4', alpha: 0.12, fadeIn: 0.2,
      });
    }
  },

  draw(ctx) {
    const t = this.t;
    R.sky(ctx, 'ch3-sky', [[0, '#0a0c16'], [0.55, '#131524'], [1, '#1d1e30']], View.left, 0, View.W + 2, 900);
    /* far rooftops */
    R.hills(ctx, 420, 90, '#0c0d18', 41, t);
    /* the street: repeating facades */
    srand(99);
    const shades = ['#11101c', '#141220', '#0f0e1a'];
    for (let bx = -200; bx < this.worldEnd + 600; ) {
      const bw = 220 + rng() * 240;
      const bh = 380 + rng() * 260;
      ctx.fillStyle = shades[(rng() * shades.length) | 0];
      ctx.fillRect(bx, 820 - bh, bw, bh);
      /* windows */
      const cols = Math.max(2, (bw / 80) | 0), rows = Math.max(3, (bh / 110) | 0);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const wxx = bx + 30 + i * (bw - 60) / Math.max(cols - 1, 1) - 12;
        const wyy = 820 - bh + 46 + j * 92;
        const lit = rng() < 0.08;
        ctx.fillStyle = lit ? 'rgba(255,196,120,0.55)' : 'rgba(8,8,14,0.9)';
        ctx.fillRect(wxx, wyy, 26, 38);
      }
      bx += bw + 12;
    }
    /* pavement */
    ctx.fillStyle = '#0b0a12';
    ctx.fillRect(View.left, 800, View.W + 2, 100);
    ctx.fillStyle = 'rgba(223,230,242,0.05)';
    ctx.fillRect(View.left, 800, View.W + 2, 7);

    /* doors */
    for (const d of this.doors) {
      const isFinal = d.final;
      /* pale stone surround so each door reads against the facade */
      ctx.fillStyle = '#221e33';
      ctx.beginPath();
      ctx.moveTo(d.x - 78, 802);
      ctx.lineTo(d.x - 78, 612);
      ctx.quadraticCurveTo(d.x, 540, d.x + 78, 612);
      ctx.lineTo(d.x + 78, 802);
      ctx.closePath(); ctx.fill();
      /* step */
      ctx.fillStyle = '#262238';
      ctx.fillRect(d.x - 84, 796, 168, 10);
      /* arch recess */
      ctx.fillStyle = '#0a0814';
      ctx.beginPath();
      ctx.moveTo(d.x - 62, 802);
      ctx.lineTo(d.x - 62, 620);
      ctx.quadraticCurveTo(d.x, 560, d.x + 62, 620);
      ctx.lineTo(d.x + 62, 802);
      ctx.closePath(); ctx.fill();
      /* door panel / opening */
      const open = isFinal ? this.doorOpen : 0;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(d.x - 48, 800);
      ctx.lineTo(d.x - 48, 634);
      ctx.quadraticCurveTo(d.x, 584, d.x + 48, 634);
      ctx.lineTo(d.x + 48, 800);
      ctx.closePath(); ctx.clip();
      if (open > 0.01) {
        const g = ctx.createLinearGradient(0, 580, 0, 800);
        g.addColorStop(0, `rgba(255,238,200,${0.85 * open})`);
        g.addColorStop(1, `rgba(255,214,150,${0.6 * open})`);
        ctx.fillStyle = g;
        ctx.fillRect(d.x - 48, 580, 96, 222);
        ctx.globalCompositeOperation = 'lighter';
        R.glow(ctx, d.x, 700, 130 * open, 'rgba(255,226,170,0.5)');
        /* the waiting silhouette of Mother Michael */
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = open;
        R.nun(ctx, d.x + 10, 798, 196, { color: '#241c20', coif: 'rgba(236,228,210,0.9)' });
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#1f1830';
        ctx.fillRect(d.x - 48, 580, 96, 222);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4;
        ctx.strokeRect(d.x - 32, 642, 28, 64);
        ctx.strokeRect(d.x + 4, 642, 28, 64);
        ctx.strokeRect(d.x - 32, 718, 28, 76);
        ctx.strokeRect(d.x + 4, 718, 28, 76);
        ctx.beginPath(); ctx.arc(d.x + 36, 722, 4.5, 0, TAU);
        ctx.fillStyle = 'rgba(212,190,148,0.7)'; ctx.fill();
        /* lamp pool washing the door face */
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.16 * d.lampI;
        R.glow(ctx, d.x, 640, 120, 'rgba(190,170,255,0.7)');
        ctx.restore();
      }
      ctx.restore();
      /* knock shiver */
      if (this.knockAnim > 0.01 && Math.abs(this.hero.x - d.x) < 110) {
        ctx.save();
        ctx.globalAlpha = this.knockAnim * 0.5;
        ctx.strokeStyle = '#cfd6e4';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(d.x + 26, 726, 12 + (1 - this.knockAnim) * 26, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      /* lamp */
      const li = isFinal ? (0.9 + this.accepted * 0.4) : d.lampI;
      lamp(ctx, d.x, 588, 64, isFinal ? 'rgba(255,214,140,0.8)' : 'rgba(220,190,255,0.55)', li * 0.8, t + d.x, 0.1);
      ctx.fillStyle = `rgba(255,224,170,${0.35 + li * 0.5})`;
      ctx.beginPath(); ctx.arc(d.x, 588, 5, 0, TAU); ctx.fill();
      /* plaque on the final door */
      if (isFinal) {
        ctx.globalAlpha = 0.75;
        spacedTextAt(ctx, 'ŻYTNIA 3/9', d.x, 545, 11, 4, 'rgba(214,206,188,0.7)');
        ctx.globalAlpha = 1;
      }
    }

    /* Helena */
    const kneel = this.kneeling;
    ctx.save();
    if (this.hero.face < 0) { ctx.translate(this.hero.x, 0); ctx.scale(-1, 1); ctx.translate(-this.hero.x, 0); }
    R.maiden(ctx, this.hero.x, 802, kneel ? 185 : 208, { color: '#241a26', kneel, walk: kneel ? undefined : this.hero.phase });
    ctx.restore();
    /* acceptance light */
    if (this.accepted > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = this.accepted * 0.5;
      R.glow(ctx, this.hero.x, 660, 190, 'rgba(255,236,196,0.5)');
      ctx.restore();
    }
  },
};

/* small caps helper at world position (textAlign center) */
function spacedTextAt(ctx, str, x, y, size, spacing, color) {
  ctx.save();
  ctx.translate(x, y);
  spacedText(ctx, str, 0, 0, size, spacing, color);
  ctx.restore();
}
