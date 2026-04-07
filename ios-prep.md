# BibleHabit iOS — App Store Prep Checklist

## Current Status
- `capacitor.config.ts` created (appId: co.biblehabit.app, server URL mode)
- Capacitor packages NOT yet installed — must do steps below first
- No `ios/` directory yet
- AdMob plugin NOT configured yet (see note below)

---

## Step 1: Install Capacitor Packages

```bash
cd /Users/forrestwebber/slacked-internal-dev/projects/daily_bible
npm install @capacitor/core @capacitor/ios @capacitor/cli
npm install @capacitor-community/admob  # if ads needed in iOS
```

---

## Step 2: Add iOS Platform (one-time)

```bash
npx cap add ios
```

This creates the `ios/` directory with the Xcode project.

---

## Step 3: Sync (run after any code/config changes)

```bash
npx cap sync
```

---

## Step 4: Open in Xcode

```bash
npx cap open ios
```

---

## Step 5: Xcode Configuration

Inside Xcode (App target > General):

- [ ] Bundle Identifier: `co.biblehabit.app`
- [ ] Display Name: `BibleHabit`
- [ ] Version: `1.0` (user-facing, e.g. "1.0.0")
- [ ] Build: `1` (increment each App Store submission)
- [ ] Deployment Target: iOS 16.0 minimum recommended
- [ ] Device Orientation: Portrait (or as desired)
- [ ] Signing & Capabilities: Select your Apple Developer Team (Forrest Webber / entity)

---

## Step 6: Safe Area / Status Bar (CSS)

Since `viewportFit: "cover"` is set in layout.tsx, add safe area insets to your
global CSS where needed (e.g. bottom nav bars, top headers):

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

Add to `globals.css` for any fixed/sticky elements that hug the edges.

---

## Step 7: App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Create a new App record:
   - Bundle ID: `co.biblehabit.app`
   - Name: `BibleHabit`
   - SKU: `biblehabit-ios-001`
   - Primary language: English (U.S.)
3. Category: Reference (or Lifestyle)

---

## Step 8: In-App Subscription — $4.99/yr

In App Store Connect > your app > Monetization > Subscriptions:

1. Create a Subscription Group: "BibleHabit Premium"
2. Add subscription:
   - Reference Name: `BibleHabit Annual`
   - Product ID: `co.biblehabit.app.premium.annual`
   - Duration: 1 Year
   - Price: $4.99/yr (Tier 5 in US)
3. Add localization (title + description)
4. Submit for review along with app

In the iOS app code, use StoreKit 2 (or Capacitor's in-app purchase plugin) to
gate the paywall. Since the iOS app uses a live server URL, the paywall logic
should live in the web app with a Capacitor bridge for purchase confirmation.

Recommended plugin: `@capacitor-community/purchases` (RevenueCat wrapper) or
`@ionic-native/in-app-purchase-2`.

---

## Step 9: Screenshots Required for App Store

Sizes needed (use Simulator or real device):
- 6.9" (iPhone 16 Pro Max) — 1320 x 2868 px
- 6.5" (iPhone 14 Plus / 13 Pro Max) — 1242 x 2688 px
- 5.5" (iPhone 8 Plus) — 1242 x 2208 px
- iPad Pro 13" — 2064 x 2752 px (if supporting iPad)

Minimum: 6.9" and 6.5" required. At least 1, up to 10 per size.

---

## AdMob Note

`@capacitor-community/admob` is not installed or initialized.
The monetization model is:
- Web (free) — ads via Google AdSense/AdMob web
- iOS ($4.99/yr) — no ads for paying users

If you want ads on iOS for non-subscribers, you'll need to:
1. `npm install @capacitor-community/admob`
2. Register app in AdMob console, get App ID
3. Add App ID to `ios/App/App/Info.plist` under `GADApplicationIdentifier`
4. Initialize AdMob on app launch via Capacitor plugin
5. Gate ads behind a "not subscribed" check

This is optional — the simpler path is to skip ads on iOS entirely since
the subscription is the revenue model there.

---

## Server URL Mode — What This Means

`capacitor.config.ts` uses `server.url: "https://biblehabit.co"`. This means:
- The iOS app is a WKWebView pointing at the live production site
- No static export (`out/`) is needed
- `webDir: "out"` is still required by Capacitor but won't be loaded
- Changes to the web app automatically reflect in the iOS app (no App Store update needed for content)
- You MUST submit an App Store update if native Capacitor plugins change
- Apple may flag this if the app is essentially just a website — ensure there is
  meaningful native value (push notifications, offline reading, etc.) OR frame
  it as a native app with web content (common, generally accepted)

---

## Files Changed by This Prep

- `/capacitor.config.ts` — created
- `/src/app/layout.tsx` — added `Viewport` export with `viewportFit: "cover"`
