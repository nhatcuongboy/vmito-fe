import { Suspense } from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';

export default function LeaderboardPage() {
  return (
    <Suspense>
      <LeaderboardContent />
    </Suspense>
  );
}
