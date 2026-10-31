---
status: accepted
---

# Write-only posture toward Chess.com

The extension never reads or modifies Chess.com. Its only contact with Chess.com is a **top-level navigation** that carries a PGN in: a GET to `https://www.chess.com/analysis?pgn=<encoded>`, or, above the URL length ceiling, an ordinary form POST to `https://www.chess.com/analysis`. It makes no `fetch`/XHR to any Chess.com endpoint, injects nothing into any Chess.com page, and requests no Chess.com host permission. We chose this because it is the least exposed design available against Chess.com's User Agreement and `robots.txt`, and because every alternative that gets closer to the destination's literal "one click" does so by touching Chess.com in a way that those documents prohibit.

## Context

Chess.com has no write API: the PubAPI is "a read-only REST API", and "You cannot send game-moves or other commands to Chess.com from this system." The undocumented `?pgn=` parameter and `POST /analysis` are the only ways in. See `docs/research/chesscom-import-surfaces.md` §4 and §6 on branch `research/mechanisms-and-stack`.

The [User Agreement](https://www.chess.com/legal/user-agreement) prohibits, verbatim:

- "automation software (bots), hacks, modifications (mods) or any other unauthorized third-party software designed to modify the Services"
- "any robot, spider, site search/retrieval application, or other manual or automatic device or process to retrieve, index, 'data mine,' or in any way reproduce or circumvent the navigational structure or presentation of the Services"
- "automated or artificial intelligence (AI) tools to access, scan, scrape, data mine, copy, or use the materials or content in the Services"

`robots.txt` disallows `/analysis/game/`, `/game/`, `/callback/`, `/service/`, `/download/pgn`, `/games/archive` and `/games/search`, and leaves `/analysis` allowed.

The clause text is confirmed. How it applies to this extension is our judgment, not Chess.com's ruling. Navigating a user's own PGN to `/analysis`, which the user then acts on, is the reading that touches none of those clauses.

## The boundary

**Allowed:** opening a new tab, or navigating one, to `/analysis` with the PGN in the query string or in a POST body. The response renders for the user and the extension never sees it.

**Foreclosed**, so that nobody has to argue it out again:

- **The Chess.com → Lichess direction.** That direction needs games read out of Chess.com, which is the "retrieve, index, 'data mine'" clause and robots-disallowed paths.
- **Creating the persisted analysis ourselves.** Game Review runs only on a persisted analysis (`/analysis/game/pgn/<id>/review`), and Chess.com creates one when the user clicks Review. Creating it through some private endpoint and reading back its id would need a Chess.com host permission (the endpoints are not CORS-open). It would very likely go through robots-disallowed paths. And it would publish the PGN at a public URL because the extension chose to, not because the user did. The extension therefore lands the user on the analysis board, and **the user clicks Review**. "One click" means one click in the extension plus Chess.com's own Review button.
- **Auto-clicking anything in Chess.com's UI**, including Review and Save. That is software modifying the Services, and it would need a content script on Chess.com.
- **Injecting UI into Chess.com pages** (buttons, banners, overlays).
- **Confirming that the import worked** by reading the resulting page. The extension has no success signal, so breakage of `?pgn=` has to be detected some other way.
- **Detecting the user's membership tier** to tailor messaging, for example warning free users about the Game Review daily limit. Store copy describes the free-tier behaviour instead.
- **Any Game Review quota workaround**, for example routing through another account or reusing someone else's persisted analysis. This is circumvention, and it is out of bounds whatever the mechanism.

## Consequences

- The permission set is `activeTab`, `contextMenus` and `https://lichess.org/*`, with nothing on `chess.com`. A Chess.com host permission is the clearest sign that this ADR is being broken. Adding one means superseding this ADR, not editing a manifest.
- The destination's "in one click" is reworded to match the boundary: one click lands the game on Chess.com's analysis board, ready for Review.
- The import seam can only fail silently from the extension's point of view. Detecting breakage happens outside the running extension (maintenance posture, still unspecified).
- The extension never causes a PGN to be published on Chess.com. A public persisted analysis appears only when the user clicks Review, and Chess.com creates it. The privacy policy can say exactly that.
