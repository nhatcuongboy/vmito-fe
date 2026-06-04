'use client';

import { useEffect, useState } from 'react';
import { Box, Text, Flex, Input, HStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, MatchSet } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import {
  BadmintonRules,
  isSetComplete as isSetCompleteFE,
} from '@/lib/scoring/badminton';
import { toaster } from '@/components/ui/toaster';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch;
  set: MatchSet | null;
  rules: BadmintonRules;
  /** True when `set` is the latest (in-progress) set — allows any score. */
  isLatestSet: boolean;
  onUpdated: (m: CategoryMatch) => void;
}

export default function EditSetScoreModal({
  isOpen,
  onClose,
  match,
  set,
  rules,
  isLatestSet,
  onUpdated,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);

  const [p1, setP1] = useState('0');
  const [p2, setP2] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !set) return;
    setP1(String(set.player1Score));
    setP2(String(set.player2Score));
  }, [isOpen, set]);

  if (!set) return null;

  const parseScore = (raw: string): number => {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : NaN;
  };
  const p1Num = parseScore(p1);
  const p2Num = parseScore(p2);
  const validNumbers = Number.isInteger(p1Num) && Number.isInteger(p2Num);

  // Reasonable client-side bound; server is authoritative.
  const capDisplay = rules.cap;
  const exceedsCap = validNumbers && (p1Num > capDisplay || p2Num > capDisplay);
  const setComplete =
    validNumbers && isSetCompleteFE(p1Num, p2Num, rules).complete;
  const needsCompleted = !isLatestSet;
  const incompleteError = validNumbers && needsCompleted && !setComplete;

  const canSubmit =
    validNumbers &&
    !exceedsCap &&
    !incompleteError &&
    !submitting &&
    (p1Num !== set.player1Score || p2Num !== set.player2Score);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const updated = await CategoryService.updateSetScore(
        match.id,
        set.setNumber,
        { player1Score: p1Num, player2Score: p2Num }
      );
      onUpdated(updated);
      toaster.success({ title: t('editSetSuccess') });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editSetTitle', { number: set.setNumber })}
      size="sm"
      primaryActionText={t('save')}
      onPrimaryAction={() => void handleSubmit()}
      isPrimaryLoading={submitting}
      isPrimaryDisabled={!canSubmit}
      secondaryActionText={t('cancel')}
      onSecondaryAction={onClose}
    >
      <Text fontSize="sm" color="gray.600" mb={3} _dark={{ color: 'gray.300' }}>
        {isLatestSet ? t('editSetHintLatest') : t('editSetHintPast')}
      </Text>

      <HStack gap={3} align="end" justify="space-between">
        <Box flex="1">
          <Text fontSize="sm" fontWeight="medium" mb={1} truncate>
            {team1}
          </Text>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={capDisplay}
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            textAlign="center"
            fontSize="2xl"
            fontWeight="bold"
            h="56px"
          />
        </Box>
        <Text
          fontSize="xl"
          pb={3}
          color="gray.400"
          _dark={{ color: 'gray.500' }}
        >
          –
        </Text>
        <Box flex="1">
          <Text fontSize="sm" fontWeight="medium" mb={1} truncate>
            {team2}
          </Text>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={capDisplay}
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            textAlign="center"
            fontSize="2xl"
            fontWeight="bold"
            h="56px"
          />
        </Box>
      </HStack>

      <Flex direction="column" gap={1} mt={3} fontSize="xs">
        {!validNumbers && (
          <Text color="red.500">{t('editSetErrorInvalid')}</Text>
        )}
        {exceedsCap && (
          <Text color="red.500">
            {t('editSetErrorCap', { cap: capDisplay })}
          </Text>
        )}
        {incompleteError && (
          <Text color="red.500">{t('editSetErrorIncomplete')}</Text>
        )}
        {!incompleteError && !isLatestSet && validNumbers && (
          <Text color="gray.500" _dark={{ color: 'gray.400' }}>
            {t('editSetWillResetLater')}
          </Text>
        )}
      </Flex>
    </VModal>
  );
}
