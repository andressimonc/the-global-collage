// GET and POST /api/notes — keeps what a reviewer writes on the review site (public/index.html). JSON in, JSON out.
//   POST { who, k, notes: { options: { "4": { mark, messages: [{ text, at }] }, … }, favorite, plan, overall }, done }
//        who: letters, digits, dashes · mark: 'like' | 'no' | null · at: milliseconds · favorite: an option number or null
//        plan: 'favorite' | 'mix' | null · overall: text · anything else in the body is dropped
//        → 200 { ok: true, savedAt }
//   GET  ?who=<who>&k=<key>  → 200 that reviewer's document { who, notes, done, savedAt } · 404 when there is none
//   GET  ?all=1&k=<key>      → 200 { reviewers: [document, …] }
// Also answers 400 { error: 'Bad request' | 'Check …' }, 401 { error: 'Wrong key' }, 413 { error: 'Too large' },
// 501 { error: 'Notes are not set up' }, 502 { error: 'Storage failed' }.
// The host sets REVIEW_KEY (when set, k must equal it) and one place to keep the notes, one JSON file per reviewer:
//   NOTES_DIR              a folder of plain files (the local preview and the check), or else
//   GITHUB_NOTES_TOKEN + GITHUB_NOTES_REPO ("owner/repo")  the project's own GitHub repository: notes/<who>.json on the branch
//                          GITHUB_NOTES_BRANCH (default "notes"), one commit per save, so the notes are read with a git pull.
//                          The token is a fine-grained one for that single repository with Contents: read and write. Or else
//   BLOB_READ_WRITE_TOKEN  Vercel Blob, as notes/<who>.json, or else the answer is 501 and the page keeps notes on the device.
// ponytail: GitHub allows roughly 500 saves an hour from one token; plenty for a few reviewers, move to Blob if it ever is not.
// ponytail: no rate limit; the key is the only gate. Add a host firewall rule if the link ever leaks.
// ponytail: the last save wins, whole document. Merge by message if one reviewer ever writes from two devices at once.
// ponytail: a Blob read just after a save can be up to a minute old (its CDN), and all=1 reads one page of 1000 reviewers.
import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const WHO = /^[a-z0-9-]{1,40}$/;
const OPTION = /^[1-9]\d?$/;
const MARKS = ['like', 'no'];
const PLANS = ['favorite', 'mix'];
const MAX_BODY = 200_000, MAX_MESSAGES = 200, MAX_TEXT = 4000;

const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const digest = (s) => createHash('sha256').update(s).digest();
const keyOk = (k) => !process.env.REVIEW_KEY || (typeof k === 'string' && timingSafeEqual(digest(k), digest(process.env.REVIEW_KEY)));

// The notes with only the fields we know, or the name of the first thing that is wrong.
function clean(notes) {
  if (!isObject(notes)) return 'notes';
  const out = { options: {}, favorite: null, plan: null, overall: '' };
  let count = 0;
  if (notes.options != null && !isObject(notes.options)) return 'options';
  for (const [n, option] of Object.entries(notes.options ?? {})) {
    if (!OPTION.test(n) || !isObject(option)) return 'options';
    if (option.mark != null && !MARKS.includes(option.mark)) return 'mark';
    if (option.messages != null && !Array.isArray(option.messages)) return 'messages';
    const messages = [];
    for (const m of option.messages ?? []) {
      if (!isObject(m) || typeof m.text !== 'string' || !m.text.trim() || m.text.length > MAX_TEXT) return 'messages';
      if (!Number.isSafeInteger(m.at) || m.at < 0 || ++count > MAX_MESSAGES) return 'messages';
      messages.push({ text: m.text, at: m.at });
    }
    out.options[n] = { mark: option.mark ?? null, messages };
  }
  if (notes.favorite != null) {
    if (!Number.isInteger(notes.favorite) || !OPTION.test(String(notes.favorite))) return 'favorite';
    out.favorite = notes.favorite;
  }
  if (notes.plan != null) {
    if (!PLANS.includes(notes.plan)) return 'plan';
    out.plan = notes.plan;
  }
  if (notes.overall != null) {
    if (typeof notes.overall !== 'string' || notes.overall.length > MAX_TEXT) return 'overall';
    out.overall = notes.overall;
  }
  return out;
}

// Where the notes are kept: { save(who, doc), load(who) → doc | null, list() → [doc] }, or null when the host has set neither.
async function store() {
  const dir = process.env.NOTES_DIR;
  if (dir) {
    const load = async (who) => {
      try { return JSON.parse(await readFile(join(dir, `${who}.json`), 'utf8')); } catch (err) { if (err.code === 'ENOENT') return null; throw err; }
    };
    return {
      save: async (who, doc) => { await mkdir(dir, { recursive: true }); await writeFile(join(dir, `${who}.json`), JSON.stringify(doc, null, 2)); },
      load,
      list: async () => {
        const names = await readdir(dir).catch(() => []);
        return Promise.all(names.filter((name) => name.endsWith('.json') && WHO.test(name.slice(0, -5))).sort().map((name) => load(name.slice(0, -5))));
      },
    };
  }
  // A store on the open internet is only used behind the review key: without one, anyone with the address could write to it.
  if (!process.env.REVIEW_KEY) return null;
  const token = (process.env.GITHUB_NOTES_TOKEN ?? '').trim(), repo = (process.env.GITHUB_NOTES_REPO ?? '').trim();
  if (token) {
    // fixed messages: a bad value must never be echoed into a log
    if (!/^\w+$/.test(token)) throw new Error('GITHUB_NOTES_TOKEN is not a GitHub token');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_NOTES_REPO must be owner/repo');
    const branch = process.env.GITHUB_NOTES_BRANCH || 'notes';
    const github = (path, init = {}) => fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'the-global-collage-review' },
    });
    // One reviewer's file as GitHub has it now: { sha, doc }, or null when there is none. who is already checked against WHO.
    const file = async (who) => {
      const got = await github(`notes/${who}.json?ref=${encodeURIComponent(branch)}`);
      if (got.status === 404) return null;
      if (!got.ok) throw new Error(`github read ${who}: ${got.status}`);
      const { sha, content } = await got.json();
      return { sha, doc: JSON.parse(Buffer.from(content, 'base64').toString('utf8')) };
    };
    return {
      // Each save is one commit. A save that lost a race with another (GitHub answers 409 or 422) reads the new sha and tries once more.
      save: async (who, doc) => {
        for (let attempt = 0; ; attempt++) {
          const now = await file(who);
          if (attempt && now?.doc?.savedAt > doc.savedAt) return; // a newer save got there first: leave it
          const sha = now?.sha;
          const put = await github(`notes/${who}.json`, { method: 'PUT', body: JSON.stringify({ message: `Review notes: ${who}`, branch, sha, content: Buffer.from(JSON.stringify(doc, null, 2)).toString('base64') }) });
          if (put.ok) return;
          if ((put.status === 409 || put.status === 422) && attempt === 0) continue;
          throw new Error(`github write ${who}: ${put.status}`);
        }
      },
      load: async (who) => (await file(who))?.doc ?? null,
      list: async () => {
        const got = await github(`notes?ref=${encodeURIComponent(branch)}`);
        if (got.status === 404) { // no notes folder yet, or the branch or repository is not reachable: tell those apart
          if (!(await github(`?ref=${encodeURIComponent(branch)}`)).ok) throw new Error('github: repository or branch not reachable');
          return [];
        }
        if (!got.ok) throw new Error(`github list: ${got.status}`);
        const names = (await got.json()).map((entry) => entry.name).filter((name) => name.endsWith('.json') && WHO.test(name.slice(0, -5))).sort();
        return Promise.all(names.map(async (name) => (await file(name.slice(0, -5)))?.doc ?? null));
      },
    };
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put, list } = await import('@vercel/blob');
    const read = async (prefix) => Promise.all((await list({ prefix })).blobs.map(async (blob) => {
      const got = await fetch(blob.url, { cache: 'no-store' });
      if (!got.ok) throw new Error(`blob ${blob.pathname}: ${got.status}`);
      return { path: blob.pathname, doc: await got.json() };
    }));
    return {
      save: (who, doc) => put(`notes/${who}.json`, JSON.stringify(doc), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 }),
      load: async (who) => (await read(`notes/${who}.json`)).find((blob) => blob.path === `notes/${who}.json`)?.doc ?? null,
      list: async () => (await read('notes/')).map((blob) => blob.doc),
    };
  }
  return null;
}

const storageFailed = (err) => { console.error('notes: storage failed', err); return reply(502, { error: 'Storage failed' }); };

export async function POST(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) return reply(413, { error: 'Too large' });
  let data;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > MAX_BODY) return reply(413, { error: 'Too large' });
    data = JSON.parse(raw);
  } catch { return reply(400, { error: 'Bad request' }); }
  if (!isObject(data)) return reply(400, { error: 'Bad request' });
  if (!keyOk(data.k)) return reply(401, { error: 'Wrong key' });
  if (typeof data.who !== 'string' || !WHO.test(data.who)) return reply(400, { error: 'Check who' });
  const notes = clean(data.notes);
  if (typeof notes === 'string') return reply(400, { error: `Check ${notes}` });

  try {
    const kept = await store();
    if (!kept) return reply(501, { error: 'Notes are not set up' });
    const savedAt = new Date().toISOString();
    await kept.save(data.who, { who: data.who, notes, done: data.done === true, savedAt });
    return reply(200, { ok: true, savedAt });
  } catch (err) { return storageFailed(err); }
}

export async function GET(request) {
  const query = new URL(request.url).searchParams;
  if (!keyOk(query.get('k'))) return reply(401, { error: 'Wrong key' });
  const all = query.get('all') === '1';
  const who = query.get('who') ?? '';
  if (!all && !WHO.test(who)) return reply(400, { error: 'Check who' });

  try {
    const kept = await store();
    if (!kept) return reply(501, { error: 'Notes are not set up' });
    if (all) return reply(200, { reviewers: (await kept.list()).filter(Boolean) });
    const doc = await kept.load(who);
    return doc ? reply(200, doc) : reply(404, { error: 'No notes yet' });
  } catch (err) { return storageFailed(err); }
}
