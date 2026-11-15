# Changelog

What changed in each release, for the people who use the extension. The section for a version becomes its GitHub release notes and its release notes on Firefox Add-ons. Add it in the pull request that bumps the version; CI fails while the version in `package.json` has no section.

Keep each section to plain bullets. Firefox Add-ons drops headings and shows tables as raw text.

## 1.1.0 - 2026-11-15

- Games now open on Chess.com with their clocks: both players' clocks show on the board, and each move shows how long it took.
- A very long game (roughly 100 moves or more) still opens, without the clocks, since Chess.com cannot take it with them.

## 1.0.0 - 2026-11-01

- First release. Click the toolbar button on a finished Lichess game, and the game opens on Chess.com's analysis board, ready for Game Review.
