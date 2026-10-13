// node docs/option-3/drag-check.mjs public/option-3/js/site.js
// Runs the real site.js against a stub page and drags one piece: it must follow the pointer,
// keep its centre inside the table, come to the front, and carry on from where it was dropped.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const classes = () => { const s = new Set(); return { add: (c) => s.add(c), remove: (c) => s.delete(c), toggle: (c, on) => (on ? s.add(c) : s.delete(c)), contains: (c) => s.has(c) }; };
const el = (rect) => { const on = {}, props = {}; return { on, props, classList: classes(), style: { setProperty: (k, v) => { props[k] = v; }, removeProperty: (k) => { delete props[k]; } },
  addEventListener: (t, f) => { on[t] = f; }, setPointerCapture() {}, setAttribute() {}, getBoundingClientRect: () => rect() }; };
let dx = 0, dy = 0;
const piece = el(() => ({ left: 450 + dx, top: 250 + dy, width: 100, height: 100 }));
const layer = el(() => ({}));
const table = { ...el(() => ({ left: 0, top: 0, right: 1000, bottom: 600 })), querySelector: () => layer, querySelectorAll: () => [piece] };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.addEventListener = () => {};
globalThis.window = globalThis;
globalThis.IntersectionObserver = class { observe() {} unobserve() {} };
globalThis.document = { documentElement: el(() => ({})), querySelector: () => null,
  querySelectorAll: (sel) => (sel === '[data-table]' ? [table] : []) };

await import(pathToFileURL(process.argv[2]).href);
const px = (k) => parseFloat(piece.props[k]);
const move = (x, y, id = 1) => { piece.on.pointermove({ pointerId: id, clientX: x, clientY: y }); dx = px('--dx'); dy = px('--dy'); };

piece.on.pointerdown({ pointerId: 1, pointerType: 'mouse', button: 0, clientX: 500, clientY: 300 });
assert.ok(piece.classList.contains('is-held') && layer.classList.contains('is-played'));
assert.equal(piece.style.zIndex, '11');
move(700, 350); assert.deepEqual([dx, dy], [200, 50]);
move(2000, -500); assert.deepEqual([dx, dy], [500, -300], 'centre stays inside the table');
piece.on.pointermove({ pointerId: 2, clientX: 0, clientY: 0 }); assert.deepEqual([px('--dx'), px('--dy')], [500, -300], 'another finger is ignored');
piece.on.pointerup({ pointerId: 1 }); assert.ok(!piece.classList.contains('is-held'));
piece.on.pointermove({ pointerId: 1, clientX: 0, clientY: 0 }); assert.equal(px('--dx'), 500, 'no move after drop');
piece.on.pointerdown({ pointerId: 3, pointerType: 'touch', button: 0, clientX: 1000, clientY: 0 });
move(900, 100, 3); assert.deepEqual([dx, dy], [400, -200], 'second drag continues from the drop');
piece.on.pointerdown({ pointerId: 4, pointerType: 'mouse', button: 2, clientX: 0, clientY: 0 });
assert.equal(piece.style.zIndex, '12', 'right button does not pick up');
console.log('drag check: ok');
