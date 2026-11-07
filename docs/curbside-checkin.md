# Curbside check-in

Curbside checkout now creates a Square PICKUP fulfillment with is_curbside_pickup and an ASAP 15-minute preparation estimate. Carryout and shipping checkout retain their existing behavior.

The payment link returns customers to /curbside with a signed, seven-day order-specific token in the URL fragment. The browser saves that link locally and removes the fragment from the address bar. The footer's Curbside check-in link reopens the last saved order in that browser. Customers should keep the return page open; there is no custom check-in email or SMS delivery in this version. Square receipt notification behavior is unchanged.

The customer enters their order name and vehicle/parking details and taps I'm here. The API verifies the token, configured location, curbside fulfillment, completed Square payments and remaining paid amount before updating buyer_arrived_at and curbside_details on the existing Square fulfillment. Canceled, already-collected and unpaid orders cannot check in. Already-recorded arrivals return success without issuing a second update. Version conflicts are re-read once. Tokens are sent to the API in a header, never query parameters. No new database table is needed.

Square's curbside arrival alert depends on enabled POS order alerts. Verify that alerts are on in the shop's Square POS, then perform one paid curbside order and check-in to confirm the arrival banner/notification on the actual device. Mocked API tests cannot verify the device alert. A Square update failure displays an error and directs the customer to contact the shop; it never claims the team received an alert.

No new environment variable is required. CURBSIDE_CHECKIN_SECRET may optionally provide a dedicated persistent signing secret; otherwise the existing SQUARE_ACCESS_TOKEN signs domain-separated tokens. Rotating either effective signing key invalidates earlier check-in links. The CHECKOUT_REDIRECT_URL origin, when configured, must be the custom website's current domain, not the old Square storefront.

Validation: node --test api/tests/curbside.test.js api/tests/checkoutCurbside.test.js. Covers signed/expired links, ownership/location, unpaid/closed orders, arrival payload, repeat taps, version conflict, validation/origin controls, SDK fulfillment serialization, signed checkout return and unchanged carryout behavior.
