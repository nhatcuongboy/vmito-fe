'use client';

import { useTranslations } from 'next-intl';
import { Box, Flex } from '@chakra-ui/react';
import {
  CalendarPlus,
  Medal,
  Star,
  Trophy,
  UserPlus,
  Users,
  ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import type { Post, TournamentPodiumSide } from '@/types/post';

const MAX_STANDINGS_ROWS = 5;

interface ActivityPostContentProps {
  post: Post;
}

function EntityPreviewCard({
  href,
  image,
  title,
  subtitle,
  actionLabel,
  icon,
}: {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  actionLabel: string;
  icon: React.ReactNode;
}) {
  const imageSrc = image ? normalizeImageUrl(image) : null;
  return (
    <Link href={href} className="block transition hover:opacity-95">
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-700/40">
        {imageSrc ? (
          <img // eslint-disable-line @next/next/no-img-element
            src={imageSrc}
            alt={title}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-50">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">
              {subtitle}
            </div>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-green-600 dark:text-green-400">
          {actionLabel}
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
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
      {t(`activity.${post.activityType}`, {
        author: authorName,
        club: metadata.clubName ?? '',
        tournament: metadata.tournamentName ?? '',
        session: metadata.sessionName ?? '',
        rated: metadata.ratedName ?? '',
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
              href={ROUTES.BROWSE.SESSIONS.DETAIL(
                metadata.sessionId ?? '',
                metadata.sessionSlug ?? undefined
              )}
              image={metadata.coverPhoto}
              title={metadata.sessionName ?? ''}
              subtitle={metadata.location}
              actionLabel={t('activity.viewSession')}
              icon={<CalendarPlus size={24} />}
            />
          </Box>
        </>
      );

    case 'SESSION_RESULTS': {
      const standings = metadata.standings ?? [];
      const visible = standings.slice(0, MAX_STANDINGS_ROWS);
      const hiddenCount = standings.length - visible.length;
      const medals = ['🥇', '🥈', '🥉'];
      return (
        <>
          {headline}
          <Box px={4} pt={3}>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-[12px] uppercase tracking-wide text-gray-500 dark:bg-gray-700/40 dark:text-gray-400">
                    <th className="px-3 py-2 font-semibold">
                      {t('activity.standingsRank')}
                    </th>
                    <th className="px-3 py-2 font-semibold">
                      {t('activity.standingsPlayer')}
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      {t('activity.standingsMatches')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={`${row.rank}-${row.playerNumber}`}
                      className="border-t border-gray-100 dark:border-white/5"
                    >
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
                        {medals[row.rank - 1] ?? row.rank}
                      </td>
                      <td className="max-w-0 truncate px-3 py-2 text-gray-900 dark:text-gray-50">
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
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                        {row.matchesPlayed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hiddenCount > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-center text-[13px] text-gray-500 dark:border-white/5 dark:bg-gray-700/40 dark:text-gray-400">
                  {t('activity.andMorePlayers', { count: hiddenCount })}
                </div>
              )}
            </div>
          </Box>
          <Box px={4} pt={3}>
            <EntityPreviewCard
              href={ROUTES.BROWSE.SESSIONS.DETAIL(
                metadata.sessionId ?? '',
                metadata.sessionSlug ?? undefined
              )}
              image={metadata.coverPhoto}
              title={metadata.sessionName ?? ''}
              actionLabel={t('activity.viewSession')}
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
              actionLabel={t('activity.viewClub')}
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
              actionLabel={t('activity.viewTournament')}
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
              actionLabel={t('activity.viewTournament')}
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
            <Box mt={3.5}>
              <div className="flex justify-center bg-gray-100 dark:bg-gray-900">
                <img // eslint-disable-line @next/next/no-img-element
                  src={imageSrc}
                  alt={t('activity.AVATAR_UPDATED', { author: authorName })}
                  className="max-h-[420px] w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </Box>
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
                actionLabel={t('activity.viewProfile')}
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
