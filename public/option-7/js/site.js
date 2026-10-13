// The Global Collage — Option 7 "The Cover". One module, loaded on every page from the <head>:
//   <script type="module" blocking="render" src="js/site.js"></script>
// It runs before the first paint (the page is parsed by then), so nothing flashes.
//
// What it does: the spine (current cover's name, one tick per cover, Menu, Cart), the contents page
// and the cart that slide out of the spine, the cart on top of the shop layer, the newsletter
// fields, the rack of featured pieces (drag, arrows, keys), the cover stack (each cover holds while
// the next slides up over it; mastheads travel sideways with the scroll; figures land a beat
// later), and the shared motion kit. With reduced motion the page is a plain scroll.
//
// EXPORTS (for page scripts:  import { pieceCard, addToCart, openCart } from './site.js')
//   pieceCard(product, { sizes, ground })  -> <article class="issue">: the piece as a small cover. A link
//                                    (data-piece) to its page with the title, the whole piece
//                                    uncropped, year, "Original, 1 of 1" and the price; an
//                                    "Add to cart" button when it can be bought, "Sold" when not.
//                                    ground: the cover colour (default: the picture's average).
//   addToCart(product, button)     -> adds, then opens the cart; a refusal is shown in the cart.
//   openCart(from) / closePanels() -> open the cart (focus returns to `from`) / close cart and menu.
import { init, reduced } from '../../shared/motion.js';
import { getProduct, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const INK = '#231F20', PAPER = '#EFEDEA', EASE = 'cubic-bezier(.16,1,.3,1)';

if (!reduced) html.classList.add('is-live');

// ---------- panels: the contents page and the cart, both worked from the spine ----------
const spine = $('.spine'), scrim = $('.scrim');
const panels = { menu: $('#menu'), cart: $('#cart') };
const toggles = { menu: $('[data-menu-toggle]'), cart: $('[data-cart-toggle]') };
const labels = { menu: 'Menu', cart: 'Cart' };
const behind = $$('main, .back, .skip'); // switched off while a panel is open
let openName = null, returnTo = null;
for (const panel of Object.values(panels)) { panel.hidden = false; panel.inert = true; }

function setPanel(name, from) {
  if (name === openName) return;
  if (name && !openName) returnTo = from ?? document.activeElement;
  openName = name;
  if (name !== 'cart') $('.tgc-checkout-note')?.remove(); // the checkout note belongs to the open cart: it leaves with it
  for (const [key, panel] of Object.entries(panels)) {
    const on = key === name;
    panel.classList.toggle('is-open', on);
    panel.inert = !on;
    toggles[key].setAttribute('aria-expanded', String(on));
    toggles[key].classList.toggle('is-open', on);
    $('[data-label]', toggles[key]).textContent = on ? 'Close' : labels[key];
  }
  behind.forEach((node) => { node.inert = !!name; });
  scrim.classList.toggle('is-on', name === 'cart');
  html.classList.toggle('is-locked', !!name);
  if (name) panels[name].focus({ preventScroll: true });
  else { returnTo?.focus?.({ preventScroll: true }); returnTo = null; }
}
export const openCart = (from) => setPanel('cart', from);
export const closePanels = () => setPanel(null);

for (const key of ['menu', 'cart']) toggles[key].addEventListener('click', () => setPanel(openName === key ? null : key, toggles[key]));
$$('[data-close]').forEach((node) => node.addEventListener('click', closePanels));
addEventListener('keydown', (e) => {
  if (!openName) return;
  if (e.key === 'Escape') { e.preventDefault(); closePanels(); return; }
  if (e.key !== 'Tab') return;
  // focus stays inside the open panel and the spine
  const stops = [panels[openName], spine].flatMap((root) => $$('a[href], button:not([disabled]), input', root)).filter((n) => n.getClientRects().length);
  const first = stops[0], last = stops.at(-1), at = document.activeElement;
  if (e.shiftKey && (at === first || !stops.includes(at))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (at === last || !stops.includes(at))) { e.preventDefault(); first.focus(); }
});
addEventListener('pageshow', (e) => { if (e.persisted) closePanels(); }); // Back never returns to an open panel

// contents page: the cover of the line under the pointer (or the focused line) slides in beside it
const minis = $$('.mini');
let shownMini = null;
function showMini(key) {
  const next = minis.find((m) => m.dataset.cover === key);
  if (!next || next === shownMini) return;
  minis.forEach((m) => { m.classList.toggle('was-on', m === shownMini); m.classList.toggle('is-on', m === next); });
  shownMini = next;
}
$$('.menu__row').forEach((row) => ['pointerenter', 'focus'].forEach((type) => row.addEventListener(type, () => showMini(row.dataset.cover))));
showMini($('.menu__row[aria-current]')?.dataset.cover ?? minis[0]?.dataset.cover);

// ---------- the cart, drawn from the shop layer ----------
const cartLines = $('[data-cart-lines]'), cartEmpty = $('[data-cart-empty]'), cartFoot = $('[data-cart-foot]');
const cartSubtotal = $('[data-cart-subtotal]'), cartStatus = $('[data-cart-status]');
const say = (text = '', state = '') => { cartStatus.textContent = text; cartStatus.dataset.state = state; };
const fail = (err) => say(err?.message ?? 'Something went wrong. Please try again.', 'error');

function cartLine(line) {
  const li = el('li', 'cart__line');
  const thumb = el('a', 'cart__thumb'); thumb.href = line.url; thumb.tabIndex = -1; thumb.setAttribute('aria-hidden', 'true');
  const img = el('img'); Object.assign(img, imageAttrs(line.image, '60px')); img.alt = '';
  thumb.append(img);
  const name = el('a', 'cart__name', line.title); name.href = line.url;
  const remove = el('button', 'cart__remove', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => { remove.disabled = true; cart.remove(line.id).then(() => panels.cart.focus({ preventScroll: true }), fail); });
  li.append(thumb, name, el('span', 'cart__price', formatPrice(line.price) ?? ''), el('span', 'cart__mark', line.type === 'original' ? 'Original, 1 of 1' : ''), remove);
  return li;
}
let lastCount = null;
function paintCart(c) {
  for (const badge of $$('[data-cart-count]')) {
    badge.textContent = c.count;
    if (lastCount !== null && c.count > lastCount) { badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump'); }
  }
  lastCount = c.count;
  toggles.cart.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  cartLines.replaceChildren(...c.lines.map(cartLine));
  cartEmpty.hidden = c.count > 0;
  cartFoot.hidden = c.count === 0;
  cartSubtotal.textContent = formatPrice(c.subtotal) ?? '';
}
$$('[data-cart-count]').forEach((badge) => { badge.textContent = cart.count(); });
cart.subscribe((c) => { say(); paintCart(c); });
cart.get().then(paintCart, () => {});
$('[data-checkout]').addEventListener('click', () => { say(); cart.checkout().catch(fail); }); // sample mode: the layer shows its own notice

export function addToCart(product, button) {
  if (button) button.disabled = true;
  say();
  return cart.add(product).then(() => openCart(button), (err) => { openCart(button); fail(err); }).finally(() => { if (button) button.disabled = false; });
}

// ---------- the piece as a small cover ----------
// Words on a cover colour must read: ink or paper, whichever is clearer; a colour that suits neither
// is lightened until ink does. ponytail: a plain mix toward white, a palette per piece if Camila wants exact colours.
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)); return .2126 * r + .7152 * g + .0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05); };
const lighten = (hex) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * .8 + 51).toString(16).padStart(2, '0')).join('');
function coverColours(hex) {
  let ground = /^#[0-9a-f]{6}$/i.test(hex ?? '') ? hex : PAPER;
  for (let n = 0; n < 8 && contrast(ground, INK) < 4.5 && contrast(ground, PAPER) < 4.5; n++) ground = lighten(ground);
  return [ground, contrast(ground, PAPER) >= 4.5 && contrast(ground, PAPER) > contrast(ground, INK) ? PAPER : INK];
}
console.assert(coverColours('#660E3D')[1] === PAPER && coverColours('#91785F')[1] === INK && contrast(...coverColours('#91785F')) >= 4.5, 'coverColours');

export function pieceCard(product, { sizes = '(min-width: 700px) 340px, 76vw', ground } = {}) {
  const image = product.images[0], attrs = imageAttrs(image, sizes);
  const [bg, on] = coverColours(ground || image.avg);
  const card = el('article', 'issue'); card.dataset.handle = product.handle;
  card.style.setProperty('--ground', bg); card.style.setProperty('--on', on);
  const link = el('a', 'issue__link'); link.href = product.url; link.setAttribute('data-piece', '');
  const art = el('span', 'issue__art'), img = el('img');
  img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false;
  Object.assign(img, attrs);
  art.style.setProperty('--r', (attrs.width / attrs.height).toFixed(4));
  if (image.lowres) img.style.maxWidth = `${attrs.width}px`; // never wider than the file
  art.append(img);
  const meta = el('span', 'issue__meta');
  if (product.year) meta.append(el('span', 'issue__year', product.year));
  if (product.badge) meta.append(el('span', 'issue__mark', product.badge));
  const price = product.available ? formatPrice(product.price) : 'Sold';
  link.append(el('span', 'issue__title', product.title), art, meta, el('span', 'issue__price', price ?? ''));
  card.append(link);
  if (product.available) {
    const add = el('button', 'issue__add', 'Add to cart'); add.type = 'button'; add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product, add));
    card.append(add);
  } else card.classList.add('is-sold');
  if (price) mountSampleNote(); // this page shows a price
  return card;
}

// Home's featured pieces are in the HTML (so they show with JavaScript off); the shop layer fills them in.
const featured = $$('[data-featured] li[data-handle]').map((li) =>
  getProduct(li.dataset.handle).then((product) => { if (product) li.replaceChildren(pieceCard(product, { ground: li.style.getPropertyValue('--ground').trim() })); }, () => {}));

// ---------- the rack: a row you drag (mouse), swipe (touch: the browser's own scroll), or step with arrows ----------
for (const rack of $$('[data-rack]')) {
  const track = $('.rack__track', rack), prev = $('[data-rack-prev]', rack), next = $('[data-rack-next]', rack), count = $('.rack__count', rack);
  const step = () => { const [a, b] = track.children; return b ? b.offsetLeft - a.offsetLeft : track.clientWidth; };
  const slide = (left) => track.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  const paintRack = () => {
    const max = track.scrollWidth - track.clientWidth, n = track.children.length;
    rack.style.setProperty('--seen', clamp((track.scrollLeft + track.clientWidth) / track.scrollWidth, 0, 1).toFixed(3));
    prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= max - 2;
    const at = next.disabled ? n : clamp(Math.round(track.scrollLeft / step()) + 1, 1, n);
    count.textContent = `${String(at).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
  };
  let queuedRack = false;
  track.addEventListener('scroll', () => { if (!queuedRack) { queuedRack = true; requestAnimationFrame(() => { queuedRack = false; paintRack(); }); } }, { passive: true });
  prev.addEventListener('click', () => slide((Math.ceil(track.scrollLeft / step() - .05) - 1) * step()));
  next.addEventListener('click', () => slide((Math.floor(track.scrollLeft / step() + .05) + 1) * step()));
  new ResizeObserver(paintRack).observe(track);
  // mouse only: a press that moves drags the row and lets go with a short glide onto the nearest piece.
  // The wheel and a vertical swipe are never touched, so the page always scrolls.
  let drag = null, dragged = false;
  track.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) { drag = { x: e.clientX, left: track.scrollLeft, last: e.clientX, t: e.timeStamp, v: 0 }; dragged = false; } });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) < 6) return;
    if (!dragged) { dragged = true; track.classList.add('is-dragging'); }
    drag.v = (e.clientX - drag.last) / Math.max(1, e.timeStamp - drag.t); drag.last = e.clientX; drag.t = e.timeStamp;
    track.scrollLeft = drag.left - dx;
  });
  const drop = () => {
    if (!drag) return;
    const v = drag.v; drag = null;
    if (!dragged) return;
    track.classList.remove('is-dragging');
    slide(Math.round((track.scrollLeft - clamp(v, -2.5, 2.5) * 260) / step()) * step());
  };
  addEventListener('pointerup', drop); addEventListener('pointercancel', drop);
  track.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true); // the click that ends a drag opens nothing
  track.addEventListener('dragstart', (e) => e.preventDefault());
}

// ---------- newsletter fields (Stay in touch, back cover) ----------
$$('form[data-newsletter]').forEach((form) => wireForm(form, { kind: 'newsletter' }));

// ---------- the cover stack and the spine ----------
const main = $('main'), covers = $$('.cover'), sections = [...covers, $('.back')];
const nameEl = $('[data-spine-name]'), ticks = $('.spine__ticks');
let starts = [], current = -1;

// each masthead spans its cover exactly, whatever the word and whichever typeface loaded
function fit() {
  const ems = covers.map((cover) => {
    const mast = $('.masthead', cover); if (!mast) return 0;
    const range = document.createRange(); range.selectNodeContents(mast);
    return range.getBoundingClientRect().width / parseFloat(getComputedStyle(mast).fontSize);
  });
  covers.forEach((cover, i) => { if (ems[i] > 0) $('.cover__in', cover).style.setProperty('--em', (ems[i] * 1.004).toFixed(3)); });
}
// where each cover starts on the page (a cover that is holding reports where it is held, not where it lives)
function measure() {
  let y = main.getBoundingClientRect().top + scrollY;
  starts = covers.map((cover) => { const at = y, h = cover.offsetHeight; cover.style.setProperty('--h', `${h}px`); y += h; return at; });
  starts.push(y);
  settle();
}
// A cover that is holding cannot be scrolled to the middle of the screen, so "bring this into view"
// (a keyboard, a script, find-in-page) would overshoot and pull the next cover over the very thing
// it wanted. Everything inside a cover therefore carries a scroll margin that makes its "centred"
// position the cover's own resting position.
const offsetIn = (node, root) => { let y = 0; while (node && node !== root) { y += node.offsetTop; node = node.offsetParent; } return y; };
function settle() {
  const vh = innerHeight, jobs = [];
  for (const cover of covers) {
    const held = getComputedStyle(cover).position === 'sticky', travel = Math.max(0, cover.offsetHeight - vh);
    for (const node of $$('*', cover)) {
      if (!node.offsetHeight) continue;
      const centre = offsetIn(node, cover) + node.offsetHeight / 2;
      const off = held ? vh / 2 - (centre - clamp(centre - vh / 2, 0, travel)) : 0; // how far above the middle of the screen it rests
      jobs.push([node, Math.max(0, -2 * off), Math.max(0, 2 * off)]);
    }
  }
  for (const [node, top, bottom] of jobs) { node.style.scrollMarginTop = `${top.toFixed(0)}px`; node.style.scrollMarginBottom = `${bottom.toFixed(0)}px`; }
}
const sent = new WeakMap(); // the last value written per cover, so a still cover is never restyled
const setVar = (node, name, value) => { const v = value.toFixed(3), was = sent.get(node) ?? sent.set(node, {}).get(node); if (was[name] !== v) { was[name] = v; node.style.setProperty(`--${name}`, v); } };
function paint() {
  const vh = innerHeight, tops = sections.map((s) => s.getBoundingClientRect().top);
  let now = 0;
  sections.forEach((s, i) => {
    if (tops[i] <= vh * .55) now = i;
    if (i >= covers.length) return;
    const enter = clamp((vh - tops[i]) / vh, 0, 1);
    setVar(s, 'enter', enter);                                                       // 0 below the screen, 1 once it has slid all the way up
    setVar(s, 'under', i + 1 < covers.length ? clamp(1 - tops[i + 1] / vh, 0, 1) : 0); // how far the next cover has come over it
    if (enter > .3) s.classList.add('is-on'); else if (enter < .05) s.classList.remove('is-on');
  });
  if (innerHeight + scrollY >= html.scrollHeight - 2) now = sections.length - 1;
  if (now === current) return;
  sections.forEach((s, i) => s.classList.toggle('is-current', i === now));
  [...ticks.children].forEach((li, i) => li.firstElementChild.setAttribute('aria-current', String(i === now)));
  nameEl.textContent = sections[now].dataset.name ?? '';
  if (!reduced && current >= 0) nameEl.animate([{ opacity: 0, transform: `translateY(${now > current ? 12 : -12}px)` }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
  current = now;
}
const goTo = (i) => scrollTo({ top: starts[i], behavior: reduced ? 'auto' : 'smooth' });
sections.forEach((s, i) => {
  const li = el('li'), tick = el('button'); tick.type = 'button'; tick.setAttribute('aria-label', s.dataset.name ?? ''); tick.dataset.goto = s.id;
  tick.addEventListener('click', () => goTo(i));
  li.append(tick); ticks.append(li);
});
// keyboard: a link inside a cover that is lying under the next one is brought back into view
main.addEventListener('focusin', (e) => {
  const i = covers.findIndex((cover) => cover.contains(e.target));
  if (i < 0 || getComputedStyle(covers[i]).position !== 'sticky') return;
  const c = covers[i].getBoundingClientRect(), t = e.target.getBoundingClientRect(), nextTop = covers[i + 1]?.getBoundingClientRect().top ?? Infinity;
  if (t.top >= 0 && t.bottom <= Math.min(nextTop, innerHeight)) return;
  scrollTo({ top: clamp(starts[i] + (t.top - c.top) - innerHeight / 2, starts[i], Math.max(starts[i], starts[i + 1] - innerHeight)), behavior: 'instant' });
});

let queued = false;
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; paint(); }); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue, { passive: true });
if ('ResizeObserver' in window) { const sized = new ResizeObserver(() => { measure(); queue(); }); covers.forEach((cover) => sized.observe(cover)); }
matchMedia('(max-width: 699px)').addEventListener('change', fit);
document.fonts?.load('900 1em Neco').then(() => { fit(); measure(); queue(); }, () => {});
measure();
paint();
Promise.all(featured).then(measure); // the cards the shop layer drew need their scroll margins too

// ---------- the note about sample prices, and the motion kit (words, reveals, pointer, the piece transition) ----------
mountSampleNote();
{ const note = $('.tgc-sample-note'); if (note) $('#the-work .cover__in')?.append(note); } // Home: the note sits in the Work cover, beside the prices (see css 15)
init({ scroll: false });
