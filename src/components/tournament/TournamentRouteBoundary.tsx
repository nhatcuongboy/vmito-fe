'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import TournamentPageShell, {
  type TournamentSegment,
} from '@/components/tournament/TournamentPageShell';

interface ITournamentRouteBoundaryProps {
  children: ReactNode;
}

const ROUTE_SEGMENTS = new Set<TournamentSegment>([
  'teams',
  'schedule',
  'standings',
  'manage',
  'dashboard',
]);

export default function TournamentRouteBoundary({
  children,
}: ITournamentRouteBoundaryProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  const tournamentSegmentIndex = pathSegments.findIndex(
    (segment) => segment === 'tournament'
  );
  const routeSegments =
    tournamentSegmentIndex >= 0
      ? pathSegments.slice(tournamentSegmentIndex + 1)
      : [];
  const isTournamentRoot = routeSegments.length === 1;
  const routeSegment = routeSegments[1] as TournamentSegment | undefined;
  const isTournamentTab =
    routeSegments.length === 2 &&
    !!routeSegment &&
    ROUTE_SEGMENTS.has(routeSegment);

  if (!isTournamentRoot && !isTournamentTab) {
    return children;
  }

  return (
    <>
      {children}
      <TournamentPageShell
        activeSegment={isTournamentRoot ? 'home' : (routeSegment ?? 'home')}
      />
    </>
  );
}
