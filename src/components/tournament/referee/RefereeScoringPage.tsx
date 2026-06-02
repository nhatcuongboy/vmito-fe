'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Text, Heading, Spinner, Badge } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import ScoreEntryBoard from './ScoreEntryBoard';

export default function RefereeScoringPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const matchId = String(params?.matchId ?? '');
  const t = useTranslations('pages.tournaments.scoreEntry');
  const router = useRouter();

  const [match, setMatch] = useState<CategoryMatch | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
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
        setTournamentId(tour.id);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId, tournamentParam]);

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
      <Flex justify="center" align="center" minH="100dvh">
        <Spinner />
      </Flex>
    );
  }

  if (!match || !tournamentId) {
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
          tournamentId={tournamentId}
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
