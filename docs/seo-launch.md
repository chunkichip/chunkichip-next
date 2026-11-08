# SEO launch checks

## Implemented

- Unique server-generated product metadata and canonical URLs from the public Square-backed menu. Weekly modifier flavor IDs resolve alongside item IDs.
- Product content is rendered on the server, then refreshed in the browser so current availability still comes from Square.
- Home menu initial data can be server-rendered; five-minute catalog fetch revalidation. Provider outages preserve the interactive client fallback.
- Dynamic sitemap includes public catalog item and current weekly flavor URLs, excludes internal packaging, catering SKUs, and private checkout pages.
- Archive title/description/canonical, private confirmation noindex, and breadcrumb structured data on valid product pages. Unknown product IDs return 404 when the catalog is healthy.
- Existing real homepage photograph is used for default social previews and the local business image, replacing the Google Street View thumbnail.
- Responsive Next image optimization for large local box art, lazy loading for below-the-fold home product images, and explicit hero dimensions.
- Permanent redirect rules from observed Square sitemap paths. `www.chunkichip.com` redirects to the canonical `chunkichip.com` host after the domain is attached.
- The onrender.com host sends `X-Robots-Tag: noindex`; custom production hosts do not.

## Old sitemap review

Observed 28 URLs at https://www.chunkichip.com/sitemap.xml on November 7, 2026.

- Existing `/`, `/catering`, `/shipping` paths remain.
- `/jobs` -> `/careers`; `/menu` -> `/#menu`; `/donation-requests` -> `/contact` (the shop handles inquiries).
- `/product/:slug/:id` -> `/product/:id`; catering product slugs instead -> `/catering`.
- Shipping category paths -> `/#shipping-boxes`; cookie box categories -> `/#boxes`; cookie categories -> `/#single-cookies`; all/drinks categories -> `/#menu`.
- `/s/stories/story-title` has no confirmed matching article. Leave it 404 rather than redirecting an unrelated article to the homepage.
- The old `gourmet-cookie-12-pack/5OX2RU5LKKQJW2ZAAI7PYT5U` path keeps its catalog ID. The current Square name is authoritative even when an old slug differs.

## Still required at domain cutover

1. Attach chunkichip.com and www.chunkichip.com to Render and verify TLS before changing live DNS. Preserve email DNS records.
2. Check canonical tags, redirects, sitemap and robots on the real domain, including a real old Square product URL.
3. Keep Google Search Console verification valid, submit the new sitemap, inspect home/catering/a product, and watch indexing/404 reports. This is the same business domain; a domain Change of Address is not needed merely to replace hosting.
4. Validate local business/breadcrumb markup using Google's Rich Results Test. No rich-result eligibility or ranking guarantee is claimed.
5. Measure mobile PageSpeed/Core Web Vitals on the actual domain. Image optimizations are implemented; no performance score has been verified here.
6. Confirm Google Business Profile website/order URLs point to the correct pages and preserve existing business information.

Public search results, ranking transfer, external profile edits, live DNS and Search Console submissions are not completed by this code change.

## Verification before publishing

- TypeScript and production build passed.
- All 33 existing API tests passed.
- A production-mode HTTP check with a local read-only public catalog fixture verified product title/description/canonical and rendered content, breadcrumb markup, product sitemap entries, omission of checkout/internal catering SKUs, legacy redirects, unknown-product 404, confirmation noindex, onrender-only noindex response headers, and www-to-apex redirects.
- Next image optimization served a 640 px box image as a 102,366-byte WebP, versus the 3,213,012-byte original PNG. This is an asset-size check, not a PageSpeed or Core Web Vitals score.
