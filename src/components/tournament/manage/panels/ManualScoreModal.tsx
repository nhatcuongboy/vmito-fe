'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button, IconButton, Input } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';

import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  EndCategoryMatchRequest,
  MatchSet,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import {
  defaultRules,
  isMatchComplete,
  buildScoreString,
} from '@/lib/scoring/badminton';

type ResultMode = 'score' | 'forfeit' | 'manual';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  onSaved: (m: CategoryMatch) => void;
  /** Category points mode; enables the manual-points tab when 'manual'. */
  pointsEarning?: 'match_results' | 'manual' | 'tiebreakers_only';
}

interface SetInput {
  player1Score: number;
  player2Score: number;
}

export default function ManualScoreModal({
  isOpen,
  onClose,
  match,
  onSaved,
  pointsEarning,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const [sets, setSets] = useState<SetInput[]>([]);
  const [mode, setMode] = useState<ResultMode>('score');
  const [forfeitWinner, setForfeitWinner] = useState<1 | 2 | null>(null);
  const [manual1, setManual1] = useState(0);
  const [manual2, setManual2] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const allowManual = pointsEarning === 'manual';

  const rules = useMemo(
    () => defaultRules(match?.matchFormat),
    [match?.matchFormat]
  );
  const maxSets = rules.bestOf;
  const minSets = rules.bestOf === 3 ? 2 : 1;

  const isDoubles =
    match?.participants?.some((p) => p.categoryRegistration?.pair) ?? false;

  const regIdOfPosition = (pos: number) =>
    match?.participants?.find((p) => p.position === pos)
      ?.categoryRegistrationId;

  // Seed inputs + default mode from the existing match each time it opens.
  useEffect(() => {
    if (!isOpen || !match) return;

    const existing = (match.sets ?? []).map((s) => ({
      player1Score: s.player1Score,
      player2Score: s.player2Score,
    }));
    setSets(
      existing.length >= minSets
        ? existing
        : Array.from({ length: minSets }, () => ({
            player1Score: 0,
            player2Score: 0,
          }))
    );

    const winnerPos =
      match.winnerId ===
      match.participants?.find((p) => p.position === 1)?.categoryRegistrationId
        ? 1
        : match.winnerId ===
            match.participants?.find((p) => p.position === 2)
              ?.categoryRegistrationId
          ? 2
          : null;

    setManual1(match.player1Points ?? 0);
    setManual2(match.player2Points ?? 0);

    if (match.isForfeit) {
      setMode('forfeit');
      setForfeitWinner(winnerPos);
    } else if (match.player1Points != null || match.player2Points != null) {
      setMode('manual');
      setForfeitWinner(null);
    } else {
      setMode(allowManual ? 'manual' : 'score');
      setForfeitWinner(null);
    }
  }, [isOpen, match, minSets, allowManual]);

  if (!match) return null;

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);

  const matchSets: MatchSet[] = sets.map((s, i) => ({
    setNumber: i + 1,
    player1Score: s.player1Score,
    player2Score: s.player2Score,
  }));
  const { complete, winnerSide } = isMatchComplete(matchSets, rules);
  const winnerName = winnerSide === 1 ? team1 : winnerSide === 2 ? team2 : null;

  const manualWinner = manual1 > manual2 ? 1 : manual2 > manual1 ? 2 : null;

  const canSave =
    mode === 'score'
      ? complete && !!winnerSide
      : mode === 'forfeit'
        ? forfeitWinner !== null
        : true; // manual: 0-0 is a valid draw

  const updateScore = (index: number, side: 1 | 2, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setSets((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [side === 1 ? 'player1Score' : 'player2Score']: value,
            }
          : s
      )
    );
  };

  const addSet = () =>
    setSets((prev) => [...prev, { player1Score: 0, player2Score: 0 }]);
  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const buildPayload = (): EndCategoryMatchRequest | null => {
    if (mode === 'forfeit') {
      if (!forfeitWinner) return null;
      return {
        score: t('walkover'),
        isForfeit: true,
        winnerId: regIdOfPosition(forfeitWinner),
        player1Score: 0,
        player2Score: 0,
        sets: [],
      };
    }
    if (mode === 'manual') {
      return {
        score: `${manual1} - ${manual2}`,
        player1Points: manual1,
        player2Points: manual2,
        winnerId: manualWinner ? regIdOfPosition(manualWinner) : undefined,
        isDraw: manualWinner === null,
      };
    }
    // score
    if (!complete || !winnerSide) return null;
    const played = matchSets.filter(
      (s, i) => i === 0 || s.player1Score > 0 || s.player2Score > 0
    );
    const total1 = played.reduce((sum, s) => sum + s.player1Score, 0);
    const total2 = played.reduce((sum, s) => sum + s.player2Score, 0);
    return {
      score: buildScoreString(played),
      sets: played,
      winnerId: winnerSide === 1 ? regIdOfPosition(1) : regIdOfPosition(2),
      player1Score: total1,
      player2Score: total2,
      ...(isDoubles && { player3Score: total1, player4Score: total2 }),
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      const resp = await CategoryService.endMatch(match.id, payload);
      onSaved(resp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const modes: ResultMode[] = allowManual
    ? ['score', 'forfeit', 'manual']
    : ['score', 'forfeit'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>{t('title')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Flex justify="space-between" align="center" mb={4} gap={2}>
          <Text fontWeight="semibold" flex="1" truncate>
            {team1}
          </Text>
          <Text color="gray.400">{t('vs')}</Text>
          <Text fontWeight="semibold" flex="1" textAlign="right" truncate>
            {team2}
          </Text>
        </Flex>

        <Flex gap={2} mb={4}>
          {modes.map((m) => (
            <Button
              key={m}
              size="sm"
              flex="1"
              variant={mode === m ? 'solid' : 'outline'}
              colorPalette={mode === m ? 'blue' : 'gray'}
              onClick={() => setMode(m)}
            >
              {t(
                m === 'score'
                  ? 'modeScore'
                  : m === 'forfeit'
                    ? 'modeForfeit'
                    : 'modeManual'
              )}
            </Button>
          ))}
        </Flex>

        {mode === 'score' && (
          <>
            {sets.map((s, i) => (
              <Flex key={i} align="center" gap={2} mb={2}>
                <Text fontSize="sm" color="gray.500" minW="48px">
                  {t('set')} {i + 1}
                </Text>
                <Input
                  type="number"
                  min={0}
                  value={String(s.player1Score)}
                  onChange={(e) => updateScore(i, 1, e.target.value)}
                  textAlign="center"
                />
                <Text color="gray.400">-</Text>
                <Input
                  type="number"
                  min={0}
                  value={String(s.player2Score)}
                  onChange={(e) => updateScore(i, 2, e.target.value)}
                  textAlign="center"
                />
                {sets.length > minSets && (
                  <IconButton
                    aria-label={t('removeSet')}
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSet(i)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                )}
              </Flex>
            ))}

            {sets.length < maxSets && (
              <Button size="sm" variant="ghost" onClick={addSet} mt={1}>
                <Plus size={14} /> {t('addSet')}
              </Button>
            )}

            <ResultBox>
              {complete && winnerName ? (
                <Text>
                  {t('winner')}:{' '}
                  <Text as="span" fontWeight="bold" color="green.500">
                    {winnerName}
                  </Text>{' '}
                  <Text as="span" color="gray.500">
                    ({buildScoreString(matchSets)})
                  </Text>
                </Text>
              ) : (
                <Text color="orange.500" fontSize="sm">
                  {t('noWinnerYet')}
                </Text>
              )}
            </ResultBox>
          </>
        )}

        {mode === 'forfeit' && (
          <>
            <Text fontSize="sm" color="gray.500" mb={2}>
              {t('selectWinner')}
            </Text>
            <Flex gap={2}>
              {([1, 2] as const).map((pos) => (
                <Button
                  key={pos}
                  flex="1"
                  variant={forfeitWinner === pos ? 'solid' : 'outline'}
                  colorPalette={forfeitWinner === pos ? 'green' : 'gray'}
                  onClick={() => setForfeitWinner(pos)}
                >
                  {pos === 1 ? team1 : team2}
                </Button>
              ))}
            </Flex>
            <Text fontSize="xs" color="gray.500" mt={3}>
              {t('forfeitHint')}
            </Text>
          </>
        )}

        {mode === 'manual' && (
          <>
            <Flex gap={3}>
              {([1, 2] as const).map((pos) => (
                <Box key={pos} flex="1">
                  <Text fontSize="sm" color="gray.500" mb={1} truncate>
                    {pos === 1 ? team1 : team2}
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    value={String(pos === 1 ? manual1 : manual2)}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value) || 0);
                      if (pos === 1) setManual1(v);
                      else setManual2(v);
                    }}
                    textAlign="center"
                  />
                </Box>
              ))}
            </Flex>
            <ResultBox>
              <Text>
                {t('winner')}:{' '}
                <Text as="span" fontWeight="bold" color="green.500">
                  {manualWinner === 1
                    ? team1
                    : manualWinner === 2
                      ? team2
                      : t('draw')}
                </Text>
              </Text>
            </ResultBox>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="green"
          onClick={() => void handleSave()}
          loading={submitting}
          disabled={!canSave}
        >
          {t('save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <Box
      mt={4}
      p={3}
      borderRadius="lg"
      bg="gray.50"
      _dark={{ bg: 'gray.700' }}
      textAlign="center"
    >
      {children}
    </Box>
  );
}
