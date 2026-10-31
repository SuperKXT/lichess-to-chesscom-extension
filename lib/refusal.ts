import type { Variant } from './lichess';

/** Why the extension will not open a page or link. A designed outcome. */
export type Refusal =
  { reason: PlainReason } | { reason: 'variant'; variant: Variant | 'unknown' };

/** A refusal that needs nothing but its reason to explain. */
export type PlainReason =
  | 'not-a-game'
  | 'not-found'
  | 'analysis-board'
  | 'puzzle'
  | 'simul'
  | 'tournament'
  | 'study'
  | 'broadcast'
  | 'ongoing'
  | 'aborted'
  | 'from-position';

/** Something went wrong reaching Lichess. Unlike a refusal, retrying may help. */
export type ExportError = 'network' | 'rate-limited' | 'unexpected';

// Every string the user can be shown lives below. None claims anything about
// Chess.com, whose behaviour for these cases is untested.

export function refusalMessage(refusal: Refusal): string {
  if (refusal.reason !== 'variant') return plainMessages[refusal.reason];
  const name =
    refusal.variant === 'unknown' ? 'variant' : variantNames[refusal.variant];
  return `Only standard chess is supported, and this is a ${name} game.`;
}

export function errorMessage(error: ExportError): string {
  return errorMessages[error];
}

const plainMessages: Readonly<Record<PlainReason, string>> = {
  'not-a-game':
    "This isn't a Lichess game. Open a finished game, then try again.",
  'not-found': 'Lichess has no game at this address.',
  'analysis-board':
    "The analysis board isn't a saved game, so there's nothing to open. Open a finished game instead.",
  puzzle:
    "Puzzles can't be opened on Chess.com: Lichess doesn't export them as games.",
  simul: 'A simul has no single game to open. Open one of its games instead.',
  tournament: 'This is a tournament page. Open one of its games instead.',
  study: "Studies aren't supported yet. Open a single game instead.",
  broadcast: "Broadcasts aren't supported yet. Open a single game instead.",
  ongoing: 'This game is still being played. Try again once it has finished.',
  aborted: "This game was aborted, so there's nothing to review.",
  'from-position': "Games started from a custom position aren't supported yet.",
};

const variantNames: Readonly<Record<Variant, string>> = {
  chess960: 'Chess960',
  crazyhouse: 'Crazyhouse',
  antichess: 'Antichess',
  atomic: 'Atomic',
  horde: 'Horde',
  kingOfTheHill: 'King of the Hill',
  racingKings: 'Racing Kings',
  threeCheck: 'Three-check',
};

const errorMessages: Readonly<Record<ExportError, string>> = {
  network: "Couldn't reach Lichess. Check your connection and try again.",
  'rate-limited':
    'Lichess is limiting requests right now. Wait a minute and try again.',
  unexpected: 'Lichess sent an unexpected response. Try again in a moment.',
};
