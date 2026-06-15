---
name: faustyna-game
description: >-
  Context for working on FAUSTYNA — Vessel of Mercy, the narrative web game on
  Saint Faustina Kowalska in this repo. Use this BEFORE editing any code here so
  you don't have to re-derive the game's feel, aesthetic, architecture, build
  step, scene system, i18n, or commit conventions. Trigger whenever the task
  touches the game: a chapter/scene, the epilogue, the gallery, audio, the
  painting, menu/UI, translations, the title, or "the game" / "this game".
---

# FAUSTYNA — Vessel of Mercy

A reverent, contemplative narrative browser game on the life of Saint Faustina
Kowalska (1905–1938) and the message of Divine Mercy, drawn from her *Diary*.
~20 minutes: nine chapters + an epilogue + a closing photo gallery. Read this
first; then make the change. You usually do **not** need to re-read every file.

## The design in one line

The whole game is **one verb — hold** (to trust). Taught in chapter I, broken on
purpose in chapter VIII ("the hold that doesn't answer"), inverted at the end:
the last thing asked of the player is to *let go*. In chapter V the player paints
the Divine Mercy image by hand; that imperfect painting **is** the game's holy
image from then on, returning at the end as a keepsake that dissolves into the
real Kazimirowski canvas.

## Feel & aesthetic — match this every time

- **Reverent, slow, hushed.** Nothing is loud or gamey. Beats breathe. Silence
  and dwell time are features. Never add HUD, score, timers, or jokey copy.
- **Candlelit darkness.** Near-black backgrounds; a single warm light is the
  emotional anchor of almost every scene.
- **Palette (CSS vars in `shell.html`):** `--bg #060508`, ink `--ink #ece5d8`
  (warm off-white), `--gold #e8c98a` (the sacred/accent color), plus dim/faint
  variants. Reds/blues only as the Divine Mercy rays (`#e8364c` red, `#cfdcff`
  pale).
- **Typography:** serif throughout — Iowan Old Style / Palatino / Georgia.
  Headings & labels are letterspaced uppercase; quotes are italic. Use the
  `spacedText()` helper for canvas letterspacing.
- **All art is procedural canvas** (no sprites/images, except a few inlined
  photos for the keepsake & closing gallery). Soft light is drawn with additive
  `globalCompositeOperation = 'lighter'` + `R.glow()` radial gradients, halos,
  flicker (`lamp()`), stars, dust motes.
- **Always-on post:** film grain + vignette + a slow breathing zoom (camera
  drift) are applied globally by `Engine.draw()` — don't re-add them per scene.
  Respect `Save.data.settings.reduceMotion` (via `Engine.fx`).
- **Audio is synthesized WebAudio** (no files): drone pads (`Audio.pad.set`),
  bells (`Audio.bell`), plucks/celesta, shimmer, choir channel, a recurring
  `Audio.motif`. Keep cues sparse and gentle; one bell at the right moment.
- **One input:** touch / click / hold anywhere (Space/Enter advance, Esc menu,
  M mute). Design every interaction around that single verb.

## Architecture & build

Single-file game. **Source lives in `src/`; `index.html` is generated — never
edit `index.html` (or `test.html`) by hand.**

```
src/shell.html        HTML + CSS (typography, overlay UI, all the #ids)
src/js/00–08          engine: util, input, audio, particles, render(R), text/UI, save, engine, chapters
src/js/05a–05d        i18n + pt/it/pl dictionaries
src/js/10–21          scenes: title, ch1–ch9, epilogue, gallery
src/js/99-main.js     boot
build.js              concatenates src/js/*.js (sorted) into index.html
tools/shoot.js        headless-Chrome screenshot harness (CDP) → reports JS errors
```

- Build: **`node build.js`** (writes `index.html`). New scene files are picked
  up automatically by sort order — name them with a numeric prefix.
- Test build: **`node build.js test`** also emits `test.html` with an
  auto-driver. Both `index.html` and `test.html` are tracked and should stay in
  sync — running `node build.js test` regenerates both.
- Inlined assets: images are base64 data-URIs injected at the top of the bundle
  in `build.js` (e.g. `MERCY_IMG`, the gallery `*_IMG` consts). Add new images
  there, then reference the global const from a scene.

## Scene system (how to add/edit a beat)

Scenes are objects registered on the global `SCENES` map, with lifecycle
`enter()`, `exit()`, `update(dt)`, `draw(ctx)`, optional `onPress/onRelease/onMove`,
and an optional generator `script: function*(S){ ... }` for choreography:

```js
SCENES.foo = {
  id: 'foo',
  enter() { this.t = 0; Audio.pad.set(/*chords*/, {level,hold,bright}); },
  script: function* (S) {
    yield S.wait(2);
    yield S.textAuto('A line that auto-advances.', 4.5, { small: true });
    yield S.text('A line that waits for a press.', { quote: true, attr: 'Diary, 47' });
    yield S.waitFor(() => cond, { hint: 'touch and hold', hintAfter: 4 });
    yield S.holdTotal(2.6, { hint: '…' });   // accumulated hold-time gate
    S.do(() => { /* side effect */ });
  },
  update(dt) { this.t += dt; },
  draw(ctx) { R.sky(ctx, 'foo-sky', [...stops], View.left, 0, View.W+2, 900); },
};
```

- `Engine.go(id, opts)` switches scenes (fade by default; `{instant}`,
  `{slowIn/slowOut}`, `{noCard}`). Chapters (in `CHAPTERS`) get a title card;
  non-chapter scenes (title, gallery) just fade in.
- Recurring helpers in `08-chapters.js`: `PrayBloom` (the hold-to-pray bloom),
  `Walker`, `lamp()`, `drawRing()`, the shared `Painting` store, `drawTaperedPath`.
- DOM overlay (`05-text.js`): `Text` (narrative lines), `Hint`, `TitleCard`,
  `Choices` (works-of-mercy buttons), `Menu` (pause/chapter select), `UI.els`.
  Canvas paints the world; the DOM speaks.
- Coordinate space: scenes live in `y ∈ [0,900]`, horizontally centered on `x=0`
  (`View.left` is negative, `View.W` is the band width). Outside is letterboxed.

## i18n — required for any player-facing string

English strings **are the keys**; `tr(str)` maps them to pt/it/pl, falling
through unchanged for `en` and for proper nouns / deliberate Polish. **Every new
visible string must be added to all three dicts**: `05b-lang-pt.js`,
`05c-lang-it.js`, `05d-lang-pl.js`. Diary citations (`'Diary, n'`) auto-translate
by pattern. Keep *Diary* quotations verbatim from the standard editions already
used in the dicts.

## Conventions

- **Commits:** in the user's name, terse lowercase-prefixed subject in the
  existing voice (`gallery:`, `epilogue:`, `ux:`, `i18n:`, `keepsake:`). **No
  Claude co-author trailer.**
- **Code style:** terse, no framework, `"use strict"`, evocative one-line
  comments that explain the *why/feeling*, not the mechanics. Match the
  surrounding density.
- **Verify visually** with `node build.js test` + `node tools/shoot.js` (or a
  copy pointed at your scene) — it captures frames and surfaces JS exceptions.
- **Fidelity matters:** dates, places, and quotations follow the historical
  record and the *Diary*; treat the subject with reverence.
