'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { Category, CategoryMatch, Tournament } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import ManualScoreModal from './ManualScoreModal';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface Props {
  tournament: Tournament;
  categories: Category[];
  /** When false, results are read-only (no score entry). Defaults to true. */
  canEdit?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: 'green',
  SCHEDULED: 'blue',
  FINISHED: 'gray',
  CANCELLED: 'red',
};

export default function ResultsPanel({
  tournament,
  categories,
  canEdit = true,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');

  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CategoryMatch | null>(null);

  const load = useCallback(async () => {
    const all = await TournamentService.getAllMatches(tournament.id);
    setMatches(all);
  }, [tournament.id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const catName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const groups = useMemo(() => {
    const byCat = new Map<string, CategoryMatch[]>();
    for (const m of matches) {
      if (!byCat.has(m.categoryId)) byCat.set(m.categoryId, []);
      byCat.get(m.categoryId)!.push(m);
    }
    return Array.from(byCat.entries()).map(([categoryId, items]) => ({
      categoryId,
      name: catName.get(categoryId) ?? '',
      items: items.sort((a, b) => a.matchNumber - b.matchNumber),
    }));
  }, [matches, catName]);

  if (loading) {
    return <TournamentMatchListSkeleton count={6} />;
  }

  return (
    <Box>
      <Heading size="md" mb={1}>
        {t('panelTitle')}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={5}>
        {t('panelDescription')}
      </Text>

      {matches.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          {t('noMatches')}
        </Text>
      ) : (
        <VStack align="stretch" gap={6}>
          {groups.map((group) => (
            <Box key={group.categoryId}>
              <Heading
                size="sm"
                mb={2}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {group.name}
              </Heading>
              <VStack align="stretch" gap={2}>
                {group.items.map((m) => {
                  const finished = m.status === 'FINISHED';
                  return (
                    <Flex
                      key={m.id}
                      align="center"
                      gap={3}
                      p={3}
                      borderWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: 'gray.700' }}
                      borderRadius="lg"
                    >
                      <Box flex="1" minW={0}>
                        <Flex gap={2} align="center" mb={1}>
                          <Badge
                            colorPalette={STATUS_COLOR[m.status] ?? 'gray'}
                            fontSize="xs"
                          >
                            {t(`status.${m.status}`)}
                          </Badge>
                          {m.court && (
                            <Text fontSize="xs" color="gray.500">
                              {t('court')} {m.court.courtNumber}
                            </Text>
                          )}
                          <Text fontSize="xs" color="gray.500" truncate>
                            {getRoundDisplayLabel(m.round, tRounds)}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" truncate>
                          {getTeamLabel(m, 1)} {t('vs')} {getTeamLabel(m, 2)}
                        </Text>
                      </Box>

                      {finished || !canEdit ? (
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          whiteSpace="nowrap"
                        >
                          {m.score || '—'}
                        </Text>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(m)}
                        >
                          <Pencil size={14} /> {t('enterResult')}
                        </Button>
                      )}
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}

      {canEdit && (
        <ManualScoreModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          match={selected}
          onSaved={() => void load()}
        />
      )}
    </Box>
  );
}
