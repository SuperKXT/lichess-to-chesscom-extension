import type { ExportError, PlainReason, Refusal } from './refusal';

declare const gameIdBrand: unique symbol;

/** The 8-character public id of a Lichess game. Safe to log and send. */
export type GameId = string & { readonly [gameIdBrand]: true };

export type Classification =
  | { kind: 'game'; gameId: GameId }
  | ({ kind: 'refused' } & Refusal)
  | { kind: 'off-lichess' };

export function classifyLichessUrl(url: string): Classification {
  const parsed = URL.parse(url);
  if (parsed?.protocol !== 'https:' || parsed.host !== 'lichess.org') {
    return { kind: 'off-lichess' };
  }
  const path = parsed.pathname.replace(/(?<=.)\/$/, '');
  const surface = surfaceOf(path);
  if (surface !== undefined) return { kind: 'refused', reason: surface };
  for (const route of gameRoutes) {
    const id = route.exec(path)?.[1];
    if (id !== undefined) return { kind: 'game', gameId: id as GameId };
  }
  return { kind: 'refused', reason: 'not-a-game' };
}

// lila's single-game page routes (`conf/routes`). Ids are `\w`, with no `-`.
// Each captures only the game id, so a full id's secret is never kept.
const gameRoutes: readonly RegExp[] = [
  /^\/game\/(\w{8})(?:\/(?:white|black)(?:\/analysis)?)?$/,
  /^\/game\/(\w{8})\w{4}$/,
  /^\/(\w{8})\/(?:white|black)$/,
  /^\/embed\/(?:game\/)?(\w{8})(?:\/(?:white|black))?$/,
  // A bare id is a link lila redirects; it may also be a challenge or user.
  /^\/(\w{8})(?:\w{4})?$/,
];

/** The refusal for a known non-game surface, judged by its leading segment. */
function surfaceOf(path: string): PlainReason | undefined {
  const [, first = '', second = ''] = path.split('/');
  // `/embed/<surface>` and lila's `/<lang>/<surface>` (2 or 3 letters).
  const prefixed = first === 'embed' || /^\w{2,3}$/.test(first);
  return (
    surfaceSegments.get(first) ??
    (prefixed ? surfaceSegments.get(second) : undefined)
  );
}

const surfaceSegments: ReadonlyMap<string, PlainReason> = new Map([
  ['analysis', 'analysis-board'],
  ['training', 'puzzle'],
  ['streak', 'puzzle'],
  ['storm', 'puzzle'],
  ['racer', 'puzzle'],
  ['simul', 'simul'],
  ['tournament', 'tournament'],
  ['swiss', 'tournament'],
  ['study', 'study'],
  ['broadcast', 'broadcast'],
  // lila's other first segments of exactly 8 `\w` characters, which would
  // otherwise read as a bare game id.
  ['features', 'not-a-game'],
  ['insights', 'not-a-game'],
  ['password', 'not-a-game'],
  ['practice', 'not-a-game'],
  ['streamer', 'not-a-game'],
  ['timeline', 'not-a-game'],
]);

/** What Lichess answered to `/game/export/<id>` as JSON with `pgnInJson`. */
export interface ExportResponse {
  status: number;
  body: unknown;
}

export type Assessment =
  | { kind: 'ready'; pgn: string }
  | ({ kind: 'refused' } & Refusal)
  | { kind: 'error'; error: ExportError };

export function assessExport({ status, body }: ExportResponse): Assessment {
  if (status === 404) return { kind: 'refused', reason: 'not-found' };
  if (status === 429) return { kind: 'error', error: 'rate-limited' };
  if (status !== 200 || !isExportedGame(body)) {
    return { kind: 'error', error: 'unexpected' };
  }
  const refusal = unfinished.get(body.status) ?? variantRefusal(body.variant);
  if (refusal !== undefined) return { kind: 'refused', ...refusal };
  return { kind: 'ready', pgn: body.pgn };
}

/** The only fields of Lichess's game JSON that are read. */
interface ExportedGame {
  pgn: string;
  status: string;
  /** A bare key such as `standard`, not an object. */
  variant: string;
}

function isExportedGame(body: unknown): body is ExportedGame {
  if (typeof body !== 'object' || body === null) return false;
  const game = body as Partial<Record<keyof ExportedGame, unknown>>;
  return (
    typeof game.pgn === 'string' &&
    typeof game.status === 'string' &&
    typeof game.variant === 'string'
  );
}

// lila's statuses for a game that has not ended. Any other status, including
// one added later, is a way of ending.
const unfinished: ReadonlyMap<string, Refusal> = new Map([
  ['created', { reason: 'ongoing' }],
  ['started', { reason: 'ongoing' }],
  ['aborted', { reason: 'aborted' }],
  ['noStart', { reason: 'aborted' }],
]);

/** A Lichess variant other than standard chess. */
export type Variant = (typeof variants)[number];

const variants = [
  'chess960',
  'crazyhouse',
  'antichess',
  'atomic',
  'horde',
  'kingOfTheHill',
  'racingKings',
  'threeCheck',
] as const;

function variantRefusal(key: string): Refusal | undefined {
  if (key === 'standard') return undefined;
  if (key === 'fromPosition') return { reason: 'from-position' };
  const variant = variants.find((known) => known === key) ?? 'unknown';
  return { reason: 'variant', variant };
}
