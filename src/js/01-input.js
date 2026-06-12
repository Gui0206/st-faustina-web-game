/* Unified input: pointer + keyboard collapse into one vocabulary.
   press / hold / release / move — plus pointer position in world coords.
   The whole game is playable with one finger or one key (space). */

const Input = {
  down: false,          // is the primary input held right now (pointer OR key)
  holdTime: 0,          // seconds current hold has lasted
  x: 0, y: 0,           // pointer in world coords (virtual units)
  sx: 0, sy: 0,         // pointer in screen px
  moved: false,         // pointer moved since last frame
  lastMoveAt: 0,        // engine time of last pointer move
  vx: 0, vy: 0,         // pointer velocity (world units/sec)
  speed: 0,             // smoothed |velocity| — stable across refresh rates
  hasPointer: true,
  keys: new Set(),
  _pDown: false, _kDown: false,
  _px: 0, _py: 0,
  _listeners: { press: [], release: [], move: [] },

  on(ev, fn) { this._listeners[ev].push(fn); },
  emit(ev, arg) { for (const fn of this._listeners[ev]) fn(arg); },

  _sync() {
    const want = this._pDown || this._kDown;
    if (want && !this.down) { this.down = true; this.holdTime = 0; this.emit('press', { x: this.x, y: this.y }); }
    else if (!want && this.down) { this.down = false; this.emit('release', { x: this.x, y: this.y, held: this.holdTime }); }
  },

  init(el) {
    const opts = { passive: false };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      this._setPos(e);
      this._pDown = true; this._sync();
    }, opts);
    el.addEventListener('pointermove', e => {
      this._setPos(e);
    }, opts);
    const up = e => { this._pDown = false; this._sync(); };
    el.addEventListener('pointerup', up, opts);
    el.addEventListener('pointercancel', up, opts);
    window.addEventListener('blur', () => {
      this.keys.clear();
      this._pDown = false; this._kDown = false; this._sync();
    });

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this._kDown = true; this._sync();
      }
      if (e.code === 'Escape') Menu.toggle();
      if (e.code === 'KeyM') Audio.toggleMute();
    });
    window.addEventListener('keyup', e => {
      this.keys.delete(e.code);
      if (e.code === 'Space' || e.code === 'Enter') {
        this._kDown = false; this._sync();
      }
    });
  },

  _setPos(e) {
    this.sx = e.clientX; this.sy = e.clientY;
    const w = View.toWorld(e.clientX, e.clientY);
    this.x = w.x; this.y = w.y;
    this.moved = true;
    this.lastMoveAt = Engine.time;
    this.emit('move', { x: this.x, y: this.y });
  },

  update(dt) {
    if (this.down) this.holdTime += dt;
    if (dt > 0) {
      this.vx = (this.x - this._px) / dt;
      this.vy = (this.y - this._py) / dt;
      /* smoothed magnitude: per-frame deltas alternate 0/2× when the event
         rate beats the frame rate (high-Hz displays) — the EMA settles it */
      this.speed = damp(this.speed, Math.hypot(this.vx, this.vy), 10, dt);
    }
    this._px = this.x; this._py = this.y;
  },
  postUpdate() { this.moved = false; },

  /* directional intent for walk scenes: keys or pointer-x relative to a figure */
  axis() {
    let a = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) a -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) a += 1;
    return a;
  },
};
