#!/usr/bin/env node
/* Builds the single-file game: inlines all src/js/*.js (sorted) into src/shell.html
   at the <!--{{SCRIPTS}}--> marker and writes index.html. */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const JS = path.join(SRC, 'js');

const shell = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
const files = fs.readdirSync(JS).filter(f => f.endsWith('.js')).sort();

/* inline assets as data URIs so index.html stays a single file */
const dataUri = (file, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(SRC, 'assets', file)).toString('base64')}`;

let bundle = '"use strict";\n';
bundle += `const MERCY_IMG = '${dataUri('mercy.jpg', 'image/jpeg')}';\n`;
/* closing gallery — the real people behind the story */
bundle += `const HELENA_IMG = '${dataUri('helena-kowalska.jpg', 'image/jpeg')}';\n`;
bundle += `const FAUSTINA_NUN_IMG = '${dataUri('saint-faustina.png', 'image/png')}';\n`;
bundle += `const FAUSTINA_JESUS_IMG = '${dataUri('st-faustina-and-Jesus.jpg', 'image/jpeg')}';\n`;
bundle += `const JOHN_PAUL_II_IMG = '${dataUri('st-john-paul-ii.jpg', 'image/jpeg')}';\n`;
for (const f of files) {
  const code = fs.readFileSync(path.join(JS, f), 'utf8');
  bundle += `\n/* ============ ${f} ============ */\n` + code + '\n';
}

const render = extra => shell.replace('<!--{{SCRIPTS}}-->', () => `<script>\n(function(){\n${bundle}${extra}\n})();\n</script>`);
const out = render('');
fs.writeFileSync(path.join(ROOT, 'index.html'), out);
console.log(`built index.html  (${(out.length / 1024).toFixed(1)} KB, ${files.length} modules)`);

/* test build: same game + an auto-driver for headless screenshots */
if (process.argv.includes('test')) {
  const driver = `
<script>
(function(){
  const G = window.__G;
  const q = new URLSearchParams(location.hash.slice(1));
  const scene = q.get('scene');
  const mode = q.get('mode') || 'auto';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const press = () => { G.Input.down = true; G.Input.holdTime = 0; G.Engine.handlePress({x:G.Input.x,y:G.Input.y}); };
  const release = () => { G.Input.down = false; G.Input.emit('release', {x:G.Input.x,y:G.Input.y,held:G.Input.holdTime}); };
  const move = (x,y) => { G.Input.x = x; G.Input.y = y; G.Input.lastMoveAt = G.Engine.time; G.Input.moved = true; G.Input.emit('move', {x,y}); };
  async function strokePath(pts, stepMs=40){
    move(pts[0].x, pts[0].y); press(); await sleep(60);
    for (const p of pts){ move(p.x, p.y); await sleep(stepMs); }
    release(); await sleep(200);
  }
  window.addEventListener('load', async () => {
    window.__shotReady = false;
    await sleep(500);
    press(); release();                       // wake audio + title
    if (!scene || scene === 'title') { window.__shotReady = true; return; }
    await sleep(500);
    G.Engine.go(scene, { instant: true });
    window.__shotReady = true;
    /* DOM choice clicker (gate scene) */
    setInterval(() => {
      const b = document.querySelector('#choices.on .choice:not(.disabled)');
      if (b && scene !== 'title') b.click();
    }, 4200);
    if (mode === 'paint') {
      /* text advancer in parallel */
      setInterval(() => { if (G.Text.showing && G.Text.blocking) { press(); release(); } }, 1700);
      const sc = G.Engine.scene;
      while (sc.step !== 'garment') await sleep(300);
      const r = sc.canvasRect;
      const U = (x,y) => ({ x: r.x + x*r.w, y: r.y + y*r.h });
      for (let s=0; s<6; s++){
        const x0 = 0.3 + s*0.08;
        const pts = []; for (let i=0;i<=10;i++) pts.push(U(x0 + Math.sin(i)*0.02, 0.15 + i*0.07));
        await strokePath(pts);
        if (sc.step !== 'garment') break;
      }
      while (sc.step !== 'hand') await sleep(300);
      await strokePath([U(0.44,0.18),U(0.38,0.24),U(0.31,0.295),U(0.295,0.305)]);
      while (sc.step !== 'ray_red') await sleep(300);
      { const pts=[]; for(let i=0;i<=12;i++) pts.push(U(0.5-(0.22*i/12), 0.42+(0.5*i/12))); await strokePath(pts); }
      while (sc.step !== 'ray_pale') await sleep(300);
      { const pts=[]; for(let i=0;i<=12;i++) pts.push(U(0.5+(0.22*i/12), 0.42+(0.5*i/12))); await strokePath(pts); }
      while (sc.step !== 'sig') await sleep(300);
      { const pts=[]; for(let i=0;i<=14;i++) pts.push(U(0.16+0.7*i/14, 0.92)); await strokePath(pts, 70); }
      return;
    }
    if (scene === 'ch9' && mode === 'long') {
      for (let i=0;i<5;i++){ press(); await sleep(2600); release(); await sleep(900); }
      for (let i=0;i<3;i++){ press(); await sleep(5400); release(); await sleep(700); }
      return;
    }
    /* generic: hold-cycles + slow pointer drift (gentle speeds for ch4) */
    let a = 0;
    setInterval(() => { a += 0.075; move(Math.sin(a)*260, 580 + Math.cos(a*0.7)*130); }, 50);
    if (scene === 'ch2') {
      /* the dance needs brisk taps to reach the vision */
      setInterval(() => { press(); setTimeout(release, 160); }, 1050);
      setTimeout(() => setInterval(() => { press(); setTimeout(release, 2150); }, 3100), 32000);
    } else {
      setInterval(() => { press(); setTimeout(release, 2150); }, 3100);
    }
  });
})();
</script>`;
  const testOut = render('\nwindow.__G = { Engine, Input, Audio, Save, Painting, Choices, Text, I18N, Menu, UI, tr };')
    .replace('</body>', driver + '\n</body>');
  fs.writeFileSync(path.join(ROOT, 'test.html'), testOut);
  console.log('built test.html (auto-driver)');
}
