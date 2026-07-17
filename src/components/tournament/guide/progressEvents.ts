// Same-page bridge for mutations that change tournament progress but have no
// socket broadcast (group/bracket generation, match deletion). The guide
// widget subscribes; manage panels notify after a successful mutation.

const EVENT_NAME = 'vmito:tournament-progress-changed';

export function notifyTournamentProgressChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeTournamentProgressChanged(
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
