// The Global Collage — Option 5 "The Archive". One module, loaded at the end of every page:
//   <script type="module" src="js/site.js"></script>
// (The motion kit's init() runs from the <head>; see template.html.)
//
// WHAT IT DOES, from the markup it finds:
//   [data-menu-open] / [data-menu-close]   open and close <dialog id="menu"> (native modal: focus is trapped,
//                                          Escape closes, focus goes back to the control that opened it)
//   [data-cart-open] / [data-cart-close]   the same for <dialog id="cart">; it also draws the cart from the
//                                          shop layer: lines, remove, subtotal, checkout, and every [data-cart-count]
//   [data-add="<handle>"]                  a card's quick add (made by pieceCard): adds, then opens the cart
//   [data-featured]                        a list of static .piece cards (Home): filled from the shop layer in place
//   form[data-newsletter]                  wireForm(form, { kind: 'newsletter' })
//   <body data-prices>                     mountSampleNote() (every page that shows a price)
//   [data-table] .obj                      every object can be picked up and moved
//   [data-pull]                            leans toward the pointer (the kit's magnetic)
//
// EXPORTS (for the page scripts of shop.html and product.html)
//   pieceCard(product, { sizes, from } = {})  -> the finished card, an <article class="piece">: a link with
//                                          data-piece to product.html?handle=…, the whole piece uncropped, title,
//                                          year, "Original, 1 of 1", the price, or "Sold" and no button.
//                                          from: an existing static card to fill instead of making a new one.
//   layPieces(container, products, { sizes } = {})  -> the cards. Replaces the container's children and arms
//                                          their scroll reveal. An empty list leaves the container empty.
//   addToCart(product, noteEl)             -> Promise. Adds, opens the cart; a refusal is written into noteEl.
//   openCart()                             opens the cart sheet.
import { reveal, draggable, magnetic } from '../../shared/motion.js';
import { getProducts, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };

const menu = $('#menu'), sheet = $('#cart');
const show = (dialog) => { if (dialog && !dialog.open) dialog.showModal(); };

// ---------- the piece card ----------
const SIZES = '(min-width: 1280px) 30vw, (min-width: 820px) 34vw, (min-width: 640px) 46vw, 74vw';
const known = new Map(); // handle -> product, for the quick add
let lastCart = null;

export function pieceCard(product, { sizes = SIZES, from = null } = {}) {
  known.set(product.handle, product);
  const card = from ?? el('article', 'piece');
  card.dataset.handle = product.handle;
  let link = $('.piece__link', card);
  if (!link) { // a static card already has its picture: keep that exact <img>, so nothing reloads or jumps
    link = el('a', 'piece__link'); link.dataset.piece = ''; link.href = product.url;
    const print = el('span', 'print piece__print'), img = new Image(), image = product.images[0], attrs = imageAttrs(image, sizes);
    Object.assign(img, attrs, { loading: 'lazy', decoding: 'async' });
    if (image.lowres) print.style.setProperty('--cap', attrs.width + 'px');
    print.append(img);
    const cap = el('span', 'piece__cap');
    cap.append(el('span', 'piece__title'), el('span', 'piece__year'));
    link.append(print, cap); card.append(link);
  }
  $('.piece__title', card).textContent = product.title;
  $('.piece__year', card).textContent = product.year ?? '';
  $('.piece__foot', card)?.remove();
  const foot = el('div', 'piece__foot');
  if (product.badge) foot.append(el('span', 'piece__mark', product.badge));
  if (product.available) {
    const price = formatPrice(product.price);
    if (price) foot.append(el('span', 'piece__price', price));
    const add = el('button', 'piece__add'); add.type = 'button'; add.dataset.add = product.handle;
    add.append(el('span', '', 'Add to cart'), el('span', 'vh', ': ' + product.title));
    foot.append(add);
  } else foot.append(el('span', 'piece__sold', 'Sold'));
  const note = el('span', 'piece__note'); note.setAttribute('role', 'status');
  foot.append(note);
  card.append(foot);
  card.toggleAttribute('data-sold', !product.available);
  return card;
}

export function layPieces(container, products, opts) {
  const cards = products.map((p) => { const card = pieceCard(p, opts); card.setAttribute('data-reveal', ''); return card; });
  container.replaceChildren(...cards);
  reveal(container);
  markAdds();
  return cards;
}

// a quick add says "In cart" once its piece is in the cart
function markAdds() {
  for (const add of $$('[data-add]')) {
    const inCart = !!lastCart?.lines.some((line) => line.handle === add.dataset.add);
    add.toggleAttribute('data-in-cart', inCart);
    if (add.firstElementChild) add.firstElementChild.textContent = inCart ? 'In cart' : 'Add to cart';
  }
}

// ---------- the cart sheet ----------
function lineItem(line, i) {
  const li = el('li', 'cart__line'); li.style.setProperty('--i', i);
  const thumb = el('a', 'cart__thumb'), img = new Image(); thumb.href = line.url; thumb.tabIndex = -1; thumb.setAttribute('aria-hidden', 'true');
  Object.assign(img, imageAttrs(line.image, '78px')); thumb.append(img);
  const what = el('div'), name = el('a', 'cart__name', line.title); name.href = line.url;
  what.append(name, el('span', 'cart__mark', line.type === 'original' ? 'Original, 1 of 1' : line.quantity > 1 ? 'Quantity ' + line.quantity : ''));
  // ponytail: no quantity stepper. Everything for sale today is 1 of 1; add one here (cart.setQuantity) when prints arrive.
  const remove = el('button', 'cart__remove'); remove.type = 'button'; remove.dataset.remove = line.id;
  remove.append('Remove', el('span', 'vh', ' ' + line.title));
  li.append(thumb, what, el('span', 'cart__price', formatPrice(line.price) ?? ''), remove);
  return li;
}

function paint(c) {
  lastCart = c;
  for (const n of $$('[data-cart-count]')) n.textContent = c.count;
  for (const b of $$('[data-cart-open]')) b.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  markAdds();
  if (!sheet) return;
  $('[data-cart-lines]', sheet).replaceChildren(...c.lines.map(lineItem));
  $('[data-cart-lines]', sheet).hidden = !c.count;
  $('[data-cart-empty]', sheet).hidden = !!c.count;
  $('[data-cart-foot]', sheet).hidden = !c.count;
  $('[data-cart-subtotal]', sheet).textContent = formatPrice(c.subtotal) ?? '';
}

const cartError = (message = '') => { const p = sheet && $('[data-cart-error]', sheet); if (p) p.textContent = message; };

export function openCart() {
  if (!sheet) return;
  if (menu?.open) menu.close();
  cartError();
  show(sheet);
  // the cart shows prices too, so the sample line comes inside the sheet while it is open
  mountSampleNote();
  const note = $('.tgc-sample-note');
  if (note && note.parentNode !== sheet) sheet.append(note);
}

export function addToCart(product, noteEl) {
  if (noteEl) noteEl.textContent = '';
  return cart.add(product).then(openCart, (err) => { if (noteEl) noteEl.textContent = err.message; });
}

if (sheet) {
  sheet.addEventListener('close', () => {
    const note = $('.tgc-sample-note', sheet), keep = $('.tgc-checkout-note', sheet);
    if (note && document.body.hasAttribute('data-prices')) document.body.append(note);
    keep?.remove();
    if (document.activeElement === document.body) $('.corners [data-cart-open]')?.focus(); // opened from inside the menu
  });
  cart.subscribe(paint);
  cart.get().then(paint, () => {});
}
for (const n of $$('[data-cart-count]')) n.textContent = cart.count();

// ---------- one click listener for every control ----------
document.addEventListener('click', async (e) => {
  const on = (sel) => e.target.closest?.(sel);
  let t;
  if (on('[data-menu-open]')) show(menu);
  else if (on('[data-menu-close]')) menu?.close();
  else if (on('[data-cart-open]')) openCart();
  else if (on('[data-cart-close]')) sheet?.close();
  else if ((t = on('[data-add]'))) {
    const product = known.get(t.dataset.add);
    if (!product) return;
    t.disabled = true;
    await addToCart(product, $('.piece__note', t.closest('.piece') ?? document));
    t.disabled = false;
  } else if ((t = on('[data-remove]'))) cart.remove(t.dataset.remove).catch((err) => cartError(err.message));
  else if ((t = on('[data-cart-checkout]'))) {
    cartError(); t.disabled = true;
    await cart.checkout().catch((err) => cartError(err.message)); // sample mode: the layer puts its own notice in the sheet
    t.disabled = false;
  } else if (e.target === sheet) sheet.close(); // a press on the dimmed table
  else if (menu?.open && menu.contains(e.target) && !on('a, button, .mprint')) menu.close(); // a press on the bare table
});
// the menu's pictures are not needed until it opens: fetch them once the page is idle
if (menu) (window.requestIdleCallback ?? setTimeout)(() => $$('img[loading="lazy"]', menu).forEach((img) => { img.loading = 'eager'; }));

// ---------- Home's featured prints: static cards in the HTML, filled from the shop layer ----------
const featured = $('[data-featured]');
if (featured) getProducts().then((all) => {
  for (const card of $$('.piece', featured)) {
    const product = all.find((p) => p.handle === card.dataset.handle);
    if (product) pieceCard(product, { from: card }); else card.remove();
  }
  markAdds();
}).catch(() => {}); // the catalogue did not load: the static cards stay as plain links to each piece

// ---------- forms, the sample line, the table ----------
for (const form of $$('form[data-newsletter]')) wireForm(form, { kind: 'newsletter' });
if (document.body.hasAttribute('data-prices')) mountSampleNote();

for (const obj of $$('[data-table] .obj')) {
  draggable(obj, { bounds: null, onDrop: () => document.documentElement.classList.add('has-moved') });
  obj.style.touchAction = 'pan-y'; // on a phone a swipe up or down still scrolls the page; sideways moves the object
  obj.tabIndex = -1;               // a toy for the hand: decorative, so not a stop for the keyboard
}
magnetic('[data-pull]', { strength: 0.22, radius: 70 });
