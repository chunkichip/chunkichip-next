# Catering

The public `/catering` page orders one preset package separately from the regular cookie cart. Larger/custom requests are saved to Site Manager > Catering requests. No quote notification emails are sent; review that inbox and contact the customer. Status is editable by the owner; request details are read-only.

## Square catalog

- `Full-Size Cookie Catering`: 24/48/72, variations named with `Wrapped` or `Unwrapped`. Expected prices: $96/$192/$288 wrapped, $84/$168/$252 unwrapped.
- `Chiptinis Catering`: 30/$24, 60/$45, 90/$65.
- `Catering Dips`: Vanilla Frosting, Chocolate Frosting, Marshmallow Frosting modifiers, $4 each for 8 oz. Repeated dips use Square modifier quantity. Modifier association with the item is optional for the API checkout.
- Unambiguous name/size/price matches required. Changed prices, archived items, manually sold-out or unavailable-location variations disable that option. No client-provided prices are used.
- Chiptini flavor allocations must be in multiples of ten. Full-size flavor quantities remain flexible. Flavor allocations are included in the order line note and pickup note for the team.
- Catering items are excluded from the general menu API.

## Scheduling

Milford only. Pickup hours are explicitly configured in `api/cateringSchedule.json`: Wednesday through Sunday, 11 a.m. through 5 p.m. America/New_York, including the 5 p.m. pickup slot. At least 48 real hours of notice; 30-minute intervals; next 60 days. The catering schedule is independent of the Square location business-hours field. This does not include a separate event capacity calendar or holiday exceptions; update the catering schedule and disable catalog options as needed. Delivery is quote-only.

Checkout revalidates catalog and pickup slots, then creates a Square-hosted payment link with SCHEDULED pickup, customer contact, catalog variation and modifier IDs, flavor quantities, and catalog tax application. Idempotency derives from the browser attempt ID plus validated order/contact data. Paying through Square completes the order; a quote request never reserves a date.

## Quote storage

Applied setup is documented in `supabase/setup/catering-requests.sql`. Server uses existing Supabase secret. Browser submissions go through `/api/catering/quote`, not direct table writes. RLS permits owner SELECT and status-only UPDATE; server INSERT. No public request listing.

## Validation

`node --test api/tests/catering.test.js`: package mapping, price mismatch/duplicates/location sold-out, scheduling across DST, closed hours, 48-hour lead time, flavor totals, dip quantity, contact validation, checkout payload and retry idempotency. No real payments/orders or customer messages are created by these tests.
