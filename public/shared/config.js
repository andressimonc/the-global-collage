// The switches for all three sites. Nothing else needs editing to go live.
//
//   import { SITE } from '../shared/config.js';
//
// Sites do not normally read this: shop.js and forms.js do.
export const SITE = {
  shopify: {
    // The shop's permanent *.myshopify.com address (not the public domain).
    domain: '2pssuy-7e.myshopify.com',
    // Shopify's PUBLIC Storefront API token. Safe in a browser. Never an Admin token ("shpat_...").
    // Empty = sample mode: the sample catalogue, a cart kept in this browser, no checkout.
    storefrontToken: '',
    // Storefront API version. Shopify retires versions after about a year; bump it then.
    apiVersion: '2026-07',
  },
  // false = forms validate and say "thank you" but send NOTHING. true = they post to formsEndpoint.
  formsLive: false,
  // The function that emails a form (api/contact.js on Vercel).
  formsEndpoint: '/api/contact',
};
