// node dev/shop.test.mjs — checks the shop layer in both modes, with no browser and no network.
// The module is imported once per mode (and once more as "a new page view") under a different
// ?query, which gives a fresh copy each time; the token is flipped in between.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE } from '../public/shared/config.js';

// ---------- the little a browser gives the module ----------
const stored = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (k) => stored.get(k) ?? null, setItem: (k, v) => { stored.set(k, String(v)); }, removeItem: (k) => { stored.delete(k); } },
});
const on = { storage: [], pageshow: [] }; // every copy of the module adds one of each (any other type fails here)
globalThis.addEventListener = (type, fn) => { on[type].push(fn); };
globalThis.location = { href: 'http://local/option-1/shop.html', pathname: '/option-1/shop.html', search: '' };
const otherTab = (key) => on.storage.forEach((fn) => fn({ key }));
const saved = (key) => JSON.parse(stored.get(key));

// ================= SAMPLE MODE =================
// The catalogue file belongs to the lead and changes (alt text, photos, prices), so what is expected
// here is read from the file, never typed in. One alt is blanked on the way in to check the fallback.
assert.equal(SITE.shopify.storefrontToken, '', 'the checked-in config is in sample mode');
const raw = JSON.parse(readFileSync(new URL('../public/shared/shop/products.sample.json', import.meta.url))).products;
const fetched = [];
globalThis.fetch = async (url) => {
  fetched.push(String(url));
  const body = JSON.parse(readFileSync(fileURLToPath(url)));
  body.products[1].images[0].alt = null;
  return Response.json(body);
};
const shop = await import('../public/shared/shop/shop.js?sample');
const backToSample = on.pageshow.at(-1); // this copy's "the page came back out of the browser's cache"
const { cart } = shop;
const cents = (n) => Math.round(n * 100) / 100;

assert.equal(shop.isSample, true);
assert.equal(shop.STORY_PLACEHOLDER, "Camila's note about this piece, the emotion behind it, goes here.");
shop.mountSampleNote(); // no page here: must not throw

// products load once, and the filter works in both spellings
const all = await shop.getProducts();
assert.ok(raw.length > 2);
assert.equal(all.length, raw.length);
for (const type of ['original', 'print', 'good']) {
  const expected = raw.filter((p) => p.type === type).map((p) => p.handle);
  assert.deepEqual((await shop.getProducts({ type })).map((p) => p.handle), expected);
  assert.deepEqual((await shop.getProducts({ type: type + 's' })).map((p) => p.handle), expected, 'the plural from ?type= works too');
}
assert.equal(fetched.length, 1, 'the catalogue is fetched once');
assert.match(fetched[0], /\/public\/shared\/shop\/products\.sample\.json$/);
all.pop();
assert.equal((await shop.getProducts()).length, raw.length, 'a caller cannot damage the cached list');

// two different originals that can be bought, to work with below
const [first, second] = (await shop.getProducts({ type: 'original' })).filter((p) => p.available && p.price);
const rawFirst = raw.find((p) => p.handle === first.handle);
assert.equal(await shop.getProduct(first.handle), first);
assert.equal(await shop.getProduct('no-such-piece'), null);
assert.deepEqual(Object.keys(first), ['handle', 'title', 'type', 'year', 'number', 'medium', 'dimensions', 'story', 'price', 'available', 'badge', 'shipping', 'variantId', 'images', 'url']);
assert.deepEqual(Object.keys(first.images[0]).sort(), ['alt', 'avg', 'framed', 'height', 'lowres', 'sizes', 'width']);
assert.equal(first.title, rawFirst.title);
assert.equal(first.url, 'product.html?handle=' + first.handle);
assert.deepEqual(first.price, rawFirst.price);
assert.equal(first.badge, 'Original, 1 of 1');
assert.equal(first.images[0].alt, rawFirst.images[0].alt ?? rawFirst.title);
assert.equal(first.images[0].framed, false, 'the first picture is the piece itself');
assert.equal((await shop.getProduct(raw[1].handle)).images[0].alt, raw[1].title, 'a missing alt falls back to the title');

// every image URL is absolute and points at a real file, wherever the page is
const image = first.images[0];
for (const [w, path] of Object.entries(rawFirst.images[0].sizes)) assert.equal(image.sizes[w], new URL('../public/' + path, import.meta.url).href);
const images = (await shop.getProducts()).flatMap((p) => p.images);
for (const url of images.flatMap((i) => Object.values(i.sizes))) assert.ok(existsSync(fileURLToPath(url)), `${url} exists`);
assert.deepEqual(images.filter((i) => i.framed).length, raw.flatMap((p) => p.images).filter((i) => i.framed).length);

// imageAttrs / zoomSrc, for every image in the catalogue
for (const i of images) {
  const widths = Object.keys(i.sizes).map(Number).sort((a, b) => a - b);
  const attrs = shop.imageAttrs(i, '50vw');
  assert.deepEqual(Object.keys(attrs).sort(), ['alt', 'height', 'sizes', 'src', 'srcset', 'width']);
  assert.equal(attrs.srcset, widths.map((w) => `${i.sizes[w]} ${w}w`).join(', '));
  assert.equal(attrs.src, i.sizes[widths.filter((w) => w <= 960).pop() ?? widths[0]]);
  const widest = widths.at(-1);
  assert.deepEqual([attrs.sizes, attrs.width, attrs.height, attrs.alt], ['50vw', widest, Math.round(i.height * widest / i.width), i.alt]);
  assert.ok(attrs.width <= i.width, 'the size handed to a page is never wider than the piece really is');
  assert.ok(Math.abs(attrs.width / attrs.height - i.width / i.height) < 0.01, 'and it keeps the shape');
  assert.equal(shop.zoomSrc(i), i.sizes[widest]);
}
// a small scan: the width a page gets is the file it can load (480), not the scan (849), so it is not stretched
const small = images.find((i) => i.lowres && i.width > Math.max(...Object.keys(i.sizes)));
assert.ok(small, 'the sample catalogue has a low-res piece whose scan is wider than its file');
assert.equal(shop.imageAttrs(small).width, Math.max(...Object.keys(small.sizes)));
assert.equal(shop.imageAttrs(image).sizes, '100vw');
const madeUp = { sizes: { 2400: 'c', 459: 'a', 1600: 'b' }, width: 3000, height: 2000, alt: null };
assert.deepEqual(shop.imageAttrs(madeUp), { alt: '', width: 2400, height: 1600, sizes: '100vw', srcset: 'a 459w, b 1600w, c 2400w', src: 'a' });
assert.equal(shop.zoomSrc(madeUp), 'c');
// no picture (a cart line can have none): nothing to show, and nothing thrown
assert.deepEqual(shop.imageAttrs(null, '50vw'), { alt: '', sizes: '50vw' });
assert.deepEqual(shop.imageAttrs(undefined), { alt: '', sizes: '100vw' });
assert.equal(shop.zoomSrc(null), null);

// formatPrice
assert.equal(shop.formatPrice({ amount: 111, currency: 'USD' }), '$111');
assert.equal(shop.formatPrice({ amount: 1250, currency: 'USD' }), '$1,250');
assert.equal(shop.formatPrice({ amount: 19.5, currency: 'USD' }), '$19.50');
assert.equal(shop.formatPrice(null), null);

// the cart: add, cap at 1, subtotal, remove
const seen = [];
const unsubscribe = cart.subscribe((c) => seen.push(c.count));
assert.equal(cart.count(), 0);
assert.deepEqual(await cart.get(), { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: true });

let now = await cart.add(first);
assert.equal(now.count, 1);
assert.equal(cart.count(), 1);
assert.deepEqual(now.subtotal, first.price);
assert.deepEqual(now.lines[0], { id: first.variantId, handle: first.handle, title: first.title, type: 'original', quantity: 1, price: first.price, image, url: first.url });
assert.deepEqual(seen, [1], 'subscribers hear about the change');
assert.equal(saved('tgc-cart-sample').cart.count, 1, 'the cart is saved under one key');
assert.deepEqual([...stored.keys()], ['tgc-cart-sample']);

now = await cart.add(first, 3);
assert.equal(now.count, 1, 'an original already in the cart is a no-op, not an error');
assert.deepEqual(seen, [1], 'and nothing changed, so nobody is told');

now = await cart.add(second, 4);
assert.equal(now.lines[1].quantity, 1, 'an original is capped at 1 whatever is asked');
assert.deepEqual(now.subtotal, { amount: cents(first.price.amount + second.price.amount), currency: 'USD' });
now = await cart.setQuantity(now.lines[1].id, 9);
assert.equal(now.lines[1].quantity, 1, 'setQuantity cannot lift an original past 1');

await Promise.all([cart.remove(now.lines[0].id), cart.remove('not-a-line')]);
assert.deepEqual((await cart.get()).lines.map((l) => l.handle), [second.handle]);
assert.equal(cart.count(), 1);

// something that is not 1 of 1 can be had more than once
const postcards = { ...first, handle: 'postcards', title: 'Postcards', type: 'good', variantId: 'sample-postcards', price: { amount: 19.5, currency: 'USD' }, badge: null };
now = await cart.add(postcards, 2);
now = await cart.add(postcards);
assert.equal(now.lines[1].quantity, 3);
assert.deepEqual(now.subtotal, { amount: cents(second.price.amount + 58.5), currency: 'USD' });
assert.equal(now.count, 4);
now = await cart.setQuantity('sample-postcards', 1);
assert.deepEqual(now.subtotal, { amount: cents(second.price.amount + 19.5), currency: 'USD' });
now = await cart.setQuantity('sample-postcards', 0);
assert.deepEqual(now.lines.map((l) => l.handle), [second.handle], 'quantity 0 removes the line');

// refusals
await assert.rejects(cart.add({ ...first, available: false }), { message: `${first.title} is no longer available.` });
await assert.rejects(cart.add(null), /no longer available/);
await assert.rejects(cart.add(postcards, 0), /whole number/);
await assert.rejects(cart.add(postcards, 1.5), /whole number/);
await assert.rejects(cart.setQuantity(now.lines[0].id, -1), /whole number/);
assert.equal(cart.count(), 1, 'a refusal changes nothing');

// two quick clicks on the same original add it once
await cart.remove(now.lines[0].id);
await Promise.all([cart.add(second), cart.add(second)]);
assert.equal(cart.count(), 1);

// a listener that throws must not turn a good add into a failure
const stopBroken = cart.subscribe(() => { throw new Error('broken listener'); });
const realError = console.error;
console.error = () => {};
assert.equal((await cart.add(first)).count, 2);
console.error = realError;
stopBroken();

// another tab empties the cart
seen.length = 0;
stored.set('tgc-cart-sample', JSON.stringify({ id: null, cart: { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: true } }));
otherTab('tgc-cart-sample');
assert.equal(cart.count(), 0);
assert.deepEqual(seen, [0]);
stored.set('tgc-cart-sample', 'not json');
otherTab('tgc-cart-sample');
assert.equal(cart.count(), 0, 'corrupt storage reads as an empty cart');
unsubscribe();
await cart.add(first);
assert.deepEqual(seen, [0, 0], 'unsubscribe stops the calls');

// a saved cart of the wrong shape (an older build, a half-written value, anything else on this address)
// reads as empty: it must not break count(), add() or a page's cart paint
const emptySample = { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: true };
const goodLine = { id: first.variantId, handle: first.handle, title: first.title, type: 'original', quantity: 1, price: first.price, image: null, url: first.url };
for (const [why, lines] of [
  ['a line that is null', [null]],
  ['lines that are not a list', 'x'],
  ['a line with no id', [{ ...goodLine, id: undefined }]],
  ['a line with no title', [{ ...goodLine, title: null }]],
  ['a currency that is not a currency', [{ ...goodLine, price: { amount: 111, currency: 'dollars' } }]],
  ['a price that is not a number', [{ ...goodLine, price: { amount: '111', currency: 'USD' } }]],
  ['a quantity of 0', [{ ...goodLine, quantity: 0 }]],
  ['half a piece', [{ ...goodLine, quantity: 1.5 }]],
  ['an original 99 times', [{ ...goodLine, quantity: 99 }]],
  ['a picture with no files', [{ ...goodLine, image: {} }]],
]) {
  stored.set('tgc-cart-sample', JSON.stringify({ id: null, cart: { lines, count: 1, subtotal: first.price, checkoutUrl: null, sample: true } }));
  otherTab('tgc-cart-sample');
  assert.deepEqual(await cart.get(), emptySample, why);
  assert.equal(cart.count(), 0, why);
  assert.equal(shop.formatPrice((await cart.get()).subtotal), null, why);
}
assert.equal((await cart.add(first)).count, 1, 'and the cart works again afterwards');
// good lines with a count, a subtotal and a checkout address that are not: all three are worked out again
stored.set('tgc-cart-sample', JSON.stringify({ id: 'x', cart: { lines: [goodLine], count: '7', subtotal: { amount: 1, currency: 'nope' }, checkoutUrl: 'javascript:alert(1)' } }));
otherTab('tgc-cart-sample');
assert.deepEqual(await cart.get(), { lines: [goodLine], count: 1, subtotal: first.price, checkoutUrl: null, sample: true });
assert.equal(cart.count(), 1);

// Back brings a page out of the browser's cache: it heard no storage event, so it reads the saved cart again
const afterBack = [];
const stopAfterBack = cart.subscribe((c) => afterBack.push(c.count));
stored.set('tgc-cart-sample', JSON.stringify({ id: null, cart: emptySample }));
backToSample({ persisted: false });
assert.equal(cart.count(), 1, 'an ordinary page load reads nothing twice');
backToSample({ persisted: true });
assert.equal(cart.count(), 0, 'the page that came back shows the cart as it is now');
assert.deepEqual(afterBack, [0], 'and its subscribers repaint');
stopAfterBack();
await cart.add(first);

// the preview switch: ?sold=<handle> in the page address shows that piece as sold (sample mode only)
location.search = `?type=originals&sold=${second.handle}`;
const soldPreview = await import('../public/shared/shop/shop.js?sample-sold');
const shownSold = await soldPreview.getProduct(second.handle);
location.search = '';
assert.equal(shownSold.available, false);
assert.equal((await soldPreview.getProduct(first.handle)).available, true, 'only the piece that was named');
await assert.rejects(soldPreview.cart.add(shownSold), /no longer available/);
assert.equal(second.available, true, 'and nothing changes without the switch');

// checkout goes nowhere in sample mode
assert.deepEqual(await cart.checkout(), { sample: true });
assert.equal(location.href, 'http://local/option-1/shop.html');

// ================= LIVE MODE (a pretend Shopify) =================
SITE.shopify.storefrontToken = 'public-test-token';
stored.clear();

const money = (amount) => ({ amount: amount.toFixed(1), currencyCode: 'USD' });
const node = (handle, title, extra = {}) => ({
  handle, title, description: '', productType: '', availableForSale: true,
  collections: { nodes: [{ handle: 'frontpage' }, { handle: 'originals' }] },
  images: { nodes: [{ url: `https://cdn.shopify.com/s/files/1/0001/${handle}.jpg?v=17`, altText: null, width: 2544, height: 3067 }] },
  priceRange: { minVariantPrice: money(111) },
  variants: { nodes: [{ id: `gid://shopify/ProductVariant/${handle}`, availableForSale: true, price: money(111) }] },
  metafields: [null, null, null, null],
  ...extra,
});
const NODES = [
  node('curiosity', 'Curiosity', {
    description: 'Shop description.',
    images: { nodes: [
      { url: 'https://cdn.shopify.com/s/files/1/0001/curiosity.jpg?v=17', altText: 'Curiosity, a collage of an eye over the sea', width: 2544, height: 3067 },
      { url: 'https://cdn.shopify.com/s/files/1/0001/curiosity-detail.jpg', altText: null, width: 1200, height: 900 },
      { url: 'https://cdn.shopify.com/s/files/1/0001/curiosity-tiny.jpg', altText: null, width: 400, height: 300 },
    ] },
    metafields: [{ key: 'year', value: '2023' }, { key: 'dimensions', value: '12 x 16 in' }, { key: 'medium', value: 'Mixed-media collage on paper' }, { key: 'story', value: 'Wanting to know.' }],
  }),
  node('postcards', 'Postcards', {
    description: 'Six postcards.', productType: 'Goods', collections: { nodes: [] },
    priceRange: { minVariantPrice: money(19.5) },
    variants: { nodes: [{ id: 'gid://shopify/ProductVariant/postcards', availableForSale: true, price: money(19.5) }] },
  }),
  node('stuck', 'Stuck', { availableForSale: false, variants: { nodes: [{ id: 'gid://shopify/ProductVariant/stuck', availableForSale: false, price: money(111) }] } }),
  node('zenda-beach', 'Zenda Beach', { metafields: [{ key: 'year', value: 'c. 2023' }, null, null, null] }),
  node('gift-card', 'Gift card', { productType: 'Gift Cards', collections: { nodes: [] }, variants: { nodes: [] }, priceRange: { minVariantPrice: money(50) } }),
  node('no-photo-yet', 'No photo yet', { images: { nodes: [] } }),
];

// The pretend shop: carts live in a Map; `gone` variants are answered without an error and without a line.
const server = { carts: new Map(), made: 0, gone: new Set() };
const variantOf = (id) => NODES.find((n) => n.variants.nodes[0]?.id === id);
function cartNode(id) {
  const lines = server.carts.get(id);
  if (!lines) return null;
  const total = lines.reduce((sum, l) => sum + Number(variantOf(l.merchandiseId).variants.nodes[0].price.amount) * l.quantity, 0);
  return {
    id, checkoutUrl: `https://2pssuy-7e.myshopify.com/cart/c/${id.split('/').pop()}`,
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    cost: { subtotalAmount: money(total) },
    lines: { nodes: lines.map((l) => {
      const product = variantOf(l.merchandiseId);
      return { id: l.id, quantity: l.quantity, merchandise: { id: l.merchandiseId, price: product.variants.nodes[0].price, image: product.images.nodes[0], product: { handle: product.handle, title: product.title, productType: product.productType, collections: product.collections } } };
    }) },
  };
}
function addLines(id, lines) {
  for (const { merchandiseId, quantity } of lines) {
    if (!variantOf(merchandiseId)) return [{ field: ['lines', '0', 'merchandiseId'], message: `The merchandise with id ${merchandiseId} does not exist.` }];
    if (server.gone.has(merchandiseId)) continue;
    const line = server.carts.get(id).find((l) => l.merchandiseId === merchandiseId);
    if (line) line.quantity += quantity;
    else server.carts.get(id).push({ id: `gid://shopify/CartLine/${merchandiseId.split('/').pop()}`, merchandiseId, quantity });
  }
  return [];
}
const noCart = { cart: null, userErrors: [{ field: ['cartId'], message: 'The specified cart does not exist.' }] };
const answers = {
  Products: () => ({ products: { nodes: NODES } }),
  Cart: ({ id }) => ({ cart: cartNode(id) }),
  Create: ({ input }) => {
    const id = `gid://shopify/Cart/c${++server.made}`;
    server.carts.set(id, []);
    const userErrors = addLines(id, input.lines);
    if (userErrors.length) server.carts.delete(id);
    return { cartCreate: { cart: cartNode(id), userErrors } };
  },
  Add: ({ cartId, lines }) => {
    if (!server.carts.has(cartId)) return { cartLinesAdd: noCart };
    const userErrors = addLines(cartId, lines);
    return { cartLinesAdd: { cart: userErrors.length ? null : cartNode(cartId), userErrors } };
  },
  Remove: ({ cartId, lineIds }) => {
    if (!server.carts.has(cartId)) return { cartLinesRemove: noCart };
    server.carts.set(cartId, server.carts.get(cartId).filter((l) => !lineIds.includes(l.id)));
    return { cartLinesRemove: { cart: cartNode(cartId), userErrors: [] } };
  },
  Update: ({ cartId, lines }) => {
    if (!server.carts.has(cartId)) return { cartLinesUpdate: noCart };
    for (const { id, quantity } of lines) server.carts.get(cartId).find((l) => l.id === id).quantity = quantity;
    return { cartLinesUpdate: { cart: cartNode(cartId), userErrors: [] } };
  },
};
const calls = [];
const shopify = async (url, init) => {
  const { query, variables } = JSON.parse(init.body);
  const op = /^(?:query|mutation) (\w+)/.exec(query)[1];
  calls.push({ url: String(url), method: init.method, headers: init.headers, signal: init.signal, op, variables });
  return Response.json({ data: answers[op](variables) });
};
globalThis.fetch = shopify;
const opsSince = (mark) => calls.slice(mark).map((c) => c.op);

const live = await import('../public/shared/shop/shop.js?live');
const backToLive = on.pageshow.at(-1);
assert.equal(live.isSample, false);
live.mountSampleNote(); // nothing to say in live mode

// one request, to the right place, with the public token; mapped to the same Product shape
const products = await live.getProducts();
await live.getProduct('curiosity');
assert.deepEqual(opsSince(0), ['Products'], 'one products request serves every call');
assert.equal(calls[0].url, 'https://2pssuy-7e.myshopify.com/api/2026-07/graphql.json');
assert.equal(calls[0].method, 'POST');
assert.deepEqual(calls[0].headers, { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': 'public-test-token' });
assert.ok(calls[0].signal instanceof AbortSignal, 'every request has a time limit, so one that never answers cannot hold up the cart');

const [c, p, s, z, g] = products;
assert.deepEqual(products.map((x) => x.handle), ['curiosity', 'postcards', 'stuck', 'zenda-beach', 'gift-card'], 'a product with no picture is not listed');
assert.equal(await live.getProduct('no-photo-yet'), null);
for (const x of products) live.imageAttrs(x.images[0]); // so this never throws for a listed product
assert.deepEqual(Object.keys(c), Object.keys(first), 'live and sample products have the same fields');
assert.deepEqual(Object.keys(c.images[0]).sort(), Object.keys(first.images[0]).sort(), 'and so do their images');
assert.deepEqual(
  { ...c, images: null },
  { handle: 'curiosity', title: 'Curiosity', type: 'original', year: 2023, number: null, medium: 'Mixed-media collage on paper', dimensions: '12 x 16 in', story: 'Wanting to know.', price: { amount: 111, currency: 'USD' }, available: true, badge: 'Original, 1 of 1', shipping: 'Ships from Miami, insured, US only', variantId: 'gid://shopify/ProductVariant/curiosity', images: null, url: 'product.html?handle=curiosity' },
);
assert.deepEqual(c.images[0], {
  sizes: { 480: 'https://cdn.shopify.com/s/files/1/0001/curiosity.jpg?v=17&width=480', 960: 'https://cdn.shopify.com/s/files/1/0001/curiosity.jpg?v=17&width=960', 1600: 'https://cdn.shopify.com/s/files/1/0001/curiosity.jpg?v=17&width=1600', 2400: 'https://cdn.shopify.com/s/files/1/0001/curiosity.jpg?v=17&width=2400' },
  width: 2544, height: 3067, alt: 'Curiosity, a collage of an eye over the sea', avg: null, lowres: false, framed: false,
});
assert.deepEqual(Object.keys(c.images[1].sizes), ['480', '960'], 'never wider than the file');
assert.equal(c.images[1].sizes['960'], 'https://cdn.shopify.com/s/files/1/0001/curiosity-detail.jpg?width=960');
assert.equal(c.images[1].alt, 'Curiosity');
assert.equal(c.images[1].lowres, true);
assert.deepEqual(c.images[2].sizes, { 400: 'https://cdn.shopify.com/s/files/1/0001/curiosity-tiny.jpg?width=400' });
assert.equal(live.zoomSrc(c.images[0]), c.images[0].sizes['2400']);
assert.deepEqual([p.type, p.badge, p.story, p.year, p.medium, p.dimensions], ['good', null, 'Six postcards.', null, null, null], 'type falls back to the product type, story to the description');
assert.deepEqual(p.price, { amount: 19.5, currency: 'USD' });
assert.equal(s.available, false);
assert.equal(z.year, 'c. 2023', 'a year that is not a number is kept as written');
assert.equal(z.story, null);
assert.deepEqual([g.type, g.available, g.variantId, g.price.amount], [null, false, null, 50]);
assert.deepEqual((await live.getProducts({ type: 'originals' })).map((x) => x.handle), ['curiosity', 'stuck', 'zenda-beach']);
assert.deepEqual((await live.getProducts({ type: 'good' })).map((x) => x.handle), ['postcards']);
assert.deepEqual(await live.getProducts({ type: 'print' }), []);

// cart: nothing saved yet, so nothing to ask Shopify
let mark = calls.length;
assert.deepEqual(await live.cart.get(), { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: false });
await assert.rejects(live.cart.checkout(), /Your cart is empty/);
assert.deepEqual(opsSince(mark), []);

// the first add creates the cart and remembers its id
const heard = [];
live.cart.subscribe((x) => heard.push(x.count));
now = await live.cart.add(c);
assert.deepEqual(opsSince(mark), ['Create']);
assert.deepEqual(calls.at(-1).variables, { input: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/curiosity', quantity: 1 }] } });
assert.deepEqual({ ...now.lines[0], image: null }, { id: 'gid://shopify/CartLine/curiosity', handle: 'curiosity', title: 'Curiosity', type: 'original', quantity: 1, price: { amount: 111, currency: 'USD' }, image: null, url: 'product.html?handle=curiosity' });
assert.equal(now.lines[0].image.sizes['480'], c.images[0].sizes['480']);
assert.deepEqual([now.count, now.subtotal, now.checkoutUrl, now.sample], [1, { amount: 111, currency: 'USD' }, 'https://2pssuy-7e.myshopify.com/cart/c/c1', false]);
assert.equal(live.cart.count(), 1);
assert.deepEqual(heard, [1]);
assert.equal(saved('tgc-cart').id, 'gid://shopify/Cart/c1');
assert.equal(saved('tgc-cart').cart.count, 1);

// later adds go to that cart; an original stays at 1 without asking Shopify
mark = calls.length;
await Promise.all([live.cart.add(c), live.cart.add(z), live.cart.add(z)]);
assert.deepEqual(opsSince(mark), ['Add'], 'the second click on Zenda Beach never reaches Shopify');
assert.equal(calls.at(-1).variables.cartId, 'gid://shopify/Cart/c1');
now = await live.cart.add(p, 2);
assert.deepEqual([now.count, now.subtotal.amount], [4, 261]);
mark = calls.length;
now = await live.cart.setQuantity('gid://shopify/CartLine/curiosity', 5);
assert.deepEqual(opsSince(mark), [], 'an original is not updated past 1');
now = await live.cart.setQuantity('gid://shopify/CartLine/postcards', 3);
assert.deepEqual(calls.at(-1).variables, { cartId: 'gid://shopify/Cart/c1', lines: [{ id: 'gid://shopify/CartLine/postcards', quantity: 3 }] });
assert.equal(now.count, 5);
now = await live.cart.setQuantity('gid://shopify/CartLine/postcards', 0);
now = await live.cart.remove('gid://shopify/CartLine/zenda-beach');
assert.deepEqual(opsSince(mark), ['Update', 'Remove', 'Remove']);
assert.deepEqual(now.lines.map((l) => l.handle), ['curiosity']);

// a sold piece is refused before any request
mark = calls.length;
await assert.rejects(live.cart.add(s), /Stuck is no longer available/);
await assert.rejects(live.cart.add(g), /Gift card is no longer available/);
assert.deepEqual(opsSince(mark), []);

// userErrors are thrown in Shopify's words, and the cart is left as it was
await assert.rejects(live.cart.add({ ...p, handle: 'ghost', title: 'Ghost', variantId: 'gid://shopify/ProductVariant/ghost' }), /The merchandise with id gid:\/\/shopify\/ProductVariant\/ghost does not exist\./);
assert.deepEqual(opsSince(mark), ['Add', 'Cart'], 'it checked that the cart itself is still there');
assert.equal(live.cart.count(), 1);
assert.equal(saved('tgc-cart').id, 'gid://shopify/Cart/c1');

// Shopify answers "fine" but the piece just sold: the add must fail, not pretend
server.gone.add('gid://shopify/ProductVariant/zenda-beach');
await assert.rejects(live.cart.add(z), /Zenda Beach could not be added\. It may have just sold\./);
assert.equal(live.cart.count(), 1);
server.gone.clear();

// failures on the way: no connection, a server error, a GraphQL error, an unreadable answer
for (const [broken, message] of [
  [async () => { throw new TypeError('Failed to fetch'); }, /could not be reached/],
  [async () => new Response('oops', { status: 503 }), /not answering right now \(503\)/],
  [async () => Response.json({ errors: [{ message: 'Field "x" does not exist' }] }), /returned an error/],
  [async () => new Response('<html>'), /could not be read/],
]) {
  globalThis.fetch = broken;
  await assert.rejects(live.cart.add(p), message);
  await assert.rejects(live.cart.remove('gid://shopify/CartLine/curiosity'), message);
  assert.equal(live.cart.count(), 1, 'a failed request changes nothing');
}
globalThis.fetch = shopify;

// checkout hands the browser to Shopify
assert.deepEqual(await live.cart.checkout(), { sample: false });
assert.equal(location.href, 'https://2pssuy-7e.myshopify.com/cart/c/c1');

// the saved cart is gone (bought, or expired): the next add starts a new one quietly
server.carts.clear();
mark = calls.length;
heard.length = 0;
now = await live.cart.add(p);
assert.deepEqual(opsSince(mark), ['Add', 'Cart', 'Create']);
assert.deepEqual(now.lines.map((l) => [l.handle, l.quantity]), [['postcards', 1]]);
assert.equal(saved('tgc-cart').id, 'gid://shopify/Cart/c2');
assert.deepEqual(heard, [0, 1]);

// ...also when the cart that is gone already held this very product: 1 in the new cart is a real add,
// not "it may have just sold" (which would make the visitor press again and end up with 2)
server.carts.clear();
mark = calls.length;
now = await live.cart.add(p);
assert.deepEqual(opsSince(mark), ['Add', 'Cart', 'Create']);
assert.deepEqual(now.lines.map((l) => [l.handle, l.quantity]), [['postcards', 1]]);
assert.equal(saved('tgc-cart').id, 'gid://shopify/Cart/c3');
// while in a cart that is still there, an add that changes nothing is still caught
server.gone.add('gid://shopify/ProductVariant/postcards');
await assert.rejects(live.cart.add(p), /Postcards could not be added\. It may have just sold\./);
server.gone.clear();

// ...and removing from a cart that is gone just leaves an empty cart
server.carts.clear();
now = await live.cart.remove('gid://shopify/CartLine/postcards');
assert.deepEqual(now, { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: false });
assert.equal(saved('tgc-cart').id, null);

// another tab's change arrives through storage, with no request
now = await live.cart.add(c);
const theirs = saved('tgc-cart');
const sixPostcards = { ...theirs.cart.lines[0], id: 'gid://shopify/CartLine/postcards', handle: 'postcards', title: 'Postcards', type: 'good', quantity: 6 };
stored.set('tgc-cart', JSON.stringify({ id: theirs.id, cart: { ...theirs.cart, lines: [...theirs.cart.lines, sixPostcards], count: 7 } }));
mark = calls.length;
otherTab('tgc-cart');
assert.equal(live.cart.count(), 7);
assert.deepEqual(opsSince(mark), []);

// what is saved is not believed blindly. A checkout address that is not https is dropped...
stored.set('tgc-cart', JSON.stringify({ id: theirs.id, cart: { ...theirs.cart, checkoutUrl: 'javascript:alert(1)' } }));
otherTab('tgc-cart');
assert.deepEqual([live.cart.count(), (await live.cart.get()).checkoutUrl], [1, null]);
// ...a cart with no Shopify id is not a cart, whatever it says...
stored.set('tgc-cart', JSON.stringify({ id: null, cart: { ...theirs.cart, checkoutUrl: 'https://elsewhere.example/pay' } }));
otherTab('tgc-cart');
assert.deepEqual(await live.cart.get(), { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: false });
const before = location.href;
await assert.rejects(live.cart.checkout(), /Your cart is empty/);
assert.equal(location.href, before, 'so the browser is never sent to an address Shopify did not give');
// ...and a wrong shape reads as empty but keeps the id, so the real cart can be fetched again
stored.set('tgc-cart', JSON.stringify({ id: theirs.id, cart: { lines: [null], count: 3, subtotal: { amount: 1, currency: 'nope' } } }));
otherTab('tgc-cart');
assert.equal(live.cart.count(), 0);
assert.deepEqual(opsSince(mark), [], 'none of this asked Shopify anything');

// Back brings this page out of the browser's cache (no storage event reached it): it reads the saved
// cart again and asks Shopify again, which here repairs the unreadable one above
heard.length = 0;
backToLive({ persisted: false });
assert.deepEqual([heard, opsSince(mark)], [[], []], 'an ordinary page load does none of this');
backToLive({ persisted: true });
assert.deepEqual(heard, [0], 'subscribers repaint at once from what is saved');
assert.deepEqual((await live.cart.get()).lines.map((l) => l.handle), ['curiosity']);
assert.deepEqual(opsSince(mark), ['Cart']);
assert.deepEqual(heard, [0, 1]);
assert.deepEqual(saved('tgc-cart'), theirs, 'and what is saved is whole again');

// a new page view: count() is right at once from the saved cart, then get() checks with Shopify
const nextPage = await import('../public/shared/shop/shop.js?live-next-page');
assert.equal(nextPage.cart.count(), 1);
mark = calls.length;
globalThis.fetch = async () => { throw new TypeError('offline'); };
assert.equal((await nextPage.cart.get()).count, 1, 'offline: the saved cart is still shown');
globalThis.fetch = shopify;
server.carts.clear(); // the order was completed on Shopify meanwhile
assert.deepEqual(await nextPage.cart.get(), { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: false });
await nextPage.cart.get();
assert.deepEqual(opsSince(mark), ['Cart'], 'asked once per page view');
assert.equal(nextPage.cart.count(), 0);
assert.equal(saved('tgc-cart').id, null);

// Page A (`live`) is left for page B (`nextPage`); a piece is added on B; Back shows A from the browser's
// cache. A must show that piece, and the next add on A must go into the same Shopify cart, not a second one.
now = await nextPage.cart.add(z);
const theirCart = saved('tgc-cart').id;
mark = calls.length;
assert.deepEqual((await live.cart.get()).lines.map((l) => l.handle), ['curiosity'], 'page A has heard nothing: it still holds its old cart');
const repaints = [];
const stopRepaints = live.cart.subscribe((x) => repaints.push(x.lines.map((l) => l.handle).join()));
backToLive({ persisted: true });
assert.deepEqual(repaints, ['zenda-beach'], 'it repaints from the saved cart as soon as the page is back');
stopRepaints();
now = await live.cart.add(p);
assert.deepEqual(opsSince(mark), ['Cart', 'Add'], 'no second cart is created');
assert.equal(calls.at(-1).variables.cartId, theirCart);
assert.deepEqual(now.lines.map((l) => l.handle), ['zenda-beach', 'postcards']);
assert.equal(saved('tgc-cart').id, theirCart);

// ...and Back from a finished checkout: the paid cart does not stay on screen
server.carts.clear();
backToLive({ persisted: true });
assert.deepEqual(await live.cart.get(), { lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: false });
assert.equal(saved('tgc-cart').id, null);

console.log('shop layer: all checks passed');
