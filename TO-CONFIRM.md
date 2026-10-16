# To confirm — The Global Collage website

What is still open. Rewritten 2026-10-16, when the site was finished and her Shopify connected. The
site's own choices are in `docs/site-b/DECISIONS.md`. Going live: `docs/LAUNCH.md`.

## From Camila, in her Shopify

- **No product has a picture in Shopify.** The site borrows its own files of each piece, so the site looks
  right, but Shopify's checkout and her stock Shopify pages show none. Adding the picture to each product
  fixes both.
- **Medium and size per piece** show as placeholders on every product page. They belong in product
  metafields (namespace `custom`: `medium`, `dimensions`, `year`), with Storefront access allowed.
- **Year** is missing for Dibujo Libre, Female Cactus, Let It Out, Lucky Pleasures, and Tears water the soul
  (Pink) and (Silver).
- **Which pieces are sold?** Her copy says 11 originals sold at Tripping Animals, but all 25 are listed as
  1 in stock. A sold piece should have 0 in stock; the site then shows "Sold" and no add button.
- **Three pieces carry different names in Shopify and in her files**: "Let It Out" (file: Let Out),
  "Gaga Ate" (Gaga's Offering), "Dibujo Libre" (Day # 25 Dibujo Medium). The site treats each pair as the
  same piece. Please confirm.
- **"Originals from $111"** (her copy) is now shown with the lowest price in her store ($77 on 2026-10-16).

## From Camila, for the site

- **Legal text**: shipping costs and delivery times, the returns policy, the privacy policy. Those pages
  show only what the copy states (US only, ships from Miami, insured) and marked placeholders.
- **Services carousel**: past projects, each with the brand or campaign name and one picture (four
  placeholders now).
- **Commissions in progress**: pictures (one placeholder now; her folder was empty).
- **Eight originals only exist as small files** and cannot be shown large or zoomed: Blues, Candy, Day # 25,
  Home, Looking, Royal Love Story, Small World, Tears Water The Soul - Pink.
- **The Mac Miller lyrics piece**: which one is it? The copy says to keep it out of prints (no prints yet).
- **Newsletter**: sign-ups arrive as emails in her inbox. If she wants a mailing list (Shopify Email,
  Mailchimp…), they can go there instead.

## Decisions for Camila and Dre

- **Figures cut out of her artworks are used as decoration** only on the old options; the finished site
  uses cut-outs from her studio photos, never from an artwork.
- **The brand board's printed colour codes do not match its swatches.** The site uses the swatches as
  measured: blue `#122FAB`, off-white `#EFEDEA`, black `#231F20`, orange `#FF5630`, green `#496843`. The cutting mat is `#028B71`.
- **The board names "Giaza" as the display typeface; her folder holds "Neco".** Built with Neco.
- Product pages are drawn in the browser from Shopify data, which search engines read less well than
  pages built ahead of time. Fine to start; pre-build them later if search matters.

## After launch

- The GitHub token behind the old review notes expires on 2026-11-12; nothing on the live site needs it.
