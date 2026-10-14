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

- In her browser at once (`localStorage`, key `tgc-review-r3:<who>`, one key per round), so a reload or a closed tab loses nothing.
- On the site two seconds after the last change and on Send: one JSON file per reviewer,
  `notes/<who>.json` on the `notes` branch of the GitHub repository (`{ who, notes, done, savedAt }`; `done` is true once she pressed Send).
- A new device or browser loads her notes back from the site. Last save wins.
- Text typed in the note box but not sent stays in that browser only, as a draft on its option. Pressing
  "Send my notes to Dre" turns every such draft into a note, so nothing she typed is left behind.
- If the site cannot save (no storage, wrong key, offline) the page says "Saved on this device", keeps
  trying, and Wrap-up shows "Copy all my notes" to paste into a message. Nothing is lost.

## Locally

`npm run dev`, then `http://localhost:4180/?who=dre`. No key is needed. Notes land in `_notes/<who>.json`
(not in git); read them there or at `http://localhost:4180/review/notes.html`.

## Online (set up 2026-10-13)

- Site: https://the-global-collage.vercel.app (Vercel project `the-global-collage`, team `dres-projects-6e4b1739`).
  It is published from this folder with `vercel deploy --prod` (Dre runs it; a chat cannot). The GitHub
  repository is not connected to Vercel, so a push does not publish and a saved note does not rebuild the site.
- Code: GitHub `andressimonc/the-global-collage` (private), branch `main`.
- **Notes are saved into the same repository, on the branch `notes`**, as `notes/<who>.json`, one commit per
  save. Read them with `git fetch origin notes && git show origin/notes:notes/camila.json`, on GitHub, or at
  `/review/notes.html?k=<key>`.
- Vercel settings (Production): `REVIEW_KEY` (the key in the links; a local copy is in `.review-key`, not in
  git), `GITHUB_NOTES_REPO` = `andressimonc/the-global-collage`, `GITHUB_NOTES_TOKEN` = a fine-grained GitHub
  token for that one repository with Contents: Read and write (Dre made it; when it expires every save fails
  and the page falls back to "Saved on this device").
- Without `REVIEW_KEY` the site refuses to store notes at all. Vercel Blob is still supported as a fallback
  store (`BLOB_READ_WRITE_TOKEN`) but is not used.
- To clear a reviewer and start clean: delete `notes/<who>.json` on the `notes` branch.
- Before sending a link: one real save as `?who=dre`, then look for the commit "Review notes: dre" on `notes`.

## Rounds

- **Round 2** (2026-10-13): nine options, `public/option-1` … `option-9`. Camila's notes are kept on the
  `notes` branch as `notes/round-2/camila.json` (the notes page lists only the current round).
- **Round 3** (2026-10-14): two sites, `public/site-a` and `public/site-b`, from her notes (`docs/ROUND-3.md`).
  `options.json` gives each option a `path` (its folder); without one the folder is `option-<n>`.
  Same links as before. Starting a round: move every `notes/<who>.json` into `notes/round-<n>/`, change
  the round in `storeKey` in `review.js`, then publish.

