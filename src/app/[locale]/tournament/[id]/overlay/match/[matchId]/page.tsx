import { Suspense } from 'react';
import MatchOverlayClient from '@/components/tournament/scoreboard/overlay/MatchOverlayClient';

// Public livestream overlay pinned to a single match — no auth guard. Designed
// to be embedded as an OBS browser source (transparent background by default).
export default function Page() {
  return (
    <Suspense fallback={null}>
      <MatchOverlayClient />
    </Suspense>
  );
}
