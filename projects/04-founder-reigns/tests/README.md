# Epilogue Checks

Run the deterministic logic tests:

```sh
node tests/run-unit.mjs
```

Run the Chromium scenarios (the config starts Vite if needed):

```sh
npx playwright install --with-deps chromium
npx playwright test
```

The browser suite seeds late-game snapshots by intercepting the development
module's initial state. Choice handling, REA resolution, motivation expiry,
automatic advancement, final rendering and restart use the real application.
No scenario controls or testing API are included in production.

Coverage includes the three chip outcomes, Google and REA priority, deferred
death, recovery during motivation, terminal keyboard behavior, menu/restart
and horizontal layout at 320, 390 and 1280 pixels.

Production checks:

```sh
npx tsc --noEmit
npm run build
```