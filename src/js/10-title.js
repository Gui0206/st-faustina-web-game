/* Title: a dark Polish field under the two rays, barely visible, breathing. */

SCENES.title = {
  id: 'title',
  enter() {
    this.t = 0;
    this.revealed = false;
    this.rayI = 0;
    this.titleA = 0;
    Tweens.to(this, { titleA: 1 }, 3, { delay: 0.8, ease: Ease.inOutSine });
    Engine.grainAmt = 0.06;
    this.moteT = 0;
    this.started = false;
  },
  exit() { Choices.hide(); UI.showMenuBtn(false); },

  _reveal() {
    if (this.revealed) return;
    this.revealed = true;
    Audio.init();
    Audio.pad.set([['D2', 'A2', 'D3', 'F3', 'A3'], ['Bb1', 'F2', 'D3', 'F3'], ['G1', 'G2', 'Bb2', 'D3', 'A3'], ['A1', 'A2', 'E3', 'C#4']], { level: 0.5, hold: 12, bright: 750 });
    Audio.channels.wind.set(0.16, 300);
    Tweens.to(this, { rayI: 0.34 }, 6, { ease: Ease.inOutSine });
    Audio.motif({ vel: 0.34 });
    Engine.after(1700, () => { if (Engine.scene === this) this._menu(); });
    UI.showMenuBtn(true);
  },

  _menu() {
    const savedId = Save.data.chapter && SCENES[Save.data.chapter] ? Save.data.chapter : null;
    const hasSave = Save.data.unlocked > 0 || (savedId && savedId !== 'ch1');
    const opts = [];
    if (hasSave && !Save.data.done) {
      const ch = CHAPTERS.find(c => c.id === savedId) || CHAPTERS[0];
      opts.push({ id: 'continue', label: 'Continue', sub: `chapter ${ch.num || '—'} — ${ch.title}` });
      opts.push({ id: 'begin', label: 'Begin again', sub: 'from Głogowiec' });
    } else if (Save.data.done) {
      opts.push({ id: 'begin', label: 'Begin again', sub: 'from Głogowiec' });
      opts.push({ id: 'epilogue', label: 'The keepsake', sub: 'return to your painting' });
    } else {
      opts.push({ id: 'begin', label: 'Begin', sub: 'a true story, gently told' });
    }
    Choices.show(opts, id => {
      if (id === 'continue') Engine.go(savedId || 'ch1');
      else if (id === 'epilogue') Engine.go('epilogue');
      else Engine.go('ch1');
    });
  },

  onPress() { this._reveal(); },

  update(dt) {
    this.t += dt;
    this.moteT -= dt;
    if (this.moteT <= 0) {
      this.moteT = 0.22;
      Particles.dust(rand(View.left, View.right), rand(500, 880), '#d9d2e8');
    }
  },

  draw(ctx) {
    const t = this.t;
    R.sky(ctx, 'title-sky', [[0, '#050408'], [0.55, '#0a0814'], [1, '#120e1c']], View.left, 0, View.W + 2, 900);
    R.stars(ctx, t, 0.8, 11);
    /* the rays, far and faint, from above the frame */
    R.mercyRays(ctx, 0, -160, 0.1 + this.rayI * (1 + Math.sin(t * 0.5) * 0.12), t, { len: 1500, spread: 0.42, width: 0.2 });
    /* fields of home */
    R.hills(ctx, 805, 38, '#0b0911', 3, t);
    R.hills(ctx, 845, 26, '#070509', 9, t);
    R.tree(ctx, View.left + View.W * 0.16, 832, 240, 5, '#08060b');
    /* a cottage with one lit window — where it begins */
    const cx = View.right - View.W * 0.18;
    ctx.fillStyle = '#0a0710';
    ctx.fillRect(cx - 70, 760, 140, 70);
    ctx.beginPath(); ctx.moveTo(cx - 84, 762); ctx.lineTo(cx, 712); ctx.lineTo(cx + 84, 762); ctx.closePath(); ctx.fill();
    lamp(ctx, cx + 26, 794, 30, 'rgba(255,190,110,0.85)', 0.85, t);
    ctx.fillStyle = 'rgba(255,205,130,0.9)';
    ctx.fillRect(cx + 18, 786, 17, 15);

    /* wordmark */
    ctx.save();
    ctx.globalAlpha = this.titleA;
    spacedText(ctx, 'FAUSTYNA', 0, 318, 74, 26, 'rgba(240,233,219,0.96)');
    ctx.globalAlpha = this.titleA * 0.85;
    spacedText(ctx, 'VESSEL OF MERCY', 0, 388, 19, 11, 'rgba(232,201,138,0.8)');
    ctx.globalAlpha = this.titleA * 0.6;
    spacedText(ctx, 'FROM THE DIARY OF SAINT FAUSTINA KOWALSKA', 0, 430, 12, 5.5, 'rgba(236,229,216,0.55)');
    const hr = new Date().getHours();
    if (hr === 15) {
      ctx.globalAlpha = this.titleA * (0.45 + 0.2 * Math.sin(t * 1.4));
      ctx.font = 'italic 15px "Iowan Old Style","Palatino Linotype",Georgia,serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,201,138,0.85)';
      ctx.fillText('it is the Hour of Mercy now', 0, 466);
    }
    if (!this.revealed && this.t > 2.6) {
      ctx.globalAlpha = (0.35 + 0.25 * Math.sin(t * 1.8)) * clamp01(this.t - 2.6);
      ctx.font = '15px "Iowan Old Style","Palatino Linotype",Georgia,serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ece5d8';
      ctx.fillText('touch anywhere', 0, 560);
    }
    ctx.restore();
  },
};

/* manual letterspacing — reliable across browsers */
function spacedText(ctx, str, cx, y, size, spacing, color, italic = false) {
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}${size}px "Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let total = 0;
  const widths = [];
  for (const ch of str) { const w = ctx.measureText(ch).width; widths.push(w); total += w + spacing; }
  total -= spacing;
  let x = cx - total / 2;
  let i = 0;
  for (const ch of str) { ctx.fillText(ch, x, y); x += widths[i++] + spacing; }
  ctx.restore();
}
