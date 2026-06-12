/* Chapter V — Paint an Image. Płock 1931 / Vilnius 1934.
   The heart of the game: the player paints the Image with their own
   imperfect hand — and the imperfection is answered by Diary 313. */

SCENES.ch5 = {
  id: 'ch5',
  enter() {
    this.t = 0;
    this.state = 'cell';            // cell → studio
    this.lumenI = 0; this.lumenRays = 0;
    this.step = null;               // garment → hand → ray_red → ray_pale → sig → done
    this.canvasRect = { x: -230, y: 165, w: 460, h: 620 };
    this.heart = { x: 0.5, y: 0.42 };
    this.handT = { x: 0.30, y: 0.30 };
    Painting.strokes = [];
    Painting.sigProgress = 0;
    this.curStroke = null;
    this.garmentLen = 0;
    this.handDone = false;
    this.glowAmt = 0.85;
    this.bloomed = 0;
    this.rayHintPulse = 0;
    this.brushOn = false;
    Engine.grainAmt = 0.07;
    Audio.pad.set([['D2', 'A2', 'F3', 'D4'], ['Bb1', 'F3', 'Bb3', 'D4'], ['C2', 'G3', 'E4', 'C4'], ['A1', 'E3', 'C#4', 'E4']], { level: 0.36, hold: 12, bright: 680 });
  },
  exit() { Audio.channels.air.set(0); Audio.channels.choir.set(0); },

  script: function* (S) {
    const sc = SCENES.ch5;
    yield S.wait(2.4);
    yield S.textAuto('Płock. The evening of the 22nd of February, 1931. She was alone in her cell.', 5);
    S.do(() => {
      Tweens.to(sc, { lumenI: 1 }, 6, { ease: Ease.inOutSine });
      Audio.pad.targetLevel = 0.55;
      Audio.channels.choir.set(0.16);
      Audio.shimmer(0.4, 600);
    });
    yield S.wait(5.5);
    yield S.text('In the evening, when I was in my cell, I saw the Lord Jesus clothed in a white garment.', { quote: true, attr: 'Diary, 47' });
    yield S.text('Paint an image according to the pattern you see, with the signature: Jesus, I trust in You.', { voice: true, attr: 'Diary, 47' });
    S.do(() => {
      Tweens.to(sc, { lumenRays: 1 }, 4, { ease: Ease.inOutSine });
      Audio.bell('D4', 0.3, 1.4); Audio.bell('A4', 0.2, 1.4);
      Audio.shimmer(0.6, 900);
    });
    yield S.wait(3.6);
    yield S.text('I promise that the soul that will venerate this image will not perish.', { voice: true, attr: 'Diary, 48' });
    S.do(() => {
      Tweens.to(sc, { lumenI: 0, lumenRays: 0 }, 5, { ease: Ease.inOutSine });
      Audio.channels.choir.set(0);
      Audio.pad.targetLevel = 0.36;
    });
    yield S.text('She was twenty-five — a convent cook who had never once held a brush.');
    yield S.text('For three years the command followed her. Confessors shrugged. Superiors frowned.');
    yield S.text('Then, in Vilnius, one priest believed her: Father Michał Sopoćko. He hired a painter, Eugeniusz Kazimirowski, and every week Sister Faustina came to correct the work.');
    /* ---- to the studio ---- */
    S.do(() => sc._toStudio());
    yield S.wait(3);
    yield S.textAuto('Vilnius, 1934. The painter waits. Show him what you saw.', 4.6);
    S.do(() => { sc.step = 'garment'; Hint.show('paint Him — slow, broad strokes of light', { top: '92%' }); });
    yield S.waitFor(() => sc.garmentLen > 2.1);
    S.do(() => { sc.step = 'hand'; Hint.show('the right hand, raised in blessing', { top: '92%' }); });
    yield S.waitFor(() => sc.handDone);
    S.do(() => { sc.step = 'ray_red'; Hint.show('from the heart — draw the red ray, downward', { top: '92%' }); });
    yield S.waitFor(() => Painting.strokes.some(s => s.kind === 'ray_red'));
    S.do(() => { sc.step = 'ray_pale'; Hint.show('and the pale ray, beside it', { top: '92%' }); });
    yield S.waitFor(() => Painting.strokes.some(s => s.kind === 'ray_pale'));
    yield S.wait(0.8);
    yield S.textAuto('The pale ray stands for the Water which makes souls righteous. The red ray stands for the Blood which is the life of souls. — Diary, 299', 7, { small: true });
    S.do(() => { sc.step = 'sig'; Hint.show('sign it — trace the words, left to right', { top: '92%' }); });
    yield S.waitFor(() => Painting.sigProgress > 0.93);
    S.do(() => {
      sc.step = 'done'; Hint.hide();
      Painting.sigProgress = 1;
      Save.savePainting(Painting.strokes);
      Audio.pluck('D5', 0.3);
    });
    yield S.wait(2.2);
    yield S.text('It was finished. And Sister Faustina wept.');
    yield S.text('“Who will paint You as beautiful as You are?”', { quote: true, attr: 'Diary, 313' });
    yield S.wait(0.6);
    S.do(() => sc._bloom());
    yield S.text('Not in the beauty of the color, nor of the brush, lies the greatness of this image, but in My grace.', { voice: true, attr: 'Diary, 313' });
    yield S.wait(1.5);
    yield S.text('Whatever your hand just made — it was enough. It was never about the brush.');
    yield S.text('In April 1935 the image was hung high in the Gate of Dawn, and a city looked up at it.');
    S.do(() => Engine.nextChapter());
  },

  _toStudio() {
    Engine.fade.color = '#000000';
    Tweens.to(Engine.fade, { alpha: 1 }, 1.4, {
      key: 'fade', ease: Ease.inOutQuad, onDone: () => {
        this.state = 'studio'; this.t = 0;
        Audio.pad.set([['F2', 'C3', 'A3', 'F4'], ['D2', 'A2', 'F3', 'C4'], ['Bb1', 'F3', 'D4', 'Bb3'], ['C2', 'G3', 'C4', 'E4']], { level: 0.4, hold: 11, bright: 1050 });
        Tweens.to(Engine.fade, { alpha: 0 }, 2, { key: 'fade' });
      },
    });
  },
  _bloom() {
    Tweens.to(this, { bloomed: 1, glowAmt: 1.75 }, 4.5, { ease: Ease.inOutSine });
    Audio.channels.choir.set(0.22);
    Audio.shimmer(0.7, 800);
    Audio.bell('D4', 0.32, 1.6);
    Engine.after(1200, () => Audio.motif({ vel: 0.42 }));
    Engine.shake(0.1);
  },

  /* ---------- painting input ---------- */
  _unit(p) {
    const r = this.canvasRect;
    return { x: (p.x - r.x) / r.w, y: (p.y - r.y) / r.h };
  },
  _inCanvas(u, pad = 0.02) { return u.x > -pad && u.x < 1 + pad && u.y > -pad && u.y < 1 + pad; },

  onPress(p) {
    if (this.state !== 'studio' || !this.step || this.step === 'done') return;
    const u = this._unit(p);
    if (!this._inCanvas(u)) return;
    if (this.step === 'garment' || this.step === 'hand') {
      this.curStroke = { kind: 'garment', pts: [u] };
      this._startBrush();
    } else if (this.step === 'ray_red' || this.step === 'ray_pale') {
      if (dist(u.x, u.y, this.heart.x, this.heart.y) < 0.12) {
        this.curStroke = { kind: this.step, pts: [u] };
        this._startBrush();
      } else {
        this.rayHintPulse = 1;
        Tweens.to(this, { rayHintPulse: 0 }, 1.2, { key: 'rhp' });
        Audio.pluck('D3', 0.14);
      }
    } else if (this.step === 'sig') {
      this._startBrush();
    }
  },
  onMove(p) {
    if (this.state !== 'studio') return;
    const u = this._unit(p);
    if (this.curStroke && Input.down) {
      const last = this.curStroke.pts[this.curStroke.pts.length - 1];
      if (dist(u.x, u.y, last.x, last.y) > 0.012 && this._inCanvas(u)) {
        this.curStroke.pts.push(u);
        if (this.curStroke.kind === 'garment') {
          this.garmentLen += dist(u.x, u.y, last.x, last.y);
          if (this.step === 'hand' && dist(u.x, u.y, this.handT.x, this.handT.y) < 0.075 && !this.handDone) {
            this.handDone = true;
            Audio.bell('A4', 0.22, 0.8); Audio.shimmer(0.4, 1200);
          }
        }
        /* brush sparkle */
        if (Math.random() < 0.5) {
          const r = this.canvasRect;
          Particles.spawn({
            x: r.x + u.x * r.w + rand(-3, 3), y: r.y + u.y * r.h + rand(-3, 3),
            vx: rand(-8, 8), vy: rand(-14, -4), life: rand(0.4, 1),
            size: rand(1, 2.4), endSize: 0.2,
            color: this.curStroke.kind === 'ray_red' ? '#ff8997' : '#fff0cf',
            alpha: 0.7, additive: true, glow: true,
          });
        }
      }
    }
    if (this.step === 'sig' && Input.down) {
      if (u.y > 0.84 && u.y < 0.98 && u.x > 0.14) {
        const target = clamp01((u.x - 0.18) / 0.64);
        if (target > Painting.sigProgress) {
          Painting.sigProgress = target;
          Audio.channels.air.set(0.1, 2600 + Math.random() * 600, 0.04);
        }
      }
    }
    const speed = Input.speed;
    if (this.brushOn) Audio.channels.air.set(clamp01(speed / 900) * 0.16 + 0.02, 500 + clamp(speed, 0, 1400), 0.06);
  },
  onRelease() {
    if (this.curStroke) {
      const s = this.curStroke; this.curStroke = null;
      if (s.kind === 'garment') {
        if (s.pts.length > 2) Painting.strokes.push({ kind: 'garment', pts: smoothPath(s.pts) });
      } else {
        /* validate the ray */
        const a = s.pts[0], b = s.pts[s.pts.length - 1];
        const len = s.pts.reduce((acc, p, i) => i ? acc + dist(p.x, p.y, s.pts[i - 1].x, s.pts[i - 1].y) : 0, 0);
        const sideOk = s.kind === 'ray_red' ? b.x < this.heart.x + 0.04 : b.x > this.heart.x - 0.04;
        if (len > 0.28 && b.y > a.y + 0.18 && sideOk) {
          Painting.strokes.push({ kind: s.kind, pts: smoothPath(s.pts, 3) });
          const chord = s.kind === 'ray_red' ? ['D3', 'A3', 'D4'] : ['F3', 'C4', 'F4'];
          chord.forEach((n, i) => setTimeout(() => Audio.bell(n, 0.2, 1), i * 90));
          Audio.shimmer(0.5, s.kind === 'ray_red' ? 700 : 1100);
          Engine.shake(0.05);
        } else {
          this.rayHintPulse = 1;
          Tweens.to(this, { rayHintPulse: 0 }, 1.2, { key: 'rhp' });
          Audio.pluck('D3', 0.12);
        }
      }
    }
    this._stopBrush();
  },
  _startBrush() { this.brushOn = true; },
  _stopBrush() { this.brushOn = false; Audio.channels.air.set(0, undefined, 0.12); },

  update(dt) {
    this.t += dt;
    if (this.state === 'cell' && this.lumenI > 0.3 && Math.random() < 0.2) {
      Particles.mote(320 + rand(-110, 110), rand(420, 780));
    }
    if (this.bloomed > 0.3 && Math.random() < 0.3) {
      const r = this.canvasRect;
      Particles.mote(r.x + rand(0, r.w), r.y + rand(r.h * 0.3, r.h));
    }
  },

  draw(ctx) {
    if (this.state === 'cell') this._drawCell(ctx);
    else this._drawStudio(ctx);
  },

  _drawCell(ctx) {
    const t = this.t;
    R.sky(ctx, 'ch5-cell', [[0, '#0a0710'], [0.6, '#0e0a14'], [1, '#120d18']], View.left, 0, View.W + 2, 900);
    /* bed edge, table, small lamp */
    ctx.fillStyle = '#0d0a12';
    ctx.fillRect(View.left, 740, View.W + 2, 160);
    ctx.fillStyle = '#15101c';
    ctx.fillRect(-640, 600, 300, 140);
    ctx.fillStyle = '#1a1322';
    ctx.fillRect(-660, 590, 340, 22);
    R.candle(ctx, -480, 590, 70, t, 0.7);
    lamp(ctx, -480, 545, 90, 'rgba(255,180,100,0.5)', 0.5, t);
    /* cross shadow on wall */
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-160, 300, 12, 90);
    ctx.fillRect(-186, 322, 64, 12);
    /* Faustina kneeling, facing the light */
    R.nun(ctx, -40, 822, 250, { kneel: true, color: '#120e17' });
    /* The Lord */
    R.lumen(ctx, 320, 830, 430, t, { intensity: this.lumenI, rays: this.lumenRays, raise: 1, rayLen: 760 });
    if (this.lumenI > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = this.lumenI * 0.6;
      ctx.fillStyle = '#ffe7c0';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },

  _drawStudio(ctx) {
    const t = this.t, r = this.canvasRect;
    R.sky(ctx, 'ch5-studio', [[0, '#171420'], [0.6, '#1d1926'], [1, '#231d2b']], View.left, 0, View.W + 2, 900);
    /* tall studio window, left */
    const wx = View.left + View.W * 0.1, wy = 140;
    ctx.fillStyle = '#2c3350';
    ctx.fillRect(wx, wy, 180, 420);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    R.glow(ctx, wx + 90, wy + 200, 240, 'rgba(190,205,255,0.22)');
    ctx.restore();
    ctx.strokeStyle = '#0c0a12'; ctx.lineWidth = 9;
    ctx.strokeRect(wx, wy, 180, 420);
    ctx.beginPath(); ctx.moveTo(wx + 90, wy); ctx.lineTo(wx + 90, wy + 420);
    ctx.moveTo(wx, wy + 140); ctx.lineTo(wx + 180, wy + 140);
    ctx.moveTo(wx, wy + 280); ctx.lineTo(wx + 180, wy + 280); ctx.stroke();
    /* floor */
    ctx.fillStyle = '#191420';
    ctx.fillRect(View.left, 800, View.W + 2, 100);

    /* the painter, far right, waiting (Kazimirowski) */
    R.cloaked(ctx, View.right - View.W * 0.12, 812, 280, { color: '#191523', hunch: 0.2, flip: true });
    /* Faustina beside the easel */
    R.nun(ctx, r.x - 140, 822, 264, { color: '#120e17', flip: false });

    /* easel legs */
    ctx.strokeStyle = '#241c28'; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(r.x + 30, r.y + r.h + 6); ctx.lineTo(r.x - 30, 860);
    ctx.moveTo(r.x + r.w - 30, r.y + r.h + 6); ctx.lineTo(r.x + r.w + 30, 860);
    ctx.moveTo(r.x + r.w / 2, r.y + r.h); ctx.lineTo(r.x + r.w / 2, 872);
    ctx.stroke();

    /* canvas */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#101018';
    ctx.fillRect(r.x - 10, r.y - 10, r.w + 20, r.h + 20);
    ctx.restore();
    const cg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    cg.addColorStop(0, '#191622'); cg.addColorStop(1, '#13101c');
    ctx.fillStyle = cg;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    /* ghost guide of the figure (faint, under player strokes) */
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    const gI = this.step === 'garment' || this.step === 'hand' ? 0.16 : 0.08;
    /* ghost guide sized so its heart sits at the heart marker (u 0.5, 0.42) */
    R.lumen(ctx, r.x + r.w / 2, r.y + r.h * 0.825, r.h * 0.78, t, { intensity: gI + this.bloomed * 0.5, raise: 0.9, rays: 0 });
    /* player's painting */
    Painting.render(ctx, r.x, r.y, r.w, r.h, { glow: this.glowAmt });
    /* current stroke preview */
    if (this.curStroke && this.curStroke.pts.length > 1) {
      const pts = this.curStroke.pts.map(u => ({ x: r.x + u.x * r.w, y: r.y + u.y * r.h }));
      if (this.curStroke.kind === 'garment') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < pts.length; i += 2) { ctx.globalAlpha = 0.045; R.glow(ctx, pts[i].x, pts[i].y, r.w * 0.085, '#f4ead2'); }
        ctx.restore();
      } else {
        const col = this.curStroke.kind === 'ray_red' ? '#e8364c' : '#dfe9ff';
        drawTaperedPath(ctx, pts, r.w * 0.07, col, 0.3);
      }
    }
    /* step guides */
    if (this.step === 'hand' && !this.handDone) {
      const hx = r.x + this.handT.x * r.w, hy = r.y + this.handT.y * r.h;
      const p = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + p * 0.4;
      R.glow(ctx, hx, hy, 22 + p * 10, '#ffeec9');
      ctx.restore();
    }
    if (this.step === 'ray_red' || this.step === 'ray_pale') {
      const hx = r.x + this.heart.x * r.w, hy = r.y + this.heart.y * r.h;
      const p = 0.5 + 0.5 * Math.sin(t * 2.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.5 + p * 0.5) * (1 + this.rayHintPulse);
      R.glow(ctx, hx, hy, 18 + p * 9 + this.rayHintPulse * 14, this.step === 'ray_red' ? '#ff96a3' : '#dfe9ff');
      /* dotted suggestion */
      ctx.globalAlpha = 0.16 + p * 0.1;
      ctx.setLineDash([3, 14]);
      ctx.strokeStyle = this.step === 'ray_red' ? '#ff8b99' : '#dfe9ff';
      ctx.lineWidth = 2;
      const ex = this.step === 'ray_red' ? 0.27 : 0.73;
      ctx.beginPath(); ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(r.x + (this.heart.x + (ex - this.heart.x) * 0.4) * r.w, r.y + 0.68 * r.h, r.x + ex * r.w, r.y + 0.93 * r.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (this.step === 'sig') {
      const p = 0.5 + 0.5 * Math.sin(t * 2);
      ctx.save();
      ctx.globalAlpha = 0.2 + p * 0.12;
      ctx.strokeStyle = '#e8c98a';
      ctx.setLineDash([2, 10]); ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + 0.18 * r.w, r.y + 0.93 * r.h);
      ctx.lineTo(r.x + 0.82 * r.w, r.y + 0.93 * r.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.restore();

    /* frame edge */
    ctx.strokeStyle = 'rgba(216,201,164,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    /* the bloom: grace exceeds the frame */
    if (this.bloomed > 0.01) {
      const hx = r.x + this.heart.x * r.w, hy = r.y + this.heart.y * r.h;
      R.mercyRays(ctx, hx, hy, this.bloomed * 0.55, t, { len: 1300, spread: 0.5, width: 0.16 });
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = this.bloomed * 0.5;
      ctx.fillStyle = '#ffe9c4';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },
};
