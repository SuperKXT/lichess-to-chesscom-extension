# Privacy policy

_Lichess to Chess.com Review_ is a browser extension for Chrome and Firefox. It is not affiliated with Lichess or Chess.com.

**In short:** the extension has no server, no accounts, no settings, no analytics and no tracking. It keeps nothing. When you click it, it exports one game from Lichess and opens that game on Chess.com. Nothing else leaves your browser.

**What happens when you use it**

The extension does nothing until you click its toolbar button on a Lichess page, or choose its entry on a link to a Lichess game. Then:

1. **It reads the address of that page or link** to find the game's 8-character public id. If the address contains a player's 12-character link, the extension uses only the first 8 characters, so the 4-character secret that identifies you as a player is never sent anywhere.
2. **It asks Lichess for the game**, using Lichess's public export at `https://lichess.org/game/export/` followed by the game id. Lichess receives this request as it would from any visitor, and [Lichess's privacy policy](https://lichess.org/privacy) applies to it.
3. **It opens the game on Chess.com** at `https://www.chess.com/analysis?pgn=…`. The game's PGN is in that address. A PGN is the game record: the moves, the players' Lichess usernames and ratings, the event, the date and the result. Chess.com receives that address, like any page you open, and [Chess.com's privacy policy](https://www.chess.com/legal/privacy) applies to it. The address also appears in your browser history.

The extension sends nothing anywhere else. It makes no other requests to Chess.com and never reads or changes any Chess.com page.

**What Chess.com does with the game**

Opening the game on Chess.com's analysis board saves nothing there. If you then click **Review** on Chess.com, Chess.com saves a copy of the game at a link that anyone who has the link can open. That copy is created by your click on Chess.com, not by the extension, and it is governed by Chess.com's terms.

**What the extension does not do**

- It does not store, sell or share any data beyond the one transfer described above. It has no `storage` permission and no server of its own.
- It does not use analytics, telemetry, crash reporting or advertising.
- It does not read your Lichess or Chess.com account, cookies or passwords.
- It does not add anything to the pages you visit, and it has access to no site except lichess.org.

**Permissions**

- `https://lichess.org/*`: to tell whether the current lichess.org page is a game, and to export that game from Lichess.
- `activeTab`: to read the address of the current tab, only at the moment you click the toolbar button.

**Changes and contact**

Changes to this policy are made in `PRIVACY.md` in the project's repository, where its [full history](https://github.com/SuperKXT/lichess-to-chesscom-extension/commits/main/PRIVACY.md) is public. Questions go to the [issue tracker](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues).
