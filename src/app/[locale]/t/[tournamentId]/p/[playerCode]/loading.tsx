import PageLayout from '@/components/layout/PageLayout';
import { PublicTournamentPlayerSkeleton } from '@/components/tournament/skeletons';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';

export default function Loading() {
  return (
    <PageLayout
      title="Thông tin VĐV"
      showBackButton
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      rightContent={<TournamentTopBarMenu />}
      maxW="container.lg"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <PublicTournamentPlayerSkeleton />
    </PageLayout>
  );
}
