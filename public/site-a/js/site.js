// The Global Collage — Site A "Saturn on the Mat" (option 9's orbit over option 1's cutting mat). One module, loaded on the page from the <head>:
//   <script type="module" blocking="render" src="js/site.js"></script>
// It runs before the first paint (the page is parsed by then), so the rings are in place at once.
//
// What it does: every ring on the page (orbit(), below), the planet control with its menu and the
// cart panel on top of the shop layer, the logo's colour, the scraps on the mat, the newsletter fields,
// and the shared motion kit.
//
// EXPORTS (for page scripts:  import { pieceCard, orbit, addToCart, openCart } from './site.js')
//   pieceCard(product, { sizes })   -> <article class="piece">: the link (data-piece) with the whole
//                                      piece, title, year, "Original, 1 of 1", price, and a round add
//                                      control when it can be bought; a "Sold" mark when it cannot.
//   orbit(root, options)            -> puts the children of root's .orbit__ring on a tilted ring in
//                                      perspective. See the comment above the function.
//   addToCart(product, button)      -> adds, then opens the cart; a refusal is shown in the cart.
//   openCart(from) / closePanels()  -> open the cart (focus returns to `from`) / close menu and cart.
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

if (!reduced) html.classList.add('is-live');

// ---------- the orbit ----------
// orbit(root, options): root holds one .orbit__ring whose children ride the ring. Everything is
// placed with transform; --dim (0 at the front, options.dim at the back) is left for the CSS to use.
//   measure(root) -> { cx, cy, R, B, roll, k, depth } in px inside root, or null for "no ring here"
//                    (the plain list shows). R: the ring's radius across; B: how far the front sits
//                    below the centre (the tilt); roll: radians; k: perspective, 0 flat to about .35.
//   stage      the element that takes the drag and the pointer (default root)
//   watch      extra elements whose size changes should re-measure
//   drag       true: a sideways drag spins it and it coasts to the nearest place
//   select     true: pressing something that is not at the front brings it round instead of opening it
//   rove       true: only the front one can be reached with Tab; the arrow keys turn the ring
//   lean       0..1: how much the ring leans toward the pointer
//   yaw        degrees the things turn as they go round the sides
//   anchor     'out': each thing sits just outside the line with a dot where it touches (default: centred on the line)
//   dim        0..1: --dim at the very back
//   path       true | 'split': draw the ring's line (split = far half behind, near half in front)
//   scroll     (rect, viewportHeight) -> radians added to the turn while it is on screen
//   intro      true: it sweeps into place the first time it is seen (or on play())
//   onFront    (index, element) when a different one reaches the front
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

export function orbit(root, o = {}) {
  const ringEl = $('.orbit__ring', root), items = [...ringEl.children], n = items.length, step = TAU / n;
  const stage = o.stage ?? root, lean = !reduced && fine ? o.lean ?? 0 : 0;
  const S = { angle: o.start ?? 0, target: o.start ?? 0, turn: 0, lx: 0, ly: 0, tx: 0, ty: 0, intro: o.intro && !reduced ? 0 : 1, held: !!o.intro, seen: false, geo: null, dirty: true, front: -1, drag: null, swallow: -1e9 };
  const lines = !o.path ? [] : (o.path === 'split' ? ['back', 'front'] : ['all']).map((part) => {
    const svg = document.createElementNS(SVG, 'svg'), path = document.createElementNS(SVG, 'path');
    svg.setAttribute('class', `orbit__path orbit__path--${part}`); svg.setAttribute('aria-hidden', 'true');
    svg.append(path); root.prepend(svg);
    return { svg, path, from: part === 'back' ? TAU / 4 : part === 'front' ? -TAU / 4 : 0, to: part === 'back' ? TAU * .75 : part === 'front' ? TAU / 4 : TAU };
  });
  const out = o.anchor === 'out';
  const dots = out ? items.map((item) => item.appendChild(el('i', 'orbit__dot'))) : [];
  if (out) for (const item of items) item.style.transformOrigin = '0 0';
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
      if (out) {   // the corner or edge that faces the ring's centre is pinned to the line
        const u = (.5 - .5 * X) * item._w, v = (.5 - .5 * Z) * item._h;
        item.style.transform = `translate3d(${(x - u * s).toFixed(1)}px,${(y - v * s).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        dots[i].style.transform = `translate(${u.toFixed(1)}px,${v.toFixed(1)}px)`;
      } else item.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(4)})` + (o.yaw ? ` perspective(1000px) rotateY(${(X * o.yaw).toFixed(1)}deg)` : '');
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
    if (out) for (const item of items) { item._w = item.offsetWidth; item._h = item.offsetHeight; }
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

// ---------- hero: twelve pieces on the ring around the headline ----------
const hero = $('.hero'), heroRoot = $('[data-orbit="hero"]');
if (hero && heroRoot) {
  const title = $('h1', hero), sub = $('.hero__sub', hero), actions = $('.hero__act', hero), text = $('.hero__text', hero);
  const capTitle = $('[data-cap-title]', heroRoot), capLink = $('[data-cap-link]', heroRoot);
  // where a block sits inside the hero, from layout (a client rect would include its load-in slide)
  const place = (node) => { let top = 0; for (let n = node; n && n !== hero; n = n.offsetParent) top += n.offsetTop; return { top, bottom: top + node.offsetHeight, width: node.offsetWidth, height: node.offsetHeight }; };
  // The ring is fitted to the words: its far side passes behind the headline, its near side comes
  // round below the buttons, and the front piece is as tall as the room left above the planet.
  const heroGeo = (root) => {
    const W = hero.clientWidth, H = hero.clientHeight, mid = text.offsetWidth / 2;
    const h = place(title), act = place(actions), para = place(sub);
    // what the near side must not touch (half-width from the centre, bottom edge): the subhead, the button, the link
    const boxes = [[para.width / 2, para.bottom + 10], ...[...actions.children].map((node) => [Math.max(mid - node.offsetLeft, node.offsetLeft + node.offsetWidth - mid), place(node).bottom + 14])];
    const phone = W < 700, k = .3, depth = .94, roll = phone ? .07 : .1, back = (1 - k) / (1 + k * depth);
    const R = W * (phone ? .8 : .46) / .734;   // a phone sees the near arc and the far arc; the sides are off screen, clear of the words
    const zoneTop = act.bottom + (phone ? 16 : 28), zoneBot = H - 142, yBack = h.top + h.height * .46;
    let ph = clamp(Math.min(zoneBot - zoneTop, H * .37, W * (phone ? .66 : .23)), 110, 420), yFront, B;
    for (let pass = 0; pass < 5; pass++) {   // shrink the pieces until the front one's neighbour clears the buttons
      yFront = zoneBot - ph / 2; B = (yFront - yBack) / (1 + back);
      const a = TAU / 12, Z = Math.cos(a), s = (1 - k) / (1 - k * Z * depth);
      const nx = (R * Math.sin(a) * Math.cos(roll) + B * Z * Math.sin(roll)) * s, ny = yFront - B + (-R * Math.sin(a) * Math.sin(roll) + B * Z * Math.cos(roll)) * s;
      const inner = nx - ph * s * .46, over = Math.max(0, ...boxes.filter(([halfWidth]) => inner < halfWidth + 12).map(([, bottom]) => bottom - (ny - ph * s / 2)));
      if (!over || ph <= 110) break;
      ph = Math.max(110, ph - over - 2);
    }
    root.style.setProperty('--ph', `${Math.round(ph)}px`);
    root.style.setProperty('--bar-y', `${Math.round(zoneBot + 8)}px`);
    return { cx: W / 2 + B * Math.sin(roll), cy: yFront - B, R, B, roll, k, depth };
  };
  hero.classList.add('is-turnable');
  orbit(heroRoot, {
    stage: hero, measure: heroGeo, watch: [text], drag: true, select: true, rove: true, lean: 1, yaw: 26, dim: .74, path: true,
    intro: true, introTurn: -1.9, introMs: 1900,
    scroll: (r, vh) => clamp(-r.top, 0, r.height) / vh * 1.25,
    onFront: (i, item) => {
      const a = $('a', item);
      capTitle.textContent = a.dataset.year ? `${a.dataset.title}, ${a.dataset.year}` : a.dataset.title;
      capLink.href = a.href; capLink.setAttribute('aria-label', `Open ${a.dataset.title}`);
    },
  });
}

// ---------- the other rings ----------
const names = $('[data-orbit="names"]');
if (names) orbit(names, {
  dim: .52, path: true, anchor: 'out', scroll: across(.9),
  measure: (root) => {
    const W = root.clientWidth, H = root.clientHeight;
    if (W < 720) return null;                           // a phone gets the plain list
    root.style.setProperty('--cy', `${Math.round(H * .44)}px`);
    // Narrow enough that a name at the side still lies on the paper (it may use the gutter, not the mat). At the side a name's
    // box ends at the dot and its words are centred in the box, so they reach (box + words) / 2 beyond the line; scale there: 1 - k.
    const words = document.createRange();
    const reach = Math.max(...$$('.orbit__item', root).map((item) => { words.selectNodeContents($('.bead', item)); return (item.offsetWidth + words.getBoundingClientRect().width) / 2; }));
    return { cx: W / 2, cy: H * .44, R: Math.min(W * .34, 520, (W / 2 + root.offsetLeft - 16 - reach) * .8 / .78) / .8, B: H * .31, roll: .06, k: .22, depth: .96 };
  },
});

$$('[data-orbit="moon"]').forEach((svc, i) => orbit(svc, {
  path: true, start: [.5, 2.4, 4.1][i % 3], scroll: across([1.1, -1.5, 1.9][i % 3]),
  measure: (root) => {
    const name = $('.svc__name', root), w = name.offsetWidth, h = name.offsetHeight, k = .22, depth = .96;
    return { cx: name.offsetLeft + w / 2, cy: name.offsetTop + h / 2, R: (w / 2 + Math.min(34, w * .08)) / .8, B: (h / 2 + 11) * (1 + k * depth) / (1 - k), roll: [-.035, .03, -.02][i % 3], k, depth };
  },
}));

const why = $('[data-orbit="why"]');
if (why) orbit(why, {
  path: 'split', start: -.5, scroll: across(.1),
  measure: (root) => {
    const pic = $('.why__pic', root), w = pic.offsetWidth, h = pic.offsetHeight, phone = root.clientWidth < 600;
    return { cx: pic.offsetLeft + w / 2, cy: pic.offsetTop + h / 2, R: w * (phone ? .44 : .6) / .79, B: h * (phone ? .6 : .36), roll: .1, k: .24, depth: .95 };
  },
});

// ---------- panels: the menu and the cart, worked from the planet ----------
const ctl = $('.planet'), menuBtn = $('[data-menu-toggle]'), cartBtn = $('[data-cart-toggle]'), scrim = $('.scrim');
const panels = { menu: $('#menu'), cart: $('#cart') };
const behind = $$('main, .footer, .skip, .logo');   // switched off while a panel is open
let openName = null, returnTo = null, menuRing = null;

for (const node of [ctl, scrim, ...Object.values(panels)]) if (node) node.hidden = false;
for (const panel of Object.values(panels)) if (panel) panel.inert = true;

function setPanel(name, from) {
  if (name === openName || (name && !panels[name])) return;
  if (name && !openName) returnTo = from ?? document.activeElement;
  openName = name;
  if (name !== 'cart') $('.tgc-checkout-note')?.remove(); // the checkout note belongs to the open cart: it leaves with it
  for (const [key, panel] of Object.entries(panels)) { if (panel) { panel.classList.toggle('is-open', key === name); panel.inert = key !== name; } }
  menuBtn?.setAttribute('aria-expanded', String(name === 'menu'));
  cartBtn?.setAttribute('aria-expanded', String(name === 'cart'));
  const label = menuBtn && $('[data-label]', menuBtn);
  if (label) label.textContent = name === 'menu' ? 'Close' : 'Menu';
  behind.forEach((node) => { node.inert = !!name; });
  scrim?.classList.toggle('is-on', name === 'cart');
  html.classList.toggle('is-locked', !!name);
  html.classList.toggle('cart-open', name === 'cart');
  if (ctl) ctl.dataset.state = name ?? '';
  if (name === 'menu') { menuRing?.measure(); menuRing?.play(); }
  paintChrome();
  stepAside();
  if (name) panels[name].focus({ preventScroll: true });
  else { returnTo?.focus?.({ preventScroll: true }); returnTo = null; }
}
export const openCart = (from) => setPanel('cart', from);
export const closePanels = () => setPanel(null);

menuBtn?.addEventListener('click', () => setPanel(openName === 'menu' ? null : 'menu', menuBtn));
cartBtn?.addEventListener('click', () => setPanel(openName === 'cart' ? null : 'cart', cartBtn));
$$('[data-close]').forEach((node) => node.addEventListener('click', closePanels));
addEventListener('keydown', (e) => {
  if (!openName) return;
  if (e.key === 'Escape') { e.preventDefault(); closePanels(); return; }
  if (e.key !== 'Tab') return;
  // focus stays inside the open panel (and, for the menu, the planet that closes it)
  const stops = [panels[openName], openName === 'menu' ? ctl : null].flatMap((root) => (root ? $$('a[href], button:not([disabled]), input', root) : [])).filter((node) => node.tabIndex >= 0 && node.getClientRects().length);
  if (!stops.length) { e.preventDefault(); return; }
  const first = stops[0], last = stops.at(-1), at = document.activeElement;
  if (e.shiftKey && (at === first || !stops.includes(at))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (at === last || !stops.includes(at))) { e.preventDefault(); first.focus(); }
});
addEventListener('pageshow', (e) => { if (e.persisted) closePanels(); });   // Back must not bring a page home with a panel open

const menuStage = $('[data-orbit="menu"]');
if (menuStage) {
  menuRing = orbit(menuStage, {
    drag: true, dim: .5, path: true, anchor: 'out', intro: true, introTurn: -1.1, introMs: 1500,
    measure: (root) => {
      const W = root.clientWidth, H = root.clientHeight;
      if (W < 760 || H < 560) return null;              // small screens: the plain large list
      root.style.setProperty('--cy', `${Math.round(H * .45)}px`);
      return { cx: W / 2, cy: H * .45, R: Math.min(W * .26, 400) / .79, B: Math.min(H * .23, 215), roll: .1, k: .24, depth: .95 };
    },
  });
  pointerVars(menuStage);
}

// The ground under the planet sets the colour of its focus ring; the ground under the logo sets which logo shows:
// white over the mat, black over paper and orange, none over the footer (it has its own). Later sections lie on top
// of earlier ones (the orange sheet overlaps the paper one, the card lies on the mat), so the last match wins.
const toned = $$('[data-tone]');
const toneAt = (x, y) => { let tone = 'mat'; for (const node of toned) { const r = node.getBoundingClientRect(); if (r.top <= y && r.bottom > y && r.left <= x && r.right > x) tone = node.dataset.tone; } return tone; };
function paintChrome() {
  const logo = toneAt(48, 40);
  html.dataset.logo = logo === 'ink' ? 'none' : logo === 'mat' ? 'light' : 'dark';
  html.classList.toggle('is-scrolled', scrollY > 80);
  if (ctl) ctl.dataset.on = openName === 'menu' ? 'paper' : toneAt(innerWidth / 2, innerHeight - 50);
}

// The planet steps aside: it never sits on a headline, a button, a price or a field. Whatever of those comes under its
// resting place sends it below the screen edge (the way it already leaves for the cart), and it comes back once the spot
// is clear. Never while a panel is open; keyboard focus brings it back (CSS).
// ponytail: measures every guarded thing (about 70) on scrolled frames and three times a second; cache the list if a page grows long.
const GUARDED = 'main :is(h1, h2, h3, .btn, .link, button, input, .orbit__cap a, .piece__title, .piece__price, .door__name, .door__note, .bead, .svc__name, .why__go):not(.vh), .footer :is(a, button, input)';
const textRange = document.createRange();
// where a thing really is: a button or a field is its box; a headline is its words, line by line (its block runs the full column)
function boxesOf(node) {
  if (node.matches('input, button, .btn, .why__go')) return [node.getBoundingClientRect()];
  const boxes = [], walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) { textRange.selectNodeContents(walk.currentNode); boxes.push(...textRange.getClientRects()); }
  return boxes;
}
let asideBack = 0;
function stepAside() {
  if (!ctl) return;
  const r = ctl.getBoundingClientRect(), dy = new DOMMatrixReadOnly(getComputedStyle(ctl).transform).f, gap = 8; // dy: how far aside it is right now
  const left = r.left - gap, right = r.right + 24 + gap, top = r.top - dy - gap, bottom = r.bottom - dy + gap;     // + 24: the cart moon on its right
  const hit = !openName && $$(GUARDED).some((node) => (node.checkVisibility?.({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true }) ?? true)
    && boxesOf(node).some((b) => b.width > 0 && b.right > left && b.left < right && b.bottom > top && b.top < bottom));
  if (hit) { clearTimeout(asideBack); asideBack = 0; ctl.classList.add('is-aside'); }
  else if (openName) { clearTimeout(asideBack); asideBack = 0; ctl.classList.remove('is-aside'); }
  else if (!asideBack && ctl.classList.contains('is-aside')) asideBack = setTimeout(() => { asideBack = 0; ctl.classList.remove('is-aside'); }, 350);
}
let scrollQueued = false;
const onScroll = () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; for (const ring of rings) ring.scrolled(); paintChrome(); stepAside(); }); } };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
setInterval(stepAside, 350);
paintChrome();
document.fonts?.ready.then(() => { for (const ring of rings) ring.measure(); });

// ---------- the cart, drawn from the shop layer ----------
const cartLines = $('[data-cart-lines]'), cartEmpty = $('[data-cart-empty]'), cartFoot = $('[data-cart-foot]');
const cartSubtotal = $('[data-cart-subtotal]'), cartStatus = $('[data-cart-status]'), checkout = $('[data-checkout]');
const say = (text = '', state = '') => { if (cartStatus) { cartStatus.textContent = text; cartStatus.dataset.state = state; } };
const fail = (err) => say(err?.message ?? 'Something went wrong. Please try again.', 'error');

function cartLine(line) {
  const li = el('li', 'cart__line');
  const thumb = el('a', 'cart__thumb'); thumb.href = line.url; thumb.tabIndex = -1; thumb.setAttribute('aria-hidden', 'true');
  const img = el('img'); Object.assign(img, imageAttrs(line.image, '72px')); img.alt = '';
  thumb.append(img);
  const name = el('a', 'cart__name', line.title); name.href = line.url;
  const remove = el('button', 'cart__remove', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => { remove.disabled = true; cart.remove(line.id).then(() => panels.cart?.focus({ preventScroll: true }), fail); });
  li.append(thumb, name, el('span', 'cart__price', formatPrice(line.price) ?? ''), el('span', 'cart__mark', line.type === 'original' ? 'Original, 1 of 1' : ''), remove);
  return li;
}
// the moon goes once round the planet when something lands in the cart
function lap() {
  if (reduced || !cartBtn?.animate) return;
  const frames = Array.from({ length: 25 }, (_, j) => { const t = j / 24 * TAU; return { translate: `${(37 * (Math.cos(t) - 1)).toFixed(1)}px ${(11 * Math.sin(t)).toFixed(1)}px`, scale: String(1 - .16 * Math.max(0, -Math.sin(t))), zIndex: Math.sin(t) < -.01 ? 0 : 2 }; });
  cartBtn.animate(frames, { duration: 1300, easing: 'cubic-bezier(.3,0,.2,1)' });
}
let lastCount = null;
function paintCart(c) {
  $$('[data-cart-count]').forEach((node) => { node.textContent = c.count; });
  if (lastCount !== null && c.count > lastCount) lap();
  lastCount = c.count;
  cartBtn?.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  if (!cartLines) return;
  cartLines.replaceChildren(...c.lines.map(cartLine));
  cartEmpty.hidden = c.count > 0;
  cartFoot.hidden = c.count === 0;
  cartSubtotal.textContent = formatPrice(c.subtotal) ?? '';
  if (c.count) mountSampleNote();   // the cart shows prices
}
$$('[data-cart-count]').forEach((node) => { node.textContent = cart.count(); });
cart.subscribe((c) => { say(); paintCart(c); });
cart.get().then(paintCart, () => {});
checkout?.addEventListener('click', () => { say(); cart.checkout().catch(fail); });   // sample mode: the layer shows its own notice

export function addToCart(product, button) {
  if (button) button.disabled = true;
  say();
  return cart.add(product).then(() => openCart(button), (err) => { openCart(button); fail(err); }).finally(() => { if (button) button.disabled = false; });
}

// ---------- the piece card: one card for Home and, later, the shop ----------
export function pieceCard(product, { sizes = '(min-width: 700px) 30vw, 70vw' } = {}) {
  const image = product.images[0], attrs = imageAttrs(image, sizes), sold = !product.available;
  const card = el('article', 'piece'); card.dataset.handle = product.handle;
  card.style.setProperty('--r', (attrs.width / attrs.height).toFixed(4));
  if (image.lowres) card.style.maxWidth = `${attrs.width}px`;   // never wider than the file
  const link = el('a', 'piece__link'); link.href = product.url; link.setAttribute('data-piece', '');
  const art = el('span', 'piece__art'), img = el('img');
  img.loading = 'lazy'; img.decoding = 'async'; Object.assign(img, attrs);
  if (image.avg) art.style.setProperty('--avg', image.avg);
  art.append(img);
  const price = sold ? 'Sold' : formatPrice(product.price);
  const info = el('span', 'piece__info'), meta = el('span', 'piece__meta');
  meta.append(el('span', 'piece__year', product.year ?? ''), el('span', 'piece__mark', product.badge ?? ''));
  info.append(el('span', 'piece__title', product.title), el('span', 'piece__price', price ?? ''), meta);
  link.append(art, info);
  card.append(link);
  if (sold) { card.classList.add('is-sold'); card.append(el('span', 'piece__sold', 'Sold')); }
  else {
    const add = el('button', 'piece__add'); add.type = 'button'; add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product, add));
    card.append(add);
  }
  if (price) mountSampleNote();   // this page shows a price
  return card;
}

// Home's six: the cards are in the HTML (so they show with JavaScript off); the shop layer fills
// them in, and they ride a flatter ring that can be turned.
const work = $('[data-orbit="work"]');
if (work) {
  const ring = orbit(work, {
    drag: true, select: true, rove: true, yaw: 30, dim: .62, intro: true, introTurn: -.9, introMs: 1500,
    measure: (root) => {
      const W = root.clientWidth, phone = W < 700, k = .26, B = phone ? 8 : 22;
      const ph = Math.round(Math.min(phone ? W * .9 : W * .36, innerHeight * .5, 460)), card = ph + 92;   // the art, then its slip of facts
      root.style.setProperty('--ph', `${ph}px`);
      root.style.height = `${card + B + 78}px`;                                                              // room for the turn buttons
      return { cx: W / 2, cy: card / 2 + 6, R: W * (phone ? .64 : .5), B, roll: 0, k, depth: .96 };
    },
  });
  for (const li of $$('li[data-handle]', work)) {
    getProduct(li.dataset.handle).then((product) => { if (product) { li.replaceChildren(pieceCard(product, { sizes: '(min-width: 700px) 28vw, 66vw' })); ring.sync(); } }, () => {});
  }
}

// ---------- the scraps on the mat: each one within reach of the pointer shifts a little away from it ----------
// (option 1's; the scroll drift and the slide-in are CSS: --v from the section, data-reveal, @keyframes scrap-in)
const scraps = $$('[data-scrap]').map((node) => ({ node, x: 0, y: 0 }));
if (scraps.length && !reduced && fine) {
  const REACH = 250, PUSH = 16;   // px: how near the pointer must be, and the most a scrap moves
  let frame = 0, px = 0, py = 0;
  const nudge = () => {
    frame = 0;
    for (const s of scraps) {
      const r = s.node.getBoundingClientRect();
      if (r.bottom < -REACH || r.top > innerHeight + REACH) continue;
      const dx = r.left + r.width / 2 - s.x - px, dy = r.top + r.height / 2 - s.y - py;   // from the pointer to where the scrap rests
      const d = Math.hypot(dx, dy) || 1, k = d < REACH ? ((1 - d / REACH) ** 2 * PUSH) / d : 0;
      s.x = dx * k; s.y = dy * k;
      s.node.style.setProperty('--sx', `${s.x.toFixed(1)}px`);
      s.node.style.setProperty('--sy', `${s.y.toFixed(1)}px`);
      s.node.style.setProperty('--sr', `${(s.x / 3).toFixed(2)}deg`);
    }
  };
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; frame ||= requestAnimationFrame(nudge); }, { passive: true });
}

// ---------- newsletter fields (Stay in touch, footer) ----------
$$('form[data-newsletter]').forEach((form) => wireForm(form, { kind: 'newsletter' }));

// ---------- the motion kit: words, reveals, the piece transition ----------
mountSampleNote();
{ const note = $('.tgc-sample-note'), head = $('.work__head'); if (note && head) head.append(note); } // Home: the note sits in the page, beside "The work" and its prices
init({ pointer: false });   // scroll on: sections with data-scroll get --v (the scraps' drift, the name's travel)
magnetic('.btn, .planet__menu', { strength: .2, radius: 60 });
