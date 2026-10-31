import { defineConfig } from 'wxt';

// `manifest.icons` is discovered from public/icon/; the toolbar icon is not.
// Chrome draws the action at 16/24/32, Firefox at 16/32 with 64 for 2x.
const actionIcon = {
  16: 'icon/16.png',
  24: 'icon/24.png',
  32: 'icon/32.png',
  64: 'icon/64.png',
};

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
          action: {
            default_title: 'Open on Chess.com for Game Review',
            default_icon: actionIcon,
          },
          browser_specific_settings: {
            gecko: {
              id: 'lichess-to-chesscom-review@superkxt',
              // `data_collection_permissions` needs 140 on desktop and 142
              // on Android; below that, AMO's linter warns on every upload.
              strict_min_version: '142.0',
              // The game's PGN leaves the browser in the Chess.com URL. That is
              // website content, sent on one click and eligible for implicit
              // consent under Add-on Policies §6.2.2.2.
              data_collection_permissions: { required: ['websiteContent'] },
            },
          },
        }
      : {
          action: {
            default_title: 'Open on Chess.com for Game Review',
            default_icon: actionIcon,
            default_state: 'disabled',
          },
          // 148 exposes `browser.*` natively, so no `browser ??= chrome` shim.
          minimum_chrome_version: '148',
        }),
  }),
});
