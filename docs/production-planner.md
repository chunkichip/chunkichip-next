# Owner production planner

Open /admin, sign in with an existing site owner, and select **Inventory & bake plan**.

## First use

1. Refresh Square sales. This reads recently updated orders and seeds cookie flavors from active numbered-box modifier lists.
2. Select the date on a known mixed-box ticket. Check imported orders against the ticket, including repeated quantities and multiple boxes.
3. Review any unallocated orders. The review form replaces the entire order's allocation, not just its missing items. Add missing flavors first. Reviews are bound to the Square order version and become invalid when the order changes.
4. Enter opening stock before the selected date's sales, then record bakes, waste and corrections. Opening stock is a daily starting count, not a current physical recount. Inventory is not automatically carried into a new day.
5. Import eight weeks for initial forecasting. Use a manual whole-day target until there are at least three usable matching-weekday observations.
6. Print the plan through the browser. Square Stand USB printing is not integrated.

The bake-plan lineup comes from enabled, non-archived Square box modifiers for the selected shop, including sold-out flavors that need baking. Historical imports never activate old flavors. Cookies with paid orders or stock entries for the selected date remain visible for reconciliation. Adding a flavor adds it to that date’s plan with a zero-quantity adjustment. All historical flavors remain available when reviewing an order.

## Count model

- Catalog modifier quantity multiplied by box line-item quantity.
- Only boxes whose modifier quantities sum exactly to the declared size are automatically allocated.
- Full-size and mini flavor IDs are separate. Names are normalized across box sizes; genuinely different names remain separate.
- Website catering orders are allocated only when the structured catering note's flavor sum matches the package count; dips are excluded.
- Unknown items and preset boxes without a verified recipe are flagged. Non-cookie items can be excluded with an owner-reviewed whole-order breakdown.
- Unpaid and canceled orders consume no cookies. Paid pickup orders use their pickup date; other orders use closed/created date. Advance orders are those whose due day follows their creation day.
- Refunds do not automatically restock cookies. They require review against physical stock.
- Opening + bakes + adjustments - waste - imported/manual sales = remaining after orders.
- Baseline forecast uses earlier matching weekdays with positive observed same-day demand, excluding advance orders and dates with unresolved issues. Historical flavor availability is not known, so absent flavors are not invented as zero-demand observations. This is a provisional observational estimate, not a weather/event model or a complete retail-demand forecast.
- Target = baseline + known advance-order cookies, or owner target (at least known advance orders). To bake = max(0, max(target, ordered) - opening - net production). No bake suggestion is shown without an opening count and target, or while this day's imports need review.
- Full-size tray guidance uses 15 cookies per tray. It rounds up for planning; it does not change inventory or record a bake.

## Import behavior and limits

Refresh reads three days of Square updates; history import reads 56 days. Search is scoped to the configured location and sorted/filtered by UPDATED_AT. Stable order IDs replace snapshots, preventing duplicate counts. Imports are manual and the last-import timestamp is shown; no background/webhook inventory sync is installed. Archived orders changed outside an imported window require a new history import. History remains provisional until ticket reconciliation and review are complete. Refreshes do not write to Square or alter online stock, availability, payments, or pricing.

The importer caps at 40 pages of 500 orders and fails before saving order snapshots if more pages remain. Database reads are explicitly paginated. Only summaries, flavor quantities, technical order IDs/numeric ticket labels and review notes are stored; customer contact/payment details are discarded. No new packages or credentials are required beyond the website's existing Square and Supabase server credentials.

## Security and verification

The Express API verifies the Supabase user server-side and requires app_metadata.site_admin === true. New tables have RLS enabled and no anon/authenticated grants; only the server role accesses them. Every stock mutation is timestamped and owner-attributed. Stock requests carry an idempotency UUID. Owner order reviews are version-bound. The site manager is noindex.

Run `node --test api/tests/production.test.js` and `npm run build`.
