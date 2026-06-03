import PageLayout from '@/components/layout/PageLayout';
import { TournamentShellSkeleton } from '@/components/tournament/skeletons';

export default function Loading() {
  return (
    <PageLayout
      showBackButton={false}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      maxW="full"
      px={{ base: '24px', md: 0 }}
      pb={{
        base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
        md: '24px',
      }}
    >
      <TournamentShellSkeleton />
    </PageLayout>
  );
}
