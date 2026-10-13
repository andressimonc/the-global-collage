// node dev/notes.test.mjs — checks the review-notes function against a temp folder and stand-ins for GitHub and Vercel Blob.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// '@vercel/blob' is not installed here (Vercel installs it at deploy): the function's import gets this stand-in.
const blob = { store: new Map(), calls: [] };
globalThis.blobStub = {
  put: async (path, body, options) => { blob.calls.push(['put', path, options]); blob.store.set(path, body); return { url: `https://blob.example.test/${path}`, pathname: path }; },
  list: async (options) => { blob.calls.push(['list', options]); return { blobs: [...blob.store.keys()].filter((path) => path.startsWith(options.prefix)).map((path) => ({ pathname: path, url: `https://blob.example.test/${path}` })), hasMore: false }; },
};
registerHooks({
  resolve: (specifier, context, next) => specifier === '@vercel/blob'
    ? { url: 'data:text/javascript,export const put = (...a) => globalThis.blobStub.put(...a); export const list = (...a) => globalThis.blobStub.list(...a);', shortCircuit: true }
    : next(specifier, context),
});
globalThis.fetch = async (url) => {
  const path = String(url).replace('https://blob.example.test/', '');
  return blob.store.has(path) ? new Response(blob.store.get(path)) : new Response('gone', { status: 404 });
};

const { GET, POST } = await import('../api/notes.js');
const logged = [];
console.error = (...args) => logged.push(args.join(' '));
for (const name of ['NOTES_DIR', 'BLOB_READ_WRITE_TOKEN', 'REVIEW_KEY', 'GITHUB_NOTES_TOKEN', 'GITHUB_NOTES_REPO', 'GITHUB_NOTES_BRANCH']) delete process.env[name];

const notes = {
  options: {
    4: { mark: 'like', messages: [{ text: 'I love the big word.\nKeep the dock.', at: 1760000000000 }, { text: '<b>Less pink</b>', at: 1760000001000 }] },
    7: { mark: 'no', messages: [] },
  },
  favorite: 4, plan: 'mix', overall: 'The poster, with the shop from the archive.',
};
let post = (body) => POST(new Request('http://local/api/notes', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));
let get = (query) => GET(new Request(`http://local/api/notes?${query}`));
const status = async (body) => (await post(body)).status; // reads post each time, so the hosted sections can add the key
const good = { who: 'camila', notes, done: false };

// nothing configured: the page is told to keep the notes on the device
assert.equal(await status(good), 501);
assert.deepEqual(await (await post(good)).json(), { error: 'Notes are not set up' });
assert.equal((await get('who=camila')).status, 501);
assert.equal((await get('all=1')).status, 501);

// a folder of plain files
const dir = join(mkdtempSync(join(tmpdir(), 'tgc-notes-')), 'made-on-demand');
process.env.NOTES_DIR = dir;
assert.equal((await get('who=camila')).status, 404, 'no notes yet');
assert.deepEqual(await (await get('all=1')).json(), { reviewers: [] }, 'the folder does not exist yet');

const saved = await post(good);
assert.equal(saved.status, 200);
const { ok, savedAt } = await saved.json();
assert.equal(ok, true);
assert.equal(new Date(savedAt).toISOString(), savedAt);
assert.deepEqual(readdirSync(dir), ['camila.json']);
const loaded = await get('who=camila');
assert.equal(loaded.status, 200);
assert.equal(loaded.headers.get('cache-control'), 'no-store');
assert.deepEqual(await loaded.json(), { who: 'camila', notes: { ...notes, options: { 4: notes.options[4], 7: notes.options[7] } }, done: false, savedAt });

// sending again replaces the document; done is only ever true or false
assert.equal(await status({ who: 'camila', notes: { ...notes, favorite: null }, done: 'yes' }), 200);
assert.equal(await status({ who: 'camila', notes: { ...notes, favorite: 7 }, done: true }), 200);
const again = await (await get('who=camila')).json();
assert.equal(again.notes.favorite, 7);
assert.equal(again.done, true);

// unknown fields are dropped at every level, and what is left out gets its empty value
assert.equal(await status({ who: 'dre', admin: true, notes: { options: { 2: { mark: 'like', stars: 5, messages: [{ text: 'ok', at: 1, html: '<script>' }] }, 3: {} }, extra: 'x' } }), 200);
assert.deepEqual(JSON.parse(readFileSync(join(dir, 'dre.json'), 'utf8')), {
  who: 'dre', done: false, savedAt: JSON.parse(readFileSync(join(dir, 'dre.json'), 'utf8')).savedAt,
  notes: { options: { 2: { mark: 'like', messages: [{ text: 'ok', at: 1 }] }, 3: { mark: null, messages: [] } }, favorite: null, plan: null, overall: '' },
});

// all=1 lists every reviewer and skips files that are not ours
writeFileSync(join(dir, 'README.txt'), 'not a reviewer');
writeFileSync(join(dir, 'Not A Name.json'), '{}');
assert.deepEqual((await (await get('all=1')).json()).reviewers.map((doc) => doc.who), ['camila', 'dre']);

// who: letters, digits and dashes, and never a path
for (const who of ['', 'Camila', 'a b', '../camila', 'a/b', 'x'.repeat(41), 5, null, undefined, ['camila']]) assert.equal(await status({ ...good, who }), 400, `who ${JSON.stringify(who)}`);
for (const who of ['', 'Camila', '..%2Fcamila', 'a.b']) assert.equal((await get(`who=${who}`)).status, 400, `GET who ${who}`);
assert.equal((await get('')).status, 400, 'GET needs who or all=1');

// bad bodies
assert.equal(await status('not json'), 400);
assert.equal(await status('null'), 400);
assert.equal(await status('[]'), 400);
assert.equal(await status({ who: 'camila' }), 400, 'no notes');
assert.equal(await status({ who: 'camila', notes: [] }), 400);
const withOption = (option, key = '4') => ({ who: 'camila', notes: { options: { [key]: option } } });
assert.equal(await status(withOption({ mark: 'love' })), 400, 'a mark we do not know');
assert.equal(await status(withOption({ messages: 'hello' })), 400);
assert.equal(await status(withOption({ messages: [{ text: 5, at: 1 }] })), 400);
assert.equal(await status(withOption({ messages: [{ text: '   ', at: 1 }] })), 400, 'an empty note');
assert.equal(await status(withOption({ messages: [{ text: 'ok', at: 'yesterday' }] })), 400);
assert.equal(await status(withOption({}, 'ten')), 400, 'options are numbered');
assert.equal(await status(withOption({}, '0')), 400);
assert.equal(await status(withOption({}, '100')), 400);
assert.equal(await status('{"who":"camila","notes":{"options":{"__proto__":{"mark":"like"}}}}'), 400);
assert.equal(await status({ who: 'camila', notes: { favorite: '4' } }), 400);
assert.equal(await status({ who: 'camila', notes: { favorite: 4.5 } }), 400);
assert.equal(await status({ who: 'camila', notes: { plan: 'both' } }), 400);
assert.equal(await status({ who: 'camila', notes: { overall: 'x'.repeat(4001) } }), 400);
assert.deepEqual(await (await post(withOption({ mark: 'love' }))).json(), { error: 'Check mark' });

// limits: 4000 characters a note, 200 notes in all, 200 kB a body
const many = (count, text = 'ok') => Array.from({ length: count }, (_, at) => ({ text, at }));
assert.equal(await status(withOption({ messages: [{ text: 'x'.repeat(4000), at: 1 }] })), 200);
assert.equal(await status(withOption({ messages: [{ text: 'x'.repeat(4001), at: 1 }] })), 400, 'a note that is too long');
assert.equal(await status(withOption({ messages: many(200) })), 200);
assert.equal(await status(withOption({ messages: many(201) })), 400, 'too many notes in one option');
assert.equal(await status({ who: 'camila', notes: { options: { 1: { messages: many(150) }, 2: { messages: many(51) } } } }), 400, 'too many notes across options');
assert.equal(await status(withOption({ messages: many(60, 'x'.repeat(4000)) })), 413, 'a body over 200 kB');
assert.equal((await POST(new Request('http://local/api/notes', { method: 'POST', body: '{}', headers: { 'content-length': '200001' } }))).status, 413, 'refused by its declared size');
assert.equal(await status(withOption({ messages: many(45, 'é'.repeat(4000)) })), 413, 'the limit counts bytes, not characters');
assert.equal((await (await get('who=camila')).json()).notes.options[4].messages.length, 200, 'a refused save leaves the last good one alone');

// the key: once the host sets REVIEW_KEY, nothing is saved or read without it
process.env.REVIEW_KEY = 'paper-scissors';
assert.equal(await status(good), 401);
assert.equal(await status({ ...good, k: 'paper' }), 401);
assert.equal(await status({ ...good, k: ['paper-scissors'] }), 401);
assert.equal(await status({ ...good, k: 'paper-scissors' }), 200);
assert.equal((await get('who=camila')).status, 401);
assert.equal((await get('who=camila&k=nope')).status, 401);
assert.equal((await get('all=1')).status, 401);
assert.equal((await get('who=camila&k=paper-scissors')).status, 200);
assert.equal((await get('all=1&k=paper-scissors')).status, 200);
assert.equal((await get('who=nobody-yet&k=paper-scissors')).status, 404);
delete process.env.REVIEW_KEY;
assert.equal((await get('who=camila&k=anything')).status, 200, 'no REVIEW_KEY: the key is ignored');

// Vercel Blob, when there is no folder
delete process.env.NOTES_DIR;
process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
assert.equal((await get('who=camila')).status, 501, 'a hosted store is never used without a review key');
process.env.REVIEW_KEY = 'paper-scissors';
const hostedPost = post, hostedGet = get;
post = (body) => hostedPost(typeof body === 'string' ? body : { k: 'paper-scissors', ...body });
get = (query) => hostedGet(`${query}&k=paper-scissors`);
assert.equal((await get('who=camila')).status, 404);
assert.equal(await status({ who: 'cam', notes: { overall: 'A shorter name must not be mistaken for camila.' } }), 200);
assert.equal(await status(good), 200);
assert.deepEqual(blob.calls.filter(([name]) => name === 'put').map(([, path]) => path), ['notes/cam.json', 'notes/camila.json']);
assert.deepEqual(blob.calls.find(([name]) => name === 'put')[2], { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
blob.calls.length = 0;
const fromBlob = await (await get('who=camila')).json();
assert.deepEqual(blob.calls, [['list', { prefix: 'notes/camila.json' }]]);
assert.deepEqual(fromBlob.notes, { ...notes, options: { 4: notes.options[4], 7: notes.options[7] } }, 'load reads back what save wrote');
assert.equal((await (await get('who=cam')).json()).notes.overall, 'A shorter name must not be mistaken for camila.');
blob.store.set('notes/camila.json.bak', '{}');
assert.equal((await (await get('who=camila')).json()).who, 'camila', 'only the exact path is that reviewer');
blob.store.delete('notes/camila.json.bak');
blob.calls.length = 0;
assert.deepEqual((await (await get('all=1')).json()).reviewers.map((doc) => doc.who), ['cam', 'camila']);
assert.deepEqual(blob.calls, [['list', { prefix: 'notes/' }]]);

// GitHub, when its token and repository are set: it wins over Blob, and every save is a commit on the notes branch
{
  const blobFetch = globalThis.fetch, repoFiles = new Map(), calls = [];
  let sha = 0, failNextPut = 0;
  globalThis.fetch = async (url, init = {}) => {
    const { pathname, searchParams } = new URL(url);
    assert.ok(pathname.startsWith('/repos/dre/tgc/contents/'), `unexpected request ${url}`);
    assert.equal(init.headers.Authorization, 'Bearer gh_test_token');
    const path = pathname.replace('/repos/dre/tgc/contents/', '');
    calls.push([init.method ?? 'GET', path, searchParams.get('ref'), init.body ? JSON.parse(init.body) : null]);
    const branches = ['notes', 'review']; // the branches this pretend repository has
    if (init.method === 'PUT') {
      if (!branches.includes(JSON.parse(init.body).branch)) return new Response('{}', { status: 404 });
      if (failNextPut) { // a lost race means the file changed under us: give it a new sha, as GitHub would
        const code = failNextPut; failNextPut = 0;
        if (code === 409 && repoFiles.has(path)) repoFiles.set(path, { ...repoFiles.get(path), sha: `sha-${++sha}` });
        return new Response('{}', { status: code });
      }
      const body = JSON.parse(init.body);
      if ((repoFiles.get(path)?.sha ?? undefined) !== body.sha) return new Response('{}', { status: 409 });
      repoFiles.set(path, { sha: `sha-${++sha}`, content: body.content });
      return Response.json({ content: { path } }, { status: 201 });
    }
    if (!branches.includes(searchParams.get('ref'))) return new Response('{}', { status: 404 });
    if (path === '') return Response.json([]);
    if (path === 'notes') return repoFiles.size === 0 ? new Response('{}', { status: 404 }) : Response.json([...repoFiles.keys()].map((p) => ({ name: p.replace('notes/', ''), path: p })).concat({ name: 'README.md' }));
    return repoFiles.has(path) ? Response.json(repoFiles.get(path)) : new Response('{}', { status: 404 });
  };
  process.env.GITHUB_NOTES_TOKEN = 'gh_test_token';
  process.env.GITHUB_NOTES_REPO = 'dre/tgc';
  assert.equal((await get('who=camila')).status, 404, 'GitHub is asked, not Blob');
  assert.deepEqual((await (await get('all=1')).json()).reviewers, [], 'an empty branch lists nobody');
  calls.length = 0;
  assert.equal((await hostedPost({ ...good, k: 'wrong' })).status, 401);
  assert.equal((await hostedGet('all=1&k=wrong')).status, 401);
  assert.equal(calls.length, 0, 'without the key nothing is asked of GitHub');
  assert.equal(await status(good), 200);
  const firstPut = calls.find(([method]) => method === 'PUT');
  assert.equal(firstPut[1], 'notes/camila.json');
  assert.equal(firstPut[3].branch, 'notes');
  assert.equal(firstPut[3].sha, undefined, 'a new file is sent without a sha');
  assert.equal(JSON.parse(Buffer.from(firstPut[3].content, 'base64').toString('utf8')).notes.favorite, 4);
  assert.ok(calls.filter(([method]) => method === 'GET').every(([, , ref]) => ref === 'notes'), 'every read names the notes branch');
  calls.length = 0;
  assert.equal(await status({ ...good, done: true }), 200);
  assert.equal(calls.find(([method]) => method === 'PUT')[3].sha, 'sha-1', 'an update sends the sha it replaces');
  const fromGitHub = await (await get('who=camila')).json();
  assert.equal(fromGitHub.done, true);
  assert.deepEqual(fromGitHub.notes, fromBlob.notes, 'load reads back what save wrote');
  failNextPut = 409; calls.length = 0;
  assert.equal(await status(good), 200, 'a save that lost a race tries once more');
  const puts = calls.filter(([method]) => method === 'PUT');
  assert.equal(puts.length, 2);
  assert.notEqual(puts[1][3].sha, puts[0][3].sha, 'the second try carries the new sha');
  failNextPut = 422; calls.length = 0;
  assert.equal(await status(good), 200, 'a missing sha on an existing file is retried the same way');
  assert.equal(calls.filter(([method]) => method === 'PUT').length, 2);
  assert.equal(await status({ who: 'dre', notes: { overall: 'Second reviewer.' } }), 200);
  assert.deepEqual((await (await get('all=1')).json()).reviewers.map((doc) => doc.who), ['camila', 'dre']);
  process.env.GITHUB_NOTES_BRANCH = 'review';
  assert.equal(await status({ who: 'other', notes: {} }), 200);
  assert.equal(calls.findLast(([method]) => method === 'PUT')[3].branch, 'review');
  assert.equal((await get('who=other')).status, 200, 'reads follow the branch setting too');
  process.env.GITHUB_NOTES_BRANCH = 'no-such-branch';
  assert.equal(await status(good), 502, 'a branch that does not exist is a failure, not a silent success');
  assert.equal((await get('all=1')).status, 502, 'and an unreachable branch is not read as "no notes"');
  delete process.env.GITHUB_NOTES_BRANCH;
  failNextPut = 401;
  assert.equal(await status(good), 502, 'a refused token is a storage failure the page can see');
  process.env.GITHUB_NOTES_REPO = 'dre/tgc\n';
  assert.equal(await status(good), 200, 'a pasted repository name with a line break still works');
  process.env.GITHUB_NOTES_REPO = 'not a repo';
  blob.calls.length = 0;
  assert.equal((await get('who=camila')).status, 502, 'a repository name that is not owner/repo fails loudly instead of quietly using Blob');
  assert.equal(blob.calls.length, 0);
  process.env.GITHUB_NOTES_REPO = 'dre/tgc';
  process.env.GITHUB_NOTES_TOKEN = 'gh_test_token\nwith a break';
  assert.equal(await status(good), 502);
  assert.ok(logged.length >= 4, 'each storage failure is logged');
  assert.ok(logged.every((line) => !line.includes('gh_test_token')), 'the token never reaches a log line');
  logged.length = 0;
  delete process.env.GITHUB_NOTES_TOKEN; delete process.env.GITHUB_NOTES_REPO;
  globalThis.fetch = blobFetch;
  blob.calls.length = 0;
}

// storage that breaks is an error the page can see (it then keeps the notes on the device), and it is logged
assert.equal(logged.length, 0);
globalThis.blobStub.put = async () => { throw new Error('blob is down'); };
assert.equal(await status(good), 502);
globalThis.fetch = async () => new Response('down', { status: 503 });
assert.equal((await get('who=camila')).status, 502);
assert.equal(logged.length, 2);

rmSync(join(dir, '..'), { recursive: true, force: true });
console.log('notes function: all checks passed');
