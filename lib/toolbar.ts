/** The host permission that lets the background read lichess.org tab URLs. */
export const lichessOrigin = 'https://lichess.org/*';

/**
 * Whether the toolbar button is enabled on a tab. With lichess.org access the
 * button is greyed out off Lichess. Without it (revoked in Firefox, "on click"
 * in Chrome) no tab URL is readable, so the button stays enabled everywhere
 * and a click off Lichess gets the `not-a-game` refusal instead.
 */
export function toolbarEnabled(
  tabUrl: string | undefined,
  hasLichessAccess: boolean,
): boolean {
  if (!hasLichessAccess) return true;
  return tabUrl !== undefined && URL.parse(tabUrl)?.host === 'lichess.org';
}
