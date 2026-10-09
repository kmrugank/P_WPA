# Executed validation

Validated on October 9, 2026 in the cloud workspace. Node 24.19.0, npm 11.9.0, Vite 7.3.7, Vitest 5.0.3, and Playwright 1.64.0. Browser runs use the installed `/usr/bin/chromium`, with Playwright’s iPhone 13 emulation profile.

| Check | Result |
| --- | --- |
| Frozen installation: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | Passed |
| Strict TypeScript and production build: `npm run build` | Passed |
| `npm test` | 26 tests passed across 3 files |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium-mobile` | 7 tests passed; none skipped |
| `npm audit --audit-level=high --cache /workspace/.npm-cache` | Zero vulnerabilities, including development dependencies |
| Dev server HTML and transformed main-module requests | Passed on port 5173 |
| Manifest, icons, Apple touch icon, generated service worker | Present in production output; app assets precached |

## Unit coverage

- No history, one configured interval, provisional unknown length, established regular cycles, irregular variation, missing periods and explicit outlier exclusions, very short/long cycles, leap days, month boundaries, daylight-saving calendar arithmetic, sorted/edited history, overdue forecasts, invalid dates, and paused special tracking modes.
- Date-keyed IndexedDB writes, deduplication, export, merge, replacement, deletion, invalid period dates/overlaps, and rollback after conflicting merge edits.
- Complete backup validation, malformed fields, duplicates, schema mismatches, encrypted roundtrip, wrong password, and tampered ciphertext rejection.
- In-app reminder timing, completed check-in suppression, overdue suppression, and personal-event ordering.

## Browser coverage

1. Nine-step onboarding, historical period ending/editing/deletion, symptoms and severity, mood, notes, refresh persistence, and month navigation.
2. Backup download, invalid import error, validated restore preview, explicit replacement, theme persistence, and complete local reset.
3. Service-worker activation, actual offline reload, first-time navigation to lazy-loaded screens while offline, offline saving, and persistence after another reload.
4. Axe WCAG 2 A/AA and 2.1 AA automated checks on welcome and all five screens in both light and dark themes; zero detected violations. Horizontal layout checks and captures at mobile widths, including 320 px, and desktop captures at 1440 px.
5. Denied IndexedDB access produces an explicit error and retry control instead of silently resetting records or starting onboarding.
6. Cancelling navigation preserves unsaved draft changes; saving allows navigation.
7. Imported recorded history drives statistics, interactive symptom drilldown, cycle chart selection, and downloaded appointment reports. Notes are absent by default and included only after selecting the option.

Mobile and desktop captures were visually inspected. Inspection exposed and corrected an oversized SVG icon in the cycle ring. The browser checks also exposed and corrected an accessible file input widening the mobile viewport, modal hit-testing affected by that overflow, calendar contrast on adjacent-month dates, and dark-theme inheritance. Earlier failed runs are superseded by the passing final run.

## Not verified here

- No physical iPhone or actual installed iOS PWA was tested. iPhone Safari, VoiceOver, installation, download/share behavior, background suspension, OS storage eviction, and safe-area behavior still need physical-device checks.
- The WebKit test project is configured but was not executed. Official browser downloads were denied by the cloud network policy (`cdn.playwright.dev`); installed Chromium provided the browser coverage above.
- No public HTTPS deployment has been created. Hosting headers are supplied but must be verified on the chosen host. The local Vite preview does not apply `_headers` or Vercel hosting rules.
- Background Web Push and Face ID/passkey locking are not implemented; the app clearly describes those limitations. Encryption protects optional backup files, not the live IndexedDB database.
- Calendar forecasts are deterministic heuristics, not clinically validated medical predictions or contraception.

See README.md for exact deployment and iPhone installation steps and a manual offline checklist.
