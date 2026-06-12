/* localStorage persistence: progress, the player's painting, settings. */

const Save = {
  KEY: 'faustyna_v1',
  data: null,

  read() {
    try {
      this.data = JSON.parse(localStorage.getItem(this.KEY)) || null;
    } catch (e) { this.data = null; }
    if (!this.data || typeof this.data !== 'object' || Array.isArray(this.data)) this.data = {};
    const d = this.data;
    if (!d.settings || typeof d.settings !== 'object') d.settings = {};
    if (typeof d.settings.volume !== 'number' || !isFinite(d.settings.volume)) d.settings.volume = 0.85;
    if (typeof d.settings.reduceMotion !== 'boolean')
      d.settings.reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (typeof d.unlocked !== 'number' || !isFinite(d.unlocked)) d.unlocked = 0;
    d.unlocked = clamp(Math.floor(d.unlocked), 0, CHAPTERS.length - 1);
    if (typeof d.chapter !== 'string' || !SCENES[d.chapter]) d.chapter = null;
    if (!Array.isArray(d.strokes)) d.strokes = null;
    d.done = !!d.done;
    return d;
  },

  write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* private mode */ }
  },

  reachChapter(id) {
    const i = CHAPTERS.findIndex(c => c.id === id);
    if (i >= 0) {
      this.data.chapter = id;
      this.data.unlocked = Math.max(this.data.unlocked, i);
    }
    this.write();
  },

  /* strokes: [[{x,y},...], ...] in unit canvas space; cap size */
  savePainting(strokes) {
    let total = 0;
    const out = [];
    for (const s of strokes) {
      const pts = s.pts.map(p => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000]);
      total += pts.length;
      out.push({ k: s.kind, p: pts });
      if (total > 6000) break;
    }
    this.data.strokes = out;
    this.write();
  },
};
