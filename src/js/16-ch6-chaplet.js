/* Chapter VI — The Chaplet. Vilnius, September 1935.
   A storm over the city; an angel sent to strike; a prayer on ordinary beads.
   Cadence, not speed: press with the breathing ring, and the sky retreats. */

SCENES.ch6 = {
  id: 'ch6',
  enter() {
    this.t = 0;
    this.phase = 'intro';        // intro → bigbead → decade → bridge → cascade → holy → dawn
    this.storm = 1;
    this.decadeBeads = 0;        // 0..10
    this.holyCount = 0;
    this.cascade = 0;            // 0..24
    this.cascadeT = 0;
    this.decadesDone = 0;
    this.ringT = 0;
    this.ringPeriod = 2.5;
    this.lightning = 0;
    this.lightningT = rand(1.5, 3);
    this.boltSeed = 1;
    this.dawn = 0;
    this.beadFlash = 0;
    this.angelArm = 1;
    Engine.grainAmt = 0.085;
    Audio.pad.set([['D2', 'A2', 'D3', 'F3'], ['C2', 'G2', 'C3', 'Eb3'], ['Bb1', 'F2', 'Bb2', 'D3'], ['A1', 'E2', 'A2', 'C#3']], { level: 0.4, hold: 9, bright: 520 });
    Audio.channels.rain.set(0.5, 1700);
    Audio.channels.wind.set(0.4, 300);
  },
  exit() {
    Audio.channels.rain.set(0);
    Audio.channels.wind.set(0);
  },

  script: function* (S) {
    const sc = SCENES.ch6;
    yield S.wait(2.4);
    yield S.text('Vilnius. In September of 1935, she saw in the sky an angel — the executor of God’s wrath, sent to strike the earth.');
    yield S.text('She began to plead for the world — and heard, rising within her, words she had never learned.');
    S.do(() => { sc.phase = 'bigbead'; Hint.show('press with the slow ring — begin', { ttl: 7 }); });
    yield S.waitFor(() => sc.phase === 'decade', { hint: 'press with the slow ring — begin', hintAfter: 8 });
    yield S.textAuto('Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world.', 8, { voice: true, attr: 'Diary, 476' });
    yield S.waitFor(() => sc.decadeBeads >= 10, { hint: 'each small bead — with the ring', hintAfter: 7 });
    S.do(() => { sc.phase = 'bridge'; sc.decadesDone = 1; });
    yield S.wait(1.2);
    yield S.text('Ten times on the small beads: For the sake of His sorrowful Passion, have mercy on us and on the whole world.', { quote: true, attr: 'Diary, 476' });
    yield S.text('And again. And again — five decades, fifty pleas, on ordinary rosary beads.');
    S.do(() => { sc.phase = 'cascade'; Hint.show('hold — and pray on', { ttl: 6 }); });
    yield S.waitFor(() => sc.cascade >= 24, { hint: 'hold — and pray on', hintAfter: 6 });
    S.do(() => { sc.phase = 'holy'; sc.decadesDone = 5; Hint.show('three times — Holy God', { ttl: 6 }); });
    yield S.waitFor(() => sc.holyCount >= 3, { hint: 'three times — Holy God', hintAfter: 6 });
    S.do(() => {
      sc.phase = 'dawn';
      Tweens.to(sc, { dawn: 1, storm: 0 }, 7, { ease: Ease.inOutSine });
      Audio.channels.rain.set(0.06, 1200, 2);
      Audio.channels.wind.set(0.1, 240, 2);
      Audio.pad.set([['D2', 'A2', 'F#3', 'D4'], ['G2', 'D3', 'B3', 'G3'], ['A2', 'E3', 'A3', 'C#4'], ['D2', 'A2', 'D4', 'F#4']], { level: 0.5, hold: 10, bright: 1100 });
      Audio.shimmer(0.5, 800);
    });
    yield S.wait(5);
    yield S.text('The arm did not fall. Before those words, the angel stood helpless — and the storm knelt.');
    yield S.text('Whoever will recite it will receive great mercy at the hour of death.', { voice: true, attr: 'Diary, 687' });
    yield S.text('She wrote the words down. The world still prays them every day, at three o’clock, on ordinary beads.');
    S.do(() => Engine.nextChapter());
  },

  _ringPulse() {
    /* 0..1, peaks once per period */
    return 0.5 + 0.5 * Math.sin((this.ringT / this.ringPeriod) * TAU - Math.PI / 2);
  },
  _cadence() {
    /* accuracy of pressing near the pulse peak (generous) */
    const ph = (this.ringT % this.ringPeriod) / this.ringPeriod;     // peak at 0.5
    return 1 - clamp01(Math.abs(ph - 0.5) / 0.34);
  },

  _bead(big) {
    const acc = this._cadence();
    const retreat = (big ? 0.045 : 0.02) * (0.55 + 0.45 * acc);
    this.storm = clamp01(this.storm - retreat);
    this.beadFlash = 0.6 + acc * 0.4;
    Tweens.to(this, { beadFlash: 0 }, 0.9, { key: 'bf' });
    const tones = ['D4', 'E4', 'F4', 'G4', 'A4'];
    if (big) Audio.bell('D4', 0.3, 1.1);
    else Audio.pluck(tones[(this.decadeBeads + this.cascade) % tones.length], 0.2 + acc * 0.16);
    if (acc > 0.55) Audio.shimmer(0.12, 1400);
    Tweens.to(this, { angelArm: this.storm }, 1.6, { key: 'arm', ease: Ease.inOutSine });
  },

  onPress() {
    if (this.phase === 'bigbead') {
      this._bead(true);
      this.phase = 'decade';
      Hint.show('each small bead — with the ring', { ttl: 6 });
    } else if (this.phase === 'decade') {
      if (this.decadeBeads < 10) {
        this.decadeBeads++;
        this._bead(false);
      }
    } else if (this.phase === 'holy') {
      this.holyCount++;
      Audio.bell(['D3', 'A2', 'D2'][this.holyCount - 1] || 'D3', 0.4, 1.8);
      this.storm = clamp01(this.storm - 0.07);
      Engine.shake(0.06);
      Audio.shimmer(0.3, 600);
    }
  },

  update(dt) {
    this.t += dt;
    this.ringT += dt;
    /* cascade while holding */
    if (this.phase === 'cascade') {
      if (Input.down) {
        this.cascadeT -= dt;
        if (this.cascadeT <= 0) {
          this.cascadeT = 0.34;
          this.cascade++;
          this._bead(this.cascade % 11 === 0);
          this.decadesDone = 1 + Math.min(4, Math.floor(this.cascade / 6));
        }
      }
    }
    /* lightning while the storm lives */
    this.lightningT -= dt * (0.3 + this.storm);
    if (this.lightningT <= 0 && this.storm > 0.08) {
      this.lightningT = rand(2, 5.5);
      this.lightning = 0.7 + this.storm * 0.3;
      this.boltSeed = (Math.random() * 9999) | 0;
      Tweens.to(this, { lightning: 0 }, rand(0.4, 0.8), { key: 'li', ease: Ease.outExpo });
      Engine.after(rand(150, 700), () => Audio.thunder(0.25 + this.storm * 0.5));
      if (this.storm > 0.5) Engine.shake(0.1 * this.storm);
    }
    /* rain spawns */
    const rainN = Math.round(this.storm * 5);
    for (let i = 0; i < rainN; i++) {
      Particles.spawn({
        x: rand(View.left, View.right), y: View.top - 10,
        vx: -120 * this.storm, vy: rand(560, 720), life: 1.4,
        size: 2.1, endSize: 2.1, color: 'rgba(160,180,220,0.5)', alpha: rand(0.1, 0.3),
        shape: 'streak',
      });
    }
    Audio.channels.rain.set(this.storm * 0.55 + (this.phase === 'dawn' ? 0.04 : 0), 1500 + this.storm * 700);
  },

  draw(ctx) {
    const t = this.t, storm = this.storm, dawn = this.dawn;
    /* sky: storm → dawn */
    const top = mixHex('#0a0a14', '#2c3a66', dawn);
    const mid = mixHex('#131428', '#7c6a8a', dawn);
    const bot = mixHex('#1c1c30', '#e8b27a', dawn);
    const g = ctx.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, top); g.addColorStop(0.62, mid); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(View.left, 0, View.W + 2, 900);

    /* storm clouds: layered dark blobs, receding upward as storm dies */
    ctx.save();
    const cloudLift = (1 - storm) * 260;
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = `rgba(${8 + layer * 6},${8 + layer * 5},${16 + layer * 8},${0.85 - layer * 0.2})`;
      ctx.beginPath();
      const baseY = 150 + layer * 70 - cloudLift * (1 + layer * 0.3);
      ctx.moveTo(View.left - 50, -100);
      ctx.lineTo(View.left - 50, baseY);
      for (let i = 0; i <= 16; i++) {
        const x = lerp(View.left - 50, View.right + 50, i / 16);
        const y = baseY + wobble(i * 1.3 + layer * 5 + t * 0.12) * 55 * (0.5 + storm);
        ctx.quadraticCurveTo(x - 30, y + 30, x, y);
      }
      ctx.lineTo(View.right + 50, -100);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* the angel — a terrible pillar of pale fire in the clouds */
    if (storm > 0.02) {
      const ax = View.W * 0.18, ay = 60 - cloudLift * 0.5;
      const I = storm * (0.65 + 0.1 * Math.sin(t * 1.1)) + this.lightning * 0.3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = I * 0.55;
      R.glow(ctx, ax, ay + 130, 300, 'rgba(220,210,255,0.5)');
      /* body wedge */
      const grd = ctx.createLinearGradient(0, ay, 0, ay + 460);
      grd.addColorStop(0, `rgba(235,228,255,${0.5 * I})`);
      grd.addColorStop(1, 'rgba(235,228,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(ax - 26, ay); ctx.lineTo(ax + 26, ay);
      ctx.lineTo(ax + 90, ay + 460); ctx.lineTo(ax - 90, ay + 460);
      ctx.closePath(); ctx.fill();
      /* wings: two faint arcs */
      ctx.strokeStyle = `rgba(225,215,255,${0.3 * I})`;
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.arc(ax - 130, ay + 170, 150, -1.9, -0.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(ax + 130, ay + 170, 150, Math.PI + 0.4, Math.PI + 1.9); ctx.stroke();
      /* the raised arm — lowering as the chaplet advances */
      const armA = -2.2 + (1 - this.angelArm) * 1.1;
      ctx.strokeStyle = `rgba(255,244,255,${0.5 * I})`;
      ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay + 120);
      ctx.lineTo(ax + Math.cos(armA) * 130, ay + 120 + Math.sin(armA) * 130);
      ctx.stroke();
      ctx.restore();
    }

    /* lightning */
    if (this.lightning > 0.02) {
      ctx.save();
      ctx.globalAlpha = this.lightning * 0.16;
      ctx.fillStyle = '#e8ecff';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = this.lightning * 0.8;
      ctx.strokeStyle = '#eef2ff';
      ctx.lineWidth = 2.6;
      srand(this.boltSeed);
      let bx = View.left + rng() * View.W * 0.9, by = 40;
      ctx.beginPath(); ctx.moveTo(bx, by);
      while (by < 560) { bx += (rng() - 0.5) * 90; by += 40 + rng() * 50; ctx.lineTo(bx, by); }
      ctx.stroke();
      ctx.restore();
    }

    /* Vilnius skyline */
    ctx.fillStyle = mixHex('#08070e', '#241a26', dawn * 0.7);
    ctx.beginPath();
    ctx.moveTo(View.left, 900); ctx.lineTo(View.left, 700);
    srand(77);
    let x = View.left;
    while (x < View.right) {
      const w = 60 + rng() * 130;
      const h = 640 - rng() * 110;
      ctx.lineTo(x, h);
      if (rng() < 0.3) { /* a spire */
        ctx.lineTo(x + w * 0.4, h); ctx.lineTo(x + w * 0.5, h - 90 - rng() * 70); ctx.lineTo(x + w * 0.6, h);
      }
      ctx.lineTo(x + w, h);
      x += w;
    }
    ctx.lineTo(View.right, 900);
    ctx.closePath(); ctx.fill();
    /* windows kindle as hope returns */
    srand(31);
    for (let i = 0; i < 40; i++) {
      const wx2 = View.left + rng() * View.W, wy2 = 680 + rng() * 150;
      const on = rng() < (1 - storm) * 0.9;
      if (on) {
        ctx.fillStyle = `rgba(255,200,120,${0.5 + 0.3 * Math.sin(t + i)})`;
        ctx.fillRect(wx2, wy2, 5, 8);
      }
    }

    /* Faustina at her window, foreground left — back to us, facing the storm */
    ctx.fillStyle = '#070509';
    ctx.fillRect(View.left, 820, View.W + 2, 80);
    R.nun(ctx, View.left + View.W * 0.16, 866, 250, { color: '#0e0b13' });

    /* ------ the chaplet interface ------ */
    const cy = 770, cx = 0;
    const interactive = ['bigbead', 'decade', 'holy', 'cascade'].includes(this.phase);
    if (interactive || this.phase === 'dawn') {
      /* the breathing ring, above the beads */
      if (interactive && this.phase !== 'cascade') {
        drawRing(ctx, cx, cy - 160, 56, this._ringPulse(), 0.85);
      }
      if (this.phase === 'cascade') {
        drawRing(ctx, cx, cy - 160, 56, Input.down ? 0.5 + 0.5 * Math.sin(t * 4) : 0.2, Input.down ? 0.9 : 0.5);
      }
      /* bead arc: 1 big + 10 small, a wide gentle smile of beads */
      const total = 11;
      const arcR = 420;
      const a0 = Math.PI * 0.795, a1 = Math.PI * 0.205;
      for (let i = 0; i < total; i++) {
        const f = i / (total - 1);
        const ang = lerp(a0, a1, f);
        const bx = cx + Math.cos(ang) * arcR;
        const by = cy + 330 - Math.sin(ang) * arcR;
        const isBig = i === 0;
        let lit;
        if (this.phase === 'bigbead') lit = false;
        else if (this.phase === 'decade') lit = isBig || i <= this.decadeBeads;
        else lit = true;
        const isNext = (this.phase === 'bigbead' && isBig) || (this.phase === 'decade' && i === this.decadeBeads + 1);
        const r = isBig ? 13 : 8.5;
        ctx.save();
        if (lit) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.75 + this.beadFlash * 0.25;
          R.glow(ctx, bx, by, r * 3, '#ffe7b8');
        } else if (isNext) {
          /* invite the next bead with a soft pulse */
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.3 + 0.3 * this._ringPulse();
          R.glow(ctx, bx, by, r * 2.6, '#cfd8f2');
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = lit ? '#f3e0b6' : `rgba(206,198,182,${isNext ? 0.75 : 0.34})`;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
        ctx.restore();
      }
      /* decade marks */
      for (let dnum = 0; dnum < 5; dnum++) {
        const on = dnum < this.decadesDone;
        ctx.globalAlpha = on ? 0.85 : 0.22;
        spacedTextAt(ctx, ['I', 'II', 'III', 'IV', 'V'][dnum], cx - 120 + dnum * 60, cy + 196, 13, 2, '#e8c98a');
        ctx.globalAlpha = 1;
      }
      /* persistent small-bead prayer caption */
      if (this.phase === 'decade' || this.phase === 'cascade') {
        ctx.globalAlpha = 0.5;
        ctx.font = 'italic 16px "Iowan Old Style","Palatino Linotype",Georgia,serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d8d0c0';
        ctx.fillText(tr('for the sake of His sorrowful Passion, have mercy on us and on the whole world'), cx, cy + 158);
        ctx.globalAlpha = 1;
      }
      if (this.phase === 'holy') {
        ctx.globalAlpha = 0.6;
        ctx.font = 'italic 16px "Iowan Old Style","Palatino Linotype",Georgia,serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e6dcc6';
        ctx.fillText(tr(['Holy God…', 'Holy Mighty One…', 'Holy Immortal One…'][Math.min(this.holyCount, 2)]), cx, cy + 158);
        ctx.globalAlpha = 1;
      }
    }
    /* dawn light wash */
    if (dawn > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = dawn * 0.55;
      ctx.fillStyle = '#ffd9a4';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },
};
