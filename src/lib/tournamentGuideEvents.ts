/**
 * Same-page bridge letting UI outside the tournament setup guide widget's own
 * tree (e.g. the slide-out menu's footer icon) ask it to reopen after being
 * dismissed or collapsed.
 */

const EVENT_NAME = 'vmito:tournament-guide-toggle';

export function notifyTournamentGuideToggle(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeTournamentGuideToggle(
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
