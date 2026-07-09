import PageLayout from '@/components/layout/PageLayout';
import { PublicTournamentTeamSkeleton } from '@/components/tournament/skeletons';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';

export default function Loading() {
  return (
    <PageLayout
      title="Chi tiết đội"
      showBackButton
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      rightContent={<TournamentTopBarMenu />}
      maxW="container.lg"
      bg="gray.50"
      pb={{
        base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
        md: '24px',
      }}
      _dark={{ bg: 'gray.900' }}
    >
      <PublicTournamentTeamSkeleton />
    </PageLayout>
  );
}
