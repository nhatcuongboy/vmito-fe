'use client';

import {
  TournamentContentSkeleton,
  TournamentManageSkeleton,
  TournamentMatchListSkeleton,
  TournamentTableSkeleton,
  TournamentTeamsSkeleton,
} from '@/components/tournament/skeletons';
import { usePathname } from 'next/navigation';

interface ITournamentSegmentSkeletonProps {
  activeSegment?: string;
}

export default function TournamentSegmentSkeleton({
  activeSegment,
}: ITournamentSegmentSkeletonProps) {
  const pathname = usePathname();
  const pathnameSegment = pathname.split('/').filter(Boolean).at(-1);
  const segment = activeSegment ?? pathnameSegment;

  switch (segment) {
    case 'teams':
      return <TournamentTeamsSkeleton />;
    case 'schedule':
      return <TournamentMatchListSkeleton count={6} />;
    case 'standings':
      return <TournamentTableSkeleton rows={6} columns={7} />;
    case 'manage':
    case 'dashboard':
      return <TournamentManageSkeleton />;
    default:
      return <TournamentContentSkeleton />;
  }
}
