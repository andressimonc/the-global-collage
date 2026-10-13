// Look at a page the way a visitor does, in real Chrome, and report what is broken.
// Starts its own private preview server, so it never depends on (or disturbs) anyone else's.
//
//   node tools/shot.mjs <path> <outDir> [--w 1440] [--h 900] [--mobile] [--max 8] [--no-shots] [--no-walk]
//                                       [--click "<selector>"] [--steps "<steps>"] [--wait 1200] [--reduced] [--nojs]
//
//   <path>    site path, e.g. /option-1/index.html or "/option-1/product.html?handle=curiosity"
//   <outDir>  where the PNGs go (one per screenful, named <page>-<width>-01.png ...)
//   --mobile  390x844 phone with touch;  --reduced emulates prefers-reduced-motion;  --nojs turns JavaScript off
//   --click   real click (or tap) on that element after load, before the walk
//   --steps   a short script run after load, steps separated by ";" :
//               click:<sel>   real mouse click / phone tap at the element's centre (reports if something covers it)
//               hover:<sel>   move the pointer onto it (real :hover)        scroll:<sel>  bring it into view
//               type:<sel>=<text>   fill a field       key:<Enter|Escape|Tab>   press a key
//               drag:<sel>=<dx>,<dy>   press on it, move, release          wait:<ms>
//               shot:<label>  save the screen now as <page>-<width>-step-<label>.png
//             e.g. --steps "click:.add-to-cart; wait:600; shot:added; click:[data-cart-open]; wait:600; shot:cart"
//             Forms on this preview send nothing, so it is safe to submit them here.
//   --no-walk skips the top-to-bottom walk (use with --steps when you only want the step shots)
//
// Prints one JSON line: { shots, errors, failed, brokenImages, overflowX, hiddenAfterScroll, title, h1, url }
// Exit code 1 when errors, failed requests, broken images or sideways overflow were found.
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from '../dev/server.mjs';

const args = process.argv.slice(2);
const BARE = ['--mobile', '--no-shots', '--reduced', '--no-walk', '--nojs'];
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i < 0 ? fallback : (args[i + 1] === undefined || BARE.includes(args[i + 1]) ? true : args[i + 1]); };
const [path, outDir] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1]?.startsWith('--') && !BARE.includes(args[i - 1])));
if (!path || !outDir) { console.error('usage: node tools/shot.mjs <path> <outDir> [--w 1440] [--h 900] [--mobile] [--max 8] [--no-shots] [--no-walk] [--click sel] [--steps "..."] [--wait ms] [--reduced] [--nojs]'); process.exit(2); }
const mobile = args.includes('--mobile');
const width = Number(flag('w', mobile ? 390 : 1440));
const height = Number(flag('h', mobile ? 844 : 900));
const max = Number(flag('max', 8));
const wait = Number(flag('wait', 1200));
const noShots = args.includes('--no-shots');
const steps = [flag('click', null) ? `click:${flag('click')}` : null, ...String(flag('steps', '') || '').split(';')].map((s) => s?.trim()).filter(Boolean);

const server = await startServer(0);
const origin = `http://127.0.0.1:${server.address().port}`;
const debugPort = 9300 + Math.floor(Math.random() * 20000);
const profile = mkdtempSync(join(tmpdir(), 'tgc-shot-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--hide-scrollbars', `--window-size=${width},${height}`, '--autoplay-policy=no-user-gesture-required', '--no-first-run', 'about:blank'],
  { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const done = (code) => { chrome.kill('SIGKILL'); server.close(); try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); };
setTimeout(() => { console.error('timed out'); done(1); }, 180000);

let target;
for (let i = 0; i < 80 && !target; i++) {
  await sleep(250);
  try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
}
if (!target) { console.error('no chrome target'); done(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map(), waiters = new Map();
const errors = [], failed = [], urls = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method && waiters.has(m.method)) { waiters.get(m.method)(m); waiters.delete(m.method); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.split('\n')[0] ?? m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
  if (m.method === 'Network.requestWillBeSent') urls.set(m.params.requestId, m.params.request.url);
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && !m.params.response.url.endsWith('/favicon.ico')) failed.push(`${m.params.response.status} ${m.params.response.url.replace(origin, '')}`);
  if (m.method === 'Network.loadingFailed' && !m.params.canceled) failed.push(`failed ${(urls.get(m.params.requestId) ?? '?').replace(origin, '')} (${m.params.errorText})`);
});
const send = (method, params = {}) => new Promise((r) => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((r) => waiters.set(method, r));
const evaluate = async (ex) => (await send('Runtime.evaluate', { expression: ex, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
if (args.includes('--reduced')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (args.includes('--nojs')) await send('Emulation.setScriptExecutionDisabled', { value: true });
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url: origin + path });
await loaded;
await sleep(wait);

const name = (path.split('?')[0].split('/').filter(Boolean).join('_').replace(/\.html$/, '') || 'index') + (path.includes('?') ? '_' + path.split('?')[1].replace(/[^a-z0-9]+/gi, '-') : '');
const shots = [];
if (!noShots) mkdirSync(outDir, { recursive: true });
const capture = async (label) => {
  if (noShots) return;
  const s = await send('Page.captureScreenshot', { format: 'png' });
  const file = join(outDir, `${name}-${width}-${label}.png`);
  writeFileSync(file, Buffer.from(s.result.data, 'base64'));
  shots.push(file);
};
// centre of an element once it is in view, and what is actually on top at that point
const locate = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const top = document.elementFromPoint(x, y); const ok = !!top && (top === el || el.contains(top) || top.contains(el)); return { x, y, ok, top: top ? top.tagName.toLowerCase() + (typeof top.className === 'string' && top.className ? '.' + top.className.trim().split(/\\s+/).join('.') : '') : 'nothing', visible: r.width > 0 && r.height > 0 }; })()`);
const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra });
for (const step of steps) {
  const [verb, ...rest] = step.split(':'); const arg = rest.join(':').trim();
  if (verb === 'wait') { await sleep(Number(arg) || 500); continue; }
  if (verb === 'shot') { await capture(`step-${arg.replace(/[^a-z0-9]+/gi, '-')}`); continue; }
  if (verb === 'key') { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: arg, code: arg, windowsVirtualKeyCode: { Enter: 13, Escape: 27, Tab: 9 }[arg] ?? 0, ...(arg === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }); await sleep(300); continue; }
  const [sel, value = ''] = verb === 'type' || verb === 'drag' ? [arg.slice(0, arg.lastIndexOf('=')), arg.slice(arg.lastIndexOf('=') + 1)] : [arg];
  const at = await locate(sel);
  if (!at) { errors.push(`step "${step}": nothing matches ${sel}`); continue; }
  if (!at.visible) { errors.push(`step "${step}": ${sel} has no size (hidden)`); continue; }
  await sleep(350); // let a smooth scroll settle
  const p = await locate(sel);
  if (verb === 'scroll') continue;
  if (verb === 'hover') { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0 }); await sleep(700); continue; }
  if (!p.ok && verb !== 'type') errors.push(`step "${step}": ${sel} is covered by <${p.top}> where a visitor would press`);
  if (verb === 'click') {
    if (mobile) await send('Input.synthesizeTapGesture', { x: p.x, y: p.y });
    else { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0 }); await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y); }
    await sleep(900);
  } else if (verb === 'type') {
    await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.focus(); if (el.tagName === 'SELECT') { const o = [...el.options].find(o => o.value === ${JSON.stringify(value)} || o.textContent.trim() === ${JSON.stringify(value)}); if (o) el.value = o.value; } else { el.value = ${JSON.stringify(value)}; } el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  } else if (verb === 'drag') {
    const [dx, dy] = value.split(',').map(Number);
    if (mobile) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] }); for (let k = 1; k <= 8; k++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + dx * k / 8, y: p.y + dy * k / 8 }] }); await sleep(30); } await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0 }); await mouse('mousePressed', p.x, p.y); for (let k = 1; k <= 8; k++) { await mouse('mouseMoved', p.x + dx * k / 8, p.y + dy * k / 8); await sleep(30); } await mouse('mouseReleased', p.x + dx, p.y + dy); }
    await sleep(500);
  } else errors.push(`unknown step "${step}"`);
}

// With JavaScript off nothing can be asked of the page, so just photograph it screen by screen.
if (args.includes('--nojs')) {
  const { result: { cssContentSize } } = await send('Page.getLayoutMetrics');
  for (let n = 0; n < Math.min(max, Math.ceil(cssContentSize.height / height)); n++) {
    if (noShots) break;
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: n * height, width, height, scale: 1 } });
    const file = join(outDir, `${name}-${width}-nojs-${String(n + 1).padStart(2, '0')}.png`);
    writeFileSync(file, Buffer.from(s.result.data, 'base64')); shots.push(file);
  }
  console.log(JSON.stringify({ path, width, nojs: true, shots, failed: [...new Set(failed)], pageHeight: cssContentSize.height }));
  done(failed.length ? 1 : 0);
}
const pageHeight = await evaluate('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
// Walk down a screenful at a time, in small steps like a visitor, so scroll reveals fire.
if (!args.includes('--no-walk')) {
  const screens = Math.min(max, Math.max(1, Math.ceil(pageHeight / height)));
  for (let n = 0; n < screens; n++) {
    const to = Math.min(n * height, Math.max(0, pageHeight - height));
    await evaluate(`(async () => { const from = scrollY, to = ${to}; for (let k = 1; k <= 8; k++) { window.scrollTo({ top: from + (to - from) * k / 8, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } })()`);
    await sleep(n === 0 && !steps.length ? 300 : 1100);
    await capture(String(n + 1).padStart(2, '0'));
  }
}

const health = await evaluate(`(() => {
  const doc = document.documentElement;
  const brokenImages = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'));
  const wide = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed'; }).slice(0, 5).map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : ''));
  // text that is still invisible after the whole page has been scrolled past: a reveal that never fired
  const hidden = [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main li, main img')].filter(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && (Number(cs.opacity) < 0.05) && cs.visibility !== 'hidden'; }).slice(0, 5).map(el => el.tagName.toLowerCase() + ': ' + (el.textContent || el.getAttribute('alt') || '').trim().slice(0, 40));
  return { overflowX: doc.scrollWidth > doc.clientWidth ? { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits: wide } : null, brokenImages, hiddenAfterScroll: hidden, title: document.title, h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim().replace(/\\s+/g, ' ').slice(0, 80)), pageHeight: ${pageHeight}, url: location.href.replace(location.origin, '') };
})()`);
const report = { path, width, shots, errors: [...new Set(errors)], failed: [...new Set(failed)], ...health };
console.log(JSON.stringify(report));
done(report.errors.length || report.failed.length || report.brokenImages.length || report.overflowX ? 1 : 0);
