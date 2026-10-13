// The review page: each option in a frame, a notes thread for each, a wrap-up, and saving.
//   Link:  ?who=<name>&k=<review key>&option=<number | wrap-up>
//   Notes are kept in this browser at once (localStorage "tgc-review:<who>") and on the site two seconds
//   after the last change (POST api/notes). When the site cannot save, nothing is lost: the page says
//   "Saved on this device" and the wrap-up offers "Copy all my notes".
// Everything a person typed is put on the page with textContent, never as HTML.
// ponytail: one reviewer typing on two devices at the same moment: the last save wins (see api/notes.js).
import { MARKS, label, summarize } from './summary.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };

const query = new URLSearchParams(location.search);
const asked = (query.get('who') ?? '').toLowerCase();
const who = /^[a-z0-9-]{1,40}$/.test(asked) ? asked : 'guest';
const key = query.get('k') ?? '';
const api = new URL('../api/notes', import.meta.url);
const storeKey = `tgc-review:${who}`;
const narrow = matchMedia('(max-width: 899px)');
const touch = matchMedia('(pointer: coarse)');

// ---------- what she has written, on this device and on the site ----------
// record: { notes (what the site keeps), drafts (unsent text per option), dirty (changes the site has not got),
//           syncedAt (the site's time of our last save), sent (she pressed Send), seen (the phone sheet has opened once) }
const fresh = () => ({ notes: { options: {}, favorite: null, plan: null, overall: '' }, drafts: {}, dirty: false, syncedAt: '', sent: false, seen: false });
let record = fresh();
try {
  const kept = JSON.parse(localStorage.getItem(storeKey));
  if (kept?.notes?.options) record = { ...record, ...kept, notes: { ...record.notes, ...kept.notes } };
} catch {}
const keep = () => { try { localStorage.setItem(storeKey, JSON.stringify(record)); } catch {} };

let site = null; // null: not known yet · true: the site is saving · false: it cannot, the notes live on this device
let version = 0, timer = 0, queue = Promise.resolve();

function showStatus(text) {
  text ??= site === false ? 'Saved on this device' : record.dirty ? 'Saving…' : record.syncedAt ? 'Saved' : '';
  for (const node of document.querySelectorAll('[data-status]')) node.textContent = text;
  $('copy').hidden = site !== false;
}

async function push() {
  clearTimeout(timer);
  const sending = version;
  const body = JSON.stringify({ who, k: key, notes: record.notes, done: record.sent });
  try {
    // keepalive lets a save finish while the tab is closing; browsers only allow it for small bodies
    const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: body.length < 60000 });
    if (!res.ok) throw new Error(res.status);
    record.syncedAt = (await res.json()).savedAt;
    if (sending === version) record.dirty = false;
    site = true;
  } catch { site = false; }
  keep();
  showStatus();
  return site;
}
const sync = () => (queue = queue.then(push)); // one save at a time, in order

function changed() {
  version++;
  record.dirty = true;
  keep();
  showStatus();
  clearTimeout(timer);
  timer = setTimeout(sync, 2000);
  drawDots();
}

// What the site holds wins only when it is newer than our last save and nothing here is waiting to be sent:
// a first visit on this device, or notes written on another one. Answers true when it took the site's notes.
async function pull() {
  try {
    const from = new URL(api);
    from.search = new URLSearchParams({ who, k: key });
    const res = await fetch(from, { signal: AbortSignal.timeout(6000) });
    if (res.status === 404) { site = true; return false; }
    if (!res.ok) throw new Error(res.status);
    const doc = await res.json();
    site = true;
    if (record.dirty || !doc.notes?.options || !(doc.savedAt > record.syncedAt)) return false;
    record.notes = { ...fresh().notes, ...doc.notes };
    record.syncedAt = doc.savedAt;
    record.sent ||= doc.done === true;
    keep();
    return true;
  } catch { site = false; return false; }
}

// ---------- the options ----------
let options = [];
let at = 0; // 0 … options.length - 1 are the options, options.length is the wrap-up
const current = () => options[at];
const read = (n) => record.notes.options[n] ?? { mark: null, messages: [] };
const thread = (n) => (record.notes.options[n] ??= { mark: null, messages: [] });
const markOf = (n) => (record.notes.favorite === n ? 'favorite' : read(n).mark);
const markName = (mark) => (mark === 'favorite' ? 'Favorite' : MARKS[mark]);
const count = (n) => read(n).messages.length;
const notesWord = (n) => (count(n) === 1 ? '1 note' : `${count(n)} notes`);
const pageOf = (option) => new URL(`../option-${Number(option.n)}/index.html`, import.meta.url);

function drawDots() {
  [...$('dots').children].forEach((dot, i) => {
    const option = options[i];
    dot.setAttribute('aria-current', i === at);
    if (!option) return;
    const mark = markOf(option.n);
    dot.classList.toggle('favorite', mark === 'favorite');
    dot.classList.toggle('has', Boolean(mark) || count(option.n) > 0);
    dot.title = [label(option), markName(mark), count(option.n) ? notesWord(option.n) : ''].filter(Boolean).join(' · ');
  });
  const option = current();
  $('notes-open').textContent = option && count(option.n) ? `Notes (${count(option.n)})` : 'Notes';
}

function drawThread() {
  const option = current();
  if (!option) return;
  const mark = markOf(option.n);
  $('about').textContent = label(option);
  for (const button of $('marks').children) button.setAttribute('aria-pressed', button.dataset.mark === mark);
  $('mine').replaceChildren(...read(option.n).messages.map((message) => {
    const remove = el('button', { type: 'button', textContent: '×', ariaLabel: 'Remove this note' });
    remove.addEventListener('click', () => { // two taps, so a slip of the thumb never deletes a note
      if (!remove.dataset.armed) {
        remove.dataset.armed = '1';
        remove.textContent = 'Remove?';
        setTimeout(() => { delete remove.dataset.armed; remove.textContent = '×'; }, 4000);
        return;
      }
      const messages = thread(option.n).messages;
      messages.splice(messages.indexOf(message), 1);
      changed();
      drawThread();
    });
    return el('li', {}, remove, el('p', { textContent: message.text }));
  }));
  $('note').value = record.drafts[option.n] ?? '';
}

function drawWrap() {
  const favorite = options.find((option) => option.n === record.notes.favorite);
  $('wrap-favorite').textContent = favorite ? `Your favorite: ${label(favorite)}` : 'No favorite yet. Go back and tap Favorite on the one you like best.';
  $('picks').replaceChildren(...options.map((option, i) => {
    const mark = markOf(option.n);
    const tags = el('span', { className: 'tags' }, count(option.n) ? notesWord(option.n) : '');
    if (mark) tags.append(el('span', { className: `tag ${mark}`, textContent: markName(mark) }));
    const row = el('button', { type: 'button' }, el('span', { className: 'n', textContent: option.n }), el('span', { className: 'name', textContent: option.name }), tags);
    row.addEventListener('click', () => go(i));
    return el('li', {}, row);
  }));
  for (const input of $('plan').querySelectorAll('input')) input.checked = input.value === record.notes.plan;
  $('overall').value = record.notes.overall;
  if (record.sent && !$('after').textContent) $('after').textContent = 'You sent these notes to Dre. You can still add more and send again.';
}

async function showSite() {
  const option = current();
  $('stage').replaceChildren(); // a new frame each time, so the browser's Back button never lands on another option
  if (!option) return;
  // only a clear "not there" hides the frame; any other trouble still tries to show the site
  const missing = await fetch(pageOf(option), { method: 'HEAD' }).then((res) => res.status === 404, () => false);
  if (current() !== option) return; // she has already moved on
  $('stage').replaceChildren(missing
    ? el('p', { className: 'missing', textContent: `${label(option)} is not ready yet. Use the arrows to see the others.` })
    : el('iframe', { src: pageOf(option), title: label(option) }));
}

function go(to) {
  at = Math.min(Math.max(to, 0), options.length);
  const option = current();
  const address = new URLSearchParams(location.search);
  address.set('option', option ? option.n : 'wrap-up');
  history.replaceState(null, '', `?${address}`);

  document.body.dataset.stop = option ? 'option' : 'wrap';
  $('title').textContent = option ? `Option ${at + 1} of ${options.length} · ${option.name}` : 'Wrap-up';
  $('line').textContent = $('line').title = option ? option.line : 'Your favorite, your marks, and how to move forward.';
  $('prev').disabled = at === 0;
  $('next').disabled = !option;
  $('stage').hidden = !option;
  $('wrap').hidden = Boolean(option);
  if (option) $('full').href = pageOf(option);
  else sheet(false);
  drawDots();
  drawThread();
  if (!option) drawWrap();
  showSite();
}

// On a phone the notes are a sheet over the site.
function sheet(open) {
  document.body.classList.toggle('notes-on', open);
  $('notes-open').setAttribute('aria-expanded', open);
}

// ---------- start ----------
try {
  const [config] = await Promise.all([fetch(new URL('options.json', import.meta.url)).then((res) => res.json()), pull()]);
  options = config.options;
  $('intro').replaceChildren(...[config.intro].flat().map((line) => el('p', { textContent: line })));
  $('dots').replaceChildren(
    ...options.map((option, i) => { const dot = el('button', { type: 'button', textContent: option.n, ariaLabel: label(option) }); dot.addEventListener('click', () => go(i)); return dot; }),
    el('button', { type: 'button', className: 'end', ariaLabel: 'Wrap-up' }, el('span', { className: 'long', textContent: 'Wrap-up' }), el('span', { className: 'short', textContent: '✓' })),
  );
  $('dots').lastChild.addEventListener('click', () => go(options.length));
} catch {
  $('line').textContent = 'This page could not load. Please reload it.';
  throw new Error('review: options.json did not load');
}

$('prev').addEventListener('click', () => go(at - 1));
$('next').addEventListener('click', () => go(at + 1));
addEventListener('keydown', (event) => {
  if (event.key === 'Escape') return sheet(false);
  if (event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('textarea, input, select')) return; // not while she is typing
  if (event.key === 'ArrowLeft') go(at - 1);
  if (event.key === 'ArrowRight') go(at + 1);
});

$('size').addEventListener('click', (event) => {
  const size = event.target.dataset.size;
  if (!size) return;
  $('stage').dataset.size = size;
  for (const button of $('size').children) button.setAttribute('aria-pressed', button.dataset.size === size);
});

$('marks').addEventListener('click', (event) => {
  const mark = event.target.dataset.mark;
  const option = current();
  if (!mark || !option) return;
  const notes = record.notes;
  const was = markOf(option.n);
  if (was === 'favorite') notes.favorite = null;
  if (mark === 'favorite' && was !== 'favorite') {
    if (notes.favorite != null) thread(notes.favorite).mark = 'like'; // the one that held it before is still liked
    notes.favorite = option.n;
    thread(option.n).mark = null;
  } else thread(option.n).mark = mark === was || mark === 'favorite' ? null : mark; // tap again to clear
  changed();
  drawThread();
});

$('note').addEventListener('input', () => { record.drafts[current().n] = $('note').value; keep(); });
$('note').addEventListener('keydown', (event) => { // Enter sends, Shift+Enter is a new line; on a touch keyboard Enter is a new line and Send sends
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || touch.matches) return;
  event.preventDefault();
  $('composer').requestSubmit();
});
$('composer').addEventListener('submit', (event) => {
  event.preventDefault();
  const option = current();
  const text = $('note').value.trim();
  if (!option || !text) return;
  thread(option.n).messages.push({ text, at: Date.now() });
  delete record.drafts[option.n];
  changed();
  drawThread();
  $('thread').scrollTop = $('thread').scrollHeight;
});

$('plan').addEventListener('change', (event) => { record.notes.plan = event.target.value; changed(); });
$('overall').addEventListener('input', () => { record.notes.overall = $('overall').value; changed(); });
$('send').addEventListener('click', async () => {
  record.sent = true;
  version++;
  record.dirty = true;
  keep();
  $('send').disabled = true;
  showStatus('Sending…');
  const saved = await sync();
  $('send').disabled = false;
  const name = who === 'guest' ? '' : `, ${who[0].toUpperCase()}${who.slice(1).replaceAll('-', ' ')}`;
  $('after').textContent = saved
    ? `Thank you${name}. Dre has your notes. You can still go back, add more, and send again.`
    : 'Your notes could not reach the site, but they are safe on this device. Press "Copy all my notes" and paste them into a message to Dre.';
});
$('copy').addEventListener('click', async () => {
  const text = summarize({ who, notes: record.notes }, options);
  try {
    await navigator.clipboard.writeText(text);
    $('after').textContent = 'Copied. Now paste it into a message to Dre.';
  } catch { // no clipboard here: show the text, selected, to copy by hand
    Object.assign($('copy-box'), { hidden: false, value: text }).select();
    $('after').textContent = 'Copy all of the text below and paste it into a message to Dre.';
  }
});

$('notes-open').addEventListener('click', () => sheet(!document.body.classList.contains('notes-on')));
$('notes-close').addEventListener('click', () => sheet(false));
$('scrim').addEventListener('click', () => sheet(false));
narrow.addEventListener('change', () => sheet(false));

// A change that has not reached the site goes out when she leaves the tab, comes back to it, or the network returns.
// Coming back with nothing waiting, the page looks for notes she wrote on another device in the meantime.
document.addEventListener('visibilitychange', async () => {
  if (record.dirty) return sync();
  if (document.visibilityState !== 'visible' || !(await pull())) return showStatus();
  drawDots();
  drawThread();
  if (!current()) drawWrap();
  showStatus();
});
addEventListener('online', () => { if (record.dirty) sync(); });

const wanted = query.get('option');
const start = wanted === 'wrap-up' ? options.length : Math.max(0, options.findIndex((option) => String(option.n) === wanted));
go(start);
showStatus();
if (record.dirty) sync();
if (narrow.matches && !record.seen && current()) { // a phone, the first time: open the notes so she reads Dre's message
  record.seen = true;
  keep();
  sheet(true);
}
