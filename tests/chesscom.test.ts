import { describe, expect, it } from 'vitest';

import { chessComImport, encodedQueryBudget } from '../lib/chesscom';

const pgn = `[Event "Rated blitz game"]
[White "alice"]
[Black "bob"]
[Result "1-0"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6?? 4. Qxf7# 1-0
`;

describe('chessComImport', () => {
  it("imports to Chess.com's analysis board", () => {
    const result = chessComImport(pgn);
    expect(result.kind).toBe('import');
    if (result.kind !== 'import') return;
    const url = new URL(result.url);
    expect(url.origin).toBe('https://www.chess.com');
    expect(url.pathname).toBe('/analysis');
    expect([...url.searchParams.keys()]).toEqual(['pgn']);
    expect(url.searchParams.get('pgn')).toBe(pgn);
  });

  it('percent-encodes spaces and SAN symbols rather than using `+`', () => {
    const result = chessComImport('1. e8=Q+ Kxe8#');
    expect(result).toEqual({
      kind: 'import',
      url: 'https://www.chess.com/analysis?pgn=1.%20e8%3DQ%2B%20Kxe8%23',
    });
  });

  // `pgn=` is 4 characters, and each `e` encodes to itself.
  it('imports a PGN whose encoded query is exactly the budget', () => {
    const result = chessComImport('e'.repeat(encodedQueryBudget - 4));
    expect(result.kind).toBe('import');
  });

  it('refuses a PGN whose encoded query is one over the budget', () => {
    expect(chessComImport('e'.repeat(encodedQueryBudget - 3))).toEqual({
      kind: 'refused',
      reason: 'too-long',
    });
  });

  it('measures the encoded length, not the raw one', () => {
    // Each space becomes `%20`: a third of the budget raw, over it encoded.
    const spaces = ' '.repeat(Math.ceil(encodedQueryBudget / 3));
    expect(chessComImport(spaces)).toEqual({
      kind: 'refused',
      reason: 'too-long',
    });
  });

  it('keeps the budget below the ~14,400-character ceiling observed live', () => {
    expect(encodedQueryBudget).toBe(13_000);
  });
});
