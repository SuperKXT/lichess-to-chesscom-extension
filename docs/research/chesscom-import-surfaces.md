# Research: Chess.com import surfaces

_Date: 2026-10-31. Captured from a research agent's findings. Every claim is labelled
**CONFIRMED** (verified against a primary source or a live request), **INFERRED**, or
**UNKNOWN**. Do not promote an INFERRED claim to a design assumption without testing it._

## Question

What are the exact, currently-working ways to get an arbitrary PGN into Chess.com for
analysis / Game Review, from outside Chess.com?

## 1. `chess.com/analysis` accepts `?pgn=` and `?fen=` — CONFIRMED (live request)

`GET https://www.chess.com/analysis?pgn=<percent-encoded PGN>` returns 200 and the server
injects the PGN into the page bootstrap:

```js
window.chesscom.analysis = {
  fen: '', locked: true,
  pgn: '[Event "Test"]\n1. e4 e5...',
  savedAnalysisId: '', initialTab: '',
}
```

Verified with no cookies, no login. Parameters are exactly `pgn` and `fen` (lowercase),
raw PGN text, standard percent-encoding, **one game only** (multi-game PGNs break import).

**The important find:** `https://www.chess.com/analysis/review?pgn=<encoded>` sets
`initialTab: 'review'` *and* the pgn — a deep link straight to the Game Review tab with an
arbitrary PGN. `?tab=review` on `/analysis` 302-redirects there. CONFIRMED by live fetch.

`#pgn=` (hash) is **NOT** supported — INFERRED, high confidence: the value is consumed
server-side in the HTML template and a fragment is never sent to the server; no
client-side hash reader exists in the analysis bootstrap bundle.

### URL length ceiling — CONFIRMED empirically

| Encoded query length | Result |
| --- | --- |
| 13,350 / 13,800 / 14,400 | 200 OK |
| 14,700 – 31,500 | **502** (edge rejects) |
| >= ~33,000 | **414** Request-URI Too Large |

Practical ceiling ~14.4 KB encoded; **safe budget ~13,000 encoded chars** (~4-6 KB raw
PGN). A long game carrying `[%clk ...]` annotations can exceed this, so the URL path is
not universally safe. Mitigation: request the PGN from Lichess with `clocks=0&evals=0`
(see the Lichess research doc) and keep a POST fallback.

## 2. `POST /analysis` works, no CSRF, no session — CONFIRMED (live request)

`POST https://www.chess.com/analysis`, `Content-Type: application/x-www-form-urlencoded`,
body `pgn=1. e4 e5 2. Nf3 Nc6 3. Bb5 a6` -> 200, with the PGN in the rendered bootstrap.
No cookie, no CSRF token, no login.

This is the robust path for long PGNs (no URL cap). It must be performed as a **navigation**
(a hidden auto-submitting form targeting a new tab), because:

- there is **no CORS allowance** (`/analysis` sends no `Access-Control-Allow-Origin`), so
  `fetch` cannot be used to then display the page; and
- `x-frame-options: SAMEORIGIN` + `content-security-policy: frame-ancestors 'self'` rule
  out iframe embedding.

Probed and dead: `GET/POST /library/import` (404), `GET /games/import` (404),
`POST /games/import` (405), `POST /callback/analysis` (404). `GET /library` now
301s to `/analysis/collections`.

## 3. Game Review on an imported game — PARTIALLY CONFIRMED (the key open risk)

- The Game Review button **does appear for a single-game PGN** — user report plus staff
  guidance in <https://www.chess.com/forum/view/help-support/importing-pgns-for-analysis>
  ("go to the analysis board... Load PGN... And click on Report"). Confidence:
  **user-reported, not staff-documented.**
- Anonymous bootstrap shows `locked: true`, `canViewMoveFeedback: false`,
  `canViewCompleteBasicAnalysis: false`, `hasUnlimitedReview: false`, `canCreate: false`.
  **UNKNOWN:** what these flip to for a logged-in free vs. paid member on an imported PGN.
  Could not be tested without an authenticated session.
- A feature flag named **`analysis_add_games_lock_move_feedback`** appears in the page's
  flag list. The name suggests *added* games may have move feedback locked.
  **INFERRED ONLY — do not rely on it, but do not dismiss it either.**
- **Paywall is tiered — CONFIRMED:** "Free members can still use Game Review to see key
  insights like Accuracy, move classifications, and Self Analysis. However, unlimited Game
  Review and some advanced analysis features require a Premium membership."
  (<https://support.chess.com/en/articles/8584089-how-does-game-review-work>). The widely
  cited "1 free review per day" number appears only in third-party SEO blogs — **UNKNOWN**.
  A/B flags `analysis_game_review_limit_modal_v3` and
  `ab_game_review_review_upgrade_cta_2025` confirm a quota modal exists.
- **Imports are ephemeral — CONFIRMED:** `savedAnalysisId: ''`. Persisting requires clicking
  Save in their UI and choosing a collection. No unauthenticated endpoint for this exists.

> **This section is the project's viability gate.** Whether Game Review genuinely runs on a
> PGN arrived at via `?pgn=` must be verified with a real logged-in account before any
> dependent work is built.

## 4. Official API is read-only — CONFIRMED

<https://www.chess.com/news/view/published-data-api>: "The PubAPI is a read-only REST API"
and "You cannot send game-moves or other commands to Chess.com from this system."
There is no official public write/import API, so section 1-2 is the only mechanism.

## 5. Prior art (the Chess.com -> Lichess direction)

Lichess has a documented import API — CONFIRMED live:

```
POST https://lichess.org/api/import   body: pgn=1. e4 e5 2. Nf3 Nc6 3. Bc4
Accept: application/json  ->  200 {"id":"K4ngtAkv","url":"https://lichess.org/game/K4ngtAkv"}
```

No auth, and `access-control-allow-origin: *`, so a content script can call it and open the
returned URL. Existing extensions use either that API POST, or stash the PGN in
`storage.local` and type it into `lichess.org/paste`.

Prior art: [ng/lichess-analyzer](https://github.com/ng/lichess-analyzer),
[califernication/lichessAnalysis](https://github.com/califernication/lichessAnalysis),
[imlokesh/free-chess-analysis](https://github.com/imlokesh/free-chess-analysis),
[C1em1eb/chess-pgn-link](https://github.com/C1em1eb/chess-pgn-link),
[Mohab96/chesscom-lichess-analyzer](https://github.com/Mohab96/chesscom-lichess-analyzer),
[rickygrassmuck/chesscom-to-lichess-games](https://github.com/rickygrassmuck/chesscom-to-lichess-games),
[ZeroSharp/Chess.com_Analysis_Chrome_extension](https://github.com/ZeroSharp/Chess.com_Analysis_Chrome_extension).

**The mirror of `/api/import` for our direction is the `?pgn=` / `POST /analysis` pair**,
differing in that it is undocumented, not CORS-enabled (navigation only), and creates
nothing persistent.

## 6. Terms of Service and robots — CONFIRMED text, INFERRED application

- `robots.txt`: `/analysis` is **not** disallowed. But `/analysis/game/`, `/game/`,
  `/callback/`, `/service/`, `/download/pgn`, `/games/archive`, `/games/search` **are**.
  So reading a user's games by crawling Chess.com is robots-disallowed; navigating to
  `/analysis?pgn=` is not.
- The [User Agreement](https://www.chess.com/legal/user-agreement) prohibits, verbatim: use
  of "automation software (bots), hacks, modifications (mods) or any other unauthorized
  third-party software designed to modify the Services"; use of "any robot, spider, site
  search/retrieval application... to retrieve, index, 'data mine'... or in any way
  reproduce or circumvent the navigational structure or presentation of the Services"; and
  use of "automated or artificial intelligence (AI) tools to access, scan, scrape, data
  mine, copy, or use the materials or content in the Services."

**Assessment (judgment, not a primary source):** an extension that only *writes* a
user-supplied PGN into `chess.com/analysis` via ordinary navigation is the least exposed
design — it neither scrapes Chess.com content nor modifies Chess.com pages. Injecting UI
into Chess.com pages, scraping games from Chess.com, or circumventing the Game Review quota
runs directly into the clauses above. This is the basis of the write-only architectural
constraint.

## Recommendation carried into design

Fast path: navigate to `https://www.chess.com/analysis/review?pgn=<encoded>` with a length
guard at ~13,000 encoded chars. Fallback above the guard: hidden auto-submitting POST form
to `https://www.chess.com/analysis`. Isolate both behind a single seam — the `pgn`
parameter is undocumented and may be removed without notice.

## Not confirmed

1. Whether Game Review actually runs on a `?pgn=` import when logged in (free vs. paid).
2. The exact free-tier Game Review quota.
3. Whether `pgn` is officially supported, or could vanish without notice. It appears in no
   Chess.com documentation. **Treat as undocumented and unstable.**
4. Any endpoint that creates a persistent library/collection entry from outside the UI.
