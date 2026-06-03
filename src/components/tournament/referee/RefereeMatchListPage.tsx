'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Text, Badge, Heading } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { Gavel, ChevronRight } from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  MatchStatus,
  Tournament,
  UserRole,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

const STATUS_ORDER: MatchStatus[] = [
  'IN_PROGRESS',
  'SCHEDULED',
  'FINISHED',
  'CANCELLED',
] as MatchStatus[];

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: 'green',
  SCHEDULED: 'blue',
  FINISHED: 'gray',
  CANCELLED: 'red',
};

export default function RefereeMatchListPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const t = useTranslations('pages.tournaments.scoreEntry');
  const tGuard = useTranslations('auth.guard');
  const { user } = useAuthStore();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(true);

  const load = useCallback(async () => {
    try {
      const tour = await TournamentService.getTournament(tournamentParam);
      setTournament(tour);
      const canManageTournament =
        user?.id === tour.hostId || user?.role === UserRole.ADMIN;
      const canAccessRefereeArea =
        canManageTournament || user?.role === UserRole.REFEREE;
      setCanAccess(canAccessRefereeArea);
      if (!canAccessRefereeArea) {
        setMatches([]);
        return;
      }
      const refereeMatches = canManageTournament
        ? await TournamentService.getAllMatches(tour.id)
        : await CategoryService.getMyAssignments(tour.id);
      setMatches(refereeMatches);
    } finally {
      setLoading(false);
    }
  }, [tournamentParam, user?.id, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reflect matches starting/ending live without a manual refresh.
  useTournamentSocket(tournament?.id, {
    onMatchStarted: () => void load(),
    onMatchEnded: () => void load(),
    onReconnect: () => void load(),
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: matches.filter((m) => m.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <PageLayout title={t('title')}>
      {loading ? (
        <TournamentMatchListSkeleton count={6} />
      ) : !canAccess ? (
        <Flex direction="column" align="center" py={16} gap={3}>
          <Gavel size={40} opacity={0.4} />
          <Text fontWeight="semibold">{tGuard('accessDenied')}</Text>
          <Text color="gray.500">{tGuard('permissionDenied')}</Text>
        </Flex>
      ) : matches.length === 0 ? (
        <Flex direction="column" align="center" py={16} gap={3}>
          <Gavel size={40} opacity={0.4} />
          <Text color="gray.500">{t('noAssignedMatches')}</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap={6}>
          {grouped.map((group) => (
            <Box key={group.status}>
              <Heading
                size="sm"
                mb={3}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {t(`status.${group.status}`)}
              </Heading>
              <VStack align="stretch" gap={2}>
                {group.items.map((match) => (
                  <Link
                    key={match.id}
                    href={`/tournament/${tournamentParam}/referee/${match.id}`}
                  >
                    <Flex
                      p={4}
                      align="center"
                      gap={3}
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderWidth="1px"
                      borderColor="gray.100"
                      borderRadius="xl"
                      _hover={{ borderColor: 'blue.300' }}
                      transition="border-color 0.15s"
                    >
                      <Box flex="1" minW={0}>
                        <Flex align="center" gap={2} mb={1}>
                          <Badge colorPalette={STATUS_COLOR[match.status]}>
                            {t(`status.${match.status}`)}
                          </Badge>
                          {match.court && (
                            <Text fontSize="sm" color="gray.500">
                              {t('court')} {match.court.courtNumber}
                            </Text>
                          )}
                          <Text fontSize="sm" color="gray.500" truncate>
                            {match.round}
                          </Text>
                        </Flex>
                        <Text fontWeight="semibold" truncate>
                          {getTeamLabel(match, 1)}
                          <Text as="span" color="gray.400" mx={2}>
                            {t('vs')}
                          </Text>
                          {getTeamLabel(match, 2)}
                        </Text>
                        {match.score && (
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            {match.score}
                          </Text>
                        )}
                      </Box>
                      <ChevronRight size={18} opacity={0.5} />
                    </Flex>
                  </Link>
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </PageLayout>
  );
}
