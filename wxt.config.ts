import { defineConfig } from 'wxt';

export default defineConfig({
  // Explicit imports over auto-imports: every module says what it depends on.
  imports: false,
  // AMO reviewers rebuild from the sources zip; prose only widens what they read.
  zip: { excludeSources: ['docs/**'] },
  manifest: ({ browser }) => ({
    name: 'Lichess to Chess.com Review',
    description:
      "Open a finished Lichess game on Chess.com's analysis board, ready for Game Review. Not affiliated with Lichess or Chess.com.",
    permissions: ['activeTab', 'contextMenus'],
    host_permissions: ['https://lichess.org/*'],
    ...(browser === 'firefox'
      ? {
          action: { default_title: 'Open on Chess.com for Game Review' },
          browser_specific_settings: {
            gecko: {
              id: 'lichess-to-chesscom-review@superkxt',
              // `data_collection_permissions` needs 140 on desktop and 142
              // on Android; below that, AMO's linter warns on every upload.
              strict_min_version: '142.0',
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {
          action: {
            default_title: 'Open on Chess.com for Game Review',
            default_state: 'disabled',
          },
          // 148 exposes `browser.*` natively, so no `browser ??= chrome` shim.
          minimum_chrome_version: '148',
        }),
  }),
});
