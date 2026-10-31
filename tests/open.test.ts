import { expect, it, vi } from 'vitest';

import { openOnChessCom } from '../lib/open';

const pgn =
  '[Event "Rated blitz game"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0';
const finished = { status: 'mate', variant: { key: 'standard' }, pgn };

function answering(status: number, body: unknown = null) {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(body, { status }));
}

it('imports a finished standard game to Chess.com', async () => {
  const fetchFn = answering(200, finished);

  expect(
    await openOnChessCom('https://lichess.org/game/7WuuzbB4', fetchFn),
  ).toEqual({
    kind: 'import',
    url: `https://www.chess.com/analysis?pgn=${encodeURIComponent(pgn)}`,
  });
});

it('exports by the game id alone when the page carries a full id', async () => {
  const fetchFn = answering(200, finished);

  await openOnChessCom('https://lichess.org/7WuuzbB4Zq9x', fetchFn);

  expect(fetchFn).toHaveBeenCalledOnce();
  const [url, init] = fetchFn.mock.calls[0] ?? [];
  expect(url).toBe(
    'https://lichess.org/game/export/7WuuzbB4?pgnInJson=true&clocks=false&evals=false',
  );
  expect(JSON.stringify(init)).not.toContain('Zq9x');
});

it.each([
  ['https://example.com/', 'not-a-game'],
  ['', 'not-a-game'],
  ['https://lichess.org/analysis', 'analysis-board'],
])('refuses %s without contacting Lichess', async (url, reason) => {
  const fetchFn = answering(200, finished);

  expect(await openOnChessCom(url, fetchFn)).toEqual({
    kind: 'refused',
    reason,
  });
  expect(fetchFn).not.toHaveBeenCalled();
});

it('refuses a game Lichess does not have', async () => {
  expect(
    await openOnChessCom('https://lichess.org/7WuuzbB4', answering(404)),
  ).toEqual({ kind: 'refused', reason: 'not-found' });
});

it('refuses an ongoing game', async () => {
  const fetchFn = answering(200, { ...finished, status: 'started' });

  expect(await openOnChessCom('https://lichess.org/7WuuzbB4', fetchFn)).toEqual(
    { kind: 'refused', reason: 'ongoing' },
  );
});

it('refuses a game too long for the Chess.com URL', async () => {
  const fetchFn = answering(200, { ...finished, pgn: 'e4 '.repeat(5_000) });

  expect(await openOnChessCom('https://lichess.org/7WuuzbB4', fetchFn)).toEqual(
    { kind: 'refused', reason: 'too-long' },
  );
});

it('reports a network failure', async () => {
  const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError());

  expect(await openOnChessCom('https://lichess.org/7WuuzbB4', fetchFn)).toEqual(
    { kind: 'error', error: 'network' },
  );
});

it('reports rate limiting', async () => {
  expect(
    await openOnChessCom('https://lichess.org/7WuuzbB4', answering(429)),
  ).toEqual({ kind: 'error', error: 'rate-limited' });
});

it('reports a 200 whose body is not JSON', async () => {
  const fetchFn = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('<html>', { status: 200 }));

  expect(await openOnChessCom('https://lichess.org/7WuuzbB4', fetchFn)).toEqual(
    { kind: 'error', error: 'unexpected' },
  );
});
