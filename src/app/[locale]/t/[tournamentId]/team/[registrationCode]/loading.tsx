import PageLayout from '@/components/layout/PageLayout';
import { PublicTournamentTeamSkeleton } from '@/components/tournament/skeletons';

export default function Loading() {
  return (
    <PageLayout
      title="Chi tiết đội"
      showBackButton={false}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      maxW="container.lg"
      bg="gray.50"
      pb={{
        base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
        md: '24px',
      }}
    >
      <PublicTournamentTeamSkeleton />
    </PageLayout>
  );
}
