# FAUSTYNA — Vessel of Mercy

A narrative browser game on the life of Saint Faustina Kowalska (1905–1938) and the
message of Divine Mercy, drawn from her *Diary: Divine Mercy in My Soul*.

**Play:** open `index.html` in any modern browser. That single file is the whole game
(no build, no server, no assets — all art is procedural canvas, all music and sound
are synthesized WebAudio).

- ~20 minutes, nine chapters and an epilogue
- One input: touch / click / hold anywhere (Space and Enter also work; Esc — menu; M — mute)
- Progress, settings, and your painting are saved locally; chapter select unlocks as you play

## The design in one line

The whole game is one verb — **hold** (to trust) — taught in chapter I, broken on
purpose in chapter VIII, and inverted at the end: the last thing the game asks of you
is to let go. In chapter V you paint the Divine Mercy image with your own hand; your
imperfect painting *is* the game's holy image from then on, and it returns at the end
as a keepsake you can download.

## Development

```
src/
  shell.html      HTML + CSS (typography, overlay UI)
  js/00–08        engine: utils, input, audio, particles, render, text/UI, save, loop, chapters
  js/10–20        scenes: title, nine chapters, epilogue
build.js          concatenates src into the single-file index.html
                  `node build.js test` additionally emits test.html (an auto-playing build)
tools/shoot.js    headless-Chrome screenshot harness over CDP (node tools/shoot.js → shots/)
```

## Sources and fidelity

All quoted words of Jesus and of Saint Faustina are taken verbatim (in brief
quotation) from the standard English edition of the *Diary* and cited in-game as
“Diary, n.” — © 1987 Congregation of Marians of the Immaculate Conception,
Stockbridge, MA. Places, dates, and events follow the historical record: Głogowiec,
the dance in Łódź (1924), Żytnia Street in Warsaw (1925), the Płock vision
(22 February 1931), the Kazimirowski painting in Vilnius (1934), the chaplet
(September 1935), the gate at Kraków-Łagiewniki, the Prądnik sanatorium, her death
on 5 October 1938, the 1959–1978 suspension of the devotion and its lifting,
beatification (1993), and canonization on 30 April 2000 — the first canonization of
the Great Jubilee — with the institution of Divine Mercy Sunday.

The *Diary* is approved private revelation; this game depicts it with reverence and
makes no claims beyond it.
