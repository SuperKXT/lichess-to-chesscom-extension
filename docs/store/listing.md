# Store listings

This is the copy for both store listings. Paste it in at submission ([Submit to Chrome Web Store and Firefox Add-ons](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/12)). Decided in [Store listing copy and privacy policy](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/9).

Rules for editing this copy:

- **Never state a Game Review number, tier or quota.** Chess.com's pricing changes, and any number goes stale. The listing only says that Game Review has to be available on the user's account.
- **Never promise one click to Game Review.** The extension opens the analysis board, and the user clicks Review.
- **The first line of the description stays "Not affiliated with Lichess or Chess.com."** It is what makes using both names descriptively safe.
- The "How it works" step 1 wording depends on [Trigger wiring and the refusal surface](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/15). Check it against the shipped behaviour before submitting.

## Shared by both stores

**Name**: Lichess to Chess.com Review

**Summary** (the manifest `description`, 124 of 132 characters; Chrome uses it as the summary):

> Open a finished Lichess game on Chess.com's analysis board, ready for Game Review. Not affiliated with Lichess or Chess.com.

**Description**:

```text
Not affiliated with Lichess or Chess.com.

Played a game on Lichess and want Chess.com's Game Review on it? This extension opens the finished game on Chess.com's analysis board, ready to review.

HOW IT WORKS
1. On lichess.org, open a finished game and click the extension's toolbar button.
2. The extension exports the game from Lichess and opens it on Chess.com's analysis board.
3. Click Review on Chess.com to start Game Review.

BEFORE YOU INSTALL
• Game Review is Chess.com's feature, and you need it available on your Chess.com account. The extension can't see your account, and it doesn't start the review for you.
• When you click Review, Chess.com saves a copy of the game at a link that anyone with the link can open. Chess.com does that, not the extension.
• Only finished, standard chess games are supported. Variants, games from a custom position, ongoing or aborted games, puzzles, studies, broadcasts and simuls are refused with a message that says why.

PRIVACY
No account, no settings, no analytics, no tracking, and nothing stored. The extension contacts Lichess only to export the game you chose, and passes that game to Chess.com by opening it there. It never reads or changes any Chess.com page.
Privacy policy: https://github.com/SuperKXT/lichess-to-chesscom-extension/blob/main/PRIVACY.md

SOMETHING BROKEN?
Chess.com's import isn't a documented API and can change without notice. If a game stops opening, please report it: https://github.com/SuperKXT/lichess-to-chesscom-extension/issues

Open source (MIT): https://github.com/SuperKXT/lichess-to-chesscom-extension
```

**Homepage**: https://github.com/SuperKXT/lichess-to-chesscom-extension

**Support / report breakage**: https://github.com/SuperKXT/lichess-to-chesscom-extension/issues

**Privacy policy**: https://github.com/SuperKXT/lichess-to-chesscom-extension/blob/main/PRIVACY.md

## Chrome Web Store: privacy practices tab

**Single purpose**:

> Opens the finished Lichess game the user chooses on Chess.com's analysis board, so the user can start Chess.com's Game Review on it.

**Permission justifications**:

- **`activeTab`**: Reads the address of the current tab only when the user clicks the toolbar button, to find which Lichess game to open.
- **Host permission `https://lichess.org/*`**: Exports the chosen game's PGN from Lichess's public export endpoint (`https://lichess.org/game/export/<id>`), and tells whether the current lichess.org page is a game so the toolbar button can explain when it isn't. The extension has no access to any other site.

**Remote code**: No. All code is in the package.

**Data usage**:

- Tick **Website content** only. The game's PGN, exported from Lichess, is passed to Chess.com in the address the extension opens. It is sent once, when the user clicks, and contains only the game the user chose.
- Leave every other category unticked.
- Certify all three statements: data is not sold to third parties, not used or transferred for purposes unrelated to the single purpose, and not used or transferred to determine creditworthiness or for lending.

**EU DSA trader declaration**: **Non-trader.** A free, non-commercial extension with no monetisation.

## Firefox Add-ons

- **Privacy policy**: paste the text of [PRIVACY.md](../../PRIVACY.md). AMO renders only a subset of Markdown: it drops headings with their text, shows tables as raw pipes and escapes `<`, even in inline code. Keep that file to bold, lists, links and inline code, so it reads the same on GitHub and AMO. AMO also turns every "Chess.com" into a link, which can't be switched off.
- **Data collection**: the manifest declares `data_collection_permissions: { required: ["websiteContent"] }`. Under Add-on Policies §6.2.2.2 this is implicit consent, because the PGN is sent only as the direct result of one deliberate click, and only for the game the user acted on.
- **License**: MIT.
- **Before the first submission**, accept the updated distribution agreement that takes effect 2026-12-01 ([Diff the new AMO policies effective 2026-12-01](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/11)).
