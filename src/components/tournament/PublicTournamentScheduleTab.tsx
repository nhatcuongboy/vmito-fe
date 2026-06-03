'use client';

import { useEffect, useState } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryMatch,
  Tournament,
  TournamentCourt,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import ScheduleListView from '@/components/tournament/manage/panels/schedule/ScheduleListView';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface PublicTournamentScheduleTabProps {
  tournament: Tournament;
}

export default function PublicTournamentScheduleTab({
  tournament,
}: PublicTournamentScheduleTabProps) {
  const t = useTranslations('pages.tournaments.detail');
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [matchesData, categoriesData, courtsData] = await Promise.all([
          TournamentService.getAllMatches(tournament.id),
          CategoryService.getCategories(tournament.id),
          TournamentService.getCourts(tournament.id),
        ]);
        if (cancelled) return;
        setMatches(matchesData);
        setCategories(categoriesData);
        setCourts(courtsData);
      } catch (error) {
        console.error('Error loading schedule:', error);
        if (!cancelled) {
          setMatches([]);
          setCategories([]);
          setCourts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tournament.id]);

  const scheduledMatches = matches.filter((m) => m.startTime && m.courtId);

  return (
    <Box>
      <Heading size="md" mb={4}>
        {t('tabs.schedule')}
      </Heading>
      {isLoading ? (
        <TournamentMatchListSkeleton count={5} />
      ) : scheduledMatches.length === 0 ? (
        <Text color="fg.muted">{t('scheduleTab.empty')}</Text>
      ) : (
        <ScheduleListView
          matches={scheduledMatches}
          categories={categories}
          courts={courts}
          tournamentId={tournament.slug ?? tournament.id}
          courtAbbreviation={
            tournament.venue?.acronym ?? tournament.venue?.name
          }
        />
      )}
    </Box>
  );
}
