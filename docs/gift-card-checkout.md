# Custom eGift cards

`/gift-cards` contains the six existing Square-hosted designs, amount selection ($5–$500), recipient and sender details, personal message, review, Square card payment, and order confirmation. The original Square shop remains a fallback until custom sales are enabled.

## Render settings

Existing `SQUARE_ACCESS_TOKEN`, `SQUARE_ENV=production`, `SQUARE_LOCATION_ID_MILFORD` (or `SQUARE_LOCATION_ID`), and `NEXT_PUBLIC_SUPABASE_URL` are reused.

Add privately to the main Render web service:

- `SQUARE_APPLICATION_ID`: production application ID matching the Square access token.
- `SUPABASE_SECRET_KEY`: server-only sb_secret key for the existing project. Legacy SUPABASE_SERVICE_ROLE_KEY remains a fallback. Never prefix with NEXT_PUBLIC.
- `RESEND_API_KEY`: sending key for the verified Chunki Chip email domain.
- `GIFT_CARD_EMAIL_FROM`: verified sender, e.g. `Chunki Chip <gifts@chunkichip.com>`. Verify domain ownership with Resend and use a sender the business controls.
- `GIFT_CARD_SALES_ENABLED`: leave unset or false until payment and email testing is complete. Set to true to enable purchases.

For sandbox QA use a separate service with matching Square Sandbox application ID, token, location, and `SQUARE_ENV=sandbox`. Do not temporarily change the production service's Square environment: that also affects cookie checkout. Resend test delivery needs an authorized test recipient or a verified sending domain.

## Restricted production test

Keep GIFT_CARD_SALES_ENABLED unset or false. Set GIFT_CARD_TEST_EMAIL privately to the tester email. Open /gift-cards?test=1 and use that email for both buyer and recipient. This uses real production payments and issues a real card; the tester must explicitly pay. Ordinary visitors continue seeing the Square fallback. After testing, set GIFT_CARD_SALES_ENABLED=true.

## Database

The `gift_card_purchase_delivery` migration creates `public.gift_card_orders`. RLS is enabled; anon/authenticated have no access. Only the server role reads/writes orders. Rows contain contact/order details, hashed recovery token, provider IDs, and delivery state. Raw payment card fields, payment nonces, and gift card account numbers are never stored in this table or logged.

## Lifecycle and recovery

1. Validate amount, design and recipient; persist the request with an unguessable, hashed recovery token.
2. Create a Square order with `item_type=GIFT_CARD`, then collect payment using Square's Web Payments SDK and Payments API.
3. Re-read Square order and payment. Require completed payment, matching amount/currency/location/order, and no refund before activation.
4. Create and activate a Square-generated digital card, using the paid order and gift line item.
5. Email the selected artwork, message and gift card number to the recipient using Resend.

Stable idempotency keys protect order creation, payment, card creation, activation and email delivery. A database lease prevents simultaneous processing across server instances. An interval worker retries unfinished paid orders every 30 seconds with backoff. An interrupted request can also be checked from the purchaser's existing tab; its recovery credential is in sessionStorage, never in URLs. Do not place another order to recover an ambiguous payment.

`sent` means Resend accepted the email, not proof of inbox delivery. No delivery webhook is configured. Check delivery/bounce status in Resend. Automatic email retries stop at 23 hours from the first attempt, inside Resend's 24-hour idempotency window; these orders become `attention` for manual review. Unresolved unpaid/processing orders older than 48 hours also become `attention`. Review an `attention` order against Square and Resend before any manual resend/refund; never issue another card to recover an email failure.

Payments that remain uncertain require checking the Square order before another charge. A confirmed decline uses a new purchase order for another card. Scheduled delivery, SMS delivery, bulk gifts, group gifts, Apple Pay and Google Pay are not implemented in this first version.

## Validation

- `node --test api/tests/giftCards.test.js`: validation/XSS escaping, configuration gating, origin restriction, order ownership, changed order details, completed payment/activation/email sequence, decline, retry after email failure, and parallel pay clicks using mocked provider APIs.
- `npm run build`: Next production build and TypeScript.
- Real Square payment, activation and email delivery must be verified with a sandbox purchase before enabling live sales. No live payment or email was sent during implementation.
