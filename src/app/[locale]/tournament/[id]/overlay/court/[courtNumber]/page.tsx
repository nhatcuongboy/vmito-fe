import { Suspense } from 'react';
import CourtOverlayClient from '@/components/tournament/scoreboard/overlay/CourtOverlayClient';

// Public livestream overlay keyed by court number — no auth guard. Designed to
// be embedded as an OBS browser source (transparent background by default).
export default function Page() {
  return (
    <Suspense fallback={null}>
      <CourtOverlayClient />
    </Suspense>
  );
}
