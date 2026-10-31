# Lichess to Chess.com Review

A browser extension for Chrome and Firefox that opens the finished Lichess game you are looking at on Chess.com's analysis board, ready for Game Review.

Not affiliated with Lichess or Chess.com.

## Development

Requires Node 24.14 or later (`.nvmrc` pins 26, the current LTS) and pnpm 12.

```sh
pnpm install
pnpm dev            # Chrome, with reload
pnpm dev:firefox    # Firefox, with reload
pnpm build          # .output/chrome-mv3 and .output/firefox-mv3
pnpm zip            # store zips, plus the AMO sources zip
pnpm lint           # ESLint, Prettier and web-ext lint
pnpm typecheck
pnpm test
```

## Version pins

- **TypeScript is pinned to `~6.0.3`. Do not upgrade it to 7.** typescript-eslint 8 supports `typescript >=4.8.4 <6.1.0`, and the type-aware lint rules are worth more here than the newer compiler. Lift the pin once typescript-eslint supports TypeScript 7.
- **Chrome 148 or later** (`minimum_chrome_version`). Chrome 148 is the first to expose `browser.*` natively, so the code uses it with no `browser ??= chrome` shim.
- **Firefox 142 or later** (`strict_min_version`). `data_collection_permissions`, which AMO requires for new submissions, is supported from Firefox 140 on desktop and 142 on Android. AMO's linter warns on any lower floor.
- **Node `>=24.14`** in `engines`, because AMO's reviewers rebuild the extension on Node 24.14.0.
