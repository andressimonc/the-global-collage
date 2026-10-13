// The Global Collage — Option 4 "The Poster". One module, loaded on every page from the <head>:
//   <script type="module" blocking="render" src="js/site.js"></script>
// It runs before the first paint (the page is parsed by then), so nothing flashes.
//
// What it does on every page: the dock (Menu / Shop / Cart), the menu sheet, the cart sheet on top of
// the shop layer, the footer newsletter, the poster stack (each section holds while the next rises
// over it), the logo and dock colours, the names marquee, and the shared motion kit.
//
// EXPORTS (for page scripts:  import { pieceCard, renderPieces, addToCart, openCart } from './site.js')
//   pieceCard(product, { sizes })        -> <article class="piece">: the link (data-piece) with the whole
//                                           piece, title, year, "Original, 1 of 1", price, and a round
//                                           add control when it can be bought, a "Sold" mark when not.
//   renderPieces(list, products, { sizes }) -> fills a <ul class="pieces"> with <li data-reveal> cards
//                                           and arms their entrance. Returns the list.
//   addToCart(product, button)           -> adds, then opens the cart; a refusal is shown in the cart.
//   openCart(from) / closeSheets()       -> open the cart sheet (focus returns to `from`) / close all.
import { init, reduced, reveal, magnetic } from '../../shared/motion.js';
import { getProduct, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

if (!reduced) html.classList.add('is-live');
// arriving by a page transition: the dock and logo are already there, so they do not play their load-in
addEventListener('pagereveal', (e) => { if (e.viewTransition) html.classList.add('via-vt'); });

// ---------- sheets: menu and cart, both worked from the dock ----------
const dock = $('.dock'), scrim = $('.scrim');
const sheets = { menu: $('#menu'), cart: $('#cart') };
const toggles = { menu: $('[data-menu-toggle]'), cart: $('[data-cart-toggle]') };
const names = { menu: 'Menu', cart: 'Cart' };
const behind = $$('main, .footer, .logo, .skip'); // switched off while a sheet is open
let openName = null, returnTo = null;

for (const sheet of Object.values(sheets)) { if (sheet) { sheet.hidden = false; sheet.inert = true; } }

function setSheet(name, from) {
  if (name === openName) return;
  if (name && !sheets[name]) return;
  if (name && !openName) returnTo = from ?? document.activeElement;
  openName = name;
  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet) continue;
    const on = key === name;
    sheet.classList.toggle('is-open', on);
    sheet.inert = !on;
    toggles[key]?.setAttribute('aria-expanded', String(on));
    const label = toggles[key]?.querySelector('[data-label]');
    if (label) label.textContent = on ? 'Close' : names[key];
  }
  behind.forEach((node) => { node.inert = !!name; });
  scrim?.classList.toggle('is-on', name === 'cart');
  html.classList.toggle('is-locked', !!name);
  html.classList.toggle('menu-open', name === 'menu');
  paintChrome();
  if (name) sheets[name].focus({ preventScroll: true });
  else { returnTo?.focus?.({ preventScroll: true }); returnTo = null; }
}
export const openCart = (from) => setSheet('cart', from);
export const closeSheets = () => setSheet(null);

toggles.menu?.addEventListener('click', () => setSheet(openName === 'menu' ? null : 'menu', toggles.menu));
toggles.cart?.addEventListener('click', () => setSheet(openName === 'cart' ? null : 'cart', toggles.cart));
$$('[data-close]').forEach((node) => node.addEventListener('click', closeSheets));
addEventListener('keydown', (e) => {
  if (!openName) return;
  if (e.key === 'Escape') { e.preventDefault(); closeSheets(); return; }
  if (e.key !== 'Tab') return;
  // focus stays inside the open sheet and the dock
  const stops = [sheets[openName], dock].flatMap((root) => $$('a[href], button:not([disabled]), input, select, textarea', root)).filter((n) => n.getClientRects().length);
  if (!stops.length) return;
  const first = stops[0], last = stops.at(-1), at = document.activeElement;
  if (e.shiftKey && (at === first || !stops.includes(at))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (at === last || !stops.includes(at))) { e.preventDefault(); first.focus(); }
});
// a page restored by the Back button must not come back with a sheet open
addEventListener('pageshow', (e) => { if (e.persisted) closeSheets(); });

// menu: the picture that belongs to the row under the pointer (or the focused row) slides in
const pics = $$('.menu__pics img');
const showPic = (key) => pics.forEach((img) => img.classList.toggle('is-on', img.dataset.pic === key));
const rows = $$('.menu__row[data-pic]');
const homePic = rows.find((row) => row.matches('[aria-current]'))?.dataset.pic ?? rows[0]?.dataset.pic;
rows.forEach((row) => { for (const type of ['pointerenter', 'focus']) row.addEventListener(type, () => showPic(row.dataset.pic)); });
$('.menu__list')?.addEventListener('pointerleave', () => showPic(homePic));
showPic(homePic);

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
  remove.addEventListener('click', () => { remove.disabled = true; cart.remove(line.id).then(() => sheets.cart?.focus({ preventScroll: true }), fail); });
  li.append(thumb, name, el('span', 'cart__price', formatPrice(line.price) ?? ''), el('span', 'cart__mark label', line.type === 'original' ? 'Original, 1 of 1' : ''), remove);
  return li;
}
let lastCount = null;
function paintCart(c) {
  for (const badge of $$('[data-cart-count]')) {
    badge.textContent = c.count;
    if (lastCount !== null && c.count > lastCount && !reduced) { badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump'); }
  }
  lastCount = c.count;
  toggles.cart?.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  if (!cartLines) return;
  cartLines.replaceChildren(...c.lines.map(cartLine));
  cartEmpty.hidden = c.count > 0;
  cartFoot.hidden = c.count === 0;
  cartSubtotal.textContent = formatPrice(c.subtotal) ?? '';
  if (c.count) mountSampleNote(); // the cart shows prices
}
$$('[data-cart-count]').forEach((badge) => { badge.textContent = cart.count(); });
cart.subscribe((c) => { say(); paintCart(c); });
cart.get().then(paintCart, () => {});
checkout?.addEventListener('click', () => { say(); cart.checkout().catch(fail); }); // sample mode: the layer shows its own notice

export function addToCart(product, button) {
  if (button) button.disabled = true;
  say();
  return cart.add(product).then(() => openCart(button), (err) => { openCart(button); fail(err); }).finally(() => { if (button) button.disabled = false; });
}

// ---------- the piece card: one card for Home and the shop ----------
export function pieceCard(product, { sizes = '(min-width: 820px) 40vw, 92vw' } = {}) {
  const image = product.images[0], attrs = imageAttrs(image, sizes);
  const card = el('article', 'piece'); card.dataset.handle = product.handle;
  const link = el('a', 'piece__link'); link.href = product.url; link.setAttribute('data-piece', '');
  const art = el('span', 'piece__art'), img = el('img');
  img.loading = 'lazy'; img.decoding = 'async';
  Object.assign(img, attrs);
  if (image.avg) img.style.setProperty('--avg', image.avg);
  if (image.lowres) img.style.maxWidth = `${attrs.width}px`; // never wider than the file
  art.append(img);
  const price = product.available ? formatPrice(product.price) : 'Sold';
  const info = el('span', 'piece__info');
  info.append(el('span', 'piece__title', product.title), el('span', 'piece__year', product.year ?? ''), el('span', 'piece__mark', product.badge ?? ''), el('span', 'piece__price', price ?? ''));
  link.append(art, info);
  card.append(link);
  if (product.available) {
    const add = el('button', 'piece__add'); add.type = 'button'; add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product, add));
    card.append(add);
  } else {
    card.classList.add('is-sold');
    card.append(el('span', 'piece__sold', 'Sold'));
  }
  if (price) mountSampleNote(); // this page shows a price
  return card;
}

export function renderPieces(list, products, options) {
  const brk = (kind) => { const li = el('li', `brk brk--${kind}`); li.setAttribute('aria-hidden', 'true'); return li; };
  const kids = [];
  products.forEach((product, i) => {
    const li = el('li'), image = product.images[0], attrs = imageAttrs(image), n = i + 1;
    li.setAttribute('data-reveal', '');
    li.style.setProperty('--r', (attrs.width / attrs.height).toFixed(3));
    if (image.lowres) li.style.maxWidth = `${attrs.width}px`;
    li.append(pieceCard(product, options));
    kids.push(li);
    if (n % 6 === 2 || n % 6 === 0) kids.push(brk('wide'));   // wide screens: rows of 2, then 4
    if (n % 3 !== 2) kids.push(brk('narrow'));                // phones: rows of 1, then 2
  });
  list.replaceChildren(...kids);
  reveal(list);
  return list;
}

// Home's featured pieces are in the HTML (so they show with JavaScript off); the shop layer fills them in.
for (const list of $$('[data-featured]')) {
  for (const li of $$('li[data-handle]', list)) {
    getProduct(li.dataset.handle).then((product) => { if (product) li.replaceChildren(pieceCard(product, { sizes: li.dataset.sizes || list.dataset.sizes || undefined })); }, () => {});
  }
}

// ---------- newsletter fields (footer on every page, Home's "Stay in touch") ----------
$$('form[data-newsletter]').forEach((form) => wireForm(form, { kind: 'newsletter' }));

// ---------- the poster stack, and the logo's colour ----------
const posters = reduced ? [] : $$('.stack > .poster');
if (posters.length && 'ResizeObserver' in window) {
  const sized = new ResizeObserver((entries) => { for (const e of entries) e.target.style.setProperty('--h', `${e.target.offsetHeight}px`); });
  posters.forEach((p) => { p.style.setProperty('--h', `${p.offsetHeight}px`); sized.observe(p); });
}
const held = new Set(posters.filter((p) => getComputedStyle(p).position === 'sticky'));
const toned = $$('[data-tone]');
const dark = (tone) => tone === 'cobalt' || tone === 'ink';
function paintChrome() {
  const vh = innerHeight;
  html.classList.toggle('is-scrolled', scrollY > 60);
  // the ground under the logo and under the dock: later posters lie on top of earlier ones
  let top = 'paper';
  for (const node of toned) {
    const r = node.getBoundingClientRect();
    if (r.top <= 44 && r.bottom > 44) top = node.dataset.tone;
  }
  html.dataset.logo = top === 'footer' ? 'none' : dark(top) ? 'light' : 'dark';
  // anything a jump (a link, the End key) carried past without showing it is simply shown
  for (const node of $$('[data-armed]:not(.is-in)')) if (node.getBoundingClientRect().bottom < 0) node.classList.add('is-in');
  // how far the next poster has risen over each one that holds
  posters.forEach((p, i) => {
    const next = posters[i + 1];
    if (!next || !held.has(p)) return;
    const shown = Math.min(vh / 2, p.offsetHeight); // what is left of it on screen when it starts to hold
    const cover = clamp((shown - next.getBoundingClientRect().top) / shown, 0, 1).toFixed(3);
    if (p.dataset.cover !== cover) { p.dataset.cover = cover; p.style.setProperty('--cover', cover); }
  });
}
let queued = false;
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; paintChrome(); }); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue, { passive: true });
paintChrome();

// ---------- the names marquee: runs only while it is on screen, stops under the pointer ----------
if (!reduced && 'IntersectionObserver' in window) {
  const seen = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-inview', e.isIntersecting)));
  for (const marquee of $$('[data-marquee]')) {
    const copy = marquee.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    marquee.append(copy);
    marquee.classList.add('is-running');
    seen.observe(marquee);
  }
}

// ---------- the motion kit: words, reveals, scroll and pointer values, the piece transition ----------
init();
magnetic('.dock__btn, [data-pull]', { strength: 0.22, radius: 70 });
