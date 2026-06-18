/* Chapter IV — Small Things. The convent kitchen, 1926–1930.
   Work done slowly, with love, makes the world bloom. Speed is the input;
   gentleness is the skill. */

SCENES.ch4 = {
  id: 'ch4',
  enter() {
    this.t = 0;
    this.stations = [
      { id: 'pot',    x: 330,  y: 560, r: 150, bloom: 0, label: 'the pot',      milestones: 0 },
      { id: 'floor',  x: -120, y: 760, r: 200, bloom: 0, label: 'the floor',    milestones: 0 },
      { id: 'basket', x: -520, y: 640, r: 150, bloom: 0, label: 'the potatoes', milestones: 0 },
    ];
    this.allDone = false;
    this.rosesT = -1;       // -1 inactive, >=0 animating
    this.roseBloom = 0;
    this.steamT = 0;
    this.warm = 0;          // global kitchen warmth = avg bloom
    this.rushed = 0;        // visual feedback for too-fast strokes
    this.graceGlow = 0;
    Engine.grainAmt = 0.06;
    Audio.pad.set([['F2', 'C3', 'F3', 'A3'], ['Bb1', 'F3', 'Bb3', 'D4'], ['C2', 'G3', 'C4', 'E4'], ['F2', 'C3', 'A3', 'F4']], { level: 0.4, hold: 10, bright: 980 });
    Audio.channels.wind.set(0.05, 200);
  },
  exit() { Audio.channels.air.set(0); },

  script: function* (S) {
    const sc = SCENES.ch4;
    yield S.wait(2.2);
    yield S.text('She received the habit, and with it a new name: Sister Maria Faustyna of the Blessed Sacrament.');
    yield S.text('She had hoped, perhaps, for ecstasies. She was given the kitchen.');
    S.do(() => Hint.show('hold and move gently — hurry earns nothing', { ttl: 7 }));
    yield S.waitFor(() => sc.stations.every(s => s.bloom >= 1), { hint: 'hold and move gently — hurry earns nothing', hintAfter: 8 });
    S.do(() => { sc.allDone = true; });
    yield S.wait(2);
    yield S.text('Great love can change small things into great ones, and it is only love which lends value to our actions.', { quote: true, attr: 'Diary, 303' });
    yield S.wait(0.6);
    yield S.text('One evening the great pot was too heavy for her strength, and she was ashamed to ask.');
    yield S.text('Out of obedience, she tried again —');
    S.do(() => sc._roses());
    yield S.wait(3.2);
    yield S.text('— and the lifted lid breathed out roses.');
    yield S.text('Nothing done for love is small. The years passed this way: Warsaw, Płock, the gardens, the gate.');
    S.do(() => Engine.nextChapter());
  },

  _roses() {
    this.rosesT = 0;
    Tweens.to(this, { roseBloom: 1 }, 2.6, { ease: Ease.inOutSine });
    Audio.shimmer(0.6, 700);
    Audio.bell('F4', 0.22, 1);
    const shades = ['#d8506a', '#c23a55', '#e76d83', '#b83048'];
    const mouthX = 330, mouthY = 488;
    for (let i = 0; i < 34; i++) {
      Engine.after(i * 70, () => {
        /* roses well up and SPILL over both rims — mirrored, alternating
           sides (every fifth wells straight up), then arc back down and
           cascade over the pot's edges rather than jetting vertically */
        const side = i % 5 === 0 ? 0 : (i % 2 ? 1 : -1);
        const out = side * rand(60, 160);
        Particles.spawn({
          x: mouthX + side * rand(10, 40) + rand(-8, 8), y: mouthY + rand(-8, 8),
          vx: out, vy: rand(-150, -95), ay: 230,
          life: rand(2.4, 3.8), size: rand(7, 11), endSize: rand(13, 20),
          color: pick(shades), alpha: 0.96,
          shape: 'rose', spin: side * rand(0.5, 1.5) + rand(-0.2, 0.2),
          wobble: rand(4, 12), fadeIn: 0.28, drag: 0.992,
        });
        /* a soft warm light behind each bloom */
        if (Math.random() < 0.6) Particles.spawn({
          x: mouthX + out * 0.2, y: mouthY, vx: out * 0.5, vy: rand(-95, -55), ay: 170,
          life: rand(1.4, 2.4), size: rand(10, 18), endSize: 3,
          color: '#ff9ab0', alpha: 0.4, additive: true, glow: true, fadeIn: 0.3, drag: 0.99,
        });
      });
    }
  },

  onPress() {},
  update(dt) {
    this.t += dt;
    const speed = Input.speed;
    let working = null;
    if (Input.down && !this.allDone) {
      for (const s of this.stations) {
        if (dist(Input.x, Input.y, s.x, s.y) < s.r) { working = s; break; }
      }
    }
    if (working) {
      const gentle = speed > 30 && speed < 460;
      const tooFast = speed >= 700;
      if (gentle) {
        const was = working.bloom;
        working.bloom = clamp01(working.bloom + dt / 4.2);
        this.graceGlow = damp(this.graceGlow, 1, 4, dt);
        Audio.channels.air.set(0.12, 700 + speed * 0.8, 0.1);
        if (Math.random() < 0.3) {
          Particles.spawn({
            x: Input.x + rand(-6, 6), y: Input.y + rand(-6, 6),
            vx: rand(-8, 8), vy: rand(-26, -10), life: rand(0.7, 1.6),
            size: rand(1.5, 3), endSize: 0.3, color: '#ffe2a8', alpha: 0.6,
            additive: true, glow: true, wobble: 8, drag: 0.97,
          });
        }
        const m = Math.floor(working.bloom * 3);
        if (m > working.milestones) {
          working.milestones = m;
          Audio.pluck(['F4', 'A4', 'C5'][Math.min(m - 1, 2)], 0.3);
          if (working.bloom >= 1) {
            Audio.bell('F5', 0.18, 0.7);
            Audio.shimmer(0.35, 1000);
            Particles.burst(working.x, working.y - 40, 16, () => ({
              x: working.x + rand(-50, 50), y: working.y + rand(-60, 10),
              vx: rand(-20, 20), vy: rand(-60, -20), life: rand(1, 2.2),
              size: rand(2, 4), endSize: 0.4, color: '#ffe9bc', alpha: 0.7,
              additive: true, glow: true, wobble: 10, fadeIn: 0.2,
            }));
          }
        }
        if (was < 1 && working.bloom >= 1) Hint.hide();
      } else if (tooFast) {
        this.rushed = Math.min(1, this.rushed + dt * 3);
        Audio.channels.air.set(0.05, 2400, 0.06);
        if (Math.random() < 0.2) {
          Particles.spawn({
            x: Input.x, y: Input.y, vx: rand(-30, 30), vy: rand(-20, 20),
            life: 0.5, size: 3, endSize: 0.5, color: '#6f6a62', alpha: 0.4,
          });
        }
      } else {
        Audio.channels.air.set(0.04, 500, 0.15);
      }
    } else {
      Audio.channels.air.set(0, undefined, 0.2);
      this.graceGlow = damp(this.graceGlow, 0, 3, dt);
    }
    this.rushed = Math.max(0, this.rushed - dt * 1.2);
    this.warm = this.stations.reduce((a, s) => a + s.bloom, 0) / this.stations.length;
    Audio.pad.targetLevel = 0.4 + this.warm * 0.14;
    /* steam from the pot */
    this.steamT -= dt;
    if (this.steamT <= 0) {
      this.steamT = rand(0.12, 0.3);
      Particles.spawn({
        x: 330 + rand(-34, 34), y: 512, vx: rand(-4, 8), vy: rand(-44, -22),
        life: rand(1.6, 3), size: rand(6, 12), endSize: rand(18, 30),
        color: '#cfd0d8', alpha: 0.07, fadeIn: 0.5, wobble: 8,
      });
    }
    if (this.rosesT >= 0) this.rosesT += dt;
  },

  draw(ctx) {
    const t = this.t, warm = this.warm;
    /* walls — grow warmer as the work blooms */
    const wallTop = mixHex('#241c26', '#33252a', warm);
    const wallBot = mixHex('#2e2230', '#473327', warm);
    const g1 = ctx.createLinearGradient(0, 0, 0, 900);
    g1.addColorStop(0, wallTop); g1.addColorStop(1, wallBot);
    ctx.fillStyle = g1; ctx.fillRect(View.left, 0, View.W + 2, 900);

    /* morning window, top-left */
    const wx = -640, wy = 170, ww = 230, wh = 320;
    ctx.fillStyle = mixHex('#46507a', '#8a96b8', warm * 0.7);
    ctx.fillRect(wx, wy, ww, wh);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    R.glow(ctx, wx + ww / 2, wy + wh / 2, 240 + warm * 130, `rgba(255,228,170,${0.26 + warm * 0.26})`);
    ctx.restore();
    ctx.strokeStyle = '#0d0a10'; ctx.lineWidth = 10;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    /* light shaft */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const shaft = ctx.createLinearGradient(wx, wy, wx + 360, wy + 560);
    shaft.addColorStop(0, `rgba(255,232,180,${0.18 + warm * 0.14})`);
    shaft.addColorStop(1, 'rgba(255,232,180,0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(wx + 8, wy + 10); ctx.lineTo(wx + ww - 8, wy + 24);
    ctx.lineTo(wx + ww + 320, 880); ctx.lineTo(wx - 80, 880);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* floor */
    ctx.fillStyle = mixHex('#241a23', '#3c2b1f', this.stations[1].bloom * 0.8);
    ctx.fillRect(View.left, 720, View.W + 2, 180);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.18})`;
      ctx.fillRect(View.left, 720 + i * 20, View.W + 2, 1.5);
    }

    /* ---- station: stove + pot ---- */
    const potB = this.stations[0].bloom;
    ctx.fillStyle = mixHex('#2c2230', '#3e2f33', potB);
    ctx.fillRect(220, 580, 220, 150);
    ctx.fillStyle = mixHex('#1a141f', '#2a1e22', potB);
    ctx.fillRect(210, 568, 240, 18);
    /* fire glow under */
    lamp(ctx, 330, 716, 80 + potB * 30, 'rgba(255,140,60,0.75)', 0.6 + potB * 0.4, t, 0.2);
    /* embers drifting from the firebox */
    if (Math.random() < 0.12) Particles.ember(330 + rand(-40, 40), 716, '#ffb46a');
    /* the pot */
    ctx.fillStyle = mixHex('#332a38', mixHex('#4a3830', '#6a4c38', potB), potB);
    ctx.beginPath();
    ctx.ellipse(330, 540, 86, 18, 0, 0, TAU); ctx.fill();
    ctx.fillRect(244, 540 - 50, 172, 50);
    ctx.beginPath(); ctx.ellipse(330, 490, 86, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,196,110,${0.06 + potB * 0.2})`;
    ctx.beginPath(); ctx.ellipse(330, 490, 70, 12, 0, 0, TAU); ctx.fill();
    /* copper gleam when loved */
    if (potB > 0.2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = potB * 0.5;
      R.glow(ctx, 296, 512, 40, 'rgba(255,180,110,0.55)');
      ctx.restore();
    }
    /* roses overflowing at the finale — a heaped, mirrored mound brimming
       over the mouth of the pot, opening rose by rose as the bloom rises */
    if (this.roseBloom > 0.01) {
      const a = this.roseBloom;
      const roseShades = ['#c93b56', '#e05c75', '#a92f47', '#d84d68'];
      const spots = [
        [0, -34], [-22, -30], [22, -30], [-44, -16], [44, -16],
        [-12, -50], [12, -50], [-66, 0], [66, 0], [0, -16],
        [-36, -2], [36, -2],
      ];
      ctx.save();
      spots.forEach(([dx, dy], i) => {
        srand(i * 17 + 5);
        const grow = clamp01((a - i * 0.04) / 0.5);   // bloom in sequence
        if (grow <= 0.02) return;
        const r = (9 + rng() * 6) * grow;
        ctx.globalAlpha = grow * (0.85 + rng() * 0.15);
        R.rose(ctx, 330 + dx * (0.55 + a * 0.45), 488 + dy * a, r, rng() * TAU, roseShades[i % roseShades.length]);
      });
      ctx.restore();
      ctx.globalAlpha = 1;
      lamp(ctx, 330, 484, 130 * a, 'rgba(255,130,150,0.5)', a * 0.7, t, 0.04);
    }

    /* ---- station: basket of potatoes ---- */
    const basB = this.stations[2].bloom;
    ctx.fillStyle = mixHex('#322637', '#4c381f', basB);
    ctx.beginPath();
    ctx.moveTo(-590, 700); ctx.quadraticCurveTo(-520, 760, -450, 700);
    ctx.lineTo(-462, 640); ctx.lineTo(-578, 640);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 7; i++) {
      srand(i * 13 + 3);
      ctx.fillStyle = mixHex('#42333c', '#9a7c4e', basB * (0.5 + rng() * 0.5));
      ctx.beginPath();
      ctx.ellipse(-520 + (rng() - 0.5) * 90, 632 - rng() * 22, 16 + rng() * 8, 12 + rng() * 5, rng(), 0, TAU);
      ctx.fill();
    }
    if (basB > 0.2) lamp(ctx, -520, 630, 80, 'rgba(255,206,130,0.45)', basB * 0.5, t, 0.05);

    /* ---- station: floor sweeping — broom leaning ---- */
    const flB = this.stations[1].bloom;
    ctx.strokeStyle = mixHex('#43343c', '#5c4628', flB);
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-150, 758); ctx.lineTo(-96, 520); ctx.stroke();
    ctx.fillStyle = mixHex('#4a3a42', '#7a6238', flB);
    ctx.beginPath();
    ctx.moveTo(-178, 766); ctx.lineTo(-122, 752); ctx.lineTo(-138, 712); ctx.lineTo(-168, 722);
    ctx.closePath(); ctx.fill();
    if (flB > 0.2) lamp(ctx, -120, 750, 110, 'rgba(255,216,150,0.4)', flB * 0.45, t, 0.04);

    /* sister Faustina at work — follows the active region loosely */
    const fx = clamp(damp(this._fx || 0, Input.down ? Input.x : 60, 2, Engine.dt), -460, 460);
    this._fx = fx;
    R.nun(ctx, fx, 800, 270, { color: '#141019' });

    /* station auras (gentle invitations) — each unfinished station carries
       the same legible cue: a warm halo, a bright core that reads even where
       the window light falls (the potato basket), and a progress ring */
    if (!this.allDone) {
      for (const s of this.stations) {
        if (s.bloom >= 1) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + s.x);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.2 + pulse * 0.18;
        R.glow(ctx, s.x, s.y, s.r * 0.6, 'rgba(255,214,150,0.6)');
        ctx.globalAlpha = 0.5 + pulse * 0.4;
        R.glow(ctx, s.x, s.y, 30, 'rgba(255,236,196,0.9)');
        ctx.restore();
        ctx.save();
        /* faint full track + gold filled progress arc */
        ctx.globalAlpha = 0.32 + pulse * 0.2;
        ctx.strokeStyle = 'rgba(255,240,205,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, 26, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 0.7 + pulse * 0.3;
        ctx.strokeStyle = 'rgba(240,205,140,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.x, s.y, 26, -Math.PI / 2, -Math.PI / 2 + s.bloom * TAU); ctx.stroke();
        ctx.restore();
      }
    }

    /* warmth wash */
    if (warm > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = warm * 0.55;
      ctx.fillStyle = '#ffcf96';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
    /* rushed gray flash */
    if (this.rushed > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.rushed * 0.12;
      ctx.fillStyle = '#888';
      ctx.fillRect(View.left, 0, View.W + 2, 900);
      ctx.restore();
    }
  },
};
