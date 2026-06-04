import PageLayout from '@/components/layout/PageLayout';
import { PublicTournamentPlayerSkeleton } from '@/components/tournament/skeletons';

export default function Loading() {
  return (
    <PageLayout
      title="Thông tin VĐV"
      showBackButton={false}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      maxW="container.lg"
      bg="gray.50"
    >
      <PublicTournamentPlayerSkeleton />
    </PageLayout>
  );
}
