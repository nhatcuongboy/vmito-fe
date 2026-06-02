import { Suspense } from 'react';
import PublicScoreboardPage from '@/components/tournament/scoreboard/PublicScoreboardPage';

// Public spectator scoreboard — no auth guard.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PublicScoreboardPage />
    </Suspense>
  );
}
