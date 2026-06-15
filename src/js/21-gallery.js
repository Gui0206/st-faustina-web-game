/* Closing gallery — the real people behind the story.
   After the keepsake, the four photographs are shown one at a time, each with
   a quiet caption. One tap reveals the next; the last returns to the title. */

SCENES.gallery = {
  id: 'gallery',

  slides: [
    { src: () => HELENA_IMG,         cap: 'Helena Kowalska',                                  sub: 'before she entered the convent' },
    { src: () => FAUSTINA_NUN_IMG,   cap: 'Sister Maria Faustina of the Blessed Sacrament',   sub: 'Helena Kowalska · 1905–1938' },
    { src: () => FAUSTINA_JESUS_IMG, cap: '“Paint an image according to the pattern you see.”', sub: 'the apparition at Płock · 22 February 1931' },
    { src: () => JOHN_PAUL_II_IMG,   cap: 'Saint John Paul II',                                sub: 'who canonized her · Rome, 30 April 2000' },
  ],

  enter() {
    this.t = 0;
    this.i = 0;
    this.fade = 0;          // current slide reveal 0→1
    this.prev = -1;         // outgoing slide index (-1 = none)
    this.prevA = 0;         // outgoing slide alpha
    this.idle = 0;
    this.ended = false;     // past the last slide → returning
    this.cueA = 0;
    this.imgs = this.slides.map(s => { const im = new Image(); im.src = s.src(); return im; });
    Engine.grainAmt = 0.08;
    /* a brighter, airier pad than the epilogue's dark globe — light, not dusk */
    Audio.pad.set([['D3', 'A3', 'D4', 'F#4'], ['G3', 'D4', 'G4', 'B4'], ['A3', 'E4', 'A4', 'C#5'], ['D3', 'A3', 'D4', 'F#4']], { level: 0.4, hold: 13, bright: 1180 });
    Audio.channels.choir.set(0.12, ['A3', 'D4', 'F#4', 'A4']);
    document.getElementById('app').classList.add('show-cursor');
    this._chime();
  },

  exit() {
    Audio.channels.choir.set(0);
    document.getElementById('app').classList.remove('show-cursor');
  },

  _chime() {
    /* a bright sprinkle of light — high grains, a celesta, a bell an octave up */
    Audio.shimmer(0.5, 1500);
    Audio.celesta('A5', 0.3);
    Audio.bell('D5', 0.18, 1.4);
  },

  _advance() {
    if (this.ended) return;
    /* a press while a slide is still arriving simply completes its reveal */
    if (this.fade < 0.92) { this.fade = 1; return; }
    if (this.i >= this.slides.length - 1) {
      this.ended = true;
      Audio.motif({ final: true, vel: 0.32, slow: true });
      Engine.go('title', { slowOut: true });
      return;
    }
    this.prev = this.i;
    this.prevA = 1;
    this.i++;
    this.fade = 0;
    this.idle = 0;
    this._chime();
  },

  onPress() { this._advance(); },

  update(dt) {
    this.t += dt;
    this.fade = Math.min(1, this.fade + dt / 1.6);
    if (this.prevA > 0) this.prevA = Math.max(0, this.prevA - dt / 1.0);
    this.idle += Input.down ? 0 : dt;
    /* the "touch to continue" cue breathes in once the slide has settled */
    const wantCue = this.fade > 0.96 && !this.ended ? 1 : 0;
    this.cueA = damp(this.cueA, wantCue, 4, dt);
    if (this.t > 1 && Math.random() < 0.04) {
      Particles.dust(rand(View.left, View.right), rand(120, 820), '#d9d2e8');
    }
  },

  _drawSlide(ctx, idx, alpha) {
    if (alpha <= 0.002) return;
    const img = this.imgs[idx];
    const slide = this.slides[idx];
    const cx = 0, cy = 372;
    const maxW = Math.min(View.W * 0.6, 540), maxH = 486;
    let iw = maxW, ih = maxH;
    if (img && img.complete && img.naturalWidth) {
      const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      iw = img.naturalWidth * s; ih = img.naturalHeight * s;
    }
    const x = cx - iw / 2, y = cy - ih / 2;
    const rise = (1 - alpha) * 18;   // a gentle lift as it fades in

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, rise);

    /* warm halo behind the frame */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.5;
    R.glow(ctx, cx, cy, Math.max(iw, ih) * 0.92, 'rgba(255,232,186,0.5)');
    ctx.restore();

    const pad = 12;
    /* mat + soft drop shadow */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 46; ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(x - pad, y - pad, iw + pad * 2, ih + pad * 2);
    ctx.restore();

    /* the photograph */
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, x, y, iw, ih);
    else { ctx.fillStyle = '#15121d'; ctx.fillRect(x, y, iw, ih); }

    /* thin gilded rim */
    ctx.strokeStyle = 'rgba(232,201,138,0.5)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - pad + 0.5, y - pad + 0.5, iw + pad * 2 - 1, ih + pad * 2 - 1);

    /* caption */
    const capY = y + ih + pad + 56;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(236,229,216,0.95)';
    ctx.font = 'italic 26px "Iowan Old Style","Palatino Linotype",Georgia,serif';
    /* wrap the long caption to a second line rather than overflow */
    const lines = ['']; const maxLine = View.W * 0.82;
    for (const word of tr(slide.cap).split(' ')) {
      const probe = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
      if (ctx.measureText(probe).width > maxLine && lines[lines.length - 1]) lines.push(word);
      else lines[lines.length - 1] = probe;
    }
    lines.forEach((ln, k) => ctx.fillText(ln, cx, capY + k * 34));
    ctx.fillStyle = 'rgba(232,201,138,0.72)';
    ctx.font = '13px "Iowan Old Style","Palatino Linotype",Georgia,serif';
    spacedText(ctx, tr(slide.sub).toUpperCase(), cx, capY + lines.length * 34 + 14, 13, 3, 'rgba(232,201,138,0.7)');
    ctx.restore();
  },

  draw(ctx) {
    R.sky(ctx, 'gallery-sky', [[0, '#04030a'], [0.6, '#070613'], [1, '#0b0916']], View.left, 0, View.W + 2, 900);
    R.stars(ctx, this.t, 0.6, 71);
    if (this.prevA > 0) this._drawSlide(ctx, this.prev, this.prevA * (1 - this.fade));
    this._drawSlide(ctx, this.i, this.fade);

    /* touch-to-continue cue */
    if (this.cueA > 0.01) {
      const last = this.i >= this.slides.length - 1;
      ctx.save();
      ctx.globalAlpha = this.cueA * (0.4 + 0.28 * Math.sin(this.t * 1.8));
      ctx.fillStyle = '#ece5d8';
      ctx.font = '14px "Iowan Old Style","Palatino Linotype",Georgia,serif';
      ctx.textAlign = 'center';
      ctx.fillText(tr(last ? 'touch to return' : 'touch to continue'), 0, 824);
      ctx.restore();
    }
  },
};
