// The Global Collage — Option 3 "Sticker Pop". What the look needs on every page:
// the phone menu, the reveals, the play table (drag the pieces) and the footer newsletter.
// The shop (cart drawer, cart count, product grids) is wired per page from ../shared/shop/shop.js.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- phone menu ----
const head = document.querySelector('.head');
const menuBtn = document.querySelector('.menubtn');
if (head && menuBtn) {
  const setOpen = (open) => {
    head.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('is-locked', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setOpen(!head.classList.contains('is-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && head.classList.contains('is-open')) { setOpen(false); menuBtn.focus(); } });
  matchMedia('(min-width: 960px)').addEventListener('change', () => setOpen(false));
}

// ---- reveals: [data-reveal] and the play table get .is-in when they come into view ----
const toReveal = document.querySelectorAll('[data-reveal], [data-table] .table');
if (reduced || !('IntersectionObserver' in window)) {
  toReveal.forEach((el) => el.classList.add('is-in'));
} else {
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      seen.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  toReveal.forEach((el) => seen.observe(el));
  // a jump (the End key, a link to the foot of the page) can carry something past the observer without one
  // frame in view: once its top is above the window, it has arrived
  addEventListener('scroll', () => {
    for (const el of toReveal) if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < 0) { el.classList.add('is-in'); seen.unobserve(el); }
  }, { passive: true });
}

// ---- the play table: drag any [data-piece] inside [data-table] with mouse, pen or finger ----
// A piece keeps its centre inside the table, comes to the front when picked up, and the page
// works the same if nobody ever touches one.
for (const table of document.querySelectorAll('[data-table]')) {
  const layer = table.querySelector('.table');
  let front = 10;
  for (const piece of table.querySelectorAll('[data-piece]')) {
    let pointer = null, startX = 0, startY = 0, dx = 0, dy = 0, min = [0, 0], max = [0, 0];
    piece.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const box = table.getBoundingClientRect(), me = piece.getBoundingClientRect();
      const cx = me.left + me.width / 2, cy = me.top + me.height / 2;
      min = [dx + box.left - cx, dy + box.top - cy];
      max = [dx + box.right - cx, dy + box.bottom - cy];
      pointer = e.pointerId; startX = e.clientX - dx; startY = e.clientY - dy;
      piece.setPointerCapture(pointer);
      piece.style.zIndex = String(++front);
      piece.classList.add('is-held');
      layer?.classList.add('is-played');
    });
    piece.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointer) return;
      dx = Math.min(max[0], Math.max(min[0], e.clientX - startX));
      dy = Math.min(max[1], Math.max(min[1], e.clientY - startY));
      piece.style.setProperty('--dx', `${dx}px`);
      piece.style.setProperty('--dy', `${dy}px`);
    });
    const drop = (e) => { if (e.pointerId === pointer) { pointer = null; piece.classList.remove('is-held'); } };
    piece.addEventListener('pointerup', drop);
    piece.addEventListener('pointercancel', drop);
    // a new layout (phone turned, window resized across the breakpoint) puts the pieces back
    matchMedia('(max-width: 759px)').addEventListener('change', () => { dx = dy = 0; piece.style.removeProperty('--dx'); piece.style.removeProperty('--dy'); });
  }
}

// ---- shop: the cart drawer, the header count, and "Add to cart" on the featured six ----
// Everything comes from the shared shop layer (the sample catalogue in preview). The product pages are where a
// piece is bought; until they exist, each featured piece that can be bought carries its own button.
const drawer = document.querySelector('dialog.cart');
if (drawer) {
  import('../../shared/shop/shop.js').then(({ getProducts, cart, formatPrice, imageAttrs, mountSampleNote }) => {
    const part = (name) => drawer.querySelector(`[data-cart-${name}]`);
    const el = (tag, className, text = '') => Object.assign(document.createElement(tag), { className, textContent: text });
    const say = (message = '') => { part('status').textContent = message; };
    const open = () => { if (drawer.open) return; say(); drawer.showModal(); mountSampleNote(); };   // the cart shows prices: the sample note goes in with it
    const row = (line) => {
      const li = el('li', 'cart__line');
      if (line.image) {
        const pic = el('span', 'sticker sticker--rect');
        pic.style.setProperty('--r', '-2deg');
        pic.append(Object.assign(new Image(), imageAttrs(line.image, '84px')));
        li.append(pic);
      }
      const words = el('div');
      const title = el('a', 'cart__title', line.title);
      title.href = line.url;
      words.append(title, el('span', 'cart__meta', line.type === 'original' ? 'Original, 1 of 1' : `Quantity ${line.quantity}`), el('span', 'cart__meta', formatPrice(line.price) ?? ''));
      const remove = el('button', 'cart__remove', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${line.title}`);
      remove.addEventListener('click', () => cart.remove(line.id).then(() => say(), (err) => say(err.message)));
      li.append(words, remove);
      return li;
    };
    const paint = (now) => {
      document.querySelectorAll('[data-cart-count]').forEach((n) => { n.textContent = now.count; });
      document.querySelectorAll('[data-cart-open]').forEach((b) => b.setAttribute('aria-label', `Cart, ${now.count} ${now.count === 1 ? 'item' : 'items'}`));
      part('lines').replaceChildren(...now.lines.map(row));
      part('empty').hidden = now.count > 0;
      part('foot').hidden = now.count === 0;
      part('subtotal').textContent = formatPrice(now.subtotal) ?? '';
    };
    cart.subscribe(paint);
    cart.get().then(paint, () => {});
    document.querySelectorAll('[data-cart-open]').forEach((b) => b.addEventListener('click', open));
    part('close').addEventListener('click', () => drawer.close());
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });   // a click on the dimmed page
    // sample mode: the shop layer writes its own notice inside this drawer, so it stays open
    part('checkout').addEventListener('click', () => { say(); cart.checkout().catch((err) => say(err.message)); });
    getProducts().then((all) => document.querySelectorAll('[data-featured] > li[data-handle]').forEach((li) => {
      const product = all.find((p) => p.handle === li.dataset.handle);
      if (!product?.available) return;
      const add = el('button', 'card__add', 'Add to cart');
      add.type = 'button';
      add.setAttribute('aria-label', `Add ${product.title} to cart`);
      add.addEventListener('click', () => cart.add(product).then(open, (err) => { open(); say(err.message); }));
      li.append(add);
    })).catch(() => {});
  }).catch(() => {});   // without the shop layer the page still reads; the cart button does nothing
}

// ---- newsletter fields (footer on every page, and Home's "Stay in touch") ----
const newsletters = document.querySelectorAll('form[data-newsletter]');
if (newsletters.length) {
  import('../../shared/forms.js')
    .then(({ wireForm }) => newsletters.forEach((form) => wireForm(form, { kind: 'newsletter' })))
    .catch(() => {});   // without the forms layer the field simply does nothing
}
