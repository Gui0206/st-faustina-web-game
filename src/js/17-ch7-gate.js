/* Chapter VII — The Gate. Kraków-Łagiewniki, 1937.
   Portress during hard years. Mercy has three ways: deed, word, prayer —
   and bread is finite. The last visitor is not who he seems. */

SCENES.ch7 = {
  id: 'ch7',
  enter() {
    this.t = 0;
    this.bread = 3;
    this.visitorI = -1;
    this.visitor = null;
    this.phaseT = 0;
    this.loafAnim = null;
    this.prayHold = null;
    this.soup = 0;
    this.reveal = 0;
    this.drizzle = 0.5;
    this.visitors = [
      { who: 'a mother, a child asleep on her shoulder', line: '“Bread, sister. Not for me.”',
        deed: 'The loaf passed through the bars. The child did not wake — but the mother closed her eyes.',
        word: '“They are beautiful, your little one.” The woman looked up as if no one had spoken to her in weeks.',
        prayer: 'She prayed in silence. The woman left no lighter — but not alone.' , h: 250, hunch: 0.25, child: true },
      { who: 'an old man, coat thin as paper', line: '“Only to stand out of the rain a moment.”',
        deed: 'Bread, and the dry corner of the gateway. He ate slowly, saving half.',
        word: 'They spoke of the harvests before the war. For a moment he was forty years younger.',
        prayer: 'She held him in her prayer. He straightened a little, as if the coat had thickened.', h: 264, hunch: 0.5 },
      { who: 'a young man with hard eyes', line: '“God has forgotten this city. Don’t waste your bread on me.”',
        deed: 'He took the loaf like an accusation. At the corner, he looked back once.',
        word: '“He has not forgotten you. I know it the way I know it is raining.” He had no answer for that.',
        prayer: 'No words would land. She prayed instead — the long way around a locked door.', h: 280, hunch: 0.1 },
      { who: 'a widow who says nothing at all', line: '…',
        deed: 'Bread, wrapped in cloth, pressed into silent hands.',
        word: 'No answer came. Some griefs only want company; she stood with her in the rain.',
        prayer: 'For the silent, silence that listens upward. The widow lifted her face into the rain like a blessing.', h: 246, hunch: 0.6 },
    ];
    Engine.grainAmt = 0.075;
    Audio.pad.set([['G1', 'D3', 'Bb3', 'G3'], ['Eb2', 'Bb2', 'G3', 'Eb4'], ['F2', 'C3', 'A3', 'F3'], ['D2', 'A2', 'F3', 'D4']], { level: 0.38, hold: 11, bright: 700 });
    Audio.channels.rain.set(0.28, 1900);
  },
  exit() { Audio.channels.rain.set(0); Audio.channels.choir.set(0); },

  script: function* (S) {
    const sc = SCENES.ch7;
    yield S.wait(2.2);
    yield S.text('Kraków. Hard years. The convent made her portress — keeper of the gate.');
    yield S.text('The poor of the city learned which gate gave soup, and the line learned her name.');
    /* four visitors, three loaves */
    for (let i = 0; i < 4; i++) {
      S.do(() => sc._nextVisitor());
      yield S.waitFor(() => sc.visitor && sc.visitor.state === 'waiting');
      yield S.textAuto(sc.visitor.def.who, 3.2, { small: true });
      yield S.textAuto(sc.visitor.def.line, 3.6);
      S.do(() => sc._offerChoices());
      yield S.waitFor(() => sc.visitor.state === 'resolved');
      yield S.text(sc.visitor.outcomeText);
      S.do(() => sc._dismissVisitor());
      yield S.waitFor(() => !sc.visitor);
    }
    yield S.text('Toward evening, when the pots were nearly empty, one more figure came through the rain.');
    S.do(() => sc._nextVisitor(true));
    yield S.waitFor(() => sc.visitor && sc.visitor.state === 'waiting');
    yield S.textAuto('a young man — barefoot, bareheaded, his clothes frozen to him', 4);
    yield S.textAuto('“Something hot, if you can.”', 3.4);
    yield S.text('There was no bread left to weigh, no choice to make. She went to the kitchen and brought him soup, full of crumbs.');
    S.do(() => { Tweens.to(sc, { soup: 1 }, 2, { ease: Ease.inOutSine }); Audio.shimmer(0.2, 700); });
    yield S.wait(3);
    yield S.text('He ate. And as she took back the bowl, the rain forgot to fall.');
    S.do(() => {
      Tweens.to(sc, { reveal: 1 }, 5, { ease: Ease.inOutSine });
      Audio.channels.choir.set(0.2);
      Audio.bell('D4', 0.3, 1.5);
      Audio.shimmer(0.6, 900);
      Audio.channels.rain.set(0.04, 1200, 2);
    });
    yield S.wait(4);
    yield S.text('My daughter, the blessings of the poor who bless Me as they leave this gate have reached My ears. And this is why I came down from My throne — to taste the fruits of your mercy.', { voice: true, attr: 'Diary, 1312' });
    yield S.wait(0.5);
    yield S.text('I am giving you three ways of exercising mercy toward your neighbor: the first — by deed, the second — by word, the third — by prayer.', { voice: true, attr: 'Diary, 742' });
    yield S.text('Help me, O Lord, that my eyes may be merciful, so that I may never suspect or judge from appearances, but look for what is beautiful in my neighbors’ souls.', { quote: true, attr: 'Diary, 163' });
    S.do(() => Engine.nextChapter());
  },

  _nextVisitor(isLast = false) {
    this.visitorI++;
    const def = isLast
      ? { who: 'the young man', h: 286, hunch: 0.35, last: true }
      : this.visitors[this.visitorI];
    this.visitor = {
      def, x: View.left - 120, y: 806,
      state: 'approaching', warmth: 0, lift: 0,
      outcomeText: '', guardian: 0,
    };
  },
  _offerChoices() {
    const v = this.visitor;
    v.state = 'choosing';
    Choices.show([
      { id: 'deed', label: 'Deed', sub: this.bread > 0 ? `give bread — ${this.bread} left` : 'no bread left', disabled: this.bread <= 0 },
      { id: 'word', label: 'Word', sub: 'stay, and speak' },
      { id: 'prayer', label: 'Prayer', sub: 'hold a moment' },
    ], id => this._choose(id));
  },
  _choose(id) {
    const v = this.visitor;
    v.choice = id;
    v.outcomeText = v.def[id];
    if (id === 'deed') {
      this.bread--;
      this.loafAnim = { t: 0, from: { x: 240, y: 700 }, to: { x: v.x, y: v.y - v.def.h * 0.5 } };
      Audio.swish(0.18);
      Engine.after(900, () => {
        Audio.pluck('G4', 0.3);
        Tweens.to(v, { warmth: 1 }, 2, { ease: Ease.inOutSine });
        v.state = 'resolved';
      });
    } else if (id === 'word') {
      Audio.celesta('A4', 0.3);
      Tweens.to(v, { lift: 1, warmth: 0.7 }, 2.4, { ease: Ease.inOutSine });
      Engine.after(1800, () => { v.state = 'resolved'; });
    } else {
      Hint.show('hold', { ttl: 4 });
      v.state = 'praying';
      this.prayHold = new PrayBloom({
        riseTime: 1.6, fall: 0.3,
        onFull: () => {
          Hint.hide();
          this.prayHold = null;
          Audio.shimmer(0.4, 1000);
          Tweens.to(v, { guardian: 1, warmth: 0.5 }, 2.2, { ease: Ease.inOutSine });
          for (let i = 0; i < 14; i++) {
            Engine.after(i * 110, () => Particles.mote(v.x + rand(-40, 40), v.y - rand(40, v.def.h)));
          }
          Engine.after(1600, () => { v.state = 'resolved'; });
        },
      });
    }
  },
  _dismissVisitor() {
    const v = this.visitor;
    v.state = 'leaving';
    Engine.after(2600, () => { if (this.visitor === v) this.visitor = null; });
  },

  onPress() {},
  update(dt) {
    this.t += dt;
    const v = this.visitor;
    if (v) {
      if (v.state === 'approaching') {
        v.x = damp(v.x, -40, 1.6, dt);
        if (v.x > -60) v.state = 'waiting';
      } else if (v.state === 'leaving') {
        v.x -= 90 * dt;
      } else if (v.state === 'praying' && this.prayHold) {
        this.prayHold.update(dt);
      }
    }
    if (this.loafAnim) {
      const L = this.loafAnim;
      L.t += dt / 0.9;
      if (L.t >= 1) this.loafAnim = null;
    }
    /* drizzle */
    const rainAmt = this.reveal > 0.3 ? (1 - this.reveal) : 1;
    for (let i = 0; i < Math.round(2.4 * rainAmt); i++) {
      Particles.spawn({
        x: rand(View.left, View.right), y: View.top - 10,
        vx: -40, vy: rand(420, 540), life: 1.7,
        size: 1.8, endSize: 1.8, color: 'rgba(150,170,205,0.4)', alpha: rand(0.07, 0.2),
        shape: 'streak',
      });
    }
  },

  draw(ctx) {
    const t = this.t, rv = this.reveal;
    /* gray drizzling morning */
    const top = mixHex('#272c3a', '#39405c', rv * 0.5);
    const bot = mixHex('#3a3d4c', '#6a6480', rv * 0.5);
    const g = ctx.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(View.left, 0, View.W + 2, 900);
    /* far rooftops through the rain */
    R.hills(ctx, 560, 120, 'rgba(24,26,38,0.55)', 67, t);
    /* convent wall, right side */
    ctx.fillStyle = '#2c2536';
    ctx.fillRect(120, 240, View.right - 120 + 10, 660);
    /* stone texture hints */
    srand(13);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let i = 0; i < 30; i++) ctx.fillRect(140 + rng() * (View.right - 200), 260 + rng() * 560, 40 + rng() * 60, 2);
    /* wall cap */
    ctx.fillStyle = '#241e2e';
    ctx.fillRect(112, 228, View.right - 112 + 10, 18);
    /* the gate arch in the wall */
    ctx.fillStyle = '#0c0a12';
    ctx.beginPath();
    ctx.moveTo(140, 900); ctx.lineTo(140, 480);
    ctx.quadraticCurveTo(250, 380, 360, 480);
    ctx.lineTo(360, 900);
    ctx.closePath(); ctx.fill();
    /* warm light inside the gate */
    lamp(ctx, 250, 640, 170 + rv * 120, 'rgba(255,196,120,0.55)', 0.55 + rv * 0.45, t, 0.06);
    /* gate bars */
    ctx.strokeStyle = '#060509'; ctx.lineWidth = 7;
    for (let i = 0; i < 6; i++) {
      const bx = 162 + i * 36;
      ctx.beginPath(); ctx.moveTo(bx, 900); ctx.lineTo(bx, 470 + Math.pow(Math.abs(i - 2.5) / 2.5, 2) * -40 + 30);
      ctx.stroke();
    }
    /* lamp over the gate */
    lamp(ctx, 250, 420, 70, 'rgba(255,210,140,0.8)', 0.85, t, 0.12);
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath(); ctx.arc(250, 420, 6, 0, TAU); ctx.fill();

    /* wet street */
    ctx.fillStyle = '#23222e';
    ctx.fillRect(View.left, 800, View.W + 2, 100);
    ctx.fillStyle = 'rgba(160,170,200,0.07)';
    ctx.fillRect(View.left, 800, View.W + 2, 5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.07;
    R.glow(ctx, 250, 830, 180, 'rgba(255,196,120,0.8)');
    ctx.restore();

    /* Faustina inside the gate */
    R.nun(ctx, 262, 818, 256, { color: '#16111c', flip: true });
    /* bread basket beside her */
    ctx.fillStyle = '#241b22';
    ctx.beginPath(); ctx.ellipse(330, 802, 44, 14, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < this.bread; i++) {
      ctx.fillStyle = '#9a7448';
      ctx.beginPath(); ctx.ellipse(316 + i * 16, 792, 13, 8, 0.3, 0, TAU); ctx.fill();
    }

    /* visitor */
    const v = this.visitor;
    if (v) {
      const warmCol = mixHex('#11101a', '#3a2a26', v.warmth);
      const hunch = v.def.hunch * (1 - v.lift * 0.8);
      R.cloaked(ctx, v.x, v.y, v.def.h, { color: warmCol, hunch });
      if (v.def.child) {
        ctx.fillStyle = warmCol;
        ctx.beginPath(); ctx.arc(v.x + 26, v.y - v.def.h * 0.62, v.def.h * 0.07, 0, TAU); ctx.fill();
      }
      if (v.warmth > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = v.warmth * 0.35;
        R.glow(ctx, v.x, v.y - v.def.h * 0.5, v.def.h * 0.55, 'rgba(255,196,130,0.5)');
        ctx.restore();
      }
      if (v.guardian > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = v.guardian * (0.3 + 0.1 * Math.sin(t * 1.8));
        R.glow(ctx, v.x, v.y - v.def.h * 1.05, 30, '#fff3d8');
        ctx.restore();
      }
      /* the soup bowl */
      if (v.def.last && this.soup > 0.02) {
        const bx = v.x + 40, by = v.y - v.def.h * 0.42;
        ctx.globalAlpha = this.soup;
        ctx.fillStyle = '#2c2026';
        ctx.beginPath(); ctx.ellipse(bx, by, 20, 8, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        if (Math.random() < 0.3) {
          Particles.spawn({
            x: bx + rand(-8, 8), y: by - 6, vx: rand(-2, 4), vy: rand(-26, -14),
            life: rand(0.8, 1.6), size: 4, endSize: 10, color: '#cfd0d8', alpha: 0.08, fadeIn: 0.3,
          });
        }
      }
      /* the revelation */
      if (rv > 0.02 && v.def.last) {
        R.lumen(ctx, v.x, v.y, v.def.h * 1.35, t, { intensity: rv, rays: rv * 0.5, raise: 0.6, rayLen: 700 });
      }
    }
    /* flying loaf */
    if (this.loafAnim) {
      const L = this.loafAnim, tt = Ease.inOutQuad(clamp01(L.t));
      const lx = lerp(L.from.x, L.to.x, tt);
      const ly = lerp(L.from.y, L.to.y, tt) - Math.sin(tt * Math.PI) * 90;
      ctx.fillStyle = '#a87e4e';
      ctx.beginPath(); ctx.ellipse(lx, ly, 13, 8, tt * 2, 0, TAU); ctx.fill();
    }
    /* reveal wash */
    if (rv > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = rv * 0.6;
      ctx.fillStyle = '#ffe3b8';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },
};
