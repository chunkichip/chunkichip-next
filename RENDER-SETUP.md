# Chunki Chip Render setup

This project serves the Next.js storefront and Square API from one Render web service. Connect the `chunkichip/chunkichip-next` GitHub repository to Render and select **New Blueprint Instance** so Render reads `render.yaml`.

Set these private environment values in the Render service dashboard:

- `SQUARE_ACCESS_TOKEN`: Square access token for the production account.
- `SQUARE_LOCATION_ID`: location that should receive online orders.
- `SQUARE_ENV`: `production` (the blueprint default).
- `SHIPPO_API_TOKEN`: a private Shippo API token. Add it in Render's environment settings; do not put it in the browser or commit it to GitHub.
- `SHIPPO_PACKAGES_JSON`: use this exact JSON for the two box sizes currently shipped: `{"6":{"length":9,"width":4,"height":4,"weight":3,"distanceUnit":"in","massUnit":"lb"},"12":{"length":9,"width":8,"height":4,"weight":6,"distanceUnit":"in","massUnit":"lb"}}`.
- `CHECKOUT_REDIRECT_URL`: the public success page, normally `https://chunkichip.com/success`.

Catalog items must be active and visible to e-commerce in Square. To offer box flavor choices, attach a Square modifier list to the corresponding box item. The modifier names, prices, and options are loaded from Square when the menu is requested.

Nationwide checkout requests live Shippo rates from the selected Square location address. Customers choose a carrier service before the site creates a Square Payment Link with that rate as the shipping fee. Accurate packed dimensions and weights are required before enabling production quotes. Shippo label purchasing remains in Shippo; connecting Shippo to Square does not provide this custom storefront with API access.

The current storefront supports Square catalog product cards, box size selection, modifier choices, a persistent cart, Square Payment Link checkout, curbside/in-store pickup, Shippo live shipping quotes, DoorDash handoff, a mailing-list form, location details, and catering entry point. Square Rewards, account sign-in, order history, gift cards, and native delivery/routing require separate Square products or credentials and are not represented as active integrations here.
