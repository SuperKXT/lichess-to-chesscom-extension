import { describe, expect, it } from 'vitest';

import { assessExport, classifyLichessUrl } from '../lib/lichess';

describe('classifyLichessUrl', () => {
  it('finds the game id on a game page', () => {
    expect(classifyLichessUrl('https://lichess.org/game/7WuuzbB4')).toEqual({
      kind: 'game',
      gameId: '7WuuzbB4',
    });
  });

  it.each([
    'https://lichess.org/game/7WuuzbB4/black',
    'https://lichess.org/game/7WuuzbB4/white/analysis',
    'https://lichess.org/7WuuzbB4/white',
    'https://lichess.org/embed/7WuuzbB4',
    'https://lichess.org/embed/7WuuzbB4/black',
    'https://lichess.org/embed/game/7WuuzbB4',
    'https://lichess.org/embed/game/7WuuzbB4/white',
    'https://lichess.org/game/7WuuzbB4/',
    'https://lichess.org/game/7WuuzbB4?theme=brown#34',
    // Bare ids only reach us as links; the export settles whether they exist.
    'https://lichess.org/7WuuzbB4',
    'https://lichess.org/7WuuzbB4Zq9x',
  ])('finds the game id in %s', (url) => {
    expect(classifyLichessUrl(url)).toEqual({
      kind: 'game',
      gameId: '7WuuzbB4',
    });
  });

  it('truncates a full id to the game id and keeps none of the secret', () => {
    const result = classifyLichessUrl('https://lichess.org/game/7WuuzbB4Zq9x');

    expect(result).toEqual({ kind: 'game', gameId: '7WuuzbB4' });
    expect(JSON.stringify(result)).not.toContain('Zq9x');
  });

  it.each([
    'https://lichess.org/',
    'https://lichess.org/@/DrNykterstein',
    'https://lichess.org/game/7WuuzbB4/edit',
    'https://lichess.org/game/7Wuuz-B4',
    'https://lichess.org/verify-title',
    'https://lichess.org/features',
    'https://lichess.org/insights',
    'https://lichess.org/password',
    'https://lichess.org/practice',
    'https://lichess.org/streamer',
    'https://lichess.org/timeline',
  ])('refuses %s as not a game', (url) => {
    expect(classifyLichessUrl(url)).toEqual({
      kind: 'refused',
      reason: 'not-a-game',
    });
  });

  it.each([
    ['https://lichess.org/analysis', 'analysis-board'],
    ['https://lichess.org/analysis/pgn/1.e4', 'analysis-board'],
    [
      'https://lichess.org/analysis/standard/8/8/8/8/8/8/8/8_w',
      'analysis-board',
    ],
    ['https://lichess.org/embed/analysis', 'analysis-board'],
    ['https://lichess.org/training', 'puzzle'],
    ['https://lichess.org/training/K69di', 'puzzle'],
    ['https://lichess.org/training/white', 'puzzle'],
    ['https://lichess.org/fr/training', 'puzzle'],
    ['https://lichess.org/streak', 'puzzle'],
    ['https://lichess.org/storm', 'puzzle'],
    ['https://lichess.org/racer', 'puzzle'],
    ['https://lichess.org/simul/a1b2c3d4', 'simul'],
    ['https://lichess.org/tournament/a1b2c3d4', 'tournament'],
    ['https://lichess.org/swiss/a1b2c3d4', 'tournament'],
    ['https://lichess.org/study/a1b2c3d4/e5f6g7h8', 'study'],
    ['https://lichess.org/broadcast/tour/round-1/a1b2c3d4', 'broadcast'],
    ['https://lichess.org/embed/broadcast/tour/round-1/a1b2c3d4', 'broadcast'],
  ])('refuses %s as %s', (url, reason) => {
    expect(classifyLichessUrl(url)).toEqual({ kind: 'refused', reason });
  });

  it.each([
    'https://www.chess.com/game/7WuuzbB4',
    'http://lichess.org/game/7WuuzbB4',
    'https://lichess.org.evil.example/game/7WuuzbB4',
    'https://www.lichess.org/game/7WuuzbB4',
    'not a url',
  ])('treats %s as off Lichess', (url) => {
    expect(classifyLichessUrl(url)).toEqual({ kind: 'off-lichess' });
  });
});

describe('assessExport', () => {
  const pgn =
    '[Event "Rated blitz game"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0\n';
  const finished = { status: 'mate', variant: { key: 'standard' }, pgn };

  it('hands over the PGN of a finished standard game', () => {
    expect(assessExport({ status: 200, body: finished })).toEqual({
      kind: 'ready',
      pgn,
    });
  });

  it.each([
    ['created', 'ongoing'],
    ['started', 'ongoing'],
    ['aborted', 'aborted'],
    ['noStart', 'aborted'],
  ])('refuses a game whose status is %s as %s', (status, reason) => {
    expect(
      assessExport({ status: 200, body: { ...finished, status } }),
    ).toEqual({ kind: 'refused', reason });
  });

  it.each(['crazyhouse', 'chess960', 'racingKings'])(
    'refuses a %s game, naming the variant',
    (key) => {
      expect(
        assessExport({ status: 200, body: { ...finished, variant: { key } } }),
      ).toEqual({ kind: 'refused', reason: 'variant', variant: key });
    },
  );

  it('refuses a variant it has never seen without naming it', () => {
    expect(
      assessExport({
        status: 200,
        body: { ...finished, variant: { key: 'newVariant' } },
      }),
    ).toEqual({ kind: 'refused', reason: 'variant', variant: 'unknown' });
  });

  it('refuses a game started from a custom position', () => {
    expect(
      assessExport({
        status: 200,
        body: { ...finished, variant: { key: 'fromPosition' } },
      }),
    ).toEqual({ kind: 'refused', reason: 'from-position' });
  });

  it('refuses when Lichess has no such game', () => {
    expect(assessExport({ status: 404, body: undefined })).toEqual({
      kind: 'refused',
      reason: 'not-found',
    });
  });

  it.each([
    ['a 429', 'rate-limited', 429, finished],
    ['a 500', 'unexpected', 500, finished],
    ['a null body', 'unexpected', 200, null],
    ['a missing pgn', 'unexpected', 200, { ...finished, pgn: undefined }],
    ['a numeric status', 'unexpected', 200, { ...finished, status: 7 }],
    ['a flat variant', 'unexpected', 200, { ...finished, variant: 'standard' }],
  ])('reports %s as %s', (_, error, status, body) => {
    expect(assessExport({ status, body })).toEqual({ kind: 'error', error });
  });

  it('treats a status it has never seen as finished', () => {
    expect(
      assessExport({ status: 200, body: { ...finished, status: 'newEnding' } }),
    ).toEqual({ kind: 'ready', pgn });
  });
});
