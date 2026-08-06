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
import { AppSportBadge } from '@/components/common/AppSportBadge';
import { PostAvatar } from './PostAvatar';
import type {
  Post,
  SessionResultsStanding,
  TournamentPodiumSide,
} from '@/types/post';
import type { SportType } from '@/lib/api/types';

const MAX_STANDINGS_ROWS = 3;

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
  sportType,
}: {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  icon: React.ReactNode;
  sportType?: SportType | null;
}) {
  const imageSrc = image ? normalizeImageUrl(image) : null;
  return (
    <Link href={href} className="group block">
      <div
        className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-green-300 group-hover:shadow-md dark:border-white/10 dark:from-gray-700/50 dark:to-gray-800/40 dark:group-hover:border-green-500/40"
        style={{ padding: 12 }}
      >
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
          <div className="flex items-center gap-1.5">
            <div
              className="truncate text-[15px] text-green-700 dark:text-green-300"
              style={{ fontWeight: 600 }}
            >
              {title}
            </div>
            {sportType && <AppSportBadge sportType={sportType} iconOnly />}
          </div>
          {subtitle && (
            <div
              className="truncate text-[13px] text-gray-500 dark:text-gray-400"
              style={{ marginTop: 2 }}
            >
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
        <table
          className="w-full border-separate border-spacing-0"
          style={{ fontSize: 14 }}
        >
          <thead>
            <tr className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100/70 text-left text-[11px] uppercase tracking-wide text-gray-500 backdrop-blur dark:from-gray-800 dark:to-gray-700/70 dark:text-gray-400">
              <th
                style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12 }}
              >
                {t('activity.standingsRank')}
              </th>
              <th
                style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12 }}
              >
                {t('activity.standingsPlayer')}
              </th>
              <th
                className="text-right"
                style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12 }}
              >
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
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{ fontWeight: 700, fontSize: 15 }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${
                        podium
                          ? podium.badge
                          : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PostAvatar name={row.name} image={row.image} size={28} />
                      <span
                        className="min-w-0 flex-1 break-words text-gray-900 dark:text-gray-50"
                        style={{ fontWeight: 500, fontSize: 15 }}
                      >
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
                  <td className="text-right" style={{ padding: '8px 12px' }}>
                    {hasWinRate ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          style={{
                            padding: '2px 8px',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                          className={`inline-flex min-w-[46px] items-center justify-center rounded-full ${
                            (row.winRate ?? 0) >= 50
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          }`}
                        >
                          {row.winRate ?? 0}%
                        </span>
                        <span
                          className="text-gray-400 dark:text-gray-500"
                          style={{ fontSize: 12 }}
                        >
                          {t('activity.standingsMatchesShort', {
                            count: row.matchesPlayed,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                        style={{
                          padding: '2px 8px',
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
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
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50 text-green-600 transition-colors hover:bg-green-50 dark:border-white/5 dark:bg-gray-700/40 dark:text-green-300 dark:hover:bg-green-950/20"
          style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}
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
    <span
      className="text-gray-900 dark:text-gray-50"
      style={{ fontWeight: 600 }}
    >
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
              sportType={metadata.sportType}
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
              sportType={metadata.sportType}
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
              sportType={metadata.sportType}
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
                  className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/20"
                  style={{ padding: 12 }}
                >
                  <div
                    className="text-[13px] uppercase tracking-wide text-amber-700 dark:text-amber-300"
                    style={{ fontWeight: 600 }}
                  >
                    {category.categoryName}
                  </div>
                  <div
                    className="flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-200"
                    style={{ marginTop: 6 }}
                  >
                    <span aria-hidden="true">🏆</span>
                    <span>{t('activity.champion')}:</span>
                    <PodiumNames side={category.champion} />
                  </div>
                  {category.runnerUp && (
                    <div
                      className="flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-200"
                      style={{ marginTop: 4 }}
                    >
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
              sportType={metadata.sportType}
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

    case 'COVER_PHOTO_UPDATED': {
      const coverSrc = metadata.coverPhoto
        ? normalizeImageUrl(metadata.coverPhoto)
        : null;
      return (
        <>
          {headline}
          {coverSrc ? (
            <AvatarUpdatedImage
              src={coverSrc}
              alt={t('activity.COVER_PHOTO_UPDATED', { author: authorName })}
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
