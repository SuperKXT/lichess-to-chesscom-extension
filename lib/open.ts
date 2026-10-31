import { chessComImport } from './chesscom';
import { assessExport, classifyLichessUrl } from './lichess';
import type { GameId } from './lichess';
import type { ExportError, Refusal } from './refusal';

/** How one click ends. Never silence: always one of these three. */
export type Outcome =
  | { kind: 'import'; url: string }
  | ({ kind: 'refused' } & Refusal)
  | { kind: 'error'; error: ExportError };

/**
 * Everything between the user's click and the Chess.com tab: classify the
 * page, export the game, assess it, and build the import. Touches no
 * `browser.*`, so the caller decides what to do with the outcome.
 */
export async function openOnChessCom(
  pageUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<Outcome> {
  const page = classifyLichessUrl(pageUrl);
  if (page.kind === 'off-lichess')
    return { kind: 'refused', reason: 'not-a-game' };
  if (page.kind === 'refused') return page;

  const response = await exportGame(page.gameId, fetchFn);
  if ('error' in response) return { kind: 'error', error: response.error };

  const assessment = assessExport(response);
  if (assessment.kind !== 'ready') return assessment;
  return chessComImport(assessment.pgn);
}

async function exportGame(
  gameId: GameId,
  fetchFn: typeof fetch,
): Promise<{ status: number; body: unknown } | { error: ExportError }> {
  let response: Response;
  try {
    response = await fetchFn(exportUrl(gameId), {
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { error: 'network' };
  }
  // Only a 200 body is read; `assessExport` judges every other status alone.
  if (response.status !== 200) return { status: response.status, body: null };
  try {
    return { status: 200, body: await response.json() };
  } catch {
    return { error: 'unexpected' };
  }
}

function exportUrl(gameId: GameId): string {
  return `https://lichess.org/game/export/${gameId}?pgnInJson=true&clocks=false&evals=false`;
}
