/* Engine: loop, camera, scene manager, transitions, and the script runner —
   a generator-coroutine system that choreographs each chapter's beats. */

const Engine = {
  time: 0, dt: 0,
  cam: { x: 0, y: 450, zoom: 1, shakeX: 0, shakeY: 0, trauma: 0 },
  drift: { t: 0, amp: 0.018, rate: 0.05 },     // slow breathing zoom
  fade: { alpha: 1, color: '#000000' },        // full-screen fade overlay
  grainAmt: 0.07,
  letterboxAmt: 0,
  paused: false,
  scene: null,
  scriptRunner: null,
  pressQueued: false,
  _last: 0,

  get fx() { return Save.data.settings.reduceMotion ? 0 : 1; },

  init() {
    View.init(document.getElementById('stage'));
    Input.init(document.getElementById('app'));
    Input.on('press', p => this.handlePress(p));
    Input.on('release', p => { if (!this.paused && this.scene && this.scene.onRelease) this.scene.onRelease(p); });
    Input.on('move', p => { if (!this.paused && this.scene && this.scene.onMove) this.scene.onMove(p); });
    this._last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  },

  handlePress(p) {
    Audio.init();
    if (this.paused) return;
    if (TitleCard.visible) {
      if (Engine.time - TitleCard.shownAt > 0.9) this.pressQueued = true; // skip card
      return;
    }
    if (Text.showing && Text.blocking) { Text.advance(); return; }
    if (this.scene && this.scene.onPress) {
      try { this.scene.onPress(p); } catch (e) { console.error('scene.onPress', e); }
    }
  },

  /* ---------------- main loop ---------------- */
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.05);
    if (this.paused) return;
    this.dt = dt; this.time += dt;

    Input.update(dt);
    Tweens.update(dt);
    try { Audio.update(dt); } catch (e) { console.error('audio.update', e); }

    /* camera drift + shake */
    this.drift.t += dt * this.drift.rate;
    if (this.cam.trauma > 0) {
      this.cam.trauma = Math.max(0, this.cam.trauma - dt * 1.6);
      const s = this.cam.trauma * this.cam.trauma * 22 * this.fx;
      this.cam.shakeX = rand(-s, s); this.cam.shakeY = rand(-s, s);
    } else { this.cam.shakeX = this.cam.shakeY = 0; }

    if (this.scene && this.scene.update) {
      try { this.scene.update(dt); } catch (e) { console.error('scene.update', e); }
    }
    if (this.scriptRunner) this.scriptRunner.update(dt);
    Particles.update(dt);
    Text.update(dt);
    Cursor.update(dt);

    this.draw();
    Input.postUpdate();
  },

  shake(amount) { this.cam.trauma = Math.min(1, this.cam.trauma + amount); },

  draw() {
    const ctx = View.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, View.pixW, View.pixH);

    const driftZoom = 1 + (Math.sin(this.drift.t * TAU) * this.drift.amp + this.drift.amp) * this.fx;
    const cam = {
      x: this.cam.x, y: this.cam.y,
      zoom: this.cam.zoom * driftZoom,
      shakeX: this.cam.shakeX, shakeY: this.cam.shakeY,
    };
    View.apply(cam);

    /* scenes live in the y∈[0,900] band; outside stays pure black (letterbox) */
    ctx.save();
    ctx.beginPath();
    ctx.rect(View.left - 4, 0, View.W + 8, View.H);
    ctx.clip();
    if (this.scene && this.scene.draw) {
      try { this.scene.draw(ctx); } catch (e) { console.error('scene.draw', e); }
    }
    Particles.draw(ctx, false);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    Particles.draw(ctx, true);
    ctx.restore();
    if (this.scene && this.scene.drawFront) this.scene.drawFront(ctx);
    Cursor.draw(ctx);
    ctx.restore();

    R.grain(ctx, this.grainAmt * (this.fx ? 1 : 0.4));
    R.vignette(ctx, 0.62);
    R.letterbox(ctx, this.letterboxAmt);

    if (this.fade.alpha > 0.002) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = this.fade.alpha;
      ctx.fillStyle = this.fade.color;
      ctx.fillRect(0, 0, View.pixW, View.pixH);
      ctx.globalAlpha = 1;
    }
  },

  /* ---------------- scene flow ---------------- */
  runId: 0,
  go(id, opts = {}) {
    const next = SCENES[id];
    if (!next) return;
    const doSwitch = () => {
      if (this.scene && this.scene.exit) this.scene.exit();
      Particles.clear();
      Tweens.clear();
      Text.clear(true);
      Hint.hide();
      Choices.hide();
      this.scriptRunner = null;
      this.runId++;
      const run = this.runId;
      this.cam.x = 0; this.cam.y = 450; this.cam.zoom = 1; this.cam.trauma = 0;
      this.letterboxAmt = 0;
      this.scene = next;
      const ch = CHAPTERS.find(c => c.id === id);
      if (ch) Save.reachChapter(id);
      next.enter();
      const startScript = () => {
        if (this.runId === run && next.script) this.scriptRunner = new ScriptRunner(next.script);
      };

      if (ch && !opts.noCard) {
        TitleCard.show(ch.num ? `${tr('Chapter')} ${ch.num}` : '', ch.title, ch.place);
        this.fade.color = '#000000';
        this.fade.alpha = 1;
        const start = this.time;
        const waitCard = () => {
          if (this.runId !== run) return;          // superseded by another go()
          const elapsed = this.time - start;
          if ((elapsed > 3.4 || this.pressQueued) && elapsed > 1.2) {
            this.pressQueued = false;
            TitleCard.hide();
            Tweens.to(this.fade, { alpha: 0 }, 1.6, { key: 'fade' });
            startScript();                          // beats begin once the card lifts
          } else setTimeout(waitCard, 60);
        };
        setTimeout(waitCard, 60);
      } else {
        this.fade.alpha = 1;
        Tweens.to(this.fade, { alpha: 0 }, opts.slowIn ? 2.2 : 1.2, { key: 'fade' });
        startScript();
      }
    };

    if (opts.instant) { doSwitch(); }
    else {
      Tweens.to(this.fade, { alpha: 1 }, opts.slowOut ? 2 : 0.9, {
        key: 'fade', ease: Ease.inOutQuad, onDone: doSwitch,
      });
    }
  },

  /* schedule a callback that dies with the current scene run (restart-safe) */
  after(ms, fn) {
    const run = this.runId;
    setTimeout(() => { if (this.runId === run) fn(); }, ms);
  },

  nextChapter() {
    const i = CHAPTERS.findIndex(c => c.id === this.scene.id);
    const next = CHAPTERS[i + 1];
    if (next) this.go(next.id);
  },
};

/* ---------------- script runner: generator coroutines ----------------
   Scene scripts are generator functions yielding awaitables:
     yield S.wait(1.4)
     yield S.text("...", opts)            — waits for advance
     yield S.waitFor(() => cond)
     yield S.holdTotal(2.5)               — accumulated hold-time gate
     S.do(fn)                             — immediate side effect
*/
class ScriptRunner {
  constructor(genFn) {
    this.S = makeScriptAPI();
    this.gen = genFn(this.S);
    this.current = null;
    this.done = false;
  }
  update(dt) {
    if (this.done) return;
    if (this.current && !this.current.done(dt)) return;
    let r;
    try { r = this.gen.next(); }
    catch (e) { console.error('script error', e); this.done = true; return; }
    if (r.done) { this.done = true; this.current = null; return; }
    this.current = r.value;
    /* resolve instantly-completable steps in the same frame chain next tick */
  }
}

function makeScriptAPI() {
  return {
    wait(sec) { let t = sec; return { done: dt => (t -= dt) <= 0 }; },
    waitFor(fn, opts = {}) {
      /* opts.hint: (re-)shown whenever the player has idled hintAfter seconds
         without satisfying the gate — an open-ended wait must never go mute,
         or a missed one-shot hint reads as a frozen game */
      let idle = 0, hinted = false;
      return {
        done: dt => {
          if (fn()) { if (hinted) Hint.hide(); return true; }
          if (!opts.hint) return false;
          if (Input.down) { idle = 0; if (hinted) { Hint.hide(); hinted = false; } }
          else idle += dt;
          if (idle > (opts.hintAfter || 4) && !hinted) { Hint.show(opts.hint, opts); hinted = true; }
          return false;
        },
      };
    },
    text(str, opts) { return Text.show(str, opts); },
    textAuto(str, sec, opts = {}) { return Text.show(str, Object.assign({ auto: sec, passthrough: true }, opts)); },
    do(fn) {
      /* a throwing side-effect must never kill the chapter's generator */
      try { fn(); } catch (e) { console.error('script do()', e); }
      return { done: () => true };
    },
    holdTotal(sec, opts = {}) {
      /* gate: total accumulated hold time across presses */
      let acc = 0, hinted = false, idle = 0;
      return {
        done: dt => {
          if (Input.down) { acc += dt; idle = 0; if (hinted) { Hint.hide(); hinted = false; } }
          else { idle += dt; }
          if (opts.hint && idle > (opts.hintAfter || 4) && !hinted) { Hint.show(opts.hint, opts); hinted = true; }
          if (opts.onProgress) opts.onProgress(clamp01(acc / sec), Input.down);
          if (acc >= sec) { if (hinted) Hint.hide(); return true; }
          return false;
        },
      };
    },
    pressGate(opts = {}) {
      /* wait for the next fresh press (consumed by scene.onPress normally; use flagged) */
      let pressed = false, idle = 0, hinted = false;
      const off = () => { pressed = true; };
      Input.on('press', off);   // note: listeners persist; acceptable for scene lifetime
      return {
        done: dt => {
          idle += dt;
          if (opts.hint && idle > (opts.hintAfter || 5) && !hinted) { Hint.show(opts.hint, opts); hinted = true; }
          if (pressed && hinted) Hint.hide();
          return pressed;
        },
      };
    },
  };
}

/* ---------------- luminous cursor ---------------- */
const Cursor = {
  x: 0, y: 0, r: 7, visible: 0, pressGlow: 0,
  update(dt) {
    this.x = damp(this.x, Input.x, 22, dt);
    this.y = damp(this.y, Input.y, 22, dt);
    const idle = Engine.time - Input.lastMoveAt;
    const want = (idle < 2.6 || Input.down) && !Menu.open ? 1 : 0;
    this.visible = damp(this.visible, want, 6, dt);
    this.pressGlow = damp(this.pressGlow, Input.down ? 1 : 0, 10, dt);
    if (Input.down && Math.random() < 0.35) {
      Particles.spawn({
        x: this.x + rand(-4, 4), y: this.y + rand(-4, 4),
        vx: rand(-6, 6), vy: rand(-18, -6), life: rand(0.5, 1.1),
        size: rand(1, 2.4), endSize: 0.2, color: '#ffeec9', alpha: 0.5,
        additive: true, glow: true,
      });
    }
  },
  draw(ctx) {
    if (this.visible < 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = this.visible * (0.5 + this.pressGlow * 0.5);
    R.glow(ctx, this.x, this.y, this.r * (1 + this.pressGlow * 1.6) * (1 + Math.sin(Engine.time * 2.2) * 0.12), '#fff3d9');
    ctx.globalAlpha = this.visible * 0.9;
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.arc(this.x, this.y, 1.6 + this.pressGlow * 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  },
};
