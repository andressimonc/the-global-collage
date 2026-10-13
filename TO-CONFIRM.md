# To confirm — The Global Collage website

What is still open before any of the three options can go live. Started 2026-10-13.
Each option's own choices are in `docs/option-N/DECISIONS.md`.

## From Camila

**Pictures still missing** (her Asset Guide says an empty folder means "still pending"):

| Folder | Empty | What the previews show instead |
|---|---|---|
| 01 Home › Hero — Statement Piece | yes | one of her high-resolution originals, chosen per option |
| 01 Home › About Teaser — Portrait | yes | the one portrait from 02 About |
| 01 Home › Featured Work | yes | six high-resolution originals |
| 03 Shop › Prints & POD Goods | yes | a "coming" state, no products |
| 04 Services (all three folders) | yes | marked placeholders: no project names or pictures were given |
| 05 Exhibition › Studio 18, Unsin, Coconut Grove | yes | text entries only |
| 06 Commissions › In Progress | yes | only the one finished commission |
| 07 Contact | yes (optional) | nothing |

**Eight originals only exist as small files** and cannot be shown large or zoomed. Bigger scans
needed: Blues, Candy, Day # 25, Home, Looking, Royal Love Story, Small World, Tears Water The Soul - Pink.

**Titles, as filed.** Please confirm the spelling and fill the gaps:
- "Senor Tigre" (or Señor Tigre?) · "Artstract" · "Day # 25" (file: "Day # 25 Dibujo Medium")
- No year in the file name: Day # 25, Female Cactus, Let Out, Lucky Pleasures, Tears Water The Soul - Pink and - Silver.

**Per piece, in Shopify:** price, size in inches, the one or two sentence story, and whether it is
sold (the copy says 11 originals sold at Tripping Animals). The previews show a **sample price of
$111** on every piece (her "Originals from $111") and no size or story.

**Services carousel:** the copy asks for past projects with "the brand or campaign name and one
visual". None were supplied.

**Legal text:** Shipping & Returns and Privacy. The previews state only what the copy states
(US only, ships from Miami, insured).

**The Mac Miller lyrics piece:** which one is it? The copy says to keep it out of prints.

**Duplicate:** `DSCF5885.JPG` and `DSCF5885 (1).JPG` in Process Shots are the same file.

## Decisions for Camila and Dre from the options

- **Figures cut out of her artworks are used as decoration** in several options (the tigers, the
  crowned head, the cactus, the onlookers from Curiosity…). Each option's DECISIONS file lists
  which. If she would rather her pieces never appear cut up, they swap for whole pieces.
- Each option's DECISIONS file also lists its hero piece, its six featured pieces and the few words
  that had to be added (a hint such as "Drag to look around", form thank-yous).

## Brand files

- **The brand board's printed colour codes do not match its swatches.** The previews use the
  swatches as measured: blue `#122FAB`, off-white `#EFEDEA`, black `#231F20`, orange `#FF5630`,
  green `#496843`.
- **The board names "Giaza" as the display typeface; the folder holds "Neco".** Built with Neco.
- **TT Interphases Pro is a trial copy.** It needs a paid web licence before launch, or a swap.

## Shopify (to connect the real shop)

The previews run on a sample catalogue. To switch to the real one:

1. In her Shopify admin, add the **Headless** sales channel (or a custom app) and create a
   **Storefront API** access token (the public one).
2. Publish the products to that channel. Today the store lists 25 originals in the Originals
   collection but none are visible on the storefront.
3. Paste the token into `public/shared/config.js` (`storefrontToken`). Nothing else changes.
4. For the product page fields, add product metafields in the `custom` namespace: `year`,
   `dimensions`, `medium`, `story`, and allow Storefront access to them.

## Forms and newsletter

- Contact and commission forms are built to email her through a mail service (Resend). That needs
  an account and three settings on the host. In the previews the forms send nothing.
- **Where should newsletter sign-ups go?** (Shopify's customer list, Mailchimp, Klaviyo…) Not decided.

## The review site (the nine options, for her notes)

- Putting it online needs Dre's yes, a Vercel project, a storage bucket for the notes and a review
  key. Steps: `docs/REVIEW-SITE.md`.
- The opening message to her and the one-line descriptions are drafts in his voice: `public/review/options.json`.
- One key opens both her link and the page where the notes are read.
- The trial copy of TT Interphases would be served from that public (unlisted) address.

## Before launch

- Remove the "noindex" settings (`vercel.json` and each page's robots tag).
- The site's addresses end in `.html` for now so each option works from its own folder.
- Product pages are drawn in the browser from Shopify data, which is weaker for search engines than
  pages built ahead of time. Worth deciding at launch: stay as is, pre-build the product pages, or
  port the chosen look into a Shopify theme.
