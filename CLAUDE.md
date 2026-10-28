# The Global Collage website: the owner's guide

This guide is for Claude, working for **Camila Castillo**, the collage artist behind **The Global Collage**. The
website at **theglobalcollage.com** is hers. It was built for her as a gift and handed over in late October 2026.
From then on the people who built it no longer have access to it or look after it. You do.

Talk to Camila in plain, short words. She is an artist, not a developer. Tell her what changed and what she
needs to do, not how the code works. She types her own passwords and payment details; you never ask for them,
never type them, and never save them in a file.

## 0. Where to start

- **This guide arrived as an email attachment and you have no website folder yet?** Do section 1 (first-time setup)
  with her, step by step. It ends with this guide in the folder as `CLAUDE.md`, which you read every time.
- **You are in the folder and the setup is done?** Skip to whatever she asks. Sections 2 to 6 cover it.
- **Check you can work on her computer.** You need to run commands and edit files: that is Claude Code (the Code
  tab of the Claude desktop app, or `claude` in a terminal), on her paid Claude plan. If you are only the chat in
  a web browser, tell her to open the Claude desktop app, choose Code, and pick a folder for her website (for
  example `Documents/The Global Collage`), then give you this guide again.

## 1. First-time setup (once)

The old team has already done everything it could ahead of time. The code waits for her at
https://github.com/andressimonc/the-global-collage (left open to copy until she has her own), and the live site
keeps running from the old team's hosting until step 6, so nothing is offline while you set up. Go one step at a
time, tell her what each one is for in a sentence, and wait for her when a step is hers.

1. **Her accounts.** She needs a free **GitHub** account (github.com) and a free **Vercel** account (vercel.com,
   "Continue with GitHub"). She makes them herself. The free Vercel plan ("Hobby") is what was chosen. Vercel's
   rules say Hobby is for non-commercial sites; if Vercel ever asks her to move a shop to the paid plan (Pro,
   about US$20 a month), that is what the message means, and she upgrades in Vercel › Settings › Billing.
2. **Tools.** Check for `git`, `node` (version 20 or newer), `gh` (GitHub's tool) and `vercel` (Vercel's tool).
   Install what is missing (on a Mac: Homebrew, then `brew install git node gh`, then `npm install -g vercel`).
3. **Sign in.** Run `gh auth login` and `vercel login`. Each one opens her browser; she signs in there herself.
4. **Her own copy of the code.** In the folder she chose:
   `git clone https://github.com/andressimonc/the-global-collage.git .`, then `npm test` (both checks must pass).
   Make it hers: `git remote remove origin`, then
   `gh repo create the-global-collage --private --source . --remote origin --push`. From now on her GitHub
   account holds the code, with its whole history. (If the old address no longer opens, ask Dre to open it again.)
5. **Her hosting.** Run `vercel link` (choose: set up a new project, her own account, name `the-global-collage`).
   Then connect it to her GitHub repo: `vercel git connect`. From then on **every push to `main` publishes the
   site** by itself. Run `vercel deploy --prod` once now, and open the address it prints (`...vercel.app`):
   - every page in section 2 opens;
   - the Shop page shows her pieces with prices;
   - add a piece to the cart and press checkout: it must open Shopify's checkout on
     **shop.theglobalcollage.com**. Stop there. **Never pay** for a test.
6. **Her address.** Add her domain to her project:
   `vercel domains add theglobalcollage.com` and `vercel domains add www.theglobalcollage.com`.
   The domain is still attached to the old team's project, so Vercel asks her to prove it is hers with a **TXT
   record** (name `_vercel`, and a value Vercel shows). Her domain was bought through Shopify, so its records live
   in her Shopify admin: **Settings › Domains › theglobalcollage.com › DNS settings › Add record**, type TXT. She
   can do it, or you can do it with her in her own browser while she is signed in. Then Vercel moves the domain to
   her project. **Do not change the other records**: the A record `@` → `76.76.21.21` and the CNAME `www` →
   `cname.vercel-dns.com` already point at Vercel, and `shop`, `account` and the other TXT records belong to
   Shopify. If Vercel will not move it, ask Dre (the email this guide came in) to remove it from the old project;
   the site is then offline for a few minutes until she adds it.
7. **Check the live site** the same way as step 5, on theglobalcollage.com and www.theglobalcollage.com.
8. **The forms.** In theglobalcollage@gmail.com she looks for an email from **FormSubmit** (the old team sent one
   test message from the site to start it; check Spam too) and clicks **Activate Form**. After that every
   message, commission inquiry and newsletter sign-up from the site arrives in that inbox. Send one short test
   from **theglobalcollage.com/contact** (the real address, not the `vercel.app` one) to confirm. If no FormSubmit
   email is there, that test brings a new one.
9. **Close out with the old team.**
   - She removes Dre from her Shopify: **Settings › Users and permissions** › his name › Remove.
   - Write her a two-line note to send Dre (dreblckwell@gmail.com), for example: *"All moved over: the code is in
     my GitHub and the site runs from my Vercel. You can delete your copies."* He then deletes the old code page,
     the old hosting and an old key. Nothing she runs depends on them.
   - A day later, check the site one last time (step 5's three checks).

## 2. What is where

Plain HTML, CSS and JavaScript. No framework, no build step: what is in `public/` is what goes online.

| Page | File |
|---|---|
| Home | `public/index.html` |
| About · Services · Exhibition · Commissions · Contact | `public/about.html`, `services.html`, `exhibition.html`, `commissions.html`, `contact.html` |
| Shop (all pieces; `?type=originals`, `prints`, `goods`) | `public/shop.html` |
| One piece (`product.html?handle=<shopify-handle>`) | `public/product.html`, drawn from her Shopify data |
| Shipping & Returns · Privacy · page not found | `public/shipping.html`, `privacy.html`, `404.html` |

- `public/css/site.css` and `public/js/site.js` are shared by every page. `pages-content.*` serve About to
  Contact; `pages-shop.*` serve Shop, Product and the two legal pages.
- The menu, footer and cart are repeated in every page: a change there is made in every `.html` file.
- `public/shared/`: pictures (`img/`), logos (`brand/`), fonts, the shop layer (`shop/shop.js`), the forms
  (`forms.js`), the motion (`motion.js`, `motion.css`) and the settings (`config.js`).
- `api/contact.js`: the small function that emails a form to her.
- `docs/COPY.md`: **her final words for every page, exactly as she wrote them.**
- `docs/site-b/DESIGN.md` and `DECISIONS.md`: how the design works and why (the chosen design was called "site
  B, The Work Table"). `docs/BRIEF.md`, `ROUND-2.md`, `ROUND-3.md`: her notes from the review rounds.
- `TO-CONFIRM.md`: **what is still missing from her** (sizes, legal text, which pieces are sold…).
- `mockups/`: the earlier design options, kept as history. Not online; their links no longer work.
- `dev/`: the local preview and the checks. `tools/`: screenshots and picture tools (section 3).

## 3. Changing the site

1. **Preview:** `npm run dev`, then open http://localhost:4180. Forms in the preview send nothing.
2. Make the change. Words come from her: use `docs/COPY.md` or what she tells you, word for word.
3. **Look at it** like a visitor would, on a computer and a phone:
   `node tools/shot.mjs /about.html _shots/about` and `node tools/shot.mjs /about.html _shots/about --mobile`
   (needs Google Chrome; on a Mac it is found by itself). It saves screenshots and reports broken pictures,
   errors and sideways scrolling. Show her the screenshots before you publish anything she will see.
4. `npm test`.
5. **Publish:** commit with a plain sentence saying what changed, then `git push`. Vercel publishes `main` in about
   a minute. Check the live page.
6. **Undo:** in Vercel › the project › Deployments, choose the last good one › **Instant Rollback**. Then fix the
   code (`git revert` the bad commit) so the next push does not bring it back.

Rules the site was built with, so it keeps looking like her:
- **Every headline is Neco, set in cut-paper strips.** Body text and buttons: Archivo. Small labels: IBM Plex Mono.
  All three are free fonts, in `public/shared/fonts/`.
- Her colours: blue `#122FAB`, off-white `#EFEDEA`, black `#231F20`, orange `#FF5630`, green `#496843`, cutting-mat
  green `#028B71`.
- No top bar. Links name the file (`shop.html`, `shared/...`); Vercel serves them at clean addresses (`/shop`).
- **Never invent anything**: no prices, sizes, dates, client names or quotes. Something missing shows as a loud
  placeholder (class `needs-content`) plus a line in `TO-CONFIRM.md`, until she supplies it.
- Look, colours, type, layout and wording are **her** choices. Show her options; don't pick for her.

**Pictures on the pages** (About, Exhibition, Services…) come in fixed widths: `name-480.webp`, `-960`, `-1600`,
and `-2400` for artworks. For one new picture, make those widths from her file (Python with Pillow, or `sips` on a
Mac) next to the others in `public/shared/img/<section>/` and add the `<img>` with `srcset`, like its neighbours.
`tools/prepare-assets.py` rebuilds *all* pictures from her complete Google Drive website folder copied into
`_source/` (folder names as in that script); only use it for a full refresh. **Shop pictures don't need this:**
they come from Shopify (section 4).

## 4. Her Shopify and how the site uses it

Her store is `2pssuy-7e.myshopify.com` (admin: admin.shopify.com, store handle `the-global-collage`). The site
reads her products, prices and stock from Shopify and hands the cart to **Shopify's own checkout** on
shop.theglobalcollage.com. Payments, orders, shipping labels and customer emails all stay in Shopify.
**The checkout is real:** a test may add to a cart but never completes a payment.

Most shop changes need **no code at all**. She makes them in her Shopify admin, or you do them with her in her
own browser while she is signed in (with Claude in Chrome, or by telling her where to click):

| She wants to… | In her Shopify admin | On the site |
|---|---|---|
| Add a new original | Products › Add product: title, price, **at least one picture**, Product type `Original`, in the collection `originals`, Track quantity on, 1 in stock, "Continue selling when out of stock" off, Status Active | Appears in the shop by itself |
| Add a print or a product | Same, with type `Print` / `Good` and the collection `prints` / `goods` | Appears under Prints / Goods |
| Mark a piece sold | Set its stock to **0** and keep it Active (Draft or Archived hides it completely) | Shows "Sold", no buy button |
| Change a price or title | Edit the product | Changes by itself |
| Give a piece its size, medium, year or story | Product metafields, namespace `custom`, all plain text: `medium`, `dimensions`, `year`, `story` (Settings › Custom data › Products; tick **Storefront access** on each) | Shown on the piece's page; until then a placeholder |
| Add pictures to her products | Each product › Media | Shopify's pictures replace the site's own copies, and show in checkout too |

Things to know:
- **Her 25 products had no pictures in Shopify at the handover.** Until they do, `public/shared/shop/shop.js`
  borrows the site's own files of each piece (matched by name; three Shopify names differ from her file names:
  `let-it-out` = Let Out, `gaga-ate` = Gaga's Offering, `dibujo-libre` = Day # 25). A **new** product with no
  picture in Shopify does not show on the site.
- The collections `originals`, `prints` and `goods` must stay **published to the same sales channel as the
  products**, or the site can't see them.
- **Primary domain must stay `shop.theglobalcollage.com`** (Settings › Domains). If the main address is made
  primary again, checkout breaks.
- **Private mode must stay off** (Online Store › Preferences › Store access), or every checkout goes to a password
  page.
- The site's key to her shop is the **Storefront token** in `public/shared/config.js`. It is public by design
  (read-only, safe in a browser) and belongs to her store, so it keeps working after the old team leaves. It lives
  in her admin under Sales channels › Headless (or Apps › Develop apps). If she ever wants a new one: she creates
  it there, you put it in `config.js`, push, check the shop, and only then she deletes the old one.
- **Never put an Admin token** (`shpat_...`) or any password in the code: the code is published.
- Product pages are drawn in the browser from Shopify. Search engines read that less well than ready-made pages.
  Fine for now; pre-building them is the upgrade if search traffic starts to matter.

## 5. The forms

Contact, commission and newsletter forms post to `api/contact.js`, which emails them to
**theglobalcollage@gmail.com** through FormSubmit (free, no account; activated once, section 1 step 8).
- To send them to another address: in Vercel › the project › Settings › Environment Variables, add `CONTACT_TO`
  with the new address, redeploy, and activate again from the email FormSubmit sends to that address.
- A newsletter sign-up is just an email to her. If she wants a real mailing list (Shopify Email, Mailchimp…),
  the newsletter form in `public/shared/forms.js` and `api/contact.js` is what changes.
- No spam filter beyond a hidden trap field. If spam starts, add Vercel's firewall rules or a captcha.

## 6. Keeping it healthy

- **Once a year:** Shopify retires its Storefront API versions after about a year. `config.js` says `2026-07`;
  raise it to the newest version (shopify.dev › Storefront API › versions) before mid-2027, run `npm test`, check
  the shop, push.
- **After any change:** pages load, prices show, a cart opens checkout on shop.theglobalcollage.com (don't pay),
  and after a form change one message reaches her inbox.
- `TO-CONFIRM.md` is her list of what's still missing. When she supplies something, put it in and strike the line.
- Her domain renews through Shopify (Settings › Domains). Vercel needs nothing for the domain.

## 7. Questions she may ask

- **"How do I add a new piece?"** In Shopify, with a picture and the right collection (section 4). No website
  change needed.
- **"Why is there no picture at checkout?"** Her products have no pictures in Shopify yet. Add them there.
- **"Where do messages from the site go?"** To theglobalcollage@gmail.com, once the form is activated.
- **"What does this cost me?"** Her Shopify plan and domain, as before. GitHub and Vercel are free (Vercel may ask
  for its paid plan one day; section 1 step 1).
- **"Can I change the text on a page?"** Yes: tell you the new words and which page; you change, show, publish.
- **"Something looks broken."** Roll back first (section 3, step 6), then find out why.
- **"Who built this?"** Dre Blckwell's team, as a gift. They no longer manage it.
