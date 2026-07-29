'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex } from '@chakra-ui/react';
import {
  CalendarPlus,
  ChevronDown,
  Medal,
  Star,
  Trophy,
  UserPlus,
  Users,
  ImageIcon,
} from 'lucide-react';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import AppLightbox from '@/components/ui/AppLightbox';
import { PostAvatar } from './PostAvatar';
import type {
  Post,
  SessionResultsStanding,
  TournamentPodiumSide,
} from '@/types/post';

const MAX_STANDINGS_ROWS = 5;

const PODIUM_STYLES = [
  {
    medal: '🥇',
    badge:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500/20',
    row: 'bg-amber-50/60 dark:bg-amber-950/10',
  },
  {
    medal: '🥈',
    badge:
      'bg-gray-200 text-gray-600 border-gray-300 dark:bg-white/10 dark:text-gray-300 dark:border-white/10',
    row: 'bg-gray-50/60 dark:bg-white/5',
  },
  {
    medal: '🥉',
    badge:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-500/20',
    row: 'bg-orange-50/50 dark:bg-orange-950/10',
  },
] as const;

interface ActivityPostContentProps {
  post: Post;
}

function EntityPreviewCard({
  href,
  image,
  title,
  subtitle,
  icon,
}: {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  icon: React.ReactNode;
}) {
  const imageSrc = image ? normalizeImageUrl(image) : null;
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-green-300 group-hover:shadow-md dark:border-white/10 dark:from-gray-700/50 dark:to-gray-800/40 dark:group-hover:border-green-500/40">
        {imageSrc ? (
          <img // eslint-disable-line @next/next/no-img-element
            src={imageSrc}
            alt={title}
            className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-[1.03] dark:ring-white/10"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] dark:from-green-500 dark:to-emerald-600">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[15px] text-green-700 dark:text-green-300"
            style={{ fontWeight: 600 }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SessionStandings({
  standings,
}: {
  standings: SessionResultsStanding[];
}) {
  const t = useTranslations('posts');
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = standings.length - MAX_STANDINGS_ROWS;
  const canExpand = hiddenCount > 0;
  const visible = expanded ? standings : standings.slice(0, MAX_STANDINGS_ROWS);
  const hasWinRate = standings.some((row) => row.winRate != null);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 shadow-sm dark:border-white/10">
      <div className={expanded ? 'max-h-[360px] overflow-y-auto' : ''}>
        <table className="w-full border-separate border-spacing-0 text-[14px]">
          <thead>
            <tr className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100/70 text-left text-[11px] uppercase tracking-wide text-gray-500 backdrop-blur dark:from-gray-800 dark:to-gray-700/70 dark:text-gray-400">
              <th className="px-3 py-2.5 font-semibold">
                {t('activity.standingsRank')}
              </th>
              <th className="px-3 py-2.5 font-semibold">
                {t('activity.standingsPlayer')}
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">
                {hasWinRate
                  ? t('activity.standingsWinRate')
                  : t('activity.standingsMatches')}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const podium = PODIUM_STYLES[row.rank - 1];
              return (
                <tr
                  key={`${row.rank}-${row.playerNumber}`}
                  className={`border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 ${podium?.row ?? ''}`}
                >
                  <td className="px-3 py-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-bold shadow-sm ${
                        podium
                          ? podium.badge
                          : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'
                      }`}
                    >
                      {podium ? podium.medal : row.rank}
                    </span>
                  </td>
                  <td className="max-w-0 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PostAvatar name={row.name} size={28} />
                      <span className="truncate font-medium text-gray-900 dark:text-gray-50">
                        {row.userId ? (
                          <Link
                            href={ROUTES.USER.PROFILE(row.userId)}
                            className="hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {hasWinRate ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`inline-flex min-w-[46px] items-center justify-center rounded-full px-2 py-0.5 text-[13px] font-semibold ${
                            (row.winRate ?? 0) >= 50
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          }`}
                        >
                          {row.winRate ?? 0}%
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {t('activity.standingsMatchesShort', {
                            count: row.matchesPlayed,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[13px] font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                        {row.matchesPlayed}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-green-600 transition-colors hover:bg-green-50 dark:border-white/5 dark:bg-gray-700/40 dark:text-green-300 dark:hover:bg-green-950/20"
        >
          {expanded
            ? t('activity.showLess')
            : t('activity.andMorePlayers', { count: hiddenCount })}
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}

function PodiumNames({ side }: { side: TournamentPodiumSide }) {
  const players = side.players ?? [];
  return (
    <span className="font-semibold text-gray-900 dark:text-gray-50">
      {players.map((player, index) => (
        <span key={`${player.name}-${index}`}>
          {index > 0 && ' & '}
          {player.userId ? (
            <Link
              href={ROUTES.USER.PROFILE(player.userId)}
              className="text-green-700 hover:underline dark:text-green-300"
            >
              {player.name}
            </Link>
          ) : (
            player.name
          )}
        </span>
      ))}
    </span>
  );
}

function AvatarUpdatedImage({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Box mt={3.5}>
      <div className="flex justify-center bg-gray-100 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="cursor-zoom-in"
          aria-label={alt}
        >
          <img // eslint-disable-line @next/next/no-img-element
            src={src}
            alt={alt}
            className="max-h-[420px] w-auto object-contain"
            loading="lazy"
          />
        </button>
      </div>
      {isOpen && (
        <AppLightbox
          images={[src]}
          alt={alt}
          onClose={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
}

export function ActivityPostContent({ post }: ActivityPostContentProps) {
  const t = useTranslations('posts');
  const metadata = post.metadata ?? {};
  const authorName = post.author?.name ?? '';

  if (!post.activityType) return null;

  const headline = (
    <Box
      px={4}
      pt={2.5}
      fontSize="15px"
      lineHeight="1.6"
      color="gray.700"
      _dark={{ color: 'gray.200' }}
    >
      {t.rich(`activity.${post.activityType}`, {
        author: authorName,
        club: metadata.clubName ?? '',
        tournament: metadata.tournamentName ?? '',
        session: metadata.sessionName ?? '',
        rated: metadata.ratedName ?? '',
        b: (chunks) => (
          <b
            className="text-green-700 dark:text-green-300"
            style={{ fontWeight: 700 }}
          >
            {chunks}
          </b>
        ),
      })}
    </Box>
  );

  switch (post.activityType) {
    case 'SESSION_CREATED':
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.SESSIONS.DETAIL(
                metadata.sessionId ?? '',
                metadata.sessionSlug ?? undefined
              )}
              image={metadata.coverPhoto}
              title={metadata.sessionName ?? ''}
              subtitle={metadata.location}
              icon={<CalendarPlus size={24} />}
            />
          </Box>
        </>
      );

    case 'SESSION_RESULTS': {
      const standings = metadata.standings ?? [];
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <SessionStandings standings={standings} />
          </Box>
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.SESSIONS.DETAIL(
                metadata.sessionId ?? '',
                metadata.sessionSlug ?? undefined
              )}
              image={metadata.coverPhoto}
              title={metadata.sessionName ?? ''}
              icon={<Medal size={24} />}
            />
          </Box>
        </>
      );
    }

    case 'CLUB_CREATED':
    case 'CLUB_UPDATED':
    case 'CLUB_MEMBER_JOINED':
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.CLUBS.DETAIL(metadata.clubId ?? '')}
              image={metadata.logo}
              title={metadata.clubName ?? ''}
              icon={
                post.activityType === 'CLUB_MEMBER_JOINED' ? (
                  <UserPlus size={24} />
                ) : (
                  <Users size={24} />
                )
              }
            />
          </Box>
        </>
      );

    case 'TOURNAMENT_CREATED':
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.TOURNAMENT.DETAIL(
                metadata.tournamentSlug ?? metadata.tournamentId ?? ''
              )}
              image={metadata.coverPhoto}
              title={metadata.tournamentName ?? ''}
              subtitle={metadata.venueName}
              icon={<Trophy size={24} />}
            />
          </Box>
        </>
      );

    case 'TOURNAMENT_FINISHED': {
      const categories = metadata.categories ?? [];
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <Flex direction="column" gap={2}>
              {categories.map((category) => (
                <div
                  key={category.categoryId}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-950/20"
                >
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    {category.categoryName}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-200">
                    <span aria-hidden="true">🏆</span>
                    <span>{t('activity.champion')}:</span>
                    <PodiumNames side={category.champion} />
                  </div>
                  {category.runnerUp && (
                    <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-200">
                      <span aria-hidden="true">🥈</span>
                      <span>{t('activity.runnerUp')}:</span>
                      <PodiumNames side={category.runnerUp} />
                    </div>
                  )}
                </div>
              ))}
            </Flex>
          </Box>
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.TOURNAMENT.DETAIL(
                metadata.tournamentSlug ?? metadata.tournamentId ?? ''
              )}
              title={metadata.tournamentName ?? ''}
              icon={<Trophy size={24} />}
            />
          </Box>
        </>
      );
    }

    case 'AVATAR_UPDATED': {
      const imageSrc = metadata.image
        ? normalizeImageUrl(metadata.image)
        : null;
      return (
        <>
          {headline}
          {imageSrc ? (
            <AvatarUpdatedImage
              src={imageSrc}
              alt={t('activity.AVATAR_UPDATED', { author: authorName })}
            />
          ) : (
            <Box px={4} pt={3} color="gray.400">
              <ImageIcon size={20} />
            </Box>
          )}
        </>
      );
    }

    case 'USER_RATED':
      return (
        <>
          {headline}
          {metadata.ratedUserId && (
            <Box px={4} pt={3}>
              <EntityPreviewCard
                href={ROUTES.USER.PROFILE(metadata.ratedUserId)}
                image={metadata.ratedImage}
                title={metadata.ratedName ?? ''}
                icon={<Star size={24} />}
              />
            </Box>
          )}
        </>
      );

    default:
      return headline;
  }
}
