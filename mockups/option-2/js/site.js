// The Gallery Wall — what every page needs for the look: the menu, the header, arrivals,
// fragments that align, and the forms (wired to ../../shared/forms.js; nothing is sent in preview).
// The cart and the shelves of pieces are in store.js.
//
//   import { arrive } from './site.js';   arrive(node) arms reveals and fragments inside markup added later.
import { wireForm, prefillFromQuery } from '../../shared/forms.js';

const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const held = new URLSearchParams(location.search).get('frag') === 'apart'; // review aid: keeps the opening pieces apart
window.__siteReady = true; // tells the inline guard in <head> that this file ran

/* Menu (phone and narrow panes) ------------------------------------------ */
const menuBtn = document.querySelector('[data-menu-btn]');
const setMenu = (open) => {
  root.classList.toggle('nav-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
};
menuBtn?.addEventListener('click', () => setMenu(!root.classList.contains('nav-open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('nav-open')) { setMenu(false); menuBtn.focus(); } });
matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches && menuBtn) setMenu(false); });

/* Header: a shorter bar and a shadow once the page has moved ------------- */
const header = document.querySelector('[data-header]');
const onScroll = () => header?.classList.toggle('is-stuck', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Arrivals ---------------------------------------------------------------
   [data-reveal] fades and glides in as it enters; [data-stagger] spaces its children by .07s.
   [data-align] (a cut headline, the doorways) and .frag wait until they are properly on screen,
   so the visitor sees the pieces apart before they move. */
const seen = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    seen.unobserve(entry.target);
    entry.target.classList.add('is-in');
    // a sideways shelf hides its far pieces from the observer: when one arrives, they all have
    const shelf = entry.target.closest('.ledge--walk');
    if (shelf && shelf.scrollWidth > shelf.clientWidth) shelf.querySelectorAll('[data-reveal]').forEach((el) => { seen.unobserve(el); el.classList.add('is-in'); });
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

const landed = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    // half of it showing, or (for something taller than the window) half the window filled
    if (entry.intersectionRatio < 0.5 && entry.intersectionRect.height < innerHeight * 0.5) continue;
    landed.unobserve(entry.target);
    if (entry.target.matches('.frag')) assemble(entry.target);
    else entry.target.classList.add('is-in');
  }
}, { threshold: [0.2, 0.5] });

/* Fragments that align ----------------------------------------------------
   <span class="frag" data-frag="7|3|3b|3c" data-frag-on="load|view|hover"><img class="frag__base" …></span>
     load   the picture above the fold: nothing shows until the pieces do
     view   below the fold: lies in pieces until it is scrolled to, then aligns
     hover  a shelf piece: whole, and its pieces lift under the pointer (on touch it behaves as "view")
   Each cut: [polygon in % of the picture, scatter x %, scatter y %, tilt in degrees].
   The cuts tile the rectangle exactly, so the pieces close into the whole picture. */
const CUTS = {
  7: [
    ['0 0, 38 0, 45 29, 0 24', -15, -9, -7],
    ['38 0, 71 0, 66 52, 45 29', 3, -10, 4],
    ['71 0, 100 0, 100 31, 66 52', 13, -9, 8],
    ['0 24, 45 29, 33 64, 0 57', -18, 2, 5],
    ['45 29, 66 52, 33 64', -2, 7, -11],
    ['66 52, 100 31, 100 100, 63 100', 11, 8, -6],
    ['0 57, 33 64, 66 52, 63 100, 0 100', -11, 10, 6],
  ],
  3: [
    ['0 0, 58 0, 41 46, 0 38', -9, -7, -4],
    ['58 0, 100 0, 100 62, 41 46', 10, -4, 3.5],
    ['0 38, 41 46, 100 62, 100 100, 0 100', -3, 10, -2.5],
  ],
  '3b': [
    ['0 0, 44 0, 60 52, 0 66', -8, -6, 3],
    ['44 0, 100 0, 100 40, 60 52', 9, -6, -4],
    ['0 66, 60 52, 100 40, 100 100, 0 100', 2, 10, 2.5],
  ],
  '3c': [
    ['0 0, 100 0, 100 34, 52 44, 0 30', 3, -9, -3],
    ['0 30, 52 44, 38 100, 0 100', -10, 5, 4],
    ['52 44, 100 34, 100 100, 38 100', 9, 7, -3.5],
  ],
};

const loaded = (img) => (img.complete && img.naturalWidth ? Promise.resolve() : new Promise((done) => {
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
}));
const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };

function build(frag) {
  const base = frag.querySelector('img');
  const cuts = CUTS[frag.dataset.frag] ?? CUTS[3];
  const layer = document.createElement('span');
  layer.className = 'frag__layer';
  layer.setAttribute('aria-hidden', 'true');
  cuts.forEach(([shape, dx, dy, rot], i) => {
    const piece = document.createElement('span');
    piece.className = 'frag__piece';
    piece.style.cssText = `--dx:${dx};--dy:${dy};--rot:${rot};--i:${i}`;
    const cut = document.createElement('span');
    cut.className = 'frag__cut';
    cut.style.clipPath = `polygon(${shape.replace(/(\d+(?:\.\d+)?)/g, '$1%')})`;
    const copy = new Image();
    copy.alt = '';
    copy.decoding = 'sync';
    copy.src = base.currentSrc || base.src;
    cut.append(copy);
    piece.append(cut);
    layer.append(piece);
  });
  frag.append(layer);
  return cuts.length;
}

const HOLD = 750; // ms the pieces lie apart, fully visible, before they move
// the pieces glide home, their shadows drop, and the whole picture takes over
function assemble(frag) {
  const count = Number(frag.dataset.pieces);
  if (!count) return;
  setTimeout(() => {
    frag.classList.remove('is-apart');
    setTimeout(() => frag.classList.remove('is-flying'), 1700 + count * 80);
    setTimeout(() => {
      frag.classList.add('is-whole');
      // only a shelf piece under a real pointer still needs its cuts
      if (frag.dataset.fragOn !== 'hover' || !canHover) setTimeout(() => frag.querySelector('.frag__layer')?.remove(), 300);
    }, 1900 + count * 80);
  }, Math.max(0, HOLD - (performance.now() - Number(frag.dataset.out))));
}

async function prepare(frag) {
  if (frag.dataset.pieces) return;
  const when = frag.dataset.fragOn === 'hover' && !canHover ? 'view' : frag.dataset.fragOn;
  const base = frag.querySelector('img');
  await loaded(base);
  if (!base.naturalWidth || frag.dataset.pieces) return;
  if (when === 'view' && onScreen(frag)) return; // already being looked at: leave it whole rather than break it up
  frag.dataset.pieces = build(frag);
  if (when === 'hover') { frag.classList.add('is-built', 'is-whole', 'is-out'); return; }
  frag.classList.add('is-built', 'is-apart', 'is-flying');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    frag.classList.add('is-out'); // the pieces fade up where they lie
    frag.dataset.out = performance.now();
    if (!(when === 'load' && held)) landed.observe(frag);
  }));
}

export function arrive(scope = document) {
  scope.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.querySelectorAll('[data-reveal]')].forEach((el, i) => el.style.setProperty('--d', `${i * 0.07}s`));
  });
  scope.querySelectorAll('[data-reveal]').forEach((el) => seen.observe(el));
  if (still) return; // reduced motion: the stylesheet shows everything whole and in place
  scope.querySelectorAll('[data-align]').forEach((el) => landed.observe(el));
  scope.querySelectorAll('.frag').forEach(prepare);
}
arrive();

// A jump (the End key, a link to the foot of the page) can carry something past both observers without
// one frame in view. Once its top is above the window, it has arrived.
addEventListener('scroll', () => {
  document.querySelectorAll('[data-reveal]:not(.is-in), [data-align]:not(.is-in), .frag.is-apart:not([data-passed])').forEach((el) => {
    if (el.getBoundingClientRect().top >= 0) return;
    seen.unobserve(el);
    landed.unobserve(el);
    if (el.matches('.frag')) { el.dataset.passed = ''; assemble(el); } else el.classList.add('is-in');
  });
}, { passive: true });

/* Forms: every <form data-form="contact|commission|newsletter"> ----------- */
document.querySelectorAll('form[data-form]').forEach((form) => {
  if (form.dataset.form === 'contact') prefillFromQuery(form);
  wireForm(form, { kind: form.dataset.form });
});
