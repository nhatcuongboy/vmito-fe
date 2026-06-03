import { Suspense } from 'react';
import TournamentShowcasePage from '@/components/tournament/showcase/TournamentShowcasePage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TournamentShowcasePage />
    </Suspense>
  );
}
