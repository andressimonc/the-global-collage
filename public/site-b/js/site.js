// The Global Collage — Site B, "The Work Table". One module, loaded from the <head> with blocking="render",
// so the ring and the logo's colour are in place before the first paint (the page is parsed by then).
//
// What it does: pieces arriving on the table, the hero's layers drifting apart as it leaves, scraps that shift
// away from the pointer, the logo's colour, every ring (orbit(), ported from option 9), the planet with its
// menu, the cart receipt on top of the shared shop layer, the newsletter fields, and the shared motion kit.
import { init, reduced, pointerVars, magnetic } from '../../shared/motion.js';
import { getProduct, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const TAU = Math.PI * 2, SVG = 'http://www.w3.org/2000/svg';

html.classList.add('js');

// ---------- arrivals: anything with [data-arrive] slides onto the table when it scrolls into view ----------
const arriving = $$('[data-arrive]');
if (reduced || !('IntersectionObserver' in window)) {
  arriving.forEach((node) => node.classList.add('is-in'));
} else {
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-in'); seen.unobserve(entry.target); }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  // the first screen arrives at once; the rest waits to be scrolled to
  arriving.forEach((node) => (node.getBoundingClientRect().top < innerHeight ? node.classList.add('is-in') : seen.observe(node)));
  // a jump (the End key, a link to the foot of the page) can carry a piece past the observer: once above the window, it has arrived
  addEventListener('scroll', () => {
    for (const node of arriving) if (!node.classList.contains('is-in') && node.getBoundingClientRect().top < 0) { node.classList.add('is-in'); seen.unobserve(node); }
  }, { passive: true });
}

// ---------- scraps: [data-scrap] pieces within reach of the pointer shift a little away from it ----------
const scraps = $$('[data-scrap]').map((node) => ({ node, x: 0, y: 0 }));
if (scraps.length && !reduced && fine) {
  const REACH = 250, PUSH = 16;   // px: how near the pointer must be, and the most a scrap moves
  let frame = 0, px = 0, py = 0;
  const nudge = () => {
    frame = 0;
    for (const s of scraps) {
      const r = s.node.getBoundingClientRect();
      if (r.bottom < -REACH || r.top > innerHeight + REACH) continue;
      const dx = r.left + r.width / 2 - s.x - px, dy = r.top + r.height / 2 - s.y - py;
      const d = Math.hypot(dx, dy) || 1;
      const k = d < REACH ? ((1 - d / REACH) ** 2 * PUSH) / d : 0;
      s.x = dx * k; s.y = dy * k;
      s.node.style.setProperty('--sx', `${s.x.toFixed(1)}px`);
      s.node.style.setProperty('--sy', `${s.y.toFixed(1)}px`);
      s.node.style.setProperty('--sr', `${(s.x / 3).toFixed(2)}deg`);
    }
  };
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; frame ||= requestAnimationFrame(nudge); }, { passive: true });
}

// ---------- the orbit (from option 9) ----------
// orbit(root, options): root holds one .orbit__ring whose children ride the ring. Everything is placed with
// transform; --dim (0 at the front, options.dim at the back) is left for the CSS to use.
//   measure(root) -> { cx, cy, R, B, roll, k, depth } in px inside root, or null for "no ring here" (the plain
//                    list shows). R: the ring's radius across; B: how far the front sits below the centre (the
//                    tilt); roll: radians; k: perspective, 0 flat to about .35.
//   stage   the element that takes the drag and the pointer (default root)   watch   more elements to re-measure on resize
//   drag    a sideways drag spins it and it coasts to the nearest place      select  pressing one not at the front brings it round
//   rove    only the front one can be reached with Tab; arrow keys turn it    lean    0..1 toward the pointer
//   yaw     degrees things turn round the sides    dim  --dim at the very back    path  true | 'split' (far half behind, near half in front)
//   scroll  (rect, viewportHeight) -> radians added while on screen    intro  sweeps into place when first seen (or on play())
//   onFront (index, element) when a different one reaches the front
// Returns { to(i), by(n), play(), measure(), sync(), front }.
const rings = new Set();
let raf = 0, lastT = 0;
function wake() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); } }
function loop(now) {
  const dt = clamp(now - lastT, 4, 48); lastT = now;
  let more = false;
  for (const ring of rings) if (ring.frame(dt)) more = true;
  raf = more ? requestAnimationFrame(loop) : 0;
}
const settle = (t) => 1 - (1 - t) ** 4;

function orbit(root, o = {}) {
  const ringEl = $('.orbit__ring', root), items = [...ringEl.children], n = items.length, step = TAU / n;
  const stage = o.stage ?? root, lean = !reduced && fine ? o.lean ?? 0 : 0;
  const S = { angle: o.start ?? 0, target: o.start ?? 0, turn: 0, lx: 0, ly: 0, tx: 0, ty: 0, intro: o.intro && !reduced ? 0 : 1, held: !!o.intro, seen: false, geo: null, dirty: true, front: -1, drag: null, swallow: -1e9 };
  const lines = !o.path ? [] : (o.path === 'split' ? ['back', 'front'] : ['all']).map((part) => {
    const svg = document.createElementNS(SVG, 'svg'), path = document.createElementNS(SVG, 'path');
    svg.setAttribute('class', `orbit__path orbit__path--${part}`); svg.setAttribute('aria-hidden', 'true');
    svg.append(path); root.prepend(svg);
    return { svg, path, from: part === 'back' ? TAU / 4 : part === 'front' ? -TAU / 4 : 0, to: part === 'back' ? TAU * .75 : part === 'front' ? TAU / 4 : TAU };
  });
  const scaleAt = (g, Z) => (1 - g.k) / (1 - g.k * Z * g.depth);
  const frontOf = () => (((Math.round((S.target + S.turn) / step)) % n) + n) % n;
  const reach = (item) => $$('a, button', item);

  function sync() {   // who is at the front, and who Tab can reach
    const f = frontOf(), changed = f !== S.front;
    if (changed) { items[S.front]?.classList.remove('is-front'); S.front = f; items[f].classList.add('is-front'); }
    if (o.rove) items.forEach((item, i) => reach(item).forEach((node) => { node.tabIndex = i === f ? 0 : -1; }));
    if (changed) o.onFront?.(f, items[f]);
  }

  function paint() {
    const g = S.geo, e = settle(S.intro);
    const a0 = S.angle + S.turn + (1 - e) * (o.introTurn ?? -1.4);
    const roll = g.roll + S.lx * lean * .07, B = g.B * (1 - S.ly * lean * .18), R = g.R * (1 - (1 - e) * .24);
    const cr = Math.cos(roll), sr = Math.sin(roll), fade = S.intro < 1 ? Math.min(1, S.intro * 2.4).toFixed(3) : '';
    for (let i = 0; i < n; i++) {
      const a = i * step - a0, X = Math.sin(a), Z = Math.cos(a), s = scaleAt(g, Z), item = items[i];
      const x = g.cx + (R * X * cr - B * Z * sr) * s, y = g.cy + (R * X * sr + B * Z * cr) * s;
      item.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(4)})` + (o.yaw ? ` perspective(1000px) rotateY(${(X * o.yaw).toFixed(1)}deg)` : '');
      const z = Z > 0 ? 50 + Math.round(Z * 30) : Math.round((Z + 1) * 30);   // 0-30 behind the centre, 50-80 in front of it
      if (item._z !== z) { item._z = z; item.style.zIndex = z; }
      if (o.dim) item.style.setProperty('--dim', (o.dim * ((1 - Z) / 2) ** 1.2).toFixed(3));
      if (item._fade !== fade) { item._fade = fade; item.style.opacity = fade; }
    }
    for (const { svg } of lines) {
      if (lean || o.intro) svg.style.transform = `rotate(${roll.toFixed(4)}rad) scale(${(R / g.R).toFixed(4)},${(B / g.B).toFixed(4)}) rotate(${(-g.roll).toFixed(4)}rad)`;
      if (svg._fade !== fade) { svg._fade = fade; svg.style.opacity = fade; }
    }
  }

  function frame(dt) {
    if (!S.geo) return false;
    let moving = false;
    if (S.intro < 1 && !S.held) { S.intro = Math.min(1, S.intro + dt / (o.introMs ?? 1600)); moving = true; }
    if (!S.drag?.on && S.angle !== S.target) {
      const d = S.target - S.angle;
      if (reduced || Math.abs(d) < .0006) S.angle = S.target; else S.angle += d * (1 - Math.exp(-dt / 210));
      moving = true;
    }
    if (lean && Math.abs(S.tx - S.lx) + Math.abs(S.ty - S.ly) > .002) {
      const q = 1 - Math.exp(-dt / 280);
      S.lx += (S.tx - S.lx) * q; S.ly += (S.ty - S.ly) * q; moving = true;
    }
    if (!S.seen) return false;                       // off screen: nothing is painted and the loop rests
    if (moving || S.dirty) { S.dirty = false; paint(); }
    return moving;
  }

  function measure() {
    root.classList.add('is-orbit');
    const g = S.geo = o.measure(root);
    if (!g) {
      root.classList.remove('is-orbit');
      for (const item of items) { item.style.transform = item.style.zIndex = item.style.opacity = ''; item.style.removeProperty('--dim'); item._z = item._fade = undefined; reach(item).forEach((node) => node.removeAttribute('tabindex')); }
      for (const { path } of lines) path.removeAttribute('d');
      return;
    }
    const cr = Math.cos(g.roll), sr = Math.sin(g.roll);
    for (const { svg, path, from, to } of lines) {
      let d = '';
      for (let j = 0; j <= 60; j++) {
        const a = from + (to - from) * j / 60, X = Math.sin(a), Z = Math.cos(a), s = scaleAt(g, Z);
        d += `${j ? 'L' : 'M'}${(g.cx + (g.R * X * cr - g.B * Z * sr) * s).toFixed(1)} ${(g.cy + (g.R * X * sr + g.B * Z * cr) * s).toFixed(1)}`;
      }
      path.setAttribute('d', d);
      svg.style.transformOrigin = `${g.cx.toFixed(1)}px ${g.cy.toFixed(1)}px`;
    }
    S.front = -1; items.forEach((item) => item.classList.remove('is-front'));
    sync(); scrolled(); S.dirty = false;
    paint();
  }

  function scrolled() {
    if (!S.geo || !o.scroll || reduced || !S.seen) return;
    const turn = o.scroll(stage.getBoundingClientRect(), innerHeight);
    if (Math.abs(turn - S.turn) < .0004) return;
    S.turn = turn;
    if (!turn) S.target = Math.round(S.target / step) * step;   // back at rest: square up
    S.dirty = true; sync(); wake();
  }

  const to = (i) => { const want = i * step - S.turn; S.target = want + Math.round((S.target - want) / TAU) * TAU; sync(); wake(); };
  const by = (d) => { S.target = (Math.round((S.target + S.turn) / step) + d) * step - S.turn; sync(); wake(); };
  const play = () => { S.intro = reduced ? 1 : 0; S.held = false; S.dirty = true; wake(); };

  if (o.drag) {
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !S.geo || S.drag) return;
      if (e.target.closest('a, button, input') && !ringEl.contains(e.target)) return;   // a real control outside the ring
      S.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, a: S.angle, on: false, v: 0, lx: e.clientX, lt: e.timeStamp };
    });
    stage.addEventListener('pointermove', (e) => {
      const d = S.drag; if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      if (!d.on) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return;   // a press, or a vertical swipe: that is the page's
        d.on = true; d.x = e.clientX; d.a = S.angle;
        try { stage.setPointerCapture(d.id); } catch { /* the pointer is already gone */ }
        stage.classList.add('is-turning');
      }
      const dt = Math.max(1, e.timeStamp - d.lt);
      d.v = .6 * (-(e.clientX - d.lx) / S.geo.R / dt) + .4 * d.v; d.lx = e.clientX; d.lt = e.timeStamp;
      S.angle = S.target = d.a - (e.clientX - d.x) / S.geo.R;   // the front of the ring follows the hand
      S.dirty = true; sync(); wake();
    });
    const drop = (e) => {
      const d = S.drag; if (!d || e.pointerId !== d.id) return;
      S.drag = null;
      if (!d.on) return;
      stage.classList.remove('is-turning');
      S.swallow = performance.now();
      const throwTo = S.angle + (reduced || e.timeStamp - d.lt > 90 ? 0 : clamp(d.v * 300, -2.4, 2.4));   // it coasts, then stops on a place
      S.target = Math.round((throwTo + S.turn) / step) * step - S.turn;
      sync(); wake();
    };
    stage.addEventListener('pointerup', drop);
    stage.addEventListener('pointercancel', drop);
    stage.addEventListener('click', (e) => { if (performance.now() - S.swallow < 350) { e.preventDefault(); e.stopPropagation(); } }, true);   // a drag is not a press
    ringEl.addEventListener('dragstart', (e) => e.preventDefault());
  }
  ringEl.addEventListener('click', (e) => {
    const i = items.indexOf(e.target.closest('.orbit__item'));
    if (o.select && S.geo && i >= 0 && i !== S.front) { e.preventDefault(); to(i); }
  });
  ringEl.addEventListener('focusin', (e) => {
    const i = items.indexOf(e.target.closest('.orbit__item'));
    if (S.geo && i >= 0 && i !== S.front) to(i);
  });
  root.addEventListener('keydown', (e) => {
    if (!S.geo || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.target.matches('input, textarea')) return;
    e.preventDefault();
    const inside = ringEl.contains(document.activeElement);
    by(e.key === 'ArrowRight' ? 1 : -1);
    if (inside) reach(items[S.front])[0]?.focus({ preventScroll: true });
  });
  $$('[data-turn]', root).forEach((button) => button.addEventListener('click', () => by(Number(button.dataset.turn))));
  if (lean) {
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = stage.getBoundingClientRect();
      S.tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); S.ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      wake();
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { S.tx = S.ty = 0; wake(); });
  }

  let queued = false;
  const remeasure = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; measure(); }); } };
  const api = { root, items, frame, scrolled, measure, sync, to, by, play, get front() { return S.front; } };
  rings.add(api);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(remeasure); [stage, ...(o.watch ?? [])].forEach((node) => ro.observe(node)); }
  const box = root.getBoundingClientRect();
  S.seen = box.bottom > 0 && box.top < innerHeight;   // known before the first paint; the observer keeps it true afterwards
  if (S.seen || !('IntersectionObserver' in window)) { S.seen = true; S.held = false; }
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { S.seen = entry.isIntersecting; if (S.seen) { S.held = false; S.dirty = true; scrolled(); wake(); } }, { rootMargin: '120px 0px' }).observe(root);
  measure();
  if (S.seen) wake();
  return api;
}
const across = (turns) => (r, vh) => (clamp((vh - r.top) / (vh + r.height), 0, 1) - .5) * TAU * turns;   // a turn tied to the trip across the screen

// ---------- the work: six originals on a tilted ring around "The work" ----------
// The far side passes behind the heading; the front piece stands above the caption bar; the sides reach out over
// the mat (on a phone the ring is wider than the screen, so the sides pass just off its edges).
const workRoot = $('[data-orbit="work"]');
const products = new Map();   // handle -> product, filled in by the shop layer
let workRing = null;
if (workRoot) {
  const head = $('.work-head', workRoot), bar = $('.ring-bar', workRoot);
  const capLink = $('[data-cap-link]', workRoot), capMeta = $('[data-cap-meta]', workRoot);
  const capAdd = $('[data-cap-add]', workRoot), capSold = $('[data-cap-sold]', workRoot);
  let frontItem = null;
  const caption = () => {
    if (!frontItem) return;
    const a = $('a', frontItem), product = products.get(frontItem.dataset.handle);
    capLink.textContent = a.dataset.title; capLink.href = a.getAttribute('href');
    capMeta.textContent = [a.dataset.year, 'Original, 1 of 1', product?.available ? formatPrice(product.price) : null].filter(Boolean).join(' · ');
    capAdd.hidden = !product?.available;
    capSold.hidden = !product || product.available;
    capAdd.setAttribute('aria-label', `Add ${a.dataset.title} to cart`);
  };
  workRing = orbit(workRoot, {
    drag: true, select: true, rove: true, lean: 1, yaw: 22, dim: .55, path: 'split',
    intro: true, introTurn: -1.6, introMs: 1700, scroll: across(.32),
    measure: (root) => {
      const W = root.clientWidth, H = root.clientHeight, phone = W < 700;
      const k = .3, depth = .94, roll = phone ? .05 : .08, back = (1 - k) / (1 + k * depth);
      const yBack = head.offsetTop + head.offsetHeight * .5;
      const ph = clamp(Math.min(H * .44, W * (phone ? .6 : .26)), 150, 400);
      const yFront = H - bar.offsetHeight - (phone ? 18 : 26) - ph / 2;
      const B = (yFront - yBack) / (1 + back);
      root.style.setProperty('--ph', `${Math.round(ph)}px`);
      return { cx: W / 2 + B * Math.sin(roll), cy: yFront - B, R: W * (phone ? .92 : .5), B, roll, k, depth };
    },
    onFront: (i, item) => { frontItem = item; caption(); },
  });
  capAdd.addEventListener('click', () => { const product = products.get(frontItem?.dataset.handle); if (product) addToCart(product); });
  // the shop layer knows which pieces can be bought and for how much; the ring shows it under the front piece
  Promise.all($$('[data-handle]', workRoot).map((li) => getProduct(li.dataset.handle).then((p) => { if (p) products.set(p.handle, p); }, () => {})))
    .then(() => { caption(); if ([...products.values()].some((p) => p.available)) { mountSampleNote(); const note = $('.tgc-sample-note'), slot = $('[data-note-slot]'); if (note && slot) slot.append(note); } });
}

// ---------- the planet: Menu, with the cart count riding it as its moon; the menu is a ring of pages ----------
const ctl = $('.planet'), menuBtn = $('[data-menu-toggle]'), menu = $('#menu');
const behind = $$('main, .site-footer, .skip, .logo');   // switched off while the menu is open
let menuOpen = false, returnTo = null, menuRing = null;
if (ctl) ctl.hidden = false;
if (menu) { menu.hidden = false; menu.inert = true; }

function setMenu(open) {
  if (open === menuOpen || !menu) return;
  menuOpen = open;
  if (open) returnTo = document.activeElement;
  menu.classList.toggle('is-open', open);
  menu.inert = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  $('[data-label]', menuBtn).textContent = open ? 'Close' : 'Menu';
  behind.forEach((node) => { node.inert = open; });
  html.classList.toggle('is-locked', open);
  ctl.dataset.state = open ? 'menu' : '';
  if (open) { menuRing?.measure(); menuRing?.play(); menu.focus({ preventScroll: true }); }
  else { returnTo?.focus?.({ preventScroll: true }); returnTo = null; }
  stepAside();
}
menuBtn?.addEventListener('click', () => setMenu(!menuOpen));
addEventListener('keydown', (e) => {
  if (!menuOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); setMenu(false); return; }
  if (e.key !== 'Tab') return;
  // focus stays inside the menu and the planet that closes it
  const stops = [menu, ctl].flatMap((root) => $$('a[href], button:not([disabled])', root)).filter((node) => node.tabIndex >= 0 && node.getClientRects().length);
  if (!stops.length) { e.preventDefault(); return; }
  const first = stops[0], last = stops.at(-1), at = document.activeElement;
  if (e.shiftKey && (at === first || !stops.includes(at))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (at === last || !stops.includes(at))) { e.preventDefault(); first.focus(); }
});
addEventListener('pageshow', (e) => { if (e.persisted) setMenu(false); });   // Back must not bring the page home with the menu open

const menuStage = $('[data-orbit="menu"]');
if (menuStage) {
  menuRing = orbit(menuStage, {
    drag: true, dim: .5, path: true, intro: true, introTurn: -1.1, introMs: 1500,
    measure: (root) => {
      const W = root.clientWidth, H = root.clientHeight;
      if (W < 760 || H < 560) return null;              // small screens: the plain list of strips
      root.style.setProperty('--cy', `${Math.round(H * .45)}px`);
      return { cx: W / 2, cy: H * .45, R: Math.min(W * .27, 410) / .79, B: Math.min(H * .23, 215), roll: .1, k: .24, depth: .95 };
    },
  });
  pointerVars(menuStage);
}

// The planet steps aside: it never sits on a headline, a button or a field. Whatever of those comes under its
// resting place sends it below the screen edge, and it comes back once the spot is clear. Never while the menu is
// open; keyboard focus brings it back (CSS).
// ponytail: measures every guarded thing (about 50) on scrolled frames and three times a second; cache the list if a page grows long.
const GUARDED = 'main :is(h1, h2, h3, .strip, .label, .tag, button, input, .slip, .doorway-name, .doorway-note, .proof-names li, .is-front .print):not(.visually-hidden), .site-footer :is(a, button, input)';
const textRange = document.createRange();
function boxesOf(node) {   // a button or a field is its box; a headline is its words, line by line
  if (node.matches('input, button, .label, .tag, .print')) return [node.getBoundingClientRect()];
  const boxes = [], walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) { textRange.selectNodeContents(walk.currentNode); boxes.push(...textRange.getClientRects()); }
  return boxes;
}
let asideBack = 0;
function stepAside() {
  if (!ctl) return;
  const r = ctl.getBoundingClientRect(), dy = new DOMMatrixReadOnly(getComputedStyle(ctl).transform).f, gap = 8;
  const slips = html.classList.contains('is-scrolled') ? 0 : 62;   // the two word slips show only at the top of the page
  const left = r.left - slips - gap, right = r.right + Math.max(slips, 24) + gap, top = r.top - dy - gap, bottom = r.bottom - dy + gap;   // + 24: the moon
  const hit = !menuOpen && $$(GUARDED).some((node) => (node.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true)
    && boxesOf(node).some((b) => b.width > 0 && b.right > left && b.left < right && b.bottom > top && b.top < bottom));
  if (hit) { clearTimeout(asideBack); asideBack = 0; ctl.classList.add('is-aside'); }
  else if (menuOpen) { clearTimeout(asideBack); asideBack = 0; ctl.classList.remove('is-aside'); }
  else if (!asideBack && ctl.classList.contains('is-aside')) asideBack = setTimeout(() => { asideBack = 0; ctl.classList.remove('is-aside'); }, 350);
}

// ---------- the logo's colour, and the hero coming apart as it leaves ----------
// The logo shows white over the mat and the footer's dark, black over paper and orange: whichever toned ground
// is smallest under its middle wins (a sheet over the mat, the proof strip over both).
const logo = $('.logo'), toned = $$('[data-tone]'), hero = $('.hero');
let heroOut = -1;
function paintChrome() {
  html.classList.toggle('is-scrolled', scrollY > 60);
  if (logo) {
    const r = logo.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    let tone = 'mat', area = Infinity;
    for (const node of toned) {
      const b = node.getBoundingClientRect();
      if (b.top <= y && b.bottom > y && b.left <= x && b.right > x && b.width * b.height < area) { tone = node.dataset.tone; area = b.width * b.height; }
    }
    html.dataset.logo = tone === 'ink' ? 'none' : tone === 'mat' ? 'light' : 'dark';
  }
  if (hero && !reduced) {
    const out = clamp(scrollY / hero.offsetHeight, 0, 1);
    if (Math.abs(out - heroOut) > .001 || (out === 0) !== (heroOut === 0)) { heroOut = out; hero.style.setProperty('--o', out.toFixed(4)); }
  }
}
let scrollQueued = false;
const onScroll = () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; for (const ring of rings) ring.scrolled(); paintChrome(); stepAside(); }); } };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
setInterval(stepAside, 350);
paintChrome();
document.fonts?.ready.then(() => { for (const ring of rings) ring.measure(); });

// ---------- the cart: a paper receipt from the shared shop layer, opened by the moon ----------
const receipt = $('dialog.cart');
const part = (name) => receipt?.querySelector(`[data-cart-${name}]`);
const say = (message = '') => { const status = part('status'); if (status) status.textContent = message; };
function openCart() {
  if (!receipt || receipt.open) return;
  setMenu(false);
  say(); receipt.showModal(); mountSampleNote();   // the cart shows prices: the sample note comes with it
}
function addToCart(product) {
  say();
  return cart.add(product).then(openCart, (err) => { openCart(); say(err.message); });
}
let lastCount = null;
function lap() {   // the moon goes once round the planet when something lands in the cart
  const moon = $('.planet__cart');
  if (reduced || !moon?.animate) return;
  const frames = Array.from({ length: 25 }, (_, j) => { const t = j / 24 * TAU; return { translate: `${(37 * (Math.cos(t) - 1)).toFixed(1)}px ${(11 * Math.sin(t)).toFixed(1)}px`, scale: String(1 - .16 * Math.max(0, -Math.sin(t))), zIndex: Math.sin(t) < -.01 ? 0 : 2 }; });
  moon.animate(frames, { duration: 1300, easing: 'cubic-bezier(.3,0,.2,1)' });
}
if (receipt) {
  const row = (line) => {
    const li = el('li', 'cart-line');
    if (line.image) { const img = new Image(); Object.assign(img, imageAttrs(line.image, '64px')); img.alt = ''; li.append(img); }
    const title = el('a', 'cart-line-title', line.title); title.href = line.url;
    const remove = el('button', 'cart-remove', 'Remove'); remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${line.title}`);
    remove.addEventListener('click', () => cart.remove(line.id).then(() => say(), (err) => say(err.message)));
    li.append(title, el('span', 'cart-line-price', formatPrice(line.price) ?? ''), el('span', 'cart-line-meta', line.type === 'original' ? 'Original, 1 of 1' : `Quantity ${line.quantity}`), remove);
    return li;
  };
  const paint = (now) => {
    $$('[data-cart-count]').forEach((n) => { n.textContent = now.count; });
    $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-label', `Cart, ${now.count} ${now.count === 1 ? 'item' : 'items'}`));
    if (lastCount !== null && now.count > lastCount) lap();
    lastCount = now.count;
    part('lines').replaceChildren(...now.lines.map(row));
    part('empty').hidden = now.count > 0;
    part('foot').hidden = now.count === 0;
    part('subtotal').textContent = formatPrice(now.subtotal) ?? '';
  };
  $$('[data-cart-count]').forEach((n) => { n.textContent = cart.count(); });
  cart.subscribe(paint);
  cart.get().then(paint, () => {});
  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
  part('close').addEventListener('click', () => receipt.close());
  receipt.addEventListener('click', (e) => { if (e.target === receipt) receipt.close(); });   // a click on the dimmed table
  // sample mode: the shop layer writes its own notice inside this receipt, so it stays open
  part('checkout').addEventListener('click', () => { say(); cart.checkout().catch((err) => say(err.message)); });
}

// ---------- newsletter fields (the shared forms layer; in preview it sends nothing) ----------
$$('form[data-form="newsletter"]').forEach((form) => wireForm(form, { kind: 'newsletter' }));

// ---------- the motion kit: per-section scroll values (--v), the piece transition, a planet that pulls ----------
init({ words: false, reveal: false, pointer: false });
magnetic('.planet__menu', { strength: .2, radius: 60 });
