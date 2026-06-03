import PageLayout from '@/components/layout/PageLayout';
import { TournamentCardsGridSkeleton } from '@/components/tournament/skeletons';

export default function Loading() {
  return (
    <PageLayout maxW="7xl" bg="green.50" _dark={{ bg: 'gray.900' }}>
      <TournamentCardsGridSkeleton />
    </PageLayout>
  );
}
