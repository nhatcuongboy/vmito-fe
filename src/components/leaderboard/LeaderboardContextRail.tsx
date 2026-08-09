'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Avatar, Skeleton } from '@chakra-ui/react';
import { CircleHelp, Swords, Trophy } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import type {
  ILeaderboardEntry,
  IUserAchievements,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import { RankingService } from '@/lib/api/ranking.service';
import TierBadge, { TIER_COLORS } from './TierBadge';
import PointsRulesModal from './PointsRulesModal';
import {
  RANKING_TIERS,
  SESSION_POINT_RULES,
  TOURNAMENT_POINT_RULES,
} from './points-config';

const WIDE_DESKTOP_QUERY = '(min-width: 90rem)';

interface LeaderboardContextRailProps {
  currentEntry?: ILeaderboardEntry;
  isCurrentPeriod: boolean;
  period: TLeaderboardPeriod;
  user?: {
    id: string;
    image?: string | null;
    name: string | null;
  } | null;
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

function ProgressCardSkeleton() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <Skeleton height="18px" width="120px" borderRadius="md" />
      <div className="mt-4 flex items-center gap-3">
        <Skeleton height="48px" width="48px" borderRadius="full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height="15px" width="70%" borderRadius="md" />
          <Skeleton height="18px" width="48%" borderRadius="full" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton height="64px" borderRadius="lg" />
        <Skeleton height="64px" borderRadius="lg" />
      </div>
      <Skeleton mt={4} height="8px" borderRadius="full" />
    </section>
  );
}

function PersonalProgressCard({
  achievements,
  currentEntry,
  isCurrentPeriod,
  period,
  user,
}: {
  achievements: IUserAchievements;
  currentEntry?: ILeaderboardEntry;
  isCurrentPeriod: boolean;
  period: TLeaderboardPeriod;
  user: NonNullable<LeaderboardContextRailProps['user']>;
}) {
  const t = useTranslations('leaderboard');
  const railT = useTranslations('leaderboard.rail');
  const format = useFormatter();
  const achievementRank = isCurrentPeriod
    ? achievements.ranks.find((rank) => rank.period === period)
    : undefined;
  const rank = currentEntry?.rank ?? achievementRank?.rank ?? null;
  const periodPoints = currentEntry?.points ?? achievementRank?.points ?? null;
  const showHistoricalUnavailable =
    !isCurrentPeriod && currentEntry === undefined;
  const tierColor = TIER_COLORS[achievements.tier];
  const currentTierMinimum =
    RANKING_TIERS.find(({ tier }) => tier === achievements.tier)?.minPoints ??
    0;
  const tierTarget = achievements.nextTier
    ? achievements.totalPoints + achievements.nextTier.pointsToNext
    : achievements.totalPoints;
  const tierSpan = Math.max(1, tierTarget - currentTierMinimum);
  const progress = achievements.nextTier
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            ((achievements.totalPoints - currentTierMinimum) / tierSpan) * 100
          )
        )
      )
    : 100;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-50">
        {railT('yourProgress')}
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <Avatar.Root size="lg" flexShrink={0}>
          <Avatar.Fallback name={user.name ?? ''} />
          {user.image ? <Avatar.Image src={user.image} /> : null}
        </Avatar.Root>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            {user.name}
          </div>
          <div className="mt-1">
            <TierBadge tier={achievements.tier} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-white/5">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {railT('periodRank', { period: t(`periods.${period}`) })}
          </div>
          <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-50">
            {rank ? railT('rankValue', { rank }) : '—'}
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-white/5">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {railT('periodPoints')}
          </div>
          <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-50">
            {periodPoints == null ? '—' : format.number(periodPoints)}
          </div>
        </div>
      </div>

      {showHistoricalUnavailable ? (
        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {railT('historicalRankUnavailable')}
        </p>
      ) : null}

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {achievements.nextTier
              ? railT('toNextTier', {
                  points: achievements.nextTier.pointsToNext,
                  tier: t(`tiers.${achievements.nextTier.nextTier}`),
                })
              : railT('highestTier')}
          </span>
          <span className="shrink-0 font-semibold text-gray-700 dark:text-gray-200">
            {progress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            role="progressbar"
            aria-label={railT('tierProgressLabel')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%`, backgroundColor: tierColor.solid }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {railT('totalPoints', {
            points: format.number(achievements.totalPoints),
          })}
        </div>
      </div>
    </section>
  );
}

function EarningPointsCard({
  isAuthenticated,
  onOpenRules,
}: {
  isAuthenticated: boolean;
  onOpenRules: () => void;
}) {
  const t = useTranslations('leaderboard');
  const railT = useTranslations('leaderboard.rail');
  const highlights = [
    SESSION_POINT_RULES[3],
    SESSION_POINT_RULES[0],
    TOURNAMENT_POINT_RULES[0],
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" aria-hidden="true" />
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-50">
          {railT('howToEarn')}
        </h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {railT('howToEarnDescription')}
      </p>

      <div className="mt-3 divide-y divide-gray-100 dark:divide-white/10">
        {highlights.map((rule) => (
          <div
            key={rule.reason}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0 text-gray-700 dark:text-gray-200">
              {t(`achievements.reasons.${rule.reason}`)}
            </span>
            <span className="shrink-0 font-bold text-green-600 dark:text-green-400">
              +{rule.points}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenRules}
        className="mt-3 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-green-200 px-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
      >
        <CircleHelp size={16} aria-hidden="true" />
        {t('rules.trigger')}
      </button>

      {!isAuthenticated ? (
        <Link
          href={ROUTES.HOME}
          className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          <Swords size={16} aria-hidden="true" />
          {railT('findSessions')}
        </Link>
      ) : null}
    </section>
  );
}

export default function LeaderboardContextRail({
  currentEntry,
  isCurrentPeriod,
  period,
  user,
}: LeaderboardContextRailProps) {
  const isWideDesktop = useWideDesktop();
  const [achievements, setAchievements] = useState<IUserAchievements | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    if (!isWideDesktop || !user?.id) return;

    let ignoreResult = false;
    setIsLoading(true);
    void RankingService.getUserAchievements(user.id)
      .then((result) => {
        if (!ignoreResult) setAchievements(result);
      })
      .catch(() => {
        if (!ignoreResult) setAchievements(null);
      })
      .finally(() => {
        if (!ignoreResult) setIsLoading(false);
      });

    return () => {
      ignoreResult = true;
    };
  }, [isWideDesktop, user?.id]);

  return (
    <>
      <div className="space-y-4">
        {user && isLoading ? <ProgressCardSkeleton /> : null}
        {user && !isLoading && achievements ? (
          <PersonalProgressCard
            achievements={achievements}
            currentEntry={currentEntry}
            isCurrentPeriod={isCurrentPeriod}
            period={period}
            user={user}
          />
        ) : null}
        <EarningPointsCard
          isAuthenticated={Boolean(user)}
          onOpenRules={() => setIsRulesOpen(true)}
        />
      </div>
      <PointsRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </>
  );
}
