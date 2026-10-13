# The review site

One link for the artist. She pages through the nine options with the arrows, leaves notes and a mark
on each (Favorite, I like it, Not for me), and on the last stop, Wrap-up, says how to move forward
and presses "Send my notes to Dre". It is `public/index.html` with `public/review/`.

- `public/review/options.json`: the nine names and one-liners, and `intro`, Dre's opening message. Edit freely.
- `public/review/review.js`, `review.css`, `summary.js`: the page. `public/404.html`: what the frame shows for a page that is not built.
- `public/review/notes.html`: Dre's side, every reviewer's notes as plain text with a Copy button.
- `api/notes.js`: the function that keeps the notes. Check: `node dev/notes.test.mjs`.

## The link

```
https://<site>/?who=camila&k=<review key>             her link
https://<site>/?who=camila&k=<review key>&option=5    opens on option 5 (or option=wrap-up)
https://<site>/review/notes.html?k=<review key>       Dre reads the notes
```

`who` names the reviewer (small letters, digits, dashes); each `who` has its own notes, and a link
without it writes as `guest`, so always send one. `k` must equal the site's `REVIEW_KEY`. The same
key opens `notes.html`, so anyone holding her link could read the notes too.

## How notes are kept

- In her browser at once (`localStorage`, key `tgc-review:<who>`), so a reload or a closed tab loses nothing.
- On the site two seconds after the last change and on Send: one JSON file per reviewer,
  `notes/<who>.json` in Vercel Blob (`{ who, notes, done, savedAt }`; `done` is true once she pressed Send).
- A new device or browser loads her notes back from the site. Last save wins.
- If the site cannot save (no storage, wrong key, offline) the page says "Saved on this device", keeps
  trying, and Wrap-up shows "Copy all my notes" to paste into a message. Nothing is lost.

## Locally

`npm run dev`, then `http://localhost:4180/?who=dre`. No key is needed. Notes land in `_notes/<who>.json`
(not in git); read them there or at `http://localhost:4180/review/notes.html`.

## Putting it online (only when Dre says so; not done yet)

1. Check: `npm test`, and all nine `public/option-N/index.html` exist (a missing one shows "not ready yet").
2. Create or link the Vercel project with this folder as its root. No build step: `public/` is the site, `api/` the functions.
3. Vercel dashboard → Storage → create a Blob store (public access) → connect it to the project.
   That adds `BLOB_READ_WRITE_TOKEN`. Vercel installs `@vercel/blob` from `package.json` at deploy.
4. Project → Settings → Environment Variables: add `REVIEW_KEY`, a long random string, for Production.
   Without it anyone with the address could read and write notes.
5. Deploy to production.
6. Open `https://<site>/?who=dre&k=<key>`: write a note, wait for "Saved", press Send in Wrap-up, then
   open `notes.html?k=<key>` and see it. Try it once on an iPhone (the Notes sheet with the keyboard up).
7. Give Dre her link, `https://<site>/?who=camila&k=<key>`. He sends it; nothing goes out without his yes.
