# Owner production planner

Open /admin, sign in with an existing site owner, and select **Inventory & bake plan**.

## First use

1. Refresh Square sales. This reads recently updated orders and seeds cookie flavors from active numbered-box modifier lists.
2. Select the date on a known mixed-box ticket. Check imported orders against the ticket, including repeated quantities and multiple boxes.
3. Review any unallocated orders. The review form replaces the entire order's allocation, not just its missing items. Add missing flavors first. Reviews are bound to the Square order version and become invalid when the order changes.
4. Enter opening stock before the selected date's sales, then record bakes, waste and corrections. Opening stock is a daily starting count, not a current physical recount. Inventory is not automatically carried into a new day.
5. Import eight weeks for initial forecasting. Established flavors use their own history after three usable matching-weekday observations. New active flavors receive a provisional estimate from total matching-weekday demand and past rotating-flavor demand, refined by completed sales days this week. A manual target always takes precedence.
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
- Established-flavor baselines use at least three earlier matching weekdays with positive observed same-day demand, excluding advance orders and entire dates with unresolved issues. Historical flavor availability is not known, so absent flavors are not invented as zero-demand observations.
- New active flavors without three observations use a provisional fallback. Total demand is the mean of up to eight earlier matching weekdays with positive observed sales for the same cookie size. At least one usable matching weekday and an imported history boundary are required. The historical counts not belonging to established current-menu flavors form a proxy for rotating-flavor demand; this pool is split equally among new current-menu flavors as the starting share. If that pool has no observed sales, an equal share across the active menu is used instead. This proxy is inferred from sales, not an explicit historical menu classification.
- Once a new flavor has observed sales during the selected date’s Monday-start week, its share is blended with completed, reconciled same-week sales from its first observed day onward. A 100-cookie prior at the starting share limits early noise: share = (100 × starting share + flavor sales) / (100 + same-size sales). Baseline = round up(total weekday demand × share). Today’s partial sales, future days and advance orders are excluded. Full-size and mini demand never mix. Off-menu flavors retained only for reconciliation do not receive this fallback.
- Forecast labels distinguish exact-flavor history, a new-flavor estimate, and an estimate using this week’s mix. These are provisional observed-sales estimates. Stockouts, promotions and events can affect demand; the planner has no historical availability or lost-sales data. Estimates for individual flavors are not constrained to sum to an exact shop-wide target.
- Target = baseline + known advance-order cookies, or owner target (at least known advance orders). To bake = max(0, max(target, ordered) - opening - net production). No bake suggestion is shown without an opening count and target, or while this day's imports need review.
- Full-size tray guidance uses 15 cookies per tray. It rounds up for planning; it does not change inventory or record a bake.

## Import behavior and limits

Refresh reads three days of Square updates; history import reads 56 days. Search is scoped to the configured location and sorted/filtered by UPDATED_AT. Stable order IDs replace snapshots, preventing duplicate counts. Imports are manual and the last-import timestamp is shown; no background/webhook inventory sync is installed. Archived orders changed outside an imported window require a new history import. History remains provisional until ticket reconciliation and review are complete. Refreshes do not write to Square or alter online stock, availability, payments, or pricing.

The importer caps at 40 pages of 500 orders and fails before saving order snapshots if more pages remain. Database reads are explicitly paginated. Only summaries, flavor quantities, technical order IDs/numeric ticket labels and review notes are stored; customer contact/payment details are discarded. No new packages or credentials are required beyond the website's existing Square and Supabase server credentials.

## Security and verification

The Express API verifies the Supabase user server-side and requires app_metadata.site_admin === true. New tables have RLS enabled and no anon/authenticated grants; only the server role accesses them. Every stock mutation is timestamped and owner-attributed. Stock requests carry an idempotency UUID. Owner order reviews are version-bound. The site manager is noindex.

Run `node --test api/tests/production.test.js` and `npm run build`.
