/* i18n: the English strings ARE the keys; dictionaries map them to pt / it / pl.
   Untranslated (or deliberately Polish) strings fall through unchanged.
   Diary citations ("Diary, n") are rewritten by pattern. */

const I18N = {
  lang: 'en',
  LANGS: ['en', 'pt', 'it', 'pl'],

  detect() {
    const saved = Save.data.settings.lang;
    if (saved && this.LANGS.includes(saved)) { this.lang = saved; return; }
    const nav = (navigator.language || 'en').toLowerCase();
    this.lang = nav.startsWith('pt') ? 'pt' : nav.startsWith('it') ? 'it' : nav.startsWith('pl') ? 'pl' : 'en';
  },

  set(lang) {
    if (!this.LANGS.includes(lang)) return;
    this.lang = lang;
    Save.data.settings.lang = lang;
    Save.write();
  },

  attr: { pt: 'Diário, $1', it: 'Diario, $1', pl: 'Dzienniczek, $1' },

  dict: { pt: {}, it: {}, pl: {} },
};

function tr(s) {
  if (s == null || I18N.lang === 'en') return s;
  const d = I18N.dict[I18N.lang];
  if (d[s] !== undefined) return d[s];
  const m = /^Diary, (\d+)$/.exec(s);
  if (m) return I18N.attr[I18N.lang].replace('$1', m[1]);
  return s;
}
