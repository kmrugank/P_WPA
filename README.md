# Lunara

**Your cycle. Your rhythm.** An iPhone-focused, local-first menstrual health PWA built with React, TypeScript, Vite, Dexie, date-fns, Motion, and Lucide. No login, backend, trackers, or external font/asset requests. No health records are uploaded.

## Run and verify

Requires a supported Node.js 22.12+ or Node 24 runtime and npm. Node 24.19.0 is pinned in `.nvmrc` and was used for validation.

```sh
cd /workspace/P_WPA
npm ci --cache /workspace/.npm-cache
npm run dev
npm test
npm run build
npm run preview
```

Development serves on port 5173; production preview on 4173. Use the production build for offline checks: the service worker is intentionally disabled in development. Deploy the contents of `dist`, not the source directory. No environment variables or API keys are required.

Browser tests:

```sh
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

If a Chromium browser is already installed and downloads are restricted:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium-mobile
```

`PLAYWRIGHT_BROWSERS_PATH` can point to a writable browser cache. WebKit emulation is helpful but does not replace actual iPhone Safari testing.

## What is included

- Nine-step onboarding with optional name, menstrual history, tracking goals, and reminders.
- A responsive cycle dashboard, gentle mood check-in, quick actions, personal reminders, and educational content.
- Monthly calendar with year selection, recorded vs estimated periods, daily logs, optional broad fertile estimates, and a non-color-only legend.
- Historical period creation, editing, ending, and confirmed deletion; duplicate starts and overlapping periods are rejected. Spotting does not create a cycle.
- Date-keyed daily logs with flow, mood, physical and custom symptoms and 1–5 intensity; optional sleep, energy, stress, hydration, exercise, appetite, cervical mucus, temperature, and notes. Future dates support planning notes; health controls are disabled.
- History windows, cycle and duration bar charts, symptom frequency, mood counts, flow observations, descriptive period/symptom associations, and a text appointment report with opt-in notes.
- Light, dark, and system appearance; week start, date format, tracking mode, and personal defaults.
- Versioned JSON backup and restore, file validation and preview, transactional merge or replacement, optional AES-GCM encrypted backups, and full local-data reset.
- Standalone PWA manifest, local icons, Apple touch icon, Workbox precache of every application screen, update prompt, and safe-area-aware navigation.
- Keyboard focus indicators, native modal focus handling, screen-reader labels, reduced motion, and automated accessibility checks.

## iPhone installation

Deploy to an HTTPS host first. A file opened directly from a ZIP cannot install a service worker.

1. Open your deployed address in **Safari** on the iPhone.
2. Open the **Share** menu.
3. Choose **Add to Home Screen**.
4. Enable **Open as Web App** if shown.
5. Tap **Add**, then launch Lunara from its icon.
6. Open online once and verify offline launch using the steps below.

No Apple Developer membership is required. Safari and the installed web app can have separate storage; use backup/restore if moving between them. Back up before changing deployment domains, which also changes the storage origin.

## Deploy for free

The project is a static site with no server or paid domain requirement. `dist` contains everything needed.

### GitHub Pages (recommended for this repository)

The repository includes `.github/workflows/deploy-pages.yml`. Every push to `main` tests and builds Lunara with the `/P_WPA/` base path, then publishes it to GitHub Pages.

1. Open the GitHub repository and select **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions**, select **Deploy Lunara to GitHub Pages**, and run it if a push did not start it automatically.
4. Wait for the workflow to finish. The site will be available at `https://kmrugank.github.io/P_WPA/`.
5. Open that address in iPhone Safari, use **Share → Add to Home Screen**, enable **Open as Web App** if offered, and tap **Add**.

GitHub Pages is public. The application files are public, but personal health records remain in the browser's local IndexedDB and are not committed to the repository or uploaded to GitHub.

### Netlify

Build with `npm run build`; upload the `dist` folder through Netlify’s manual deployment UI, or connect your repository. `netlify.toml` sets the build command, publish directory, and fallback. Netlify provides an HTTPS `netlify.app` address.

### Cloudflare Pages

Connect the repository, use `npm run build`, and set the output directory to `dist`. Select Node 24 if needed. Alternatively upload the built `dist` folder using Pages Direct Upload. Cloudflare supplies an HTTPS `pages.dev` address. `public/_headers` supplies security and cache headers for Pages/Netlify static hosting.

### Vercel

Import the repository as a Vite project. `vercel.json` supplies build, output, and security headers. Vercel provides an HTTPS `vercel.app` address.

Deployment needs your hosting account. This repository does not contain hosting credentials, and no public deployment has been created automatically. Verify response headers on the chosen host; Vite’s local preview does not apply hosting header files.

## Privacy and backups

The only health database is `lunara-private-v1`, stored in IndexedDB for the current origin. Personal records never enter the service-worker cache. The offline cache contains application code and public icons only. Data is not encrypted at rest inside IndexedDB: an unlocked/shared device, malicious code on the same origin, or a compromised browser can access it. Use your device lock.

Export a backup from Settings regularly. Encrypted backups use AES-256-GCM, a fresh random 16-byte salt and 12-byte IV, and PBKDF2-SHA-256 with 600,000 iterations. The password and derived key are not stored. There is no password recovery. Unencrypted exports and reports contain sensitive information; choose their storage carefully. Safari may show a download or share interface depending on version.

Restore previews show record counts before confirmation. Merge replaces matching IDs/dates from the backup and preserves current preferences; overlapping periods abort the entire transaction. Replacement replaces all records and preferences in one transaction. Invalid files do not erase existing data. “Delete all data” clears records and preferences; exported backups and OS-level copies remain outside the app’s control.

Local browser storage can be cleared or evicted. Removal, a device reset, or clearing site data may erase records. No automatic server recovery is available.

## Forecasting, with honest limits

Cycles are calendar-day intervals between confirmed period starts; duration includes both start and end dates. Local calendar arithmetic avoids daylight-saving elapsed-hour errors.

For insufficient history we use the configured typical length, or a clearly identified provisional 28-day assumption. Otherwise we blend the median and a recency-weighted mean over up to 12 intervals. Intervals below 15 days or above 90 days, or more than the greater of 15 days or 50% away from the median, are excluded from forecasting but remain in the visible history. This explicit heuristic can exclude valid unusual cycles; it is not clinically validated. The UI reports exclusions.

Ranges reflect observed variability, not a statistically calibrated prediction interval. Irregular and perimenopausal modes widen ranges. Ordinary forecasts are paused for hormonal contraception, pregnancy, postpartum, breastfeeding, and uncertain history. Overdue forecasts do not create records. A phase is shown as uncertain when history is insufficient or a forecast is unsuitable.

Optional ovulation/fertile estimates are broad calendar models around an assumed 14-day pre-period date. They cannot confirm hormone levels or ovulation and have limited reliability. **Cycle predictions and fertile-window estimates must not be used as contraception.** Lunara is not medical advice, a diagnosis, or treatment. Seek appropriate medical care for concerning symptoms.

## Notifications, locking, and other limitations

- In-app reminders appear on Home while the app is open. They do **not** wake a closed app or guarantee background delivery. No notification permission is requested.
- Reliable closed-app reminders on iOS require an installed PWA, supported Web Push, and a backend with VAPID keys, subscriptions, scheduling, and generic privacy-preserving payloads. That optional infrastructure is not implemented in this local-only release.
- No Face ID/passkey app lock is offered. WebAuthn requires an appropriate relying-party design; a JavaScript screen lock would not encrypt IndexedDB. This app makes no native security claim.
- Encryption is available for backups, not the live database. No syncing or partner sharing is included.
- Use Save to commit daily observations and preferences. Navigation warns before discarding unsaved edits; OS/browser termination cannot guarantee retention of an unsaved draft.
- iPhone date/time pickers and download behavior are controlled by Safari. Physical-device installation, safe areas, VoiceOver, download/share behavior, and storage eviction need real-device validation.

## Offline and update verification

1. Run `npm run build` and `npm run preview`, or open the HTTPS deployment.
2. Open online once; wait for “Lunara is ready to open offline.”
3. Record a period and a daily check-in, then reload to verify storage.
4. Enable airplane mode, close/reopen the installed app, and visit every tab.
5. Save a new note offline, reopen, and confirm it remains.
6. Reconnect and export a backup.
7. For app updates, save edits first, then accept “A fresh version is ready.” Updates replace app assets, not health records.

## Architecture

```
src/core/         Typed models, calendar dates, forecasts, IndexedDB, state, backup crypto/validation
src/components/   Shared UI, native modal sheets, period editor
src/screens/      Onboarding, Home, Calendar, Log, Insights, Settings
public/           Local PWA icons and hosting headers
scripts/          Reproducible icon generation (Pillow only needed to regenerate icons)
tests/            Vitest core coverage and Playwright functional/accessibility/offline checks
```

Screen modules are lazy-loaded and precached for offline navigation. Small native charts with recorded-day drilldowns avoid a heavy charting-library dependency. Styles use local CSS design tokens and system/Georgia fonts. No external content is needed for core functionality.

## Validation record

See `VALIDATION.md` for the executed checks and known untested platform behaviors. Automated accessibility checks complement, rather than replace, manual VoiceOver and real-device testing.
