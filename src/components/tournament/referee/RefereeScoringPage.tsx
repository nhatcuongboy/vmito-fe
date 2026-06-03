'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, Tournament, UserRole } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import ScoreEntryBoard from './ScoreEntryBoard';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

export default function RefereeScoringPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const matchId = String(params?.matchId ?? '');
  const t = useTranslations('pages.tournaments.scoreEntry');
  const tGuard = useTranslations('auth.guard');
  const router = useRouter();
  const { user } = useAuthStore();

  const [match, setMatch] = useState<CategoryMatch | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [m, tour] = await Promise.all([
          CategoryService.getMatch(matchId),
          TournamentService.getTournament(tournamentParam),
        ]);
        if (!active) return;
        setMatch(m);
        setTournament(tour);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId, tournamentParam]);

  const canAccess =
    !!tournament &&
    (user?.id === tournament.hostId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.REFEREE);

  const handleStart = useCallback(async () => {
    setStarting(true);
    try {
      const resp = await CategoryService.startMatch(matchId);
      setMatch(resp);
    } finally {
      setStarting(false);
    }
  }, [matchId]);

  const goBack = () => router.push(`/tournament/${tournamentParam}/referee`);

  if (loading) {
    return (
      <Box minH="100dvh" bg="gray.50" p={4} _dark={{ bg: 'gray.900' }}>
        <TournamentMatchListSkeleton count={4} />
      </Box>
    );
  }

  if (!match || !tournament) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100dvh"
        gap={3}
      >
        <Text color="gray.500">{t('matchNotFound')}</Text>
        <Button onClick={goBack}>{t('back')}</Button>
      </Flex>
    );
  }

  if (!canAccess) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100dvh"
        gap={3}
        px={4}
        textAlign="center"
      >
        <Text fontWeight="semibold">{tGuard('accessDenied')}</Text>
        <Text color="gray.500">{tGuard('permissionDenied')}</Text>
        <Button onClick={goBack}>{t('back')}</Button>
      </Flex>
    );
  }

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);

  return (
    <Box minH="100dvh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Flex align="center" gap={2} px={4} py={3}>
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft size={18} />
        </Button>
        <Text fontWeight="semibold" truncate>
          {team1} {t('vs')} {team2}
        </Text>
        {match.court && (
          <Badge colorPalette="blue" ml="auto">
            {t('court')} {match.court.courtNumber}
          </Badge>
        )}
      </Flex>

      {match.status === 'SCHEDULED' && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={6}
          py={20}
        >
          <Heading size="md" textAlign="center">
            {team1} {t('vs')} {team2}
          </Heading>
          <Button
            colorPalette="green"
            size="lg"
            onClick={() => void handleStart()}
            loading={starting}
          >
            <Play size={20} /> {t('startMatch')}
          </Button>
        </Flex>
      )}

      {match.status === 'IN_PROGRESS' && (
        <ScoreEntryBoard
          match={match}
          tournamentId={tournament.id}
          onMatchUpdate={setMatch}
        />
      )}

      {(match.status === 'FINISHED' || match.status === 'CANCELLED') && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          py={20}
        >
          <Trophy size={48} color="#ECC94B" />
          <Heading size="md">{t('finalResult')}</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            {match.score || '—'}
          </Text>
          <Flex gap={2} wrap="wrap" justify="center">
            {(match.sets ?? []).map((s, i) => (
              <Badge key={i} colorPalette="gray" fontSize="sm">
                {s.player1Score}-{s.player2Score}
              </Badge>
            ))}
          </Flex>
          <Button variant="outline" onClick={goBack}>
            {t('back')}
          </Button>
        </Flex>
      )}
    </Box>
  );
}
