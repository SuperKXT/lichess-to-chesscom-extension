# Research: Lichess game surfaces and PGN export

_Date: 2026-10-31. Claims labelled **CONFIRMED** (primary source or live request),
**INFERRED**, or **UNKNOWN**. Probed live against lichess.org plus the `lichess-org/api`
OpenAPI spec and `lichess-org/lila` source._

## Question

Where might a user want to "export this game" on Lichess, and how does an extension
reliably obtain the PGN for whatever is on screen?

## 1. URL surfaces — CONFIRMED from lila `conf/routes`

Source: <https://github.com/lichess-org/lila/blob/master/conf/routes>

| Surface | URL pattern | Canonical PGN? |
| --- | --- | --- |
| Finished/ongoing game, spectator | `/game/$gameId<\w{8}>`; bare `/<gameId>` 301-redirects here | Yes: `/game/export/<id>` |
| Player-POV spectator | `/game/<gameId>/white\|black` | Yes, same id |
| **Playing** view (you are a player) | `/game/$fullId<\w{12}>` | Yes, after truncating to 8 chars |
| Move-specific | `#<ply>` fragment; server never sees it | Same game PGN (no per-ply export) |
| Analysis board | `/analysis`, `/analysis/<variant>/<fen>`, `/analysis/pgn/*pgn` | **No** — client-only, nothing to export |
| Game -> analysis | `/game/<gameId>/<color>/analysis` | Yes, same game id |
| Study | `/study/$id<\w{8}>`, `/study/<id>/<chapterId>` | Yes (section 3) |
| Broadcast round | `/broadcast/:tourSlug/:roundSlug/$roundId<\w{8}>` | Yes (section 3) |
| Broadcast single game | `/broadcast/:ts/:rs/<roundId>/<chapterId>` | Yes — via the study API |
| Puzzle | `/training/:angleOrId`, ids are **5 chars** | **No PGN endpoint** (bare SAN list only) |
| Arena tournament | `/tournament/$id<\w{8}>` | Yes: `/api/tournament/<id>/games` |
| Swiss | `/swiss/<id>` | Yes: `/api/swiss/<id>/games` |
| Simul | `/simul/$id<\w{8}>` | **No** — no games-export endpoint exists (404 confirmed) |
| Embeds | `/embed/<gameId>[/color]`, `/embed/broadcast/...` | Game/broadcast embeds map to a real id |

Practical matcher for a content script:

```
/^\/(?:game\/)?([\w-]{8})(?:\w{4})?(?:\/(?:white|black))?(?:\/analysis)?/
```

Truncate to the first 8 chars before calling the export API.

## 2. `/game/export/<id>` — CONFIRMED

Spec: <https://lichess.org/api#tag/Games/operation/gamePgn>

- Routes: `GET /game/export/$gameId<\w{8}>` and `...<id>.pgn`. The id is **exactly 8 chars** —
  a 12-char full id returns **404** (verified).
- Batch: `POST /api/games/export/_ids` (comma-separated, max 300), also CORS-open.
- Params: `moves`, `tags`, `clocks`, `evals`, `opening`, `division`, `literate`,
  `pgnInJson`, `accuracy`, `withBookmarked`.
- **Auth: none required** (spec declares `security: []`).
- **CORS: `access-control-allow-origin: *`** — CONFIRMED live and in
  `modules/web/src/main/ResponseHeaders.scala`. `OPTIONS` preflight returns 204. So an
  extension can fetch this from a service worker or a cross-origin content script.
  `Access-Control-Allow-Credentials` is set only for Lichess's own origins, so a
  cross-origin fetch is always **anonymous**.
- **Undocumented gotcha — CONFIRMED in source.** `app/controllers/Game.scala` computes
  `flags = requestPgnFlags(extended = ctx.isAuth || game.isStrongOrRecent)` and then
  `clocks = getBoolOpt("clocks") | extended`. So the documented `true` defaults for
  `clocks`/`evals`/`opening`/`division` do **not** hold for an anonymous request on an
  old or low-rated game. **Always pass these explicitly.**
- Ongoing games are **delayed by 3 moves** (unavoidable without a trust key).
- Format follows `Accept`: default `application/x-chess-pgn`; `Accept: application/json`
  returns the game object, and `?pgnInJson=true` adds a `pgn` field.
- `Content-Disposition: attachment` is sent — irrelevant to `fetch`, but it means a plain
  `<a href>` downloads rather than navigates.
- **Rate limits: UNKNOWN numerically.** No `X-RateLimit-*` headers; no per-endpoint
  `RateLimit` in lila for `exportOne`. Only the generic policy applies (section 7).

**Design consequence:** request `clocks=0&evals=0`. Lichess evals are irrelevant (the point
is Chess.com's analysis) and clock annotations are what push a PGN past Chess.com's ~14 KB
URL ceiling.

## 3. Study and broadcast PGN — CONFIRMED

**Study:**

- `GET /api/study/<studyId>/<chapterId>.pgn` (both ids `\w{8}`). Params `clocks`,
  `comments`, `variations` (default true), `orientation` (default false).
- `GET /api/study/<studyId>.pgn` for all chapters.
- Auth: spec declares `study:read`, but that is needed only for private/unlisted studies.
  A public chapter fetched **anonymously returns 200** with ACAO `*`.
- **CORS trap — CONFIRMED by observation (single probe):** the non-`/api` alias
  `GET /study/<id>/<chapterId>.pgn` also returns 200 PGN but sent **no** ACAO header.
  Always use the `/api/...` path from a cross-origin context.

**Broadcast:**

- `GET /api/broadcast/round/<roundId>.pgn` (whole round) and
  `GET /api/broadcast/<tourId>.pgn` (whole tournament) — anonymous 200, ACAO `*`.
- `GET /api/stream/broadcast/round/<roundId>.pgn` for streaming; the spec explicitly says
  polling the round PGN is "slow and very inefficient."
- **Useful find:** a broadcast round *is* a study, so
  `/broadcast/:ts/:rs/<roundId>/<chapterId>` maps onto
  `GET /api/study/<roundId>/<chapterId>.pgn`. Verified: returns exactly the one game.
  This is the only way to get a single broadcast game rather than the whole round.

## 4. Is the PGN already in the DOM? — CONFIRMED: moves yes, PGN no

Every relevant page carries `<script type="application/json" id="page-init-data">`:

- **Game page**: `cfg.data.treeParts` — `{ply, fen, uci, san, eval, clock}` per move — plus
  `cfg.data.game` and player objects. **There is no `pgn` key.** Reconstructing a PGN would
  mean re-implementing lila's `PgnDump`.
- **Study**: `study.chapter.tags` holds the real PGN tag array; `data.treeParts` the moves.
  Still no PGN string.
- **Puzzle**: `data.game.pgn` exists but is a bare space-separated SAN list, no tags.
- **Playing round page**: declares `steps: RoundStep[]` instead of `treeParts` (field name
  CONFIRMED from `ui/round/src/interfaces.ts`; per-step shape **INFERRED**).

The "Share & export" sidebar does **not** contain PGN text, only the export URLs. Lichess's
own copy button fetches them:

```html
<div class="copy-me fetch-content">
  <a href="https://lichess.org/game/export/q7ZvsdUF?literate=1" class="copy-me__target">
```

**So there is no network-free path, and fetching the export API is exactly what Lichess's
own UI does.** Scraping `a.copy-me__target[href*="/game/export/"]` is a reasonable way to
obtain the canonical URL, but you still fetch it.

## 5. Game ID format — CONFIRMED from `modules/core/src/main/id.scala`

```scala
object GameId: def size = 8; private val idRegex = """[\w-]{8}""".r
object GameFullId: val size = 12
  def apply(gameId: GameId, playerId: GamePlayerId) = s"$gameId$playerId"
object GamePlayerId: val size = 4
```

- **Public game id: 8 chars**, charset `[A-Za-z0-9_-]`, case-sensitive.
- **Full game id: 12 chars** = public id + a **4-char secret player token**. It is what a
  player sees while playing (`/<fullId>`) and it authorizes moves and resignation
  (`POST /game/<fullId>/resign`).

> **Security constraint.** The 12-char full id is a credential. The extension must truncate
> to 8 chars before use, and must never log, store, or transmit the full id.
> `/game/export/<12 chars>` 404s anyway (verified).

Puzzle ids are `\w{5}`. Study, chapter, broadcast-round and tournament ids are all `\w{8}`.

## 6. Variants

Lichess keys — CONFIRMED (<https://github.com/lichess-org/api/blob/master/doc/specs/schemas/VariantKey.yaml>):
`standard, chess960, crazyhouse, antichess, atomic, horde, kingOfTheHill, racingKings,
threeCheck, fromPosition`.

Against Chess.com's variant list (<https://support.chess.com/article/294-chess-variants>):

- Has some counterpart: Chess960, Crazyhouse, Three-check, King of the Hill, Atomic, Horde,
  Antichess (~ Chess.com "Giveaway" — equivalence **INFERRED**, rules differ in detail).
- **No Chess.com counterpart at all: Racing Kings** — CONFIRMED by absence.
- **UNKNOWN:** whether `chess.com/analysis` will *parse* PGN for any of these variants. No
  primary source found. Must be tested empirically before relying on it.

**Chess960 PGN shape — CONFIRMED** by exporting 40 games from a Chess960 arena:

```
[Variant "Chess960"]
[FEN "brknnbrq/pppppppp/8/8/8/8/PPPPPPPP/BRKNNBRQ w KQkq - 0 1"]
[SetUp "1"]
```

Castling rights use **X-FEN style `KQkq`**, not Shredder-FEN file letters — some parsers
expect the latter for 960. Castling moves are standard `O-O`/`O-O-O` SAN (52 occurrences,
zero king-takes-rook). Crazyhouse drops appear as `P@g4`/`N@f5`. Ongoing games carry
`[Result "*"]` + `[Termination "Unterminated"]`.

## 7. API terms and etiquette

- The only normative guidance is the API intro (<https://lichess.org/api>) — CONFIRMED:
  "All requests are rate limited... **Only make one request at a time.** If you receive an
  HTTP response with a 429 status, you have exceeded one of the rate limits. In most cases,
  waiting one minute before retrying will be sufficient."
- Token guidance, relevant only if OAuth is ever added: "Do not hardcode tokens... Be
  especially careful that they are not included in **frontend bundles or apps that are
  shipped to users**." For an extension this means PKCE, never a shipped token.
- <https://lichess.org/terms-of-service> has **no API-specific clause**. Its only
  extension-adjacent language is fair-play: engine assistance and "certain software or
  extensions at our discretion" are forbidden *during play*. A post-game PGN exporter sits
  outside that; an extension reading the board of a **live game you are playing** is in
  fair-play territory. (Text CONFIRMED; application **INFERRED**.)

**Etiquette carried into design:** one request at a time, no parallel fan-out, back off
>= 60s on 429, cache by game id (a finished game's PGN is immutable), use `HEAD` +
`Last-Modified` for studies.

## Not confirmed

1. Numeric rate limits for `/game/export/<id>`, `/api/study/*.pgn`, `/api/broadcast/*.pgn`.
2. Which variants Chess.com's analysis board accepts via PGN import.
3. The playing-round page DOM step shape (field name confirmed, contents inferred).
4. `#<ply>` fragment parsing in lila (well-established behaviour, code not located;
   irrelevant to export — no per-ply endpoint exists).
5. The CORS asymmetry on `/study/...pgn` vs `/api/study/...pgn` rests on a single probe.
6. Broadcast *page* DOM — Cloudflare interstitial blocked the fetch.
