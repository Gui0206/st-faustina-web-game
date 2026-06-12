#!/usr/bin/env node
/* Real-time headless screenshot harness over CDP (no deps; Node 22 WebSocket).
   Launches Chrome, runs test.html scenarios, saves shots/, reports JS errors. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9337;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'shots3');
const PAGE = 'file://' + ROOT + '/test.html';

const SCENARIOS = [
  ['epilogue', 'auto', [96, 106]],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const prof = '/tmp/faustyna-cdp-' + Date.now();
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
    '--window-size=1600,900', '--autoplay-policy=no-user-gesture-required',
    '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  process.on('exit', () => { try { chrome.kill(); } catch (e) {} });

  let version = null;
  for (let i = 0; i < 60 && !version; i++) { await sleep(300); version = await getJson('/json/version').catch(() => null); }
  if (!version) throw new Error('chrome devtools not reachable');

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let nextId = 1;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else for (const h of handlers) h(m);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);

  let currentScene = 'boot';
  handlers.push(m => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      console.log(`[${currentScene}] EXCEPTION: ${d.text} ${(d.exception && d.exception.description || '').split('\n')[0]}`);
    }
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
      console.log(`[${currentScene}] console.${m.params.type}: ${m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 200)}`);
    }
  });

  for (const [scene, mode, times] of SCENARIOS) {
    currentScene = scene;
    /* hash-only navigation doesn't reload — bust with a unique query */
    await send('Page.navigate', { url: `${PAGE}?r=${Date.now()}#scene=${scene}&mode=${mode}` }, sessionId);
    let elapsed = 0;
    for (const t of times) {
      await sleep((t - elapsed) * 1000);
      elapsed = t;
      const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const file = path.join(OUT, `${scene}-${String(t).padStart(2, '0')}s.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`shot ${path.basename(file)}`);
    }
  }
  console.log('ALL DONE');
  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
