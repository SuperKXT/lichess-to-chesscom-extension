import { describe, expect, it } from 'vitest';

import { errorMessage, refusalMessage } from '../lib/refusal';

describe('refusalMessage', () => {
  it.each([
    [
      'not-a-game',
      "This isn't a Lichess game. Open a finished game, then try again.",
    ],
    ['not-found', 'Lichess has no game at this address.'],
    [
      'analysis-board',
      "The analysis board isn't a saved game, so there's nothing to open. Open a finished game instead.",
    ],
    [
      'puzzle',
      "Puzzles can't be opened on Chess.com: Lichess doesn't export them as games.",
    ],
    [
      'simul',
      'A simul has no single game to open. Open one of its games instead.',
    ],
    ['tournament', 'This is a tournament page. Open one of its games instead.'],
    ['study', "Studies aren't supported yet. Open a single game instead."],
    [
      'broadcast',
      "Broadcasts aren't supported yet. Open a single game instead.",
    ],
    [
      'ongoing',
      'This game is still being played. Try again once it has finished.',
    ],
    ['aborted', "This game was aborted, so there's nothing to review."],
    [
      'from-position',
      "Games started from a custom position aren't supported yet.",
    ],
  ] as const)('explains %s', (reason, message) => {
    expect(refusalMessage({ reason })).toBe(message);
  });

  it.each([
    ['crazyhouse', 'Crazyhouse'],
    ['chess960', 'Chess960'],
    ['kingOfTheHill', 'King of the Hill'],
    ['racingKings', 'Racing Kings'],
    ['threeCheck', 'Three-check'],
  ] as const)('names the %s variant', (variant, name) => {
    expect(refusalMessage({ reason: 'variant', variant })).toBe(
      `Only standard chess is supported, and this is a ${name} game.`,
    );
  });

  it('falls back to a generic name for a variant it has never seen', () => {
    expect(refusalMessage({ reason: 'variant', variant: 'unknown' })).toBe(
      'Only standard chess is supported, and this is a variant game.',
    );
  });
});

describe('errorMessage', () => {
  it.each([
    ['network', "Couldn't reach Lichess. Check your connection and try again."],
    [
      'rate-limited',
      'Lichess is limiting requests right now. Wait a minute and try again.',
    ],
    [
      'unexpected',
      'Lichess sent an unexpected response. Try again in a moment.',
    ],
  ] as const)('explains %s', (error, message) => {
    expect(errorMessage(error)).toBe(message);
  });
});
