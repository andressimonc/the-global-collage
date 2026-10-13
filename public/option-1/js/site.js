// Option 1, "The Cutting Mat": only what the look needs.
// The menu, pieces arriving on the table, scraps that shift away from the pointer, the cart receipt and the
// newsletter fields. (Products and the cart itself come from ../../shared/shop/shop.js.)

const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- arrivals: anything with [data-arrive] slides onto the table when it scrolls into view -----------------
const arriving = document.querySelectorAll('[data-arrive]');
if (still || !('IntersectionObserver' in window)) {
  arriving.forEach((el) => el.classList.add('is-in'));
} else {
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      seen.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  // whatever is on the first screen arrives at once; the rest waits to be scrolled to
  arriving.forEach((el) => (el.getBoundingClientRect().top < innerHeight ? el.classList.add('is-in') : seen.observe(el)));
  // a jump (the End key, a link to the foot of the page) can carry a piece past the observer without one frame
  // in view: once its top is above the window, it has arrived
  addEventListener('scroll', () => {
    for (const el of arriving) if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < 0) { el.classList.add('is-in'); seen.unobserve(el); }
  }, { passive: true });
}

// --- menu (phone): the nav is a sheet of paper that slides over the table --------------------------------
const header = document.querySelector('.site-header');
const menuButton = header?.querySelector('.menu-button');
if (menuButton) {
  const setMenu = (open) => {
    header.classList.toggle('menu-open', open);
    root.classList.toggle('menu-locked', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close' : 'Menu';
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuButton.focus(); }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', () => setMenu(false));
}

// --- scraps: [data-scrap] pieces within reach of the pointer shift a little away from it ------------------
const scraps = [...document.querySelectorAll('[data-scrap]')].map((el) => ({ el, x: 0, y: 0 }));
if (scraps.length && !still && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const REACH = 250, PUSH = 16;   // px: how near the pointer must be, and the most a scrap moves
  let frame = 0, px = 0, py = 0;
  const nudge = () => {
    frame = 0;
    for (const s of scraps) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -REACH || r.top > innerHeight + REACH) continue;
      const dx = r.left + r.width / 2 - s.x - px, dy = r.top + r.height / 2 - s.y - py;   // from the pointer to where the scrap rests
      const d = Math.hypot(dx, dy) || 1;
      const k = d < REACH ? ((1 - d / REACH) ** 2 * PUSH) / d : 0;
      s.x = dx * k; s.y = dy * k;
      s.el.style.setProperty('--sx', `${s.x.toFixed(1)}px`);
      s.el.style.setProperty('--sy', `${s.y.toFixed(1)}px`);
      s.el.style.setProperty('--sr', `${(s.x / 3).toFixed(2)}deg`);
    }
  };
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; frame ||= requestAnimationFrame(nudge); }, { passive: true });
}

// --- shop: the cart receipt, the header count, and "Add to cart" on the featured pieces --------------------
// Everything comes from the shared shop layer (the sample catalogue in preview). The product page is where a
// piece is bought; until it exists, each featured piece that can be bought carries its own hang-tag.
const receipt = document.querySelector('dialog.cart');
if (receipt) {
  import('../../shared/shop/shop.js').then(({ getProducts, cart, formatPrice, imageAttrs, mountSampleNote }) => {
    const part = (name) => receipt.querySelector(`[data-cart-${name}]`);
    const el = (tag, className, text = '') => Object.assign(document.createElement(tag), { className, textContent: text });
    const say = (message = '') => { part('status').textContent = message; };
    const open = () => { if (receipt.open) return; say(); receipt.showModal(); mountSampleNote(); };   // the cart shows prices: the sample note goes in with it
    const row = (line) => {
      const li = el('li', 'cart-line');
      if (line.image) li.append(Object.assign(new Image(), imageAttrs(line.image, '64px')));
      const title = el('a', 'cart-line-title', line.title);
      title.href = line.url;
      const remove = el('button', 'cart-remove', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${line.title}`);
      remove.addEventListener('click', () => cart.remove(line.id).then(() => say(), (err) => say(err.message)));
      li.append(title, el('span', 'cart-line-price', formatPrice(line.price) ?? ''), el('span', 'cart-line-meta', line.type === 'original' ? 'Original, 1 of 1' : `Quantity ${line.quantity}`), remove);
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
    part('close').addEventListener('click', () => receipt.close());
    receipt.addEventListener('click', (e) => { if (e.target === receipt) receipt.close(); });   // a click on the dimmed table
    // sample mode: the shop layer writes its own notice inside this receipt, so it stays open
    part('checkout').addEventListener('click', () => { say(); cart.checkout().catch((err) => say(err.message)); });
    getProducts().then((all) => document.querySelectorAll('.spread > li').forEach((li) => {
      const handle = new URL(li.querySelector('a.piece')?.href ?? location.href).searchParams.get('handle');
      const product = all.find((p) => p.handle === handle);
      if (!product?.available) return;
      const add = el('button', 'tag piece-add', 'Add to cart');
      add.type = 'button';
      add.setAttribute('aria-label', `Add ${product.title} to cart`);
      add.addEventListener('click', () => cart.add(product).then(open, (err) => { open(); say(err.message); }));
      li.append(add);
    })).catch(() => {});
  }).catch(() => {});   // without the shop layer the page still reads; the cart button does nothing
}

// --- newsletter fields (the shared forms layer; in preview it sends nothing) ------------------------------
const newsletters = document.querySelectorAll('form[data-form="newsletter"]');
if (newsletters.length) {
  import('../../shared/forms.js')
    .then(({ wireForm }) => newsletters.forEach((form) => wireForm(form, { kind: 'newsletter' })))
    .catch(() => newsletters.forEach((form) => form.addEventListener('submit', (e) => e.preventDefault())));
}
