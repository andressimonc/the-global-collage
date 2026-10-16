// The shop layer for all three sites: products, cart, checkout. One file, no dependencies.
// With no token in ../config.js it runs in SAMPLE mode (products.sample.json, a cart kept in this
// browser, no checkout). With a token it talks to Shopify's Storefront API. Same API either way.
//
//   import { getProducts, getProduct, cart, formatPrice, imageAttrs, zoomSrc,
//            isSample, STORY_PLACEHOLDER, mountSampleNote } from '../shared/shop/shop.js';
//
// EXPORTS
//   isSample                      boolean. true = sample catalogue and sample prices.
//   getProducts({ type } = {})    -> Promise<Product[]>. type: 'original' | 'print' | 'good' (the plurals
//                                    'originals' | 'prints' | 'goods' from ?type= work too). Omitted = all.
//                                    An empty array is a normal answer (Prints and Goods have nothing yet).
//   getProduct(handle)            -> Promise<Product | null>. null = no such piece.
//   formatPrice(price)            -> '$111', '$1,250', '$19.50'. null when price is null.
//   imageAttrs(image, sizes = '100vw') -> { alt, width, height, sizes, srcset, src }. Spread it onto an <img>:
//                                    Object.assign(img, imageAttrs(product.images[0], '(min-width: 800px) 33vw, 50vw')).
//                                    width is the widest FILE that exists, height keeps the piece's ratio. They
//                                    give the browser the shape; size the picture in CSS. See LOW-RES below.
//                                    (image null, as a cart line's can be: { alt: '', sizes }, an <img> with no file.)
//   zoomSrc(image)                -> the largest URL of that image (for the close look). null when image is null.
//   STORY_PLACEHOLDER             the text to show, styled as a placeholder, when product.story is null.
//   mountSampleNote()             call on every page that shows a price. Sample mode only: adds one small fixed,
//                                    dismissible line, class "tgc-sample-note". Restyle it freely (the defaults
//                                    have zero specificity). Does nothing in live mode or on a second call.
//   cart.get()                    -> Promise<Cart>. Live mode: the first call on a page re-checks with Shopify.
//   cart.add(product, quantity = 1) -> Promise<Cart>. REJECTS with an Error when the piece is sold or unavailable,
//                                    or when Shopify refuses. An original is capped at 1: adding one that is
//                                    already in the cart resolves with the unchanged cart (not an error).
//   cart.remove(lineId)           -> Promise<Cart>
//   cart.setQuantity(lineId, quantity) -> Promise<Cart>. 0 removes the line. An original stays at 1.
//   cart.checkout()               -> Promise<{ sample }>. Sample: goes nowhere, shows its own notice (class
//                                    "tgc-checkout-note", restyle freely) and resolves { sample: true }, so a
//                                    site that would rather say it in its own cart can. The notice is put inside
//                                    the open modal <dialog> when there is one (outside it, it could not be seen
//                                    or pressed): keep that dialog open after checkout() in sample mode.
//                                    Live: sends the browser to Shopify's checkout; rejects with
//                                    "Your cart is empty." when there is nothing to buy.
//   cart.subscribe(fn)            -> unsubscribe. fn(cart) runs after every change, in this tab or another, and
//                                    when Back brings the page out of the browser's cache with an old cart.
//                                    It does NOT run when you subscribe: paint once with cart.get().
//   cart.count()                  -> number of items, synchronously, from the saved cart (for the header).
//
// SHAPES (identical in both modes)
//   Product = { handle, title, type: 'original' | 'print' | 'good' | null, year: number | string | null,
//               number: string | null, medium: string | null, dimensions: string | null, story: string | null,
//               price: { amount: number, currency: 'USD' } | null, available: boolean,
//               badge: 'Original, 1 of 1' | null, shipping: 'Ships from Miami, insured, US only',
//               variantId, images: Image[], url: 'product.html?handle=<handle>' }
//   Image   = { sizes: { '480': absoluteUrl, '960': …, '1600': …, '2400': … }  (only the widths that exist),
//               width, height, alt (falls back to the product title), avg: '#RRGGBB' | null, lowres: boolean,
//               framed: boolean }
//             images[0] is always the piece itself (a Shopify product with no picture is not listed at all).
//             framed: true is a photo of the piece in its frame (sample catalogue only; from Shopify it is
//             always false, so treat images[1..] as extra photos).
//             width/height are Camila's original scan, which can be bigger than any file here. Do not lay
//             out with them: use imageAttrs(image).width, the widest file a page can load.
//   Cart    = { lines: Line[], count: number, subtotal: { amount, currency } | null (null when empty),
//               checkoutUrl: string | null, sample: boolean }
//   Line    = { id, handle, title, type, quantity, price, image: Image | null, url }
//   Treat all of these as read-only.
//
// RULES FOR THE SITES
//   - This file renders nothing except its two notices. You render products. Titles, stories and error
//     messages are plain text from Shopify or from Camila: set them with textContent, never innerHTML.
//   - available === false means sold: show it, mark it "Sold", no buy button. add() refuses it anyway.
//     TO SEE A SOLD PIECE in the preview (sample mode only) add &sold=<handle> to the page address:
//     shop.html?type=originals&sold=curiosity   product.html?handle=curiosity&sold=curiosity
//   - LOW-RES: when image.lowres, never show the picture wider than its file, and offer no zoom (zoomSrc
//     is that same small file):  const attrs = imageAttrs(image, sizes); Object.assign(img, attrs);
//     if (image.lowres) img.style.maxWidth = attrs.width + 'px';
//   - Every cart method can reject. Catch it and show err.message (it is written for a visitor).
//
// EXAMPLE
//   const product = await getProduct(new URLSearchParams(location.search).get('handle'));
//   title.textContent = product.title;
//   price.textContent = formatPrice(product.price) ?? '';
//   Object.assign(img, imageAttrs(product.images[0], '(min-width: 900px) 50vw, 100vw'));
//   story.textContent = product.story ?? STORY_PLACEHOLDER;
//   button.hidden = !product.available;
//   button.addEventListener('click', () => cart.add(product).then(openDrawer, (err) => { note.textContent = err.message; }));
//   const paint = (c) => { badge.textContent = c.count; };
//   cart.subscribe(paint); cart.get().then(paint);
//   mountSampleNote();
//
// SHOPIFY SETUP THIS FILE EXPECTS (live mode)
//   Collections with the handles originals, prints, goods, PUBLISHED to the same sales channel as the
//   products (an unpublished collection is invisible here). Also set each product's Product type to
//   Original, Print or Good: that is the fallback. A product with neither has no type and no 1-of-1 cap.
//   Every original: Track quantity on, 1 in stock, "Continue selling when out of stock" off. A sold piece
//   stays Active with 0 in stock so it shows as Sold (Draft or Archived makes it disappear).
//   A product with no image is not listed.
//   Product metafields, namespace "custom", readable by the Storefront API, all plain text:
//   year, dimensions, medium, story. story falls back to the product description. One variant per product.
//   Checkout runs on Shopify's primary domain. Before theglobalcollage.com points at the new site, make a
//   domain that still points at Shopify the primary one (for example shop.theglobalcollage.com, or leave
//   the myshopify.com address as primary). Otherwise checkout() lands on a page this site does not have.
import { SITE } from '../config.js';

const { domain, storefrontToken, apiVersion } = SITE.shopify;

export const isSample = !storefrontToken;
export const STORY_PLACEHOLDER = "Camila's note about this piece, the emotion behind it, goes here.";

const SAMPLE_NOTE = 'Preview: prices are samples. The real catalogue loads from Shopify.';
const CHECKOUT_NOTE = 'Preview: checkout opens on Shopify once the store is connected.';
const SHIPPING = 'Ships from Miami, insured, US only';
const ORIGINAL_BADGE = 'Original, 1 of 1';
const TYPES = ['original', 'print', 'good'];
const WIDTHS = [480, 960, 1600, 2400];
const productUrl = (handle) => 'product.html?handle=' + encodeURIComponent(handle);

// ---------- helpers the sites use ----------

export function formatPrice(price) {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, trailingZeroDisplay: 'stripIfInteger' }).format(price.amount);
}

const widthsOf = (image) => Object.keys(image.sizes).map(Number).sort((a, b) => a - b);

export function imageAttrs(image, sizes = '100vw') {
  if (!image) return { alt: '', sizes };
  const widths = widthsOf(image);
  const widest = widths.at(-1); // the scan can be wider than any file; the file is what a page can show
  const fallback = widths.filter((w) => w <= 960).pop() ?? widths[0];
  // src comes last so a browser that reads these in order has srcset before it picks a file
  return { alt: image.alt ?? '', width: widest, height: Math.round(image.height * widest / image.width), sizes, srcset: widths.map((w) => `${image.sizes[w]} ${w}w`).join(', '), src: image.sizes[fallback] };
}

export const zoomSrc = (image) => (image ? image.sizes[widthsOf(image).pop()] : null);

// ---------- products ----------

let catalogue = null;
function allProducts() {
  // a failed load is not remembered, so the next call tries again
  catalogue ??= (isSample ? sampleProducts() : liveProducts()).catch((err) => { catalogue = null; throw err; });
  return catalogue;
}

export async function getProducts({ type } = {}) {
  const want = type ? String(type).replace(/s$/, '') : null;
  return (await allProducts()).filter((p) => !want || p.type === want);
}

export async function getProduct(handle) {
  return (await allProducts()).find((p) => p.handle === handle) ?? null;
}

async function request(url, init) {
  let res;
  // 15 s with no answer is a failure the visitor is told about; without the limit one stalled request
  // would hold up every cart change queued behind it. (?. : a browser without it gets no limit.)
  try { res = await fetch(url, { ...init, signal: AbortSignal.timeout?.(15000) }); } catch { throw new Error('The shop could not be reached. Check your connection and try again.'); }
  if (!res.ok) throw new Error(`The shop is not answering right now (${res.status}). Please try again.`);
  try { return await res.json(); } catch { throw new Error('The shop sent an answer that could not be read. Please try again.'); }
}

async function sampleProducts() {
  const { products } = await request(new URL('./products.sample.json', import.meta.url));
  // preview switch: ?sold=<handle> in the page address shows that piece as sold (the file itself stays true)
  const soldForPreview = new URLSearchParams(globalThis.location?.search ?? '').getAll('sold');
  return products.map((p) => ({
    handle: p.handle, title: p.title, type: p.type, year: p.year, number: p.number, medium: p.medium,
    dimensions: p.dimensions, story: p.story, price: p.price, available: p.available && !soldForPreview.includes(p.handle), badge: p.badge,
    shipping: p.shipping, variantId: p.variantId,
    images: p.images.map((image) => ({
      ...image,
      alt: image.alt ?? p.title,
      framed: Boolean(image.framed),
      // the file stores paths relative to public/; this module sits two folders below it
      sizes: Object.fromEntries(Object.entries(image.sizes).map(([w, path]) => [w, new URL('../../' + path, import.meta.url).href])),
    })),
    url: productUrl(p.handle),
  }));
}

// ---------- Shopify (live mode) ----------

async function gql(query, variables = {}) {
  const body = await request(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': storefrontToken },
    body: JSON.stringify({ query, variables }),
  });
  // Shopify's own wording here is for developers; it rides along in err.cause
  if (body.errors?.length || !body.data) throw new Error('The shop returned an error. Please try again.', { cause: body.errors });
  return body.data;
}

// ponytail: first: 100 is the whole catalogue in one request, and getProduct() reads from it too.
// Past 100 products, page with pageInfo/endCursor and give getProduct its own product(handle:) query.
// ponytail: collections(first: 5), here and in the cart. A piece in more than five collections can lose
// "originals" from the answer and with it its type; raise the number, or rely on Product type.
const PRODUCTS_QUERY = `query Products {
  products(first: 100) {
    nodes {
      handle title description productType availableForSale
      collections(first: 5) { nodes { handle } }
      images(first: 6) { nodes { url altText width height } }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 1) { nodes { id availableForSale price { amount currencyCode } } }
      metafields(identifiers: [
        { namespace: "custom", key: "year" }, { namespace: "custom", key: "dimensions" },
        { namespace: "custom", key: "medium" }, { namespace: "custom", key: "story" }
      ]) { key value }
    }
  }
}`;

// ponytail: lines(first: 100) is the most a cart can show here; nobody buys 100 different pieces.
const CART_FIELDS = `fragment CartFields on Cart {
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) { nodes { id quantity merchandise { ... on ProductVariant {
    id price { amount currencyCode } image { url altText width height }
    product { handle title productType collections(first: 5) { nodes { handle } } }
  } } } }
}`;
const PAYLOAD = '{ cart { ...CartFields } userErrors { field message } }';
const CART_QUERY = `query Cart($id: ID!) { cart(id: $id) { ...CartFields } } ${CART_FIELDS}`;
const CART_MUTATIONS = {
  cartCreate: `mutation Create($input: CartInput!) { cartCreate(input: $input) ${PAYLOAD} } ${CART_FIELDS}`,
  cartLinesAdd: `mutation Add($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) ${PAYLOAD} } ${CART_FIELDS}`,
  cartLinesRemove: `mutation Remove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) ${PAYLOAD} } ${CART_FIELDS}`,
  cartLinesUpdate: `mutation Update($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) ${PAYLOAD} } ${CART_FIELDS}`,
};

const money = (m) => (m ? { amount: Number(m.amount), currency: m.currencyCode } : null);

function typeOf({ collections, productType }) {
  const handles = collections.nodes.map((c) => c.handle);
  const fromType = (productType ?? '').trim().toLowerCase().replace(/s$/, '');
  return TYPES.find((t) => handles.includes(t + 's')) ?? (TYPES.includes(fromType) ? fromType : null);
}

function toImage({ url, altText, width, height }, title) {
  const fits = WIDTHS.filter((w) => !width || w <= width); // never ask for more pixels than the file has
  const sizes = Object.fromEntries((fits.length ? fits : [width]).map((w) => {
    const sized = new URL(url);
    sized.searchParams.set('width', w);
    return [w, sized.href];
  }));
  return { sizes, width, height, alt: altText || title, avg: null, lowres: Boolean(width) && width < 1600, framed: false };
}

function toProduct(node) {
  const type = typeOf(node);
  const variant = node.variants.nodes[0];
  const meta = Object.fromEntries(node.metafields.filter(Boolean).map((m) => [m.key, m.value]));
  return {
    handle: node.handle,
    title: node.title,
    type,
    year: meta.year ? Number(meta.year) || meta.year : null,
    number: null,
    medium: meta.medium || null,
    dimensions: meta.dimensions || null,
    story: meta.story || node.description || null,
    price: money(variant?.price ?? node.priceRange.minVariantPrice),
    available: Boolean(node.availableForSale && variant?.availableForSale),
    badge: type === 'original' ? ORIGINAL_BADGE : null,
    shipping: SHIPPING,
    variantId: variant?.id ?? null,
    images: node.images.nodes.map((image) => toImage(image, node.title)),
    url: productUrl(node.handle),
  };
}

// Her Shopify products have no pictures yet (2026-10-16). Until they do, a piece borrows this site's own web
// files of it, and the year from her file names. Three pieces carry a different name in Shopify.
const LOCAL_NAMES = { 'let-it-out': 'let-out', 'gaga-ate': 'gagas-offering', 'dibujo-libre': 'day-no-25' };
const localImages = new Map(); // Shopify handle -> borrowed images, for cart lines too

async function liveProducts() {
  const [data, local] = await Promise.all([gql(PRODUCTS_QUERY), sampleProducts().catch(() => [])]);
  const own = new Map(local.map((p) => [p.handle, p]));
  // a product with no picture is left out, so images[0] is there for every piece a site is handed
  return data.products.nodes.map(toProduct).map((p) => {
    const mine = own.get(LOCAL_NAMES[p.handle] ?? p.handle);
    if (p.images.length || !mine) return p;
    localImages.set(p.handle, mine.images);
    return { ...p, images: mine.images, year: p.year ?? mine.year };
  }).filter((p) => p.images.length);
}

function toCart(c) {
  const lines = c.lines.nodes.map(({ id, quantity, merchandise: m }) => ({
    id, handle: m.product.handle, title: m.product.title, type: typeOf(m.product), quantity,
    price: money(m.price), image: m.image ? toImage(m.image, m.product.title) : localImages.get(m.product.handle)?.[0] ?? null, url: productUrl(m.product.handle),
  }));
  return { lines, count: c.totalQuantity, subtotal: lines.length ? money(c.cost.subtotalAmount) : null, checkoutUrl: c.checkoutUrl, sample: false };
}

// ---------- the cart: one saved { id, cart } per browser ----------

const KEY = isSample ? 'tgc-cart-sample' : 'tgc-cart';
const emptyCart = () => ({ lines: [], count: 0, subtotal: null, checkoutUrl: null, sample: isSample });
const listeners = new Set();

// The saved cart is only believed when it has the shape this file saves (an older build of the site, or
// anything else on this address, may have written it). Otherwise it reads as empty instead of breaking
// every page that paints the cart. Count and subtotal are worked out again, never read back.
const isMoney = (p) => p == null || (Number.isFinite(p.amount) && /^[A-Z]{3}$/.test(p.currency));
const isLine = (l) => typeof l?.id === 'string' && typeof l.handle === 'string' && typeof l.title === 'string'
  && Number.isInteger(l.quantity) && l.quantity >= 1 && (l.type !== 'original' || l.quantity === 1)
  && isMoney(l.price) && (l.image == null || Object.keys(l.image.sizes ?? {}).length > 0);

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* blocked or corrupt storage: start empty */ }
  // live mode keeps a saved cart id whatever else is wrong, so cart.get() can ask Shopify for the real cart
  const id = !isSample && typeof saved?.id === 'string' ? saved.id : null;
  const c = saved?.cart;
  if (!Array.isArray(c?.lines) || !c.lines.every(isLine)) return { id, cart: emptyCart() };
  if (isSample) return { id, cart: tally(c.lines) };
  if (!id || !isMoney(c.subtotal)) return { id, cart: emptyCart() }; // a Shopify cart without its id is not a cart
  const checkoutUrl = typeof c.checkoutUrl === 'string' && c.checkoutUrl.startsWith('https://') ? c.checkoutUrl : null;
  return { id, cart: { ...tally(c.lines), subtotal: c.lines.length ? c.subtotal ?? null : null, checkoutUrl, sample: false } };
}
let state = load(); // id is Shopify's cart id (always null in sample mode)
let synced = null; // live mode: the once-per-page check that Shopify still has the saved cart

function tell() {
  for (const fn of [...listeners]) {
    try { fn(state.cart); } catch (err) { console.error(err); } // one broken listener must not fail an add
  }
}

function commit(nextCart, id = state.id) {
  state = { id, cart: nextCart };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked: the cart lasts for this page */ }
  tell();
}

// another tab changed the cart
globalThis.addEventListener?.('storage', (e) => {
  if (e.key === KEY || e.key === null) { state = load(); tell(); }
});

// Back or Forward brought this page out of the browser's cache: it still holds the cart from when the
// visitor left, and it heard none of the changes since. Read the saved cart again and repaint; in live
// mode also ask Shopify again (the visitor may be coming back from a finished checkout).
globalThis.addEventListener?.('pageshow', (e) => {
  if (!e.persisted) return;
  state = load();
  synced = null;
  tell();
  if (!isSample) cart.get().catch(() => {});
});

// Cart changes run one at a time, so a double click cannot add an original twice.
let tail = Promise.resolve();
function inOrder(job) {
  const run = tail.then(() => job());
  tail = run.catch(() => {});
  return run;
}

const lineOf = (lineId) => state.cart.lines.find((l) => l.id === lineId);
const quantityOf = (handle) => state.cart.lines.find((l) => l.handle === handle)?.quantity ?? 0;
const wholeNumber = (n, min) => { if (!Number.isInteger(n) || n < min) throw new Error('Quantity must be a whole number.'); };

function tally(lines) {
  const priced = lines.filter((l) => l.price);
  const amount = Math.round(priced.reduce((sum, l) => sum + l.price.amount * l.quantity, 0) * 100) / 100;
  return {
    lines, count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: priced.length ? { amount, currency: priced[0].price.currency } : null, checkoutUrl: null, sample: true,
  };
}

const sampleCart = {
  add(product, quantity) {
    const lines = state.cart.lines.map((l) => (l.handle === product.handle ? { ...l, quantity: l.quantity + quantity } : l));
    if (!quantityOf(product.handle)) {
      lines.push({ id: product.variantId, handle: product.handle, title: product.title, type: product.type, quantity, price: product.price, image: product.images[0] ?? null, url: product.url });
    }
    commit(tally(lines));
  },
  remove(lineId) { commit(tally(state.cart.lines.filter((l) => l.id !== lineId))); },
  update(lineId, quantity) { commit(tally(state.cart.lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)))); },
};

// Runs a mutation on the saved Shopify cart and returns its payload. Returns null when Shopify no
// longer has that cart (it expired, or it was completed at checkout): the saved cart is forgotten.
async function onSavedCart(field, variables) {
  const { id } = state;
  const payload = (await gql(CART_MUTATIONS[field], { cartId: id, ...variables }))[field];
  if (payload.cart || (await gql(CART_QUERY, { id })).cart) return payload;
  commit(emptyCart(), null);
  return null;
}

function settle({ cart: fresh, userErrors }) {
  if (fresh) commit(toCart(fresh), fresh.id);
  if (!fresh || userErrors?.length) {
    throw new Error(userErrors?.map((e) => e.message).filter(Boolean).join(' ') || 'The cart could not be updated. Please try again.');
  }
}

const liveCart = {
  async add(product, quantity) {
    const lines = [{ merchandiseId: product.variantId, quantity }];
    // no saved cart, or the saved one is gone: start a new one quietly
    const payload = (state.id && (await onSavedCart('cartLinesAdd', { lines }))) || (await gql(CART_MUTATIONS.cartCreate, { input: { lines } })).cartCreate;
    settle(payload);
  },
  async remove(lineId) {
    const payload = await onSavedCart('cartLinesRemove', { lineIds: [lineId] });
    if (payload) settle(payload);
  },
  async update(lineId, quantity) {
    const payload = await onSavedCart('cartLinesUpdate', { lines: [{ id: lineId, quantity }] });
    if (payload) settle(payload);
  },
};

const backend = isSample ? sampleCart : liveCart;

async function sync() {
  if (!state.id) return;
  try {
    const { cart: fresh } = await gql(CART_QUERY, { id: state.id });
    commit(fresh ? toCart(fresh) : emptyCart(), fresh ? state.id : null);
  } catch {
    synced = null; // could not ask: keep showing the saved cart and ask again on the next get()
  }
}

export const cart = {
  async get() {
    if (!isSample) await (synced ??= inOrder(sync));
    return state.cart;
  },

  count: () => state.cart.count,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  add(product, quantity = 1) {
    return inOrder(async () => {
      if (!product?.available || !product.variantId) throw new Error(`${product?.title ?? 'This piece'} is no longer available.`);
      wholeNumber(quantity, 1);
      const had = quantityOf(product.handle);
      if (product.type === 'original') {
        if (had) return state.cart; // 1 of 1 and already in the cart
        quantity = 1;
      }
      const cartId = state.id;
      await backend.add(product, quantity);
      // Shopify can answer without an error and still not add a piece that just sold. Check.
      // (If the saved cart was gone and a new one was started, what the old one held does not count.)
      if (quantityOf(product.handle) <= (state.id === cartId ? had : 0)) throw new Error(`${product.title} could not be added. It may have just sold.`);
      return state.cart;
    });
  },

  remove(lineId) {
    return inOrder(async () => {
      if (lineOf(lineId)) await backend.remove(lineId);
      return state.cart;
    });
  },

  setQuantity(lineId, quantity) {
    return inOrder(async () => {
      wholeNumber(quantity, 0);
      const line = lineOf(lineId);
      if (!line) return state.cart;
      if (line.type === 'original') quantity = Math.min(quantity, 1);
      if (quantity === 0) await backend.remove(lineId);
      else if (quantity !== line.quantity) await backend.update(lineId, quantity);
      return state.cart;
    });
  },

  async checkout() {
    if (isSample) {
      const line = showNote('tgc-checkout-note', '');
      if (line) {
        line.setAttribute('role', 'status');
        await new Promise((r) => setTimeout(r, 50)); // a screen reader announces text that changes inside a live region
        line.textContent = CHECKOUT_NOTE;
      }
      return { sample: true };
    }
    const current = await cart.get();
    if (!current.count || !current.checkoutUrl) throw new Error('Your cart is empty.');
    location.href = current.checkoutUrl;
    return { sample: false };
  },
};

// ---------- the two notices (the only things this file puts on a page) ----------

// :where() gives these defaults zero specificity, so any site rule for the same class wins.
const NOTE_CSS = `:where(.tgc-sample-note, .tgc-checkout-note) { position: fixed; z-index: 2147483000; left: 12px; box-sizing: border-box;
  max-width: calc(100% - 24px); display: flex; gap: 12px; align-items: center; padding: 8px 12px;
  font-size: 13px; line-height: 1.4; color: #231F20; background: #fff; border: 1px solid currentColor; }
:where(.tgc-sample-note) { bottom: 12px; }
:where(.tgc-checkout-note) { top: 12px; right: 12px; width: fit-content; margin-inline: auto; }`;

// Adds the notice (or finds the one already showing) and returns the element holding its text.
function showNote(className, text) {
  if (typeof document === 'undefined') return null;
  let note = document.querySelector('.' + className);
  if (!note) {
    if (!document.querySelector('style[data-tgc-notes]')) {
      const style = document.createElement('style');
      style.dataset.tgcNotes = '';
      style.textContent = NOTE_CSS;
      document.head.prepend(style);
    }
    note = document.createElement('div');
    note.className = className;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Dismiss this note');
    close.addEventListener('click', () => note.remove());
    note.append(document.createElement('span'), close);
  }
  // An open modal <dialog> (a cart drawer) is painted over the rest of the page and switches it off,
  // whatever the z-index, so the note goes inside it. (try: an old browser throws on ":modal".)
  let host = null;
  try { host = document.querySelector('dialog:modal'); } catch { /* no modal dialogs here */ }
  host ??= document.body;
  if (note.parentNode !== host) host.append(note);
  note.firstElementChild.textContent = text;
  return note.firstElementChild;
}

let sampleNoteMounted = false;
export function mountSampleNote() {
  if (!isSample || sampleNoteMounted) return;
  sampleNoteMounted = true; // once per page view, and it stays gone after it is dismissed
  showNote('tgc-sample-note', SAMPLE_NOTE);
}
