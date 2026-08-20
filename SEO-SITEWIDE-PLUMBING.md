# BarbPH Sitewide SEO Plumbing

Status: implemented for the currently public indexable pages.

## Canonical policy

Use the custom-domain, extensionless URLs as the canonical public addresses:

- `https://barbph.com/products`
- `https://barbph.com/programs`

Do not use the Netlify subdomain as a canonical URL.
Do not use `.html` canonical URLs for these pages.

## Sitemap policy

`sitemap.xml` contains only pages that are both intended for the public and appropriate for search indexing.

Currently included:

- Products
- Programs

Intentionally not included yet:

- Homepage — no official `index.html` exists yet.
- Partnerships — parked/not built yet.
- Daily Discover lab pages — diagnostics only.
- Homepage Priority lab — diagnostics only.
- Alive FAB prototype lab — diagnostics only.
- Netlify Functions — infrastructure endpoints, not content pages.

When the official homepage is created, add `https://barbph.com/` to the sitemap in the same release.
When Partnerships becomes a real public page, add it only after its canonical/meta setup is complete.

## Robots policy

`robots.txt` allows normal public crawling but excludes the diagnostic labs and Netlify Functions. It also advertises the canonical sitemap location:

`https://barbph.com/sitemap.xml`

Important: robots rules are crawl guidance, not a substitute for `noindex`. Diagnostic HTML pages should continue carrying `noindex,nofollow` metadata.

## Current canonical sanity check

- `products.html` declares `https://barbph.com/products`.
- `programs.html` declares `https://barbph.com/programs`.
- Both therefore match the URL forms used in the sitemap.

## Search Console handoff

Once the custom domain is ready to be verified in Google Search Console:

1. Verify `barbph.com` ownership.
2. Submit `https://barbph.com/sitemap.xml`.
3. Inspect `/products` and `/programs` individually.
4. Request indexing only after the canonical domain is resolving correctly.
5. After the official homepage launches, add it to the sitemap and inspect the root URL separately.

## Guardrail

Do not add unfinished, diagnostic, parked, prototype, or placeholder URLs to the sitemap just to make it look larger. The sitemap is a clean list of pages BarbPH actually wants search engines to discover and index.
