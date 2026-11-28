# Hoodie orders

- Page: /hoodies; homepage and main menu link to it.
- XS, S, M, L, XL: $39.99. 2XL and 3XL: $49.99.
- Milford pickup only, 183 Elm St, Unit 8. Allow 1–7 days.
- Customers must supply name, US mobile number, email, size and acknowledge waiting for contact before collecting. The API validates these fields and sets the price.
- Checkout is separate from cookie checkout. It has no scheduled pickup fulfillment; Square supplies its default payment-link fulfillment. No cookie food-tax assignment is copied to merchandise.
- Square order source: Chunki Chip Hoodies; reference: Hoodie pickup. Item name contains the size. The item note contains pickup instructions and all three contact fields. Ticket name is the pickup name.
- Find paid purchases in Square Transactions and open their order details. Confirm payment before preparing merchandise. Unpaid checkout links are not paid purchases.
- **Contact the customer manually when ready**, using the mobile number or email in the order note. This feature does not send automatic ready texts or emails, and marking an API order ready in Square must not be assumed to send one. Complete the order in Square after collection.
- Customer checkout confirmation repeats the 1–7 day wait and pickup address. It links back to the site without clearing an unrelated cookie cart.
- No live payment was made by automated verification.
