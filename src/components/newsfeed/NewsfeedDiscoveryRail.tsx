'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Image, Skeleton } from '@chakra-ui/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/primitives/hover-card';
import { ClubPreviewCard } from '@/components/preview-cards/ClubPreviewCard';
import { SessionPreviewCard } from '@/components/preview-cards/SessionPreviewCard';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_CLUB_LOGO, DEFAULT_COVER_PHOTO } from '@/constants/images';
import { SessionService } from '@/lib/api/session.service';
import { ClubsService } from '@/lib/api/clubs.service';
import type { ISession } from '@/lib/api/types';
import type { IClubListItem } from '@/types/club';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { readUserLocationCookie } from '@/lib/user-location';
import {
  cityCodeToApiName,
  readPreferredCityCookie,
} from '@/lib/preferred-city';

const WIDE_DESKTOP_QUERY = '(min-width: 90rem)';
const SUGGESTION_LIMIT = 3;

type SuggestedSession = ISession & {
  availableSlots?: number;
  distance: number | null;
  matchReasons: string[];
  maxPlayers?: number;
  score: number;
};

type SectionState<T> =
  | { status: 'loading'; items: T[] }
  | { status: 'ready'; items: T[] }
  | { status: 'unavailable'; items: T[] };

interface NewsfeedDiscoveryRailProps {
  onAvailabilityChange: (hasContent: boolean) => void;
}

interface RailSectionProps {
  children: React.ReactNode;
  title: string;
  viewAllHref: string;
}

function subscribeToWideDesktop(callback: () => void) {
  const mediaQuery = window.matchMedia(WIDE_DESKTOP_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getWideDesktopSnapshot() {
  return window.matchMedia(WIDE_DESKTOP_QUERY).matches;
}

function getServerWideDesktopSnapshot() {
  return false;
}

function useWideDesktop() {
  return useSyncExternalStore(
    subscribeToWideDesktop,
    getWideDesktopSnapshot,
    getServerWideDesktopSnapshot
  );
}

function RailSection({ children, title, viewAllHref }: RailSectionProps) {
  const t = useTranslations('posts.discoveryRail');

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="truncate text-[15px] font-bold text-gray-900 dark:text-gray-50">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="shrink-0 rounded-sm text-xs font-semibold text-green-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-green-400"
        >
          {t('viewAll')}
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function RailSectionSkeleton() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Skeleton height="18px" width="132px" borderRadius="md" />
        <Skeleton height="14px" width="48px" borderRadius="md" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <Skeleton height="60px" width="60px" borderRadius="xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton height="14px" width="80%" borderRadius="md" />
              <Skeleton height="12px" width="65%" borderRadius="md" />
              <Skeleton height="12px" width="52%" borderRadius="md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewsfeedDiscoveryRailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <RailSectionSkeleton />
      <RailSectionSkeleton />
    </div>
  );
}

function SuggestedSessionCard({ session }: { session: SuggestedSession }) {
  const t = useTranslations('posts.discoveryRail');
  const format = useFormatter();
  const startTime = session.scheduledStartTime ?? session.startTime;
  const venueName =
    session.venue?.name || session.customLocationName || session.location;
  const maxPlayers =
    session.maxPlayers ?? session.numberOfCourts * session.maxPlayersPerCourt;
  const playerCount = session._count?.players ?? session.players?.length ?? 0;
  const availableSlots = Math.max(
    0,
    session.availableSlots ?? maxPlayers - playerCount
  );
  const image =
    normalizeImageUrl(session.coverPhoto, {
      cloudinaryWidth: 120,
      cloudinaryHeight: 120,
    }) ?? DEFAULT_COVER_PHOTO;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link
          href={ROUTES.SESSIONS.DETAIL(session.id, session.slug)}
          aria-label={t('viewSession', { name: session.name })}
          className="group flex min-h-[76px] items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:hover:bg-green-950/20"
        >
          <Image
            src={image}
            alt=""
            boxSize="60px"
            flexShrink={0}
            borderRadius="xl"
            objectFit="cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-green-700 dark:text-gray-50 dark:group-hover:text-green-300">
              {session.name}
            </div>
            {startTime ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <CalendarDays
                  size={13}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {format.dateTime(new Date(startTime), {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            ) : null}
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {venueName ? (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin size={13} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{venueName}</span>
                </span>
              ) : null}
              <span className="ml-auto flex shrink-0 items-center gap-1">
                <Users size={13} aria-hidden="true" />
                {t('slotsAvailable', { count: availableSlots })}
              </span>
            </div>
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <SessionPreviewCard session={session} />
      </HoverCardContent>
    </HoverCard>
  );
}

function NearbyClubCard({ club }: { club: IClubListItem }) {
  const t = useTranslations('posts.discoveryRail');
  const location = club.defaultVenue?.name || club.location;
  const image =
    normalizeImageUrl(club.logo || club.image, {
      cloudinaryWidth: 120,
      cloudinaryHeight: 120,
    }) ?? DEFAULT_CLUB_LOGO;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link
          href={ROUTES.CLUBS.DETAIL(club.slug ?? club.id)}
          aria-label={t('viewClub', { name: club.name })}
          className="group flex min-h-[76px] items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:hover:bg-green-950/20"
        >
          <Image
            src={image}
            alt=""
            boxSize="60px"
            flexShrink={0}
            borderRadius="xl"
            objectFit="cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-green-700 dark:text-gray-50 dark:group-hover:text-green-300">
              {club.name}
            </div>
            {location ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <MapPin size={13} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </div>
            ) : null}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={13} aria-hidden="true" />
                {t('memberCount', { count: club.memberCount })}
              </span>
              {club.distance != null && Number.isFinite(club.distance) ? (
                <span className="truncate">
                  {t('distanceAway', {
                    distance: Math.round(club.distance * 10) / 10,
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <ClubPreviewCard club={club} />
      </HoverCardContent>
    </HoverCard>
  );
}

export default function NewsfeedDiscoveryRail({
  onAvailabilityChange,
}: NewsfeedDiscoveryRailProps) {
  const t = useTranslations('posts.discoveryRail');
  const isWideDesktop = useWideDesktop();
  const [sessions, setSessions] = useState<SectionState<SuggestedSession>>({
    status: 'loading',
    items: [],
  });
  const [clubs, setClubs] = useState<SectionState<IClubListItem>>({
    status: 'loading',
    items: [],
  });

  useEffect(() => {
    if (!isWideDesktop) return;

    let ignoreResult = false;
    const location = readUserLocationCookie();

    void SessionService.getSuggestedSessions({
      page: 1,
      limit: SUGGESTION_LIMIT,
      ...(location ?? {}),
    })
      .then((response) => {
        if (ignoreResult) return;
        const items = response.data.slice(0, SUGGESTION_LIMIT);
        setSessions({
          status: items.length > 0 ? 'ready' : 'unavailable',
          items,
        });
      })
      .catch(() => {
        if (!ignoreResult) {
          setSessions({ status: 'unavailable', items: [] });
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [isWideDesktop]);

  useEffect(() => {
    if (!isWideDesktop) return;

    let ignoreResult = false;
    const location = readUserLocationCookie();
    const preferredCity = cityCodeToApiName(readPreferredCityCookie());

    void ClubsService.browseClubs({
      page: 1,
      limit: SUGGESTION_LIMIT,
      ...(location
        ? {
            lat: location.lat,
            lng: location.lng,
            sortBy: 'distance',
            sortOrder: 'asc',
          }
        : {
            city: preferredCity,
            sortBy: 'relevance',
            sortOrder: 'desc',
          }),
    })
      .then((response) => {
        if (ignoreResult) return;
        const items = (response.items ?? []).slice(0, SUGGESTION_LIMIT);
        setClubs({
          status: items.length > 0 ? 'ready' : 'unavailable',
          items,
        });
      })
      .catch(() => {
        if (!ignoreResult) {
          setClubs({ status: 'unavailable', items: [] });
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [isWideDesktop]);

  const reportAvailability = useCallback(() => {
    if (!isWideDesktop) return;
    if (sessions.status === 'ready' || clubs.status === 'ready') {
      onAvailabilityChange(true);
      return;
    }
    if (sessions.status === 'unavailable' && clubs.status === 'unavailable') {
      onAvailabilityChange(false);
    }
  }, [clubs.status, isWideDesktop, onAvailabilityChange, sessions.status]);

  useEffect(() => {
    reportAvailability();
  }, [reportAvailability]);

  if (!isWideDesktop) {
    return <NewsfeedDiscoveryRailSkeleton />;
  }

  return (
    <div className="space-y-4">
      {sessions.status === 'loading' ? <RailSectionSkeleton /> : null}
      {sessions.status === 'ready' ? (
        <RailSection title={t('suggestedSessions')} viewAllHref={ROUTES.HOME}>
          {sessions.items.map((session) => (
            <SuggestedSessionCard key={session.id} session={session} />
          ))}
        </RailSection>
      ) : null}

      {clubs.status === 'loading' ? <RailSectionSkeleton /> : null}
      {clubs.status === 'ready' ? (
        <RailSection
          title={
            clubs.items.some((club) => club.distance != null)
              ? t('nearbyClubs')
              : t('suggestedClubs')
          }
          viewAllHref={ROUTES.CLUBS.BROWSE}
        >
          {clubs.items.map((club) => (
            <NearbyClubCard key={club.id} club={club} />
          ))}
        </RailSection>
      ) : null}
    </div>
  );
}
