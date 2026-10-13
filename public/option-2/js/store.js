// The Gallery Wall — everything that touches the shop: the cart panel, the header count, and the
// shelves of framed pieces. All data comes from ../../shared/shop/shop.js; nothing is fetched here.
//
//   import { hang, pieceCard, openCart } from './store.js';
//   hang(ul, products)        fills a <ul class="ledge"> with framed pieces and their wall labels
//   pieceCard(product, i)     one <li class="piece"> (black frame on even i, white on odd)
//   openCart()                opens the cart panel (call it after cart.add on a product page)
// Declarative, no page script needed:
//   <ul class="ledge" data-pieces="handle,handle,…">   rehung from the catalogue in that order
//   <p class="label__price" data-price-of="handle">    filled with that piece's price, or "Sold"
import { getProducts, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { arrive } from './site.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const picture = (attrs) => { // attrs = imageAttrs(image, sizes)
  const img = new Image();
  img.loading = 'lazy'; // before src, or the browser has already started the download
  img.decoding = 'async';
  return Object.assign(img, attrs);
};
// price in its slot; a sold piece gets the mark instead and never a price that looks buyable
function priceInto(slot, product) {
  slot.className = product.available ? 'label__price' : 'label__sold';
  slot.textContent = product.available ? formatPrice(product.price) ?? '' : 'Sold';
}

/* Shelves --------------------------------------------------------------- */
const SIZES = { walk: '(max-width: 719px) 60vw, (max-width: 999px) 42vw, 26vw', grid: '(max-width: 999px) 40vw, 26vw' };
const CUT_KEYS = ['3', '3b', '3c']; // so neighbours on a shelf do not part along the same lines

export function pieceCard(product, i = 0, sizes = SIZES.grid) {
  const image = product.images[0];
  const li = el('li', 'piece');
  li.dataset.fragHost = '';
  li.dataset.reveal = '';
  li.style.setProperty('--d', `${(i % 3) * 0.07}s`);

  const framed = el('div', i % 2 ? 'framed framed--white' : 'framed');
  const attrs = imageAttrs(image, sizes);
  const img = picture(attrs);
  if (image.lowres) { // a small file: cap the frame at the file's width, and leave the picture in one piece
    framed.classList.add('framed--small');
    framed.style.setProperty('--file-w', `${attrs.width}px`);
    framed.append(img);
  } else {
    img.className = 'frag__base';
    const frag = el('span', 'frag');
    frag.dataset.frag = CUT_KEYS[i % CUT_KEYS.length];
    frag.dataset.fragOn = 'hover';
    frag.append(img);
    framed.append(frag);
  }
  const hangBox = el('div', 'piece__hang');
  hangBox.append(framed);

  const label = el('div', 'label');
  const title = el('h3', 'label__title');
  const link = el('a', '', product.title);
  link.href = product.url;
  title.append(link);
  label.append(title);
  if (product.year != null) label.append(el('p', 'label__meta', product.year));
  if (product.badge) label.append(el('p', 'label__mark', product.badge));
  const price = el('p');
  priceInto(price, product);
  label.append(price);
  if (product.available) { // the product page is where a piece is bought; until it exists the wall label carries the button
    const add = el('button', 'text-btn label__add', 'Add to cart');
    add.type = 'button';
    add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => cart.add(product).then(openCart, (err) => { openCart(); say(err.message); }));
    label.append(add);
  }
  const labelBox = el('div', 'piece__label');
  labelBox.append(label);

  li.append(hangBox, labelBox);
  return li;
}

// The shop layer's sample note floats over the page by default. Here it lies in the page, under the header,
// so it never sits on a label, a button or a field as the page moves.
function sampleNote() {
  mountSampleNote();
  const note = document.querySelector('body > .tgc-sample-note');
  if (note) document.querySelector('[data-header]')?.after(note);
}

export function hang(ul, products) {
  const sizes = ul.classList.contains('ledge--walk') ? SIZES.walk : SIZES.grid;
  ul.replaceChildren(...products.map((product, i) => pieceCard(product, i, sizes)));
  arrive(ul);
  sampleNote();
}

const wanted = [...document.querySelectorAll('[data-pieces], [data-price-of]')];
if (wanted.length) {
  getProducts().then((all) => {
    const find = (handle) => all.find((p) => p.handle === handle.trim());
    for (const node of wanted) {
      if (node.dataset.priceOf) { const product = find(node.dataset.priceOf); if (product) priceInto(node, product); continue; }
      const picked = node.dataset.pieces.split(',').map(find).filter(Boolean);
      if (picked.length) hang(node, picked);
    }
    sampleNote();
  }).catch(() => {}); // the shop cannot be reached: the pieces written into the page stay as they are
}

/* Cart ------------------------------------------------------------------ */
const panel = document.querySelector('dialog.cart');
const part = (name) => panel?.querySelector(`[data-cart-${name}]`);
const say = (message = '') => { const status = part('status'); if (status) { status.textContent = message; status.dataset.state = message ? 'error' : ''; } };

function lineRow(line) {
  const li = el('li', 'cart-line');
  if (line.image) {
    const pic = el('a', 'cart-line__pic framed');
    pic.href = line.url;
    pic.append(picture(imageAttrs(line.image, '72px')));
    li.append(pic);
  }
  const words = el('div');
  const title = el('p', 'cart-line__title');
  const link = el('a', '', line.title);
  link.href = line.url;
  title.append(link);
  // ponytail: a quantity is only stated, not editable. Originals are 1 of 1; add a stepper when prints go on sale.
  words.append(title, el('p', 'label__mark', line.type === 'original' ? 'Original, 1 of 1' : `Quantity ${line.quantity}`));
  const remove = el('button', 'text-btn', 'Remove');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => cart.remove(line.id).then(() => say(), (err) => say(err.message)));
  li.append(words, el('p', 'cart-line__price', formatPrice(line.price) ?? ''), remove);
  return li;
}

function paint(current) {
  document.querySelectorAll('[data-cart-count]').forEach((n) => { n.textContent = current.count; });
  document.querySelectorAll('[data-cart-open]').forEach((b) => b.setAttribute('aria-label', `Cart, ${current.count} ${current.count === 1 ? 'item' : 'items'}`));
  if (!panel) return;
  part('lines').replaceChildren(...current.lines.map(lineRow));
  part('empty').hidden = current.count > 0;
  part('foot').hidden = current.count === 0;
  part('subtotal').textContent = formatPrice(current.subtotal) ?? '';
}

export function openCart() {
  if (!panel || panel.open) return;
  say();
  panel.showModal();
  mountSampleNote(); // the cart shows prices on whichever page it is opened
}

document.querySelectorAll('[data-cart-count]').forEach((n) => { n.textContent = cart.count(); }); // no flash of 0
cart.subscribe(paint);
cart.get().then(paint, () => {});
document.querySelectorAll('[data-cart-open]').forEach((button) => button.addEventListener('click', openCart));
part('close')?.addEventListener('click', () => panel.close());
panel?.addEventListener('click', (e) => { if (e.target === panel) panel.close(); }); // a click on the dimmed page
// sample mode: the shop layer writes its own notice inside this panel, so it stays open
part('checkout')?.addEventListener('click', () => { say(); cart.checkout().catch((err) => say(err.message)); });
