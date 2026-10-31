import type { Refusal } from './refusal';

// The one place that knows how Chess.com accepts a PGN. `?pgn=` is
// undocumented, so if Chess.com removes it, this file is the fix. See
// `docs/research/chesscom-import-surfaces.md` and ADR 0001.

export type ChessComImport =
  { kind: 'import'; url: string } | ({ kind: 'refused' } & Refusal);

/**
 * The longest encoded query (`pgn=` and the encoded PGN) we send. Chess.com
 * answered 200 up to ~14,400 characters and 502 above it. Real games are far
 * shorter: about 700 characters of headers plus 9 to 10 per ply, so the
 * budget is only reached at around 1,300 plies.
 */
export const encodedQueryBudget = 13_000;

/** The navigation that imports `pgn` to Chess.com's analysis board. */
export function chessComImport(pgn: string): ChessComImport {
  // `encodeURIComponent`, not `URLSearchParams`: `%20` for a space is what
  // was tested live, and `+` is not.
  const query = `pgn=${encodeURIComponent(pgn)}`;
  if (query.length > encodedQueryBudget) {
    return { kind: 'refused', reason: 'too-long' };
  }
  return { kind: 'import', url: `https://www.chess.com/analysis?${query}` };
}
