# BarbPH Sitewide SEO Plumbing

Current reconciliation: **2026-08-31 (Manila)**

## Canonical policy

Use the custom-domain, extensionless URLs as the canonical public addresses.

Current canonical content pages:

- `https://barbph.com/`
- `https://barbph.com/products`
- `https://barbph.com/programs`
- `https://barbph.com/publications`
- `https://barbph.com/partnership`

Do not use the Netlify subdomain as a canonical URL. Do not use `.html` URLs as canonical public addresses.

## Systems route

Systems & Transmission Logs is currently a homepage state/view, not an independent canonical content document.

`/systems` redirects to `/?systems=open`. Because that route ultimately resolves to the homepage canonical, the redirect-only `/systems` URL should not be listed as a separate sitemap URL.

## Sitemap policy

`sitemap.xml` should contain only direct canonical public content pages that BarbPH wants indexed.

Current sitemap set:

- Homepage
- Products
- Programs
- Publications
- Partnership

Internal labs, prototypes, Netlify Functions, redirect-only routes, and external EE/Google Slides destinations do not belong in the BarbPH sitemap.

## Robots policy

`robots.txt` allows ordinary public crawling and disallows Netlify Functions.

Internal diagnostic HTML pages should carry `noindex,nofollow`. Sitemap omission plus page-level noindex is the indexing guardrail for those HTML lab surfaces.

## Search Console handoff

1. Verify `barbph.com` ownership.
2. Submit `https://barbph.com/sitemap.xml`.
3. Inspect the homepage, Products, Programs, Publications, and Partnership individually.
4. Request indexing only for canonical production pages.
5. Do not request indexing for diagnostic labs, prototypes, redirect-only Systems state, or Netlify Functions.

## Guardrail

Do not add unfinished, diagnostic, parked, prototype, redirect-only, or placeholder URLs to the sitemap merely to make it look larger. The sitemap is a clean list of canonical public content.
