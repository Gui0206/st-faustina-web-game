/* DOM overlay: narrative lines, title cards, hints, choices, menu, keepsake.
   Canvas paints the world; the DOM speaks. */

const UI = {
  els: {},
  init() {
    for (const id of ['textbox', 'advance', 'hint', 'titlecard', 'choices', 'menu', 'menubtn', 'keepsake', 'flash-note'])
      this.els[id] = document.getElementById(id);
    this.els.menubtn.addEventListener('click', e => { e.stopPropagation(); Menu.toggle(); });
    this.els.menubtn.addEventListener('pointerdown', e => e.stopPropagation());
    Menu.build();
  },
  flashNote(msg) {
    const el = this.els['flash-note'];
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(this._fn);
    this._fn = setTimeout(() => el.classList.remove('on'), 1600);
  },
  showMenuBtn(v) { this.els.menubtn.classList.toggle('visible', v); },
};

/* ---------------- narrative text ---------------- */
const Text = {
  el: null, showing: false, blocking: false, dwell: 0, minDwell: 0.7,
  autoLeft: 0, _resolve: null,

  /* show(str, opts) -> awaitable for the script runner
     opts: quote (italic + attribution), attr ("Diary, 47"), voice (His words),
           auto (seconds, auto-advance), passthrough (don't consume presses),
           small, hold (min seconds before advance allowed) */
  show(str, opts = {}) {
    this.clear(true);
    str = tr(str);
    const div = document.createElement('div');
    div.className = 'line' + (opts.voice ? ' voice' : opts.quote ? ' quote' : '') + (opts.small ? ' small' : '');
    div.innerHTML = esc(str) + (opts.attr ? `<span class="attr">— ${esc(tr(opts.attr))}</span>` : '');
    UI.els.textbox.appendChild(div);
    requestAnimationFrame(() => requestAnimationFrame(() => div.classList.add('on')));
    this.el = div;
    this.showing = true;
    this.blocking = !opts.passthrough;
    this.dwell = 0;
    /* a line can't be dismissed before it could plausibly be read — the
       interact press and the advance press are the same input, so rhythm
       presses from a scene must land inside this window and be consumed */
    const read = Math.min(3.2, 0.6 + str.split(/\s+/).filter(Boolean).length * 0.12);
    this.minDwell = Math.max(opts.hold || 0, opts.voice ? 1.2 : 0.7, read);
    this.autoLeft = opts.auto || 0;
    const self = this;
    /* per-line awaitable: resolves when THIS line is gone (replaced or dismissed) */
    return { done: () => self.el !== div };
  },

  update(dt) {
    if (!this.showing) { UI.els.advance.classList.remove('on'); return; }
    this.dwell += dt;
    if (this.autoLeft > 0) {
      if (this.dwell >= this.autoLeft) this.dismiss();
      UI.els.advance.classList.remove('on');
    } else {
      /* the cue and the permission coincide: pressing only ever skips
         when the dot says it will */
      UI.els.advance.classList.toggle('on', this.blocking && this.dwell > this.minDwell);
    }
  },

  /* user pressed while a blocking line shows */
  advance() {
    if (!this.showing || !this.blocking) return false;
    if (this.dwell < this.minDwell) {                  // consume press, not ready
      const a = UI.els.advance;
      a.classList.add('soon');
      clearTimeout(this._soonT);
      this._soonT = setTimeout(() => a.classList.remove('soon'), 500);
      return true;
    }
    this.dismiss();
    return true;
  },

  dismiss() {
    if (!this.showing) return;
    this.showing = false;
    const el = this.el;
    if (el) {
      el.classList.remove('on'); el.classList.add('off');
      setTimeout(() => el.remove(), 700);
    }
    this.el = null;
    UI.els.advance.classList.remove('on', 'soon');
  },

  clear(immediate) {
    this.showing = false;
    UI.els.advance.classList.remove('on', 'soon');
    if (this.el) {
      const el = this.el;
      if (immediate) el.remove();
      else { el.classList.remove('on'); el.classList.add('off'); setTimeout(() => el.remove(), 700); }
      this.el = null;
    }
  },
};

/* ---------------- hint microcopy ---------------- */
const Hint = {
  timer: null,
  show(str, opts = {}) {
    const el = UI.els.hint;
    el.textContent = tr(str);
    el.style.top = opts.top || '62%';
    el.classList.add('on');
    clearTimeout(this.timer);
    if (opts.ttl) this.timer = setTimeout(() => this.hide(), opts.ttl * 1000);
  },
  hide() { UI.els.hint.classList.remove('on'); },
};

/* ---------------- chapter title card ---------------- */
const TitleCard = {
  visible: false,
  show(num, title, place) {
    const el = UI.els.titlecard;
    el.innerHTML =
      (num ? `<div class="tc-num">${esc(num)}</div>` : '') +
      `<div class="tc-title">${esc(tr(title))}</div>` +
      `<div class="tc-rule"></div>` +
      (place ? `<div class="tc-place">${esc(tr(place))}</div>` : '');
    el.classList.add('on');
    this.visible = true;
    this.shownAt = Engine.time;
  },
  hide() {
    UI.els.titlecard.classList.remove('on');
    this.visible = false;
  },
};

/* ---------------- choices (three works of mercy) ---------------- */
const Choices = {
  open: false, _cb: null,
  show(options, cb) {
    const el = UI.els.choices;
    el.innerHTML = '';
    this._cb = cb;
    for (const o of options) {
      const b = document.createElement('button');
      b.className = 'choice' + (o.disabled ? ' disabled' : '');
      b.innerHTML = esc(tr(o.label)) + (o.sub ? `<small>${esc(tr(o.sub))}</small>` : '');
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', e => {
        e.stopPropagation();
        if (o.disabled) return;
        this.hide();
        Audio.pluck('A4', 0.3);
        cb(o.id);
      });
      el.appendChild(b);
    }
    el.classList.add('on');
    this.open = true;
  },
  hide() {
    UI.els.choices.classList.remove('on');
    this.open = false;
  },
};

/* ---------------- pause menu ---------------- */
const Menu = {
  open: false,
  build() {
    const el = UI.els.menu;
    const langRow = I18N.LANGS.map(l =>
      `<span class="lang${I18N.lang === l ? ' on' : ''}" data-lang="${l}">${l.toUpperCase()}</span>`).join('');
    el.innerHTML = `
      <div class="menu-panel">
        <div class="menu-title">Faustyna</div>
        <div class="menu-sep"></div>
        <button class="menu-item" data-act="resume">${esc(tr('Return'))}</button>
        <button class="menu-item" data-act="restart">${esc(tr('Restart chapter'))}</button>
        <div class="menu-sep"></div>
        <div id="menu-chapters"></div>
        <div class="menu-sep"></div>
        <div class="menu-row">${esc(tr('sound'))} <input type="range" id="m-vol" min="0" max="100" step="1"></div>
        <div class="menu-row"><span class="toggle" id="m-motion"><span class="box"></span> ${esc(tr('calm motion'))}</span></div>
        <div class="menu-row" id="m-lang">${langRow}</div>
        <div class="menu-note">${tr('A story drawn from the Diary of Saint Faustina Kowalska (1905–1938). Quotations cited as “Diary, n.” are from <i>Diary: Divine Mercy in My Soul</i>, © 1987 Congregation of Marians of the Immaculate Conception.')}</div>
      </div>`;
    el.querySelector('#m-vol').addEventListener('input', e => {
      Audio.init(); Audio.setVolume(e.target.value / 100);
    });
    el.querySelector('#m-motion').addEventListener('click', e => {
      e.stopPropagation();
      Save.data.settings.reduceMotion = !Save.data.settings.reduceMotion;
      Save.write(); this.syncSettings();
    });
    el.querySelector('#m-lang').addEventListener('click', e => {
      const chip = e.target.closest && e.target.closest('[data-lang]');
      if (!chip) return;
      e.stopPropagation();
      I18N.set(chip.dataset.lang);
      this.build(); this.refreshChapters(); this.syncSettings();   // re-render in the new language
      Audio.pluck('A4', 0.2);
    });
    if (this._bound) return;
    this._bound = true;
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => {
      const act = e.target.closest && e.target.closest('[data-act]');
      if (!act || act.classList.contains('locked')) return;
      e.stopPropagation();
      const a = act.dataset.act;
      if (a === 'resume') this.toggle(false);
      if (a === 'restart') { this.toggle(false); Engine.go(Engine.scene.id, { instant: false }); }
      if (a === 'chapter') { this.toggle(false); Engine.go(act.dataset.id, { instant: false }); }
    });
  },
  syncSettings() {
    UI.els.menu.querySelector('#m-vol').value = Math.round((Save.data.settings.volume ?? 0.85) * 100);
    UI.els.menu.querySelector('#m-motion').classList.toggle('on', !!Save.data.settings.reduceMotion);
  },
  refreshChapters() {
    const holder = UI.els.menu.querySelector('#menu-chapters');
    holder.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      const locked = i > Save.data.unlocked;
      const b = document.createElement('button');
      b.className = 'menu-item' + (locked ? ' locked' : '');
      b.dataset.act = 'chapter'; b.dataset.id = c.id;
      b.innerHTML = `${c.num}. ${esc(tr(c.menuTitle || c.title))}` + (locked ? '' : `<span class="menu-sub">${esc(tr(c.place))}</span>`);
      holder.appendChild(b);
    });
  },
  toggle(force) {
    const want = force !== undefined ? force : !this.open;
    if (want === this.open) return;
    this.open = want;
    if (want) { Audio.init(); this.refreshChapters(); this.syncSettings(); }
    UI.els.menu.classList.toggle('on', want);
    Engine.paused = want;
    document.getElementById('app').classList.toggle('show-cursor', want);
  },
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
