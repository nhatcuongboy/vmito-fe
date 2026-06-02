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
import { CategoryMatch, MatchSet } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import {
  defaultRules,
  isMatchComplete,
  buildScoreString,
} from '@/lib/scoring/badminton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  onSaved: (m: CategoryMatch) => void;
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
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const [sets, setSets] = useState<SetInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const rules = useMemo(
    () => defaultRules(match?.matchFormat),
    [match?.matchFormat]
  );
  const maxSets = rules.bestOf;
  const minSets = rules.bestOf === 3 ? 2 : 1;

  const isDoubles =
    match?.participants?.some((p) => p.categoryRegistration?.pair) ?? false;

  // Seed inputs from existing sets, or empty rows for the format.
  useEffect(() => {
    if (!isOpen || !match) return;
    const existing = (match.sets ?? []).map((s) => ({
      player1Score: s.player1Score,
      player2Score: s.player2Score,
    }));
    if (existing.length >= minSets) {
      setSets(existing);
    } else {
      setSets(
        Array.from({ length: minSets }, () => ({
          player1Score: 0,
          player2Score: 0,
        }))
      );
    }
  }, [isOpen, match, minSets]);

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

  const regIdOfPosition = (pos: number) =>
    match.participants?.find((p) => p.position === pos)?.categoryRegistrationId;

  const handleSave = async () => {
    if (!complete || !winnerSide) return;
    setSubmitting(true);
    try {
      // Keep played sets only (drop trailing 0-0), always keep set 1.
      const played = matchSets.filter(
        (s, i) => i === 0 || s.player1Score > 0 || s.player2Score > 0
      );
      const total1 = played.reduce((sum, s) => sum + s.player1Score, 0);
      const total2 = played.reduce((sum, s) => sum + s.player2Score, 0);
      const resp = await CategoryService.endMatch(match.id, {
        score: buildScoreString(played),
        sets: played,
        winnerId: winnerSide === 1 ? regIdOfPosition(1) : regIdOfPosition(2),
        player1Score: total1,
        player2Score: total2,
        ...(isDoubles && { player3Score: total1, player4Score: total2 }),
      });
      onSaved(resp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

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

        <Box
          mt={4}
          p={3}
          borderRadius="lg"
          bg="gray.50"
          _dark={{ bg: 'gray.700' }}
          textAlign="center"
        >
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
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="green"
          onClick={() => void handleSave()}
          loading={submitting}
          disabled={!complete || !winnerSide}
        >
          {t('save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
