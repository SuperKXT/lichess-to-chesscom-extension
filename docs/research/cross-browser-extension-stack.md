# Research: cross-browser MV3 extension stack (late 2026)

_Date: 2026-10-31. Chrome stable 155 (2026-10-06), Firefox stable 158/159, ESR 153._
_Claims labelled **CONFIRMED** (primary source), **INFERRED**, or **UNKNOWN**._

## Question

What is the current best-practice stack for a small, high-code-quality browser extension
shipping to both the Chrome Web Store and Firefox Add-ons from one codebase?

## 0. The two findings that invalidate 2025-era advice

| Finding | Confidence |
| --- | --- |
| **`webextension-polyfill` is EOL.** Repo archived **2026-07-30**, read-only. README: "Following the adoption of the `browser` namespace by Chrome, this polyfill has served its purpose, and will not receive any further updates." Last publish 0.12.0 (2024-05-14). | CONFIRMED — <https://github.com/mozilla/webextension-polyfill> |
| **Chrome Web Store API v1.1 shut down 2026-10-15.** V2 only, and it requires a new **Publisher ID** input. Any CI hitting `www.googleapis.com/chromewebstore/v1.1` is broken now. | CONFIRMED — <https://developer.chrome.com/blog/cws-api-v2> |

## 1. Manifest V3 in Firefox

- MV3 GA since **Firefox 109**. MV2 is **not** deprecated, and blocking `webRequest` still
  works in Firefox MV3 (Chrome restricts it to policy-installed extensions). Mozilla
  promises >= 12 months notice before changing this. CONFIRMED.
- **`background.service_worker` is NOT supported in Firefox.** Meta bug
  <https://bugzil.la/1573659> is still NEW with no milestone (last activity Oct 2026).
  Firefox MV3 uses **event pages** (`background.scripts`; `persistent: true` is an *error*
  in MV3). CONFIRMED.
- **Portable background declaration** (MDN's own example):

  ```json
  "background": {
    "scripts": ["background.js"],
    "service_worker": "background.js",
    "type": "module"
  }
  ```

  Chrome **>= 121** silently ignores `scripts` (before 121 it refused to load); Firefox
  **>= 121** starts the event page even when `service_worker` is present. So this requires
  Chrome >= 121 / Firefox >= 121. `"type": "module"` works with `background.scripts` since
  Firefox 112. `background.preferred_environment` is Firefox 136+/Safari 18+, ignored by
  Chrome. **The entry file must be context-agnostic — no `window`, no DOM.** CONFIRMED.
- **`browser_specific_settings.gecko`**: `id` is **required for MV3** to sign or distribute
  at all; plus `strict_min_version`, and `gecko_android: {}` to declare Android support.
  **New: `gecko.data_collection_permissions.required` is mandatory for new AMO submissions
  from 2025-11-03** — use `{"required": ["none"]}` when collecting nothing. Chrome ignores
  the whole key. CONFIRMED.
- **`host_permissions`**: Chrome grants at install. Firefox <= 126 never prompted; **from
  Firefox 127** they appear in the install prompt and are granted on install — but users can
  revoke per-site at any time, and **permissions added in an update are still never
  prompted** (<https://bugzil.la/1893232>). **Practical rule: never assume host access.**
  Check `permissions.contains()`, call `permissions.request()` from a user gesture, and
  watch `onAdded`/`onRemoved`. `optional_host_permissions` is Firefox 128+. CONFIRMED.
- **`action` only** in MV3 in both browsers; `browser_action` is MV2-only; the shortcut name
  is `_execute_action`; `browser_style` is gone. Firefox keeps `page_action` in MV3 and
  supports `action` extras `default_area`/`theme_icons`. CONFIRMED.
- **`browser.*` vs `chrome.*`**: **Chrome 148 (2026-05-08)** exposed all APIs under
  `browser.*` (`chrome.tabs === browser.tabs`) in content scripts, service workers and
  offscreen documents; **Chrome 152** lifted the DevTools-page exception. Chrome 148 also
  added native promise-returning `runtime.onMessage` listeners. Chrome's own guidance:
  adopt `browser` unconditionally if users are on 148+, else
  `if (!globalThis.browser) globalThis.browser = chrome;`. CONFIRMED —
  <https://developer.chrome.com/docs/extensions/develop/concepts/browser-namespace>.
  (That promise coverage across `chrome.*` is *complete* at Chrome 152 is MDN-only; Chrome's
  docs say "many methods". INFERRED.)
- **Content script world**: `content_scripts[].world` is Chrome 111 / **Firefox 128**.
  Firefox ISOLATED scripts get **Xray vision** and need
  `wrappedJSObject`/`cloneInto`/`exportFunction`, which **do not exist in Chrome** — the
  portable way to touch page JS is `world: "MAIN"` (no extension APIs there, and the page
  can tamper). CONFIRMED.
- **CSP**: both ban remote code, `unsafe-eval` and `unsafe-inline`. Firefox MV3 default is
  `script-src 'self'; upgrade-insecure-requests;` vs Chrome's
  `script-src 'self'; object-src 'self';`. `'wasm-unsafe-eval'` is needed for WASM.
  `content_security_policy.sandbox` is Chrome 88 but **Firefox only 154**. **Loosening CSP
  is a common AMO rejection cause.** CONFIRMED.

## 2. Build tooling

| Option | Version / date | Activity | Both targets | Testing |
| --- | --- | --- | --- | --- |
| **WXT** | **0.21.5, 2026-10-26** | 10.7k stars, commits this week, 1.06M dl/wk | Yes — `wxt build -b firefox`; **defaults Firefox to MV2**, pass `--mv3` | **Best in class**: `WxtVitest` + `fakeBrowser`; `wxt zip -b firefox` also emits the **AMO sources zip** |
| **Plasmo** | 0.90.5, **2025-05-17** | **Stalled** — no release or non-bot commit in ~17 months; maintenance issue unanswered; pins @parcel 2.9.3 / sharp 0.33.5 with unpatchable transitive CVEs | nominally | **No testing docs at all** |
| **CRXJS** | `@crxjs/vite-plugin` **3.0.0, 2026-09-24** | Revived, new maintainers, pushed 2026-10-26 | Firefox via **undocumented** `browser: 'firefox'`; **Firefox E2E CI only added Oct 2026** | none built-in |
| **Plain Vite + manifest script** | Vite 8.3.5 (Rolldown since 8.0) | — | hand-written per-browser manifests | DIY |
| **No bundler** | — | — | viable with caveats | DIY |

`vite-plugin-web-extension`'s own author recommends WXT for new projects.
`@samrum/vite-plugin-web-extension` is dormant. WXT's dep surface is 28 small unjs packages
with **Vite/TypeScript/web-ext as peer deps** — no vendored bundler. CONFIRMED.

**No-bundler feasibility** — CONFIRMED: ESM works in the MV3 service worker
(`"type": "module"`, Chrome 92+) but **dynamic `import()` and import assertions are
unsupported in extension SWs**. **ESM in content scripts is impossible** — `content_scripts`
has no `type` key in any browser (Firefox bug 1451545 still NEW). **Import maps are
effectively blocked** by MV3 CSP. So no-bundler is defensible only if every content script
is a single self-contained classic file.

## 3. The polyfill question — settled

**Do not use `webextension-polyfill` in a new 2026 project.** Write `browser.*` directly.
Add `globalThis.browser ??= chrome;` (or `minimum_chrome_version: "148"`) only if you must
support Chrome < 148. For types: WXT dropped the polyfill in **0.20.0** and types `browser`
via `@wxt-dev/browser`; standalone, use **`@types/chrome` 0.3.7** (which also ships
`ManifestV3`). `@types/webextension-polyfill` is a types-only leftover. CONFIRMED.

## 4. Testing — what is actually practical

- **Units: Vitest 5** (5.0.5, 2026-10-15) + **`@webext-core/fake-browser` 2.0.1** — the only
  actively maintained general-purpose extension-API fake (real in-memory
  `storage`/`tabs`/`alarms`/`runtime`, but "not all APIs are implemented").
  `sinon-chrome` is **abandoned** (2019); `jest-webextension-mock` is minimal.
- **Chromium E2E: Playwright 1.64.1 works for MV3** — `launchPersistentContext` +
  `channel: 'chromium'` (real Chrome/Edge removed the side-loading flags), **headless
  supported on that channel**, extension id from `context.serviceWorkers()[0].url()`. The
  docs now have a "Service worker idle suspension (MV3)" section and a ready-made
  `fixtures.ts`. <https://playwright.dev/docs/chrome-extensions>
- **Firefox E2E: Playwright still cannot load extensions** (no `installTemporaryAddon`;
  issue #7297 closed 2024-12). Options: `playwright-webextext` (community, active), or
  Puppeteer/Selenium against real Firefox.
- **Puppeteer 25.16.0** is now *more* capable than Playwright for Chrome extensions:
  `enableExtensions`, `browser.installExtension()`, `page.triggerExtensionAction()`.
- **What well-regarded OSS extensions actually do:** **uBlock Origin** — no bundler,
  shell/Make scripts, no test job. **Refined GitHub** — tsdown + Vitest 5 + happy-dom,
  ESLint 10 + dprint, **no polyfill**, no automated E2E. **Bitwarden** — webpack + Jest 30
  with hand-rolled `jest.fn()` Chrome stubs, plus Playwright doing the documented recipe.
  **Dark Reader** — rollup + Jest + puppeteer-core against real Chrome/Firefox/Edge.
  **SponsorBlock** — webpack + Jest, Selenium test currently skipped.
  Pattern: **nobody uses the popular mock libraries** — they stub by hand or keep the
  extension API out of unit tests entirely.

## 5. Lint / format / types baseline

- **ESLint 10.14.0.** ESLint 10.0.0 (2026-02-06) **fully removed eslintrc**:
  `/* eslint-env */` comments are now **errors**; `--env`/`--rulesdir`/`--ignore-path` are
  gone; config resolves from each file's directory. Codemod `@eslint/v9-to-v10`.
- **typescript-eslint 8.72.1** supports `eslint ^8.57||^9||^10` but
  `typescript >=4.8.4 <6.1.0` — i.e. **it does not support TypeScript 7** (7.0.2 shipped
  2026-07-08). **For type-aware ESLint rules, pin TypeScript to 6.0.x.**
- **oxlint 1.90.0** — type-aware linting declared stable, built on TS 7 via `tsgolint`,
  59 of 61 typescript-eslint type-aware rules, up to ~18x faster. Inverted constraint:
  oxlint's type-aware backend *requires* TS 7 while typescript-eslint *excludes* it.
- **Biome 2.6.4** — credible single-binary alternative: ~97% Prettier compatibility,
  ~670 rules, type-aware rules without `tsc`; fewer type-aware rules than typescript-eslint.
- **Prettier 3.9.10** (4.0 still alpha).
- **Extension-specific**: **`eslint-plugin-no-unsanitized` 4.1.5** (Mozilla,
  flat-config-only) is worth it — `innerHTML` in content scripts draws store scrutiny.
  **`globals` 17.13.0**'s `webextensions` key has only 3 globals, so spread
  `...globals.browser, ...globals.webextensions, ...globals.serviceworker`.
  **`eslint-plugin-webextensions` does not exist**; `eslint-plugin-mozilla` is for
  mozilla-central — skip it. **`addons-linter` 10.15.0 via `web-ext lint` is the real
  pre-flight** — it is literally what AMO's automated validation runs (though a clean lint
  is not a guarantee of approval).

## 6. Publishing / CI

**Chrome (API v2 only, since 2026-10-15)**

- Upload `POST https://chromewebstore.googleapis.com/upload/v2/publishers/{PUBLISHER_ID}/items/{ID}:upload`,
  then `:publish`; scope `.../auth/chromewebstore`. Auth: OAuth refresh token **or a service
  account** (new, recommended for CI, **limit one service account per publisher**). New:
  staged publish, rollout % updatable without re-review, `skipReview`, cancel pending
  submission. `TRUSTED_TESTERS` publish target was removed.
- **2-Step Verification is mandatory** before publishing or updating. The privacy-practices
  tab (single purpose, per-permission justification, data-usage certification) is mandatory.
  An **EU DSA trader declaration** is required and published on the listing.
  **Opt-in verified CRX uploads** (since 2025-05) mean you sign the CRX yourself or uploads
  are rejected.
- Maintained tooling: **`chrome-webstore-upload` 6.0.1** / **`chrome-webstore-upload-cli`
  4.0.2** (both 2026-10-04, v6 = "Use API v2"), **`mnao305/chrome-extension-upload@v7`**
  (`publisher-id` now required), **`wdzeng/chrome-extension@v2`**.
  **`PlasmoHQ/bpp` is effectively abandoned** (last commit 2025-02-09, no v2 support, so
  Chrome publishing through it is broken).
- The registration fee is "one-time" per Chrome's docs; **the $5 figure is not on a primary
  page** — INFERRED.

**AMO**

- API **v5** (`https://addons.mozilla.org/api/v5/`); two-step upload -> version-create;
  `channel` is now `listed | unlisted | enterprise`. Auth is **HMAC-SHA256 JWT**, `exp` <= 5
  min after `iat`, `Authorization: JWT <token>`; the key is **account-wide, non-expiring and
  unscopable** — no OAuth, no trusted publishing.
- **`web-ext` 10.8.0 (2026-10-15)** wraps v5. `--channel` is **required** since v8;
  `--use-submission-api` was removed (now default). In CI use
  `--upload-source-code <archive>` and `--approval-timeout 0`.
  **Gotcha: `sign --channel listed` with a GUID AMO doesn't know creates a brand-new
  listing** — a typo in CI silently creates a stray add-on. MV3 requires an explicit
  `gecko.id` (web-ext auto-generates only for MV2).
- **Source-code submission** — <https://extensionworkshop.com/documentation/publish/source-code-submission/).
  Triggered by **minifiers, bundlers (webpack/browserify), template engines, or any custom
  preprocessing**, so **any WXT/Vite/CRXJS build triggers it**. The archive must include the
  build script, **lockfile**, private deps, and a README stating OS, tool versions, download
  links and build instructions. Tools must be **open source and runnable locally (not
  web-based)**. A reviewer rebuilds and diffs the output: **"There must be no differences."**
  Required for **every** version. Max 200MB. Obfuscation is prohibited outright;
  minification is fine *with* sources. The reviewer environment is pinned:
  **Ubuntu 24.04.4 LTS, ARM64, Node 24.14.0, npm 11.9.0** — state deviations in the README.
- Signing timeline: automated validation + signing usually <= 24h; any add-on may be pulled
  for manual review. Undocumented rate limits (from `addons-server` source, not docs):
  submissions 3/min, 10/hr, 24/day per user.
- **Firefox cannot be distributed unsigned** on Release/Beta; unlisted AMO signing is the
  self-distribution path. Chrome signs the CRX for you; off-store hosting is Linux-only.
- Maintained AMO Actions: `wdzeng/firefox-addon@v1.2.1` (versions only — cannot create a new
  add-on), `hamzahamidi/publish-to-firefox-add-ons@v1.1.0`.
  **`trmcnvn/firefox-addon` is archived — do not use.**
- **New AMO policies, enterprise policies and distribution agreement take effect
  2026-12-01** (previews live, dated 2026-10-20). Substance not diffed — **read before
  Dec 1**.

## 7. Icons / assets

- **Manifest**: PNG **16, 32, 48, 128** satisfies Chrome's `icons` and Firefox picks from it;
  add **24** for Chrome `action.default_icon` (16/24/32) and **64** for Firefox 2x.
  **Chrome supports neither SVG nor WebP for any manifest icon**; **Firefox supports SVG**
  (needs `viewBox` + `xmlns`, and can theme via `prefers-color-scheme`). Keep an SVG master
  as the export source.
- **Chrome Web Store listing**: 128x128 PNG store icon (artwork 96x96 with 16px transparent
  padding), screenshots **1280x800 or 640x400**, min 1 **max 5**, full-bleed. Promo tiles
  **440x280** and **1400x560** are optional — but items without the small tile rank *after*
  items with it. Missing icon/screenshots/description is an automatic rejection.
- **AMO listing**: square **128x128** JPEG/PNG per the addons-server API docs (Extension
  Workshop separately says 32/64 — the pages disagree; upload 128). **SVG is not accepted**
  for the listing icon. Screenshots at 1280x800; other sizes must hold **1.6:1**.
  **No promo tiles on AMO.**
- One asset set covers both: SVG master -> PNG 16/24/32/48/64/128, a 128x128 listing icon,
  and screenshots at 1280x800 (cap 5 for Chrome).

## Recommended stack

1. **WXT 0.21.5** as the framework — the only option simultaneously maintained, emitting
   both targets, and **generating the AMO sources zip** you will need, because any bundler
   triggers Mozilla's source-code requirement. Pass `--mv3` for Firefox explicitly.
   Runner-up: CRXJS 3.0.0 if staying close to plain Vite, but its Firefox support is
   undocumented and only got CI coverage this month. **Do not start on Plasmo.**
2. **`browser.*` natively, no polyfill.** Types from `@wxt-dev/browser`.
3. **Background**: one context-agnostic entry declared as both `service_worker` and
   `scripts`, `"type": "module"`. Treat host permissions as revocable at runtime (Firefox).
4. **TypeScript strict + ESLint 10 flat config + typescript-eslint 8 (TS pinned 6.0.x) +
   Prettier 3**, plus `eslint-plugin-no-unsanitized`. Run **`web-ext lint`** in CI as the
   AMO pre-flight. Biome 2.6 is a legitimate single-tool alternative; oxlint is the speed
   play but wants TS 7.
5. **Tests**: Vitest 5 + `@webext-core/fake-browser` via `WxtVitest` for units; Playwright
   1.64 `launchPersistentContext` + `channel: 'chromium'` for one or two Chromium smoke
   E2Es. **Skip Firefox E2E** — Playwright cannot do it, and the well-regarded projects
   mostly have no automated E2E at all.
6. **CI**: `wxt zip -b chrome` / `-b firefox`, then `chrome-webstore-upload-cli@4` (v2 API,
   Publisher ID required) and `web-ext sign --channel listed --upload-source-code ...
   --approval-timeout 0`. Keep the sources zip reproducible against **Ubuntu 24.04 ARM64 /
   Node 24.14** and commit the lockfile.

## Not confirmed

- The **$5** CWS registration fee (Chrome's page says "one-time registration fee", no amount).
- "Promises on all `chrome.*` methods from Chrome 152" — MDN states it; Chrome's docs say
  "many methods".
- **Substance of the AMO policy changes effective 2026-12-01** — previews live, not diffed.
- AMO screenshot format / max file size — undocumented (the cited 4MB cap is issue-tracker
  only).
- Whether any external import-map mechanism shipped in a 2026 Chrome — assume import maps
  are unusable under MV3 CSP.
- Several conclusions are **inferred from absence** because primary pages are badly stale:
  the CWS images page (2018), CWS review-process (2021), AMO "create an appealing listing"
  (2019). AMO rate limits come from `addons-server` source, not docs.
