# Chunki Chip operations app

This app runs as a separate Render web service from the same Git repository, with its own build and process. It shares the existing Supabase production records and owner accounts. Square sales imports run on this service, independent of the customer website. No data migration or duplicate sales-import database is required.

Build: `npm ci && npm run build:operations`
Start: `npm run start:operations`
Health check: `/api/health`

Copy only these existing service settings securely into the new service:
- NODE_ENV=production
- NEXT_PUBLIC_OPERATIONS_APP=true (must also be set at build time)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
- SQUARE_ACCESS_TOKEN
- SQUARE_ENV=production
- SQUARE_LOCATION_ID or SQUARE_LOCATION_ID_MILFORD
- SQUARE_LOCATION_ID_NASHUA if configured

The new service does not need customer checkout, Shippo, Twilio, payment-link or analytics settings. Do not set NEXT_PUBLIC_API_URL to the customer website; operations requests must go to the operations service itself.

The initial release preserves owner-only authorization. Employee accounts and role-scoped API permissions are a subsequent feature; employees must not be assigned the site_admin flag simply to gain inventory access. Existing database RLS remains in force. The app does not change Square online availability.

The operations root redirects to /admin. No customer storefront pages, cart, analytics, or public checkout APIs are mounted in this process. The customer /admin stays operational until the new service has been tested with the owner. Do not redirect it during initial deployment.

Add the new HTTPS /admin?reset=1 URL to Supabase Auth's allowed redirect URLs before using password reset on the new domain. Existing email/password sign-in uses the same account but requires a new login on the new origin.

Verify health, owner sign-in, historical counts, a Square refresh, stock entry, print preview, weekly flavor edits and content edits before retiring the old admin. Current tray capacity is 10 full-size cookies.
