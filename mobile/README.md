# Chunki Chip mobile app — first test version

Customer app for iOS and Android, built with React and Capacitor. The native app bundles its interface locally. It reads the existing public storefront catalog at https://chunkichip.com/api/products and reuses the storefront's active weekly-flavor selection from `src/lib/catalog.ts`. It has no Square, Supabase, or other server credentials.

## Working in this version

- Cookies, Favorites, Rewards, and Visit navigation; flavor detail dialogs.
- Current weekly menu and box sizes, largest first.
- Device-persistent favorites and a labeled cached menu when offline.
- Manual refresh and refresh on returning to the app. No background polling or new hosted service.
- Existing ordering, shipping, catering, and rewards open in a secure native browser sheet (Safari View Controller / Android Custom Tabs). Closing the sheet returns to the app. Browser preview follows those links normally.
- Branded icons and launch screens; iOS UserDefaults privacy reason for device-local favorites/menu storage.

This is an alpha, not a submitted or approved store app. Checkout and rewards are website flows in this version, not embedded native forms. There are no push notifications, customer account synchronization, order history, or deep-link callbacks yet.

## Build

Node 24+ recommended. From `mobile/`:

```sh
npm ci
npm test
npm run sync
npm run open:ios
npm run open:android
```

The repository includes Xcode and Android projects. `sync` builds the web UI and copies it into both projects. iOS uses Swift Package Manager and requires macOS/Xcode; Android requires the SDK/JDK versions specified by the generated Gradle project. The provisional bundle/application ID is `com.chunkichip.app`; confirm availability in the developer accounts before the first upload. Keep this ID stable after publication.

Regenerate native icons/splashes after updating `assets/logo.png`:

```sh
npx capacitor-assets generate --ios --android --iconBackgroundColor '#ffccef' --splashBackgroundColor '#ffccef' --iconBackgroundColorDark '#ffccef' --splashBackgroundColorDark '#ffccef'
```

The storefront's root TypeScript project excludes `mobile/`, so mobile-only dependencies are not required for the production website build. The website deployment stays on `main`; this work is on `mobile-app`.

## Enrollment and release work still required

1. Owner enrolls Chunki Chip's legal entity with its existing D-U-N-S number. Apple: https://developer.apple.com/programs/enroll/ . Google Play: https://play.google.com/console/signup . Owner completes identity verification, agreements, and fees.
2. Set the Apple team/provisioning in Xcode; create and securely retain an Android upload key with Play App Signing. No signing keys are stored in this repository.
3. Test on real iPhone and Android: safe-area/keyboard, flavor details, favorites after restart, no-network startup, rewards login, checkout for pickup/shipping, scheduling, gift cards, payment redirects, curbside, and returning from the browser sheet. Do not place real charges without authorization.
4. Complete store privacy/data-safety disclosures based on the final app plus linked checkout, Square, and website analytics behavior. The included privacy manifest declares UserDefaults access only; it is not a completed store disclosure.
5. Finish app-native ordering/account requirements if needed for the intended customer experience and store review. Evaluate Apple minimum-functionality requirements; approval is not guaranteed.
6. Prepare real device screenshots, listing text, support/privacy URLs, age/content rating, reviewer instructions, and sign/upload to TestFlight and Google Play internal testing before production submission.

## Verification completed in this workspace

- Live public catalog returned HTTP 200 and accepted the `capacitor://localhost` origin.
- TypeScript + production web bundle succeeded.
- Automated checks cover current-menu selection, invalid catalog responses, and allowed storefront links.
- Both native projects generated and synchronized. Signed native builds/device testing require the development environments and developer accounts above.
