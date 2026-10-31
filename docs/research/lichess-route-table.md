# Research: Lichess's route table, as a URL classifier sees it

_Date: 2026-10-31. Source: lila `conf/routes` on master (1002 lines), plus
`app/controllers/User.scala` and `modules/round/src/main/Env.scala`. Labels as in
the other research docs: **CONFIRMED**, **INFERRED**, **UNKNOWN**._

This corrects §1 of [`lichess-game-surfaces.md`](lichess-game-surfaces.md), whose
candidate matcher is unanchored and so reads `/analysis` and `/training/...` as game
ids.

## Single-game page routes — CONFIRMED

| Route | Line |
| --- | --- |
| `/game/$gameId<\w{8}>` | 397 |
| `/game/$gameId<\w{8}>/$color<white\|black>` | 398 |
| `/game/$fullId<\w{12}>` | 399 |
| `/game/$gameId<\w{8}>/$color<white\|black>/analysis` | 408 |
| `/$gameId<\w{8}>/$color<white\|black>` (redirect) | 415 |
| `/embed/$gameId<\w{8}>[/$color]` | 417–418 |
| `/embed/game/$gameId<\w{8}>[/$color]` | 420–421 |

- There is **no** `/game/<id>/analysis` without a colour, and **no** bare `/<id>` route.
- Route ids are `\w`, **not** `[\w-]`: a game id in a URL never contains `-`.

## The bare `/<id>` catch-all — CONFIRMED in source and live

`GET /*path` (line 1002) tries, in order: a static redirect map, then a game
(`GameId.from` takes the first 8 characters), then a challenge, then a username. A bare
id therefore 301-redirects to `/game/<id>`, so a **tab** URL on a game page is always the
`/game/...` form; bare forms reach the extension only as **links**. Whether a bare
8-character segment is a game, a challenge or a user is settled by a database lookup,
so a pure classifier cannot tell. Live: `/7WuuzbB4`, `/7WuuzbB4/analysis` and
`/7WuuzbB4xyzw` all 301 to `/game/7WuuzbB4`.

## Collisions: first segments of exactly 8 or 12 `[\w-]` characters — CONFIRMED

- 8: `analysis`, `features`, `insights`, `password`, `practice`, `streamer`,
  `timeline`, `training`. Second-segment: `/embed/analysis` (line 226).
- 12: `verify-title` only, which contains `-` and so cannot match `\w{12}`.

## Other surfaces — CONFIRMED

Analysis board `/analysis[/...]`; puzzles `/training[/...]`, also under a
`/<lang>/training` prefix, with `/streak`, `/storm`, `/racer` nearby; simul `/simul/<id>`;
study `/study/<id>[/<chapterId>]`; broadcast `/broadcast/<ts>/<rs>/<roundId>[/<chapterId>]`;
arena `/tournament/<id>`; swiss `/swiss/<id>`.

## Not confirmed

1. Trailing slashes are stripped with a 301 in production, but not by the app; the layer
   is UNKNOWN (probably nginx).
2. `/<id>/white|black` and `/game/<id>/white/analysis` returned 403 to curl (anti-bot,
   INFERRED), so their live behaviour is UNCONFIRMED.
3. A bare `/<fullId>` redirecting to `/game/<fullId>` is from code only; testing it needs a
   real player token.
