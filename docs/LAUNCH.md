# Launch: putting theglobalcollage.com on the new site

Written 2026-10-16. The site is finished and lives at the root of `public/`. Her domain was bought through
Shopify, so its DNS is edited in her Shopify admin (Settings › Domains › theglobalcollage.com › DNS settings).
On 2026-10-16 it read: A `@` 23.227.38.71, AAAA `@` 2620:0127:f00f:b::, CNAME `www` and `account` →
shops.myshopify.com, TXT `_provider` and `_dmarc`.

Order matters: Vercel must know the domain before her DNS points at it, and Shopify's checkout must move to a
subdomain before the main address leaves Shopify (the cart's checkout link uses Shopify's primary domain).

## 1. Dre (two commands)

```bash
cd "/Users/dre/Documents/General - Codebases/Essentials/The Global Collage" && vercel deploy --prod --yes --scope dres-projects-6e4b1739
```

```bash
cd "/Users/dre/Documents/General - Codebases/Essentials/The Global Collage" && vercel domains add theglobalcollage.com the-global-collage --scope dres-projects-6e4b1739 && vercel domains add www.theglobalcollage.com the-global-collage --scope dres-projects-6e4b1739
```

The second prints the DNS records Vercel wants. If they differ from the ones in step 2 below, the printed
ones win: change Camila's steps before sending them.

## 2. Camila (her Shopify admin, on a computer)

**Keep checkout working**
1. Settings › Domains › **Connect existing**. Type `shop.theglobalcollage.com` and continue. Shopify manages
   her domain, so it sets this up itself. (If it asks for a record: CNAME, name `shop`, points to
   `shops.myshopify.com`, added under DNS settings.)
2. Click **theglobalcollage.com**. Next to "Primary domain" click **Change** and choose
   `shop.theglobalcollage.com`. Save.

**Point her address to the new site** (same page: DNS settings › **Manage**)
3. A record `@`: **Edit**, change it to `76.76.21.21`, save.
4. AAAA record `@`: **Remove**.
5. CNAME record `www`: **Edit**, change it to `cname.vercel-dns.com`, save.
6. Leave `account`, `shop` and the TXT records as they are.
7. Wait. Usually under an hour, at most a day. Then open theglobalcollage.com.

**Turn on the forms**
8. On theglobalcollage.com/contact, send a short test message. (This first one does not arrive.)
9. In theglobalcollage@gmail.com, open the email from FormSubmit and click **Activate Form**. From then on
   every message, commission inquiry and newsletter sign-up from the site arrives in that inbox.

## 3. After it is live (a chat can check)
- theglobalcollage.com and www load the new site; shop.theglobalcollage.com still answers for Shopify.
- Add a piece to the cart and open checkout: it must open on shop.theglobalcollage.com (do not pay).
- A contact message arrives in her inbox after activation.
