// The Global Collage: shared motion kit. One plain ES module, no dependencies. Its CSS half is
// motion.css; link that on EVERY page (it also turns on the page-to-page transitions).
//
// SET-UP, every page, in the <head>, after the stylesheets:
//   <link rel="stylesheet" href="../shared/motion.css">
//   <script type="module" blocking="render">import { init } from '../shared/motion.js'; init();</script>
// blocking="render" holds the first paint until init() has run (the whole page is parsed by then),
// so a first-screen headline is split before anyone sees it instead of flashing whole and then
// animating. Calling init() from your own module at the end of the page also works, with that flash.
//
// THE ONE RULE: nothing is hidden unless this script armed it. With JavaScript off, in a background
// tab, in print or with reduced motion the page is simply all there. Keep it true in your own CSS:
// write hidden starting states only under  [data-armed]:not(.is-in)  and scroll/pointer effects with
// a resting fallback:  var(--v, 0)  var(--p, 1)  var(--mx, 0)  var(--dx, 0px).
//
// EXPORTS
//   reduced                       boolean, live: true while the visitor asks for reduced motion.
//                                   if (!reduced) myOwnEffect();
//   init({ words = '[data-words]', reveal = '[data-reveal]', scroll = '[data-scroll]',
//          pointer = true, piece = 'a[data-piece]' } = {})
//                                 runs splitWords, reveal, scrollVars, pointerVars and pieceTransition
//                                 with their defaults. Safe on every page and more than once. Pass false
//                                 to leave one out. Reduced motion: does nothing (content is visible)
//                                 except remember the pressed picture for the product page.
//                                   init();
//   splitWords(el, { by = 'word' } = {})  -> the inner spans (Element[])
//                                 wraps every word (by: 'char' = every letter) in
//                                 <span class="w"><span class="wi" style="--i:n">word</span></span>,
//                                 n counting from 0. Spaces, <br> and inner tags (<em>, <span>) stay.
//                                 Idempotent. On a heading, link, button or [role] the full text goes in
//                                 aria-label and the spans are aria-hidden; on anything else (a <p>, a
//                                 <div>) the spans are left readable, because a label is not announced
//                                 there. init() does this for [data-words] (data-words="char" for letters).
//                                   splitWords(document.querySelector('h1'));
//   reveal(root = document, { selector = '[data-reveal]' } = {})
//                                 arms (data-armed) only the matches that are below the screen right
//                                 now, then adds class "is-in" once each scrolls into view. Call it
//                                 again on anything you render later:  reveal(grid);
//                                 Safety: if frames are not being painted, or after 2.5 s with no
//                                 observation, or at the end of the page, everything left is revealed.
//   scrollVars(root = document, { selector = '[data-scroll]' } = {})
//                                 while a match is on screen it gets --p (0 as its top touches the
//                                 bottom of the screen, 1 as its bottom leaves the top) and --v (the same,
//                                 -1 to 1, 0 = centred). <html> gets --scroll-y (a length, "312px") and
//                                 --scroll-dir (1 down, -1 up). One listener, one frame callback.
//                                   scrollVars();
//   pointerVars(el = document.documentElement, { ease = 0.12 } = {})  -> stop()
//                                 --mx / --my on el, -1 to 1 across it (the screen for <html>), eased
//                                 toward the pointer, back to 0 when it leaves. Nothing on touch screens.
//                                   const stop = pointerVars(document.querySelector('.table'));
//   magnetic(target, { strength = 0.3, radius = 90 } = {})  -> stop()
//                                 target: a selector, an element or a list. Each one leans toward a
//                                 pointer within radius px of its edge and eases back. Uses the
//                                 `translate` property, so your `transform` is untouched. For a few
//                                 buttons, not a whole grid. Nothing on touch screens.
//                                   magnetic('.dock button');
//   draggable(el, { bounds = el.parentElement, onDrop } = {})  -> destroy()
//                                 mouse and touch dragging; position is written to --dx / --dy on el
//                                 (lengths) and YOUR css applies it. Kept inside bounds (null = free), a
//                                 small throw on release, arrow keys move it 16 px when focused, class
//                                 "is-dragging" while held, z-index counts up so the last piece moved
//                                 is on top. A press that does not move still clicks links inside.
//                                 onDrop({ el, x, y }) gets the resting position.
//                                   draggable(piece, { bounds: table });
//   pieceTransition({ linkSelector = 'a[data-piece]' } = {})
//                                 listing pages (init() runs it). Carries a card's picture to the
//                                 product page and back; see THE PIECE below.
//   pieceHero(img = document.getElementById('piece-hero'))
//                                 product page. Shows the pressed picture at once and receives it.
//
// HTML / CSS CONTRACT
//   data-words            on a headline: split by init(). Words rise one by one, .07 s apart, as soon
//                         as it is split. Tune on the element: --words-dur (1.1s), --words-step (.07s),
//                         --words-delay (0s). Add data-reveal as well and a headline below the first
//                         screen waits until it scrolls into view. Not for underlined text (an
//                         underline does not cross into the word boxes).
//   data-reveal           "" (rises 40 px) | "down" | "left" | "right" | "fade" | "clip" (wipes open
//                         from the top). Tune: --reveal-dist (40px, inherits, so :root works),
//                         --reveal-dur (1.2s). Elements already on the first screen are never armed:
//                         they are just there (design your own load-in for those).
//   data-reveal-delay     milliseconds added to that element's entrance: data-reveal-delay="160".
//   data-stagger          on any ancestor: matches arriving together follow each other by that many
//                         milliseconds (data-stagger alone = 70).
//   data-armed, .is-in    set by reveal(). Hang your own effects on them:
//                           [data-armed]:not(.is-in) .rule { scale: 0 1; }   .rule { transition: scale 1s; }
//                         The kit's entrance is an animation using `translate` and `opacity`, so do
//                         not put your own `animation` on a [data-reveal] element (wrap it instead);
//                         your `transform` and `transition` are safe. left/right need an ancestor with
//                         overflow-x: clip or the page can scroll sideways for a moment.
//   data-scroll           on a SECTION that does not itself move with --p; its children inherit --p
//                         and --v and move:   .word { translate: calc(var(--v, 0) * -30vw) 0; }
//   --mx, --my            .layer { translate: calc(var(--mx, 0) * 14px) calc(var(--my, 0) * 10px); }
//   --dx, --dy            .piece { transform: translate(var(--dx, 0px), var(--dy, 0px)) rotate(-4deg); }
//                         Give the table `isolation: isolate` so raised pieces never climb over a menu.
//                         While it can be dragged an element has touch-action: none (a thumb on it
//                         drags it instead of scrolling the page).
//   .w, .wi, .ww          made by splitWords: mask, moving word, and (char mode) the whole word.
//
// PAGE-TO-PAGE (motion.css): the old page fades and slides up, the new one slides in. To design your
// own, redefine @keyframes vt-out and vt-in in your CSS, or write your own ::view-transition-old(root)
// and ::view-transition-new(root) rules; --vt-out-dur / --vt-in-dur / --vt-piece-dur on :root set the
// lengths. Give <html> a background colour: it is what shows between the two pages.
//
// THE PIECE (a picture that flies from a card to the product page)
//   Listing (Home featured, Shop grid). The handle is read from ?handle= in the href (or from
//   data-piece="handle"); the <img> needs width and height attributes:
//     <a data-piece href="product.html?handle=curiosity"><img …></a>
//   Cards rendered later by script need nothing extra. Pressing one saves { handle, src, width,
//   height, from } in sessionStorage "tgc-piece".
//   Product page, exactly this:
//     <head> …
//       <link rel="stylesheet" href="../shared/motion.css">
//       <link rel="expect" blocking="render" href="#piece-hero">
//       <script type="module" blocking="render">
//         import { init, pieceHero } from '../shared/motion.js';
//         pieceHero(); init();
//       </script>
//     </head> … <img id="piece-hero" alt=""> …
//   pieceHero() sets src, width and height from the saved card (when its handle is the one in the
//   address) before the shop data arrives, and names the picture for the flight. When the product
//   loads, set it as usual (Object.assign(img, imageAttrs(...))): the sharper file swaps in.
//   Keep it in the <head> with blocking="render": that is what guarantees it runs before the first
//   paint. A plain module after the <img> in the body also carried the picture on the local preview,
//   but only by winning a race with the first paint; when it loses, the picture is simply there.
//   Going back: the picture flies home when the listing comes back from the browser's back button,
//   or when the listing's cards are in its HTML and init() runs render-blocking in its head. A grid
//   drawn by script after a fresh load gets the plain page transition. Pictures must be opaque.
//   No support (Firefox today): ordinary page loads, the picture still shows at once.

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export let reduced = mq.matches;
mq.addEventListener('change', () => { reduced = mq.matches; });

const PIECE = 'tgc-piece';
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
const list = (target, root = document) => (typeof target === 'string' ? [...root.querySelectorAll(target)] : target instanceof Element ? [target] : [...(target ?? [])]);
const readPiece = () => { try { return JSON.parse(sessionStorage.getItem(PIECE)); } catch { return null; } };

// An eased pair of numbers: aim(x, y) sets where to go, set(x, y) is called each frame until it is there.
function follower(set, ease, rest) {
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, last = 0;
  const frame = (now) => {
    const k = 1 - (1 - ease) ** (clamp(now - last, 4, 64) / 16.7); // same feel at 60 and 120 Hz
    last = now;
    x += (tx - x) * k; y += (ty - y) * k;
    const there = Math.abs(tx - x) + Math.abs(ty - y) < rest;
    if (there) { x = tx; y = ty; }
    set(x, y);
    raf = there ? 0 : requestAnimationFrame(frame);
  };
  const aim = (nx, ny) => {
    if (nx === tx && ny === ty) return;
    tx = nx; ty = ny;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  aim.stop = () => { cancelAnimationFrame(raf); raf = 0; };
  return aim;
}

export function splitWords(el, { by = 'word' } = {}) {
  if (el.dataset.split) return [...el.querySelectorAll('.wi')];
  el.dataset.split = by;
  // a label only reaches a screen reader on elements that can carry a name; elsewhere the words stay readable
  const named = el.matches('h1,h2,h3,h4,h5,h6,a,button,[role]') && !el.querySelector('a,button,input,select,textarea');
  if (named && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
  const texts = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) texts.push(walker.currentNode);
  let i = 0;
  const wrap = (text) => {
    const w = document.createElement('span'), wi = document.createElement('span');
    w.className = 'w'; wi.className = 'wi'; wi.textContent = text;
    w.style.setProperty('--i', i); wi.style.setProperty('--i', i++);
    if (named) w.setAttribute('aria-hidden', 'true');
    w.append(wi);
    return w;
  };
  for (const node of texts) {
    const out = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part.trim()) out.append(part); // spaces and line breaks stay exactly as they were
      else if (by === 'char') { const word = document.createElement('span'); word.className = 'ww'; word.append(...[...part].map(wrap)); out.append(word); }
      else out.append(wrap(part));
    }
    node.replaceWith(out);
  }
  return [...el.querySelectorAll('.wi')];
}

export function reveal(root = document, { selector = '[data-reveal]' } = {}) {
  if (reduced || !('IntersectionObserver' in window)) return;
  const waiting = new Set(list(selector, root).filter((el) => !el.hasAttribute('data-armed') && el.getBoundingClientRect().top > innerHeight));
  if (!waiting.size) return;
  let frames = false, observed = false;
  const show = (el, extra = 0) => {
    waiting.delete(el); io.unobserve(el);
    const delay = (Number(el.dataset.revealDelay) || 0) + extra;
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('is-in');
  };
  const all = () => { [...waiting].forEach((el) => show(el)); removeEventListener('scroll', atEnd); };
  // the last lines of a page can never rise past the trigger line, so the end of the page reveals the rest;
  // and anything jumped clean over (an anchor link, the End key) never meets the observer, so show what is now above the screen
  const atEnd = () => {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) return all();
    for (const el of [...waiting]) if (el.getBoundingClientRect().bottom < 0) show(el);
  };
  const io = new IntersectionObserver((entries) => {
    observed = true;
    const batch = new Map(); // how many of each stagger group arrived together
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting || !waiting.has(target)) continue;
      const group = target.parentElement?.closest('[data-stagger]'), n = batch.get(group) ?? 0;
      batch.set(group, n + 1);
      show(target, group ? n * (Number(group.dataset.stagger) || 70) : 0);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const el of waiting) { el.setAttribute('data-armed', ''); io.observe(el); }
  addEventListener('scroll', atEnd, { passive: true });
  // safety: a page that is not being painted (background tab, stalled frames) never keeps content hidden
  requestAnimationFrame(() => { frames = true; });
  setTimeout(() => { if (!frames || !observed) all(); }, 2500);
}

const tracked = new Set();
let scrollIO = null, scrollQueued = false, lastY = 0;
function scrollFrame() {
  scrollQueued = false;
  const html = document.documentElement, y = scrollY, vh = innerHeight;
  // ponytail: an inherited property on <html> restyles the page each scrolled frame; fine at this size, move it to one element if a page ever stutters
  html.style.setProperty('--scroll-y', `${Math.round(y)}px`);
  if (y !== lastY) html.style.setProperty('--scroll-dir', y > lastY ? 1 : -1);
  lastY = y;
  for (const el of tracked) {
    const r = el.getBoundingClientRect(), p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    el.style.setProperty('--p', p.toFixed(4));
    el.style.setProperty('--v', (p * 2 - 1).toFixed(4));
  }
}
const scrollQueue = () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(scrollFrame); } };

export function scrollVars(root = document, { selector = '[data-scroll]' } = {}) {
  if (reduced || !('IntersectionObserver' in window)) return;
  if (!scrollIO) {
    scrollIO = new IntersectionObserver((entries) => {
      for (const e of entries) tracked.add(e.target);
      scrollFrame(); // arriving and leaving both get one exact value, so --p ends on 0 or 1
      for (const e of entries) if (!e.isIntersecting) tracked.delete(e.target);
    });
    lastY = scrollY;
    document.documentElement.style.setProperty('--scroll-dir', 1);
    addEventListener('scroll', scrollQueue, { passive: true });
    addEventListener('resize', scrollQueue, { passive: true });
    scrollFrame();
  }
  list(selector, root).forEach((el) => scrollIO.observe(el));
}

export function pointerVars(el = document.documentElement, { ease = 0.12 } = {}) {
  if (reduced || !finePointer()) return () => {};
  const aim = follower((x, y) => { el.style.setProperty('--mx', x.toFixed(4)); el.style.setProperty('--my', y.toFixed(4)); }, ease, 0.0005);
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    const r = el === document.documentElement ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : el.getBoundingClientRect();
    aim(clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1), clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1));
  };
  const leave = () => aim(0, 0);
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave);
    aim.stop(); el.style.removeProperty('--mx'); el.style.removeProperty('--my');
  };
}

export function magnetic(target, { strength = 0.3, radius = 90 } = {}) {
  if (reduced || !finePointer()) return () => {};
  const items = list(target).map((el) => {
    const it = { el, x: 0, y: 0 };
    it.aim = follower((x, y) => { it.x = x; it.y = y; el.style.translate = x || y ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : ''; }, 0.16, 0.05);
    return it;
  });
  const move = (e) => {
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2 - it.x), dy = e.clientY - (r.top + r.height / 2 - it.y); // from where it rests
      const gap = Math.hypot(Math.max(Math.abs(dx) - r.width / 2, 0), Math.max(Math.abs(dy) - r.height / 2, 0));
      const pull = gap < radius ? strength * (1 - gap / radius) : 0;
      it.aim(dx * pull, dy * pull);
    }
  };
  const leave = () => items.forEach((it) => it.aim(0, 0));
  addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  return () => {
    removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave);
    items.forEach((it) => { it.aim.stop(); it.el.style.translate = ''; });
  };
}

let dragZ = 0;
export function draggable(el, { bounds = el.parentElement, onDrop } = {}) {
  const pos = () => ({ x: parseFloat(el.style.getPropertyValue('--dx')) || 0, y: parseFloat(el.style.getPropertyValue('--dy')) || 0 });
  const put = (x, y) => { el.style.setProperty('--dx', `${x.toFixed(1)}px`); el.style.setProperty('--dy', `${y.toFixed(1)}px`); };
  // how far --dx / --dy may go before the element would leave bounds
  const room = () => {
    if (!bounds) return { x0: -Infinity, x1: Infinity, y0: -Infinity, y1: Infinity };
    const r = el.getBoundingClientRect(), b = bounds.getBoundingClientRect(), { x, y } = pos();
    return { x0: x + b.left - r.left, x1: x + b.right - r.right, y0: y + b.top - r.top, y1: y + b.bottom - r.bottom };
  };
  const inside = (x, y, lim) => [clamp(x, lim.x0, lim.x1), clamp(y, lim.y0, lim.y1)];
  const held = ['pointermove', 'pointerup', 'pointercancel'];
  let drag = null, glide = 0, dropped = -1e9;
  const down = (e) => {
    if (e.button !== 0 || drag) return;
    cancelAnimationFrame(glide);
    drag = { id: e.pointerId, px: e.clientX, py: e.clientY, ...pos(), lim: room(), moved: false, vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, lt: e.timeStamp };
    el.style.zIndex = ++dragZ; el.classList.add('is-dragging');
    held.forEach((type) => addEventListener(type, type === 'pointermove' ? move : up)); // on the window, not captured: a captured pointer would steal the click from a link inside
  };
  const move = (e) => {
    if (e.pointerId !== drag?.id) return;
    const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return; // a press, not a drag
    const dt = Math.max(1, e.timeStamp - drag.lt);
    Object.assign(drag, { moved: true, vx: (e.clientX - drag.lx) / dt, vy: (e.clientY - drag.ly) / dt, lx: e.clientX, ly: e.clientY, lt: e.timeStamp });
    put(...inside(drag.x + dx, drag.y + dy, drag.lim));
  };
  const up = (e) => {
    if (e.pointerId !== drag?.id) return;
    held.forEach((type) => removeEventListener(type, type === 'pointermove' ? move : up));
    el.classList.remove('is-dragging');
    const d = drag, from = pos(), still = reduced || e.type === 'pointercancel' || e.timeStamp - d.lt > 80; // held still before letting go: no throw
    drag = null;
    if (!d.moved) return;
    dropped = e.timeStamp;
    const [tx, ty] = inside(from.x + (still ? 0 : clamp(d.vx * 60, -28, 28)), from.y + (still ? 0 : clamp(d.vy * 60, -28, 28)), d.lim);
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / 450, 0, 1), k = 1 - (1 - t) ** 4;
      put(from.x + (tx - from.x) * k, from.y + (ty - from.y) * k);
      if (t < 1) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
    onDrop?.({ el, x: tx, y: ty });
  };
  const click = (e) => { if (e.timeStamp - dropped < 350) { e.preventDefault(); e.stopPropagation(); } }; // the click that ends a real drag opens nothing
  const key = (e) => {
    const by = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
    if (!by || e.target !== el) return;
    e.preventDefault();
    const { x, y } = pos(), [nx, ny] = inside(x + by[0], y + by[1], room());
    put(nx, ny); onDrop?.({ el, x: nx, y: ny });
  };
  const on = [['pointerdown', down], ['keydown', key], ['dragstart', (e) => e.preventDefault()], ['click', click, true]];
  on.forEach((args) => el.addEventListener(...args));
  Object.assign(el.style, { touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none' });
  if (el.tabIndex < 0) el.tabIndex = 0;
  return () => {
    on.forEach((args) => el.removeEventListener(...args));
    held.forEach((type) => removeEventListener(type, type === 'pointermove' ? move : up));
    cancelAnimationFrame(glide); el.classList.remove('is-dragging');
    Object.assign(el.style, { touchAction: '', userSelect: '', webkitUserSelect: '' });
  };
}

let pieceLinks = null;
export function pieceTransition({ linkSelector = 'a[data-piece]' } = {}) {
  const first = !pieceLinks;
  pieceLinks = linkSelector;
  if (!first) return; // one set of listeners; a later call only changes the selector
  const handleOf = (a) => a.dataset.piece || new URL(a.href, location.href).searchParams.get('handle');
  const links = () => [...document.querySelectorAll(pieceLinks)];
  const name = (img, on) => { if (img) img.style.viewTransitionName = on ? 'piece' : ''; };
  const carry = (a, transition) => { const img = a?.querySelector('img'); name(img, true); transition.finished.finally(() => name(img, false)); };
  let pressed = null;
  // remember the picture the moment its link is used: this part works in every browser
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.(pieceLinks), img = a?.querySelector('img');
    if (!img) return;
    pressed = a;
    const piece = { handle: handleOf(a), src: img.currentSrc || img.src, width: Number(img.getAttribute('width')) || img.naturalWidth, height: Number(img.getAttribute('height')) || img.naturalHeight, from: location.href };
    try { sessionStorage.setItem(PIECE, JSON.stringify(piece)); } catch {}
  }, true);
  // leaving for a product page: name that card's picture just before the old page is photographed
  addEventListener('pageswap', (e) => {
    const to = e.activation?.entry?.url;
    if (e.viewTransition) carry(!to || pressed?.href === to ? pressed : links().find((a) => a.href === to), e.viewTransition);
  });
  // shown again after a product page: name the card it came from, so the picture flies home
  addEventListener('pagereveal', (e) => {
    links().forEach((a) => name(a.querySelector('img'), false));
    const saved = readPiece(), from = globalThis.navigation?.activation?.from?.url;
    if (!e.viewTransition || !saved || !from || saved.from !== location.href || new URL(from).searchParams.get('handle') !== saved.handle) return;
    carry(pressed?.isConnected && handleOf(pressed) === saved.handle ? pressed : links().find((a) => handleOf(a) === saved.handle), e.viewTransition);
  });
}

export function pieceHero(img = document.getElementById('piece-hero')) {
  const saved = readPiece();
  if (!img || !saved?.src || saved.handle !== new URLSearchParams(location.search).get('handle')) return;
  img.src = saved.src;
  if (saved.width && saved.height) { img.width = saved.width; img.height = saved.height; }
  const fromListing = () => { const from = globalThis.navigation?.activation?.from?.url; return !from || from === saved.from; };
  const name = (on) => { img.style.viewTransitionName = on ? 'piece' : ''; };
  name(fromListing());
  const tooLate = setTimeout(name, 2000, false); // the first paint had already happened: nothing to receive
  addEventListener('pagereveal', (e) => {
    clearTimeout(tooLate);
    const flying = !!e.viewTransition && fromListing();
    name(flying);
    if (flying) e.viewTransition.finished.finally(() => name(false));
  });
  // going back to the listing it came from: hand the picture back
  addEventListener('pageswap', (e) => { if (e.viewTransition && e.activation?.entry?.url === saved.from) name(true); });
}

let pointerOn = false;
export function init({ words = '[data-words]', reveal: revealSel = '[data-reveal]', scroll = '[data-scroll]', pointer = true, piece = 'a[data-piece]' } = {}) {
  if (piece) pieceTransition({ linkSelector: piece }); // also remembers the picture for the product page, so it runs with reduced motion too
  if (reduced) return;
  if (words) list(words).forEach((el) => splitWords(el, { by: el.dataset.words || 'word' }));
  if (revealSel) reveal(document, { selector: revealSel });
  if (scroll) scrollVars(document, { selector: scroll });
  if (pointer && !pointerOn) { pointerOn = true; pointerVars(); }
}
