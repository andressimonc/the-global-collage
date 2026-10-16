// node dev/contact.test.mjs — checks the form function without sending anything.
import assert from 'node:assert/strict';
import { POST } from '../api/contact.js';

const contact = { kind: 'contact', name: 'Ada Lovelace', email: 'ada@example.test', reason: 'press-exhibition', message: 'Hello\nthere' };
const commission = { kind: 'commission', name: 'Ada Lovelace', email: 'ada@example.test', size: '12x16', budget: 'not sure yet', concept: 'Homesick,\nbut glad.', timeline: 'By spring' };
const newsletter = { kind: 'newsletter', email: 'ada@example.test' };
const post = (body) => POST(new Request('http://local/api/contact', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));
const status = async (body) => (await post(body)).status;

const sent = [];
const logged = [];
console.error = (...args) => logged.push(args.join(' '));
const ok = () => Response.json({ success: 'true', message: 'The form was submitted successfully.' });
globalThis.fetch = async (url, init) => { sent.push({ url, referer: init.headers.Referer, ...JSON.parse(init.body) }); return ok(); };
delete process.env.CONTACT_TO;

// bad bodies: nothing may be sent
assert.equal(await status('not json'), 400);
assert.equal(await status('null'), 400);
assert.equal(await status({ ...contact, kind: 'order' }), 400, 'unknown kind');
assert.equal(await status({ ...contact, kind: 'constructor' }), 400, 'a kind that only exists on Object.prototype');
assert.equal(await status({ ...contact, kind: undefined }), 400, 'no kind');
assert.equal(await status({ ...contact, email: 'nope' }), 400);
assert.equal(await status({ ...contact, email: 'ada@example.test\nBcc: x@y.z' }), 400, 'an email with a line break is not an email');
assert.equal(await status({ ...contact, message: '   ' }), 400);
assert.equal(await status({ ...contact, name: 'x'.repeat(121) }), 400);
assert.equal(await status({ ...contact, message: 'x'.repeat(5001) }), 400);
assert.equal(await status({ ...contact, name: 5 }), 400);
assert.equal(await status({ ...contact, reason: 'spam' }), 400, 'reason must be one of the five');
assert.equal(await status({ ...contact, reason: 'toString' }), 400);
assert.equal(await status({ ...commission, concept: '' }), 400);
assert.equal(await status({ ...commission, timeline: undefined }), 400);
assert.equal(await status({ ...commission, place: 'x'.repeat(301) }), 400, 'the optional field still has a limit');
assert.equal(await status({ kind: 'newsletter' }), 400);
assert.equal(await status({ kind: 'newsletter', email: 'ada@' }), 400);
assert.deepEqual(await (await post({ ...contact, message: '' })).json(), { error: 'Check the message field' });
assert.equal(sent.length, 0, 'nothing is sent for a bad message');

// the honeypot swallows bots quietly, whatever else the body holds
assert.equal(await status({ ...contact, company: 'Spam Inc' }), 200);
assert.equal(await status({ kind: 'nonsense', company: 'Spam Inc' }), 200);
assert.equal(sent.length, 0);

// contact, with an attempt to smuggle a header in through the name
assert.equal(await status({ ...contact, name: 'Ada\r\nBcc: x@y.z', page: '/option-1/contact.html\nX: y' }), 200);
assert.equal(sent.length, 1);
assert.equal(sent[0].url, 'https://formsubmit.co/ajax/theglobalcollage@gmail.com', 'her public address by default');
assert.equal(sent[0].referer, 'http://local/', 'FormSubmit knows the site by its address');
assert.equal(sent[0]._replyto, 'ada@example.test');
assert.equal(sent[0]._subject, 'Website message from Ada Bcc: x@y.z (Press or Exhibition)', 'line breaks are stripped from the subject');
assert.equal(sent[0].message, 'Name: Ada Bcc: x@y.z\nEmail: ada@example.test\nReason: Press or Exhibition\nMessage:\nHello\nthere\nSent from: /option-1/contact.html X: y');
for (const header of ['_replyto', '_subject']) assert.doesNotMatch(sent[0][header], /[\r\n]/);

// commission, without and with the optional field
assert.equal(await status(commission), 200);
assert.equal(sent[1]._subject, 'Commission inquiry from Ada Lovelace');
assert.equal(sent[1].message, 'Name: Ada Lovelace\nEmail: ada@example.test\nSize: 12x16\nBudget: not sure yet\nConcept:\nHomesick,\nbut glad.\nTimeline: By spring');
assert.equal(await status({ ...commission, place: 'Above the\npiano' }), 200);
assert.match(sent[2].message, /\nPlace: Above the piano$/);

// newsletter
assert.equal(await status({ ...newsletter, email: '  ada@example.test ' }), 200);
assert.equal(sent[3]._subject, 'Newsletter sign-up: ada@example.test');
assert.equal(sent[3]._replyto, 'ada@example.test');
assert.equal(sent[3].message, 'Email: ada@example.test');
assert.equal(sent.length, 4);

// CONTACT_TO on the host sends it elsewhere
process.env.CONTACT_TO = 'camila@example.test';
assert.equal(await status(newsletter), 200);
assert.equal(sent[4].url, 'https://formsubmit.co/ajax/camila@example.test');
delete process.env.CONTACT_TO;
assert.equal(sent.length, 5);

// a failing mail service: it answers with an error, or it cannot be reached at all
globalThis.fetch = async () => new Response('down', { status: 503 });
assert.equal(await status(contact), 502);
globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
assert.equal(await status(newsletter), 502);
globalThis.fetch = async () => Response.json({ success: 'false', message: 'This form needs Activation.' });
assert.equal(await status(contact), 502, 'before she activates, nothing arrives, so it is not a success');
assert.equal(logged.length, 3, 'every failure on our side is logged for the host');

// The browser side (public/shared/forms.js): wiring the same form twice, say from a site-wide script and
// again from a page script, must leave ONE submit handler, or every message would be sent twice.
const { wireForm } = await import('../public/shared/forms.js');
globalThis.document = { createElement: () => ({ style: {}, hasAttribute: () => true }) };
const handlers = [];
const form = { dataset: {}, elements: {}, append() {}, querySelector: () => null, addEventListener: (type) => handlers.push(type) };
wireForm(form, { kind: 'newsletter' });
wireForm(form, { kind: 'newsletter' });
assert.deepEqual(handlers.filter((type) => type === 'submit'), ['submit']);
assert.throws(() => wireForm(form, { kind: 'order' }), /kind must be/, 'an unknown kind is still an error');

console.log('contact function: all checks passed');
