'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import AppEmptyState from '@/components/ui/AppEmptyState';
import LeaderboardSkeleton from '@/components/leaderboard/LeaderboardSkeleton';
import PeriodCountdown from '@/components/leaderboard/PeriodCountdown';
import PeriodSelect from '@/components/leaderboard/PeriodSelect';
import PeriodTabs from '@/components/leaderboard/PeriodTabs';
import PodiumCard from '@/components/leaderboard/PodiumCard';
import PointsRulesModal from '@/components/leaderboard/PointsRulesModal';
import RankRow from '@/components/leaderboard/RankRow';
import LeaderboardContextRail from '@/components/leaderboard/LeaderboardContextRail';
import { LEADERBOARD_TABS } from '@/components/leaderboard/periods';
import {
  ILeaderboardResponse,
  RankingService,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';

const PAGE_SIZE = 20;
const PODIUM_ORDER = [1, 0, 2]; // display 2nd, 1st, 3rd

export default function LeaderboardContent() {
  const t = useTranslations('leaderboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();

  const [data, setData] = useState<ILeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const periodParam = searchParams.get('period') as TLeaderboardPeriod | null;
  const period =
    periodParam && LEADERBOARD_TABS.includes(periodParam)
      ? periodParam
      : 'week';
  const periodKey = period === 'all' ? null : searchParams.get('periodKey');
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const updateQuery = useCallback(
    (next: {
      period?: TLeaderboardPeriod;
      periodKey?: string | null;
      page?: number;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await RankingService.getLeaderboard({
        period,
        periodKey: periodKey ?? undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, periodKey, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const goToProfile = (userId: string) => router.push(`/user/${userId}`);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const podium = page === 1 ? entries.slice(0, 3) : [];
  const rest = page === 1 ? entries.slice(3) : entries;
  const currentEntry = entries.find(
    (entry) => entry.user.id === currentUser?.id
  );

  return (
    <PageLayout title={t('title')} maxW="1032px">
      <div
        data-slot="leaderboard-context-layout"
        className="mx-auto w-full max-w-[640px] min-[1440px]:grid min-[1440px]:max-w-[984px] min-[1440px]:grid-cols-[minmax(0,640px)_320px] min-[1440px]:items-start min-[1440px]:gap-6"
      >
        <div data-slot="leaderboard-main-column" className="min-w-0">
          <VStack align="stretch" gap={3}>
            <PeriodTabs
              items={LEADERBOARD_TABS.map((p) => ({
                id: p,
                label: t(`periods.${p}`),
              }))}
              activeId={period}
              onChange={(id) =>
                updateQuery({
                  period: id as TLeaderboardPeriod,
                  periodKey: null,
                  page: 1,
                })
              }
            />

            {period !== 'all' && (
              <Flex align="center" justify="space-between" gap={3}>
                <PeriodSelect
                  period={period}
                  periodKey={periodKey}
                  onChange={(option) =>
                    updateQuery({
                      periodKey: option.isCurrent ? null : option.key,
                      page: 1,
                    })
                  }
                />
                <PeriodCountdown
                  endsAt={data?.periodEnd ?? null}
                  isCurrent={data?.isCurrentPeriod ?? true}
                  onOpenRules={() => setIsRulesOpen(true)}
                />
              </Flex>
            )}
          </VStack>

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : entries.length === 0 ? (
            <Flex justify="center" pt={10} pb={16}>
              <AppEmptyState
                icon={
                  <Trophy size={36} color="var(--chakra-colors-green-500)" />
                }
                title={t('empty')}
                description={t('emptyDescription')}
                maxW="420px"
                bg="linear-gradient(180deg, rgba(23,154,59,0.06) 0%, rgba(23,154,59,0.02) 100%)"
                borderColor="green.100"
              />
            </Flex>
          ) : (
            <VStack align="stretch" gap={4} pt={4} pb={8}>
              {podium.length > 0 && (
                <Flex
                  justify="center"
                  align="flex-end"
                  gap={{ base: 1.5, sm: 3 }}
                  pt={2}
                >
                  {PODIUM_ORDER.filter((i) => podium[i]).map((i) => (
                    <PodiumCard
                      key={podium[i].user.id}
                      entry={podium[i]}
                      isChampion={i === 0}
                      period={period}
                      onClick={() => goToProfile(podium[i].user.id)}
                    />
                  ))}
                </Flex>
              )}

              <VStack align="stretch" gap={2}>
                {rest.map((entry) => (
                  <RankRow
                    key={entry.user.id}
                    entry={entry}
                    isMe={entry.user.id === currentUser?.id}
                    onClick={() => goToProfile(entry.user.id)}
                  />
                ))}
              </VStack>

              {(data?.totalPages ?? 1) > 1 && (
                <HStack justify="center" pt={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => updateQuery({ page: page - 1 })}
                  >
                    {t('previous')}
                  </Button>
                  <Text fontSize="sm" color="fg.muted">
                    {page} / {data?.totalPages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= (data?.totalPages ?? 1)}
                    onClick={() => updateQuery({ page: page + 1 })}
                  >
                    {t('next')}
                  </Button>
                </HStack>
              )}
            </VStack>
          )}
        </div>

        <aside
          data-slot="leaderboard-context-rail"
          aria-label={t('rail.ariaLabel')}
          className="sticky top-[72px] hidden self-start min-[1440px]:block"
        >
          <LeaderboardContextRail
            currentEntry={currentEntry}
            isCurrentPeriod={data?.isCurrentPeriod ?? periodKey === null}
            period={period}
            user={currentUser}
          />
        </aside>
      </div>
      <PointsRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </PageLayout>
  );
}
