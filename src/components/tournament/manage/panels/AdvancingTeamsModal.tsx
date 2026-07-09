'use client';

import { useState, useMemo, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { Info, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IAdvancingTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  groupCount: number;
  totalRegistrations: number;
  onSaved: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const getOrdinalLabel = (
  rank: number,
  t: ReturnType<typeof useTranslations>
): string => {
  const oneBased = rank + 1;
  const key = oneBased >= 1 && oneBased <= 8 ? String(oneBased) : 'other';
  return t(`panels.rounds.ordinals.${key}`, { rank: oneBased });
};

const generateAdvancingPreview = (
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] => {
  const slots: string[] = [];
  for (let rank = 0; rank < winnersPerGroup; rank++) {
    for (let g = 0; g < groupCount; g++) {
      const poolLabel = POOL_LABELS[g] ?? String(g + 1);
      slots.push(
        t('panels.rounds.nthPoolLabel', {
          rank: getOrdinalLabel(rank, t),
          pool: poolLabel,
        })
      );
    }
  }
  return slots;
};

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      as="button"
      w="44px"
      h="24px"
      borderRadius="full"
      bg={checked ? 'black' : 'gray.300'}
      position="relative"
      onClick={() => onChange(!checked)}
      transition="background 0.2s"
      flexShrink={0}
    >
      <Box
        position="absolute"
        top="2px"
        left={checked ? 'calc(100% - 22px)' : '2px'}
        w="20px"
        h="20px"
        bg="white"
        borderRadius="full"
        boxShadow="sm"
        transition="left 0.2s"
      />
    </Box>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdvancingTeamsModal({
  isOpen,
  onClose,
  category,
  groupCount,
  totalRegistrations,
  onSaved,
}: IAdvancingTeamsModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [isSaving, setIsSaving] = useState(false);
  const [rankingMethod, setRankingMethod] = useState('pool_rankings');
  const [winnersPerGroup, setWinnersPerGroup] = useState(
    category.winnersPerGroup ?? 2
  );
  const [useWildcards, setUseWildcards] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return;
    setWinnersPerGroup(category.winnersPerGroup ?? 2);
    const advConfig = (category.formatConfig as Record<string, unknown>)
      ?.advancing as Record<string, unknown> | undefined;
    setUseWildcards(!!advConfig?.useWildcards);
    setRankingMethod(
      advConfig?.rankingMethod
        ? String(advConfig.rankingMethod)
        : 'pool_rankings'
    );
  }, [isOpen, category]);

  const playoffsTeamCount = winnersPerGroup * groupCount;

  // Teams advance as `winnersPerGroup × groupCount`, so only multiples of the
  // group count are reachable — listing every integer makes intermediate values
  // snap to the nearest multiple (no-ops). Cap at the (evenly distributed) group
  // size so we never advance more teams than a group actually contains.
  const teamCountOptions = useMemo(() => {
    if (groupCount <= 0) return [0];
    const maxWinnersPerGroup = Math.floor(totalRegistrations / groupCount);
    const options: number[] = [];
    for (let w = 0; w <= maxWinnersPerGroup; w++) {
      options.push(w * groupCount);
    }
    return options;
  }, [groupCount, totalRegistrations]);

  const handleTeamCountChange = (total: number) => {
    if (total === 0 || groupCount <= 0) {
      setWinnersPerGroup(0);
      return;
    }
    setWinnersPerGroup(Math.max(1, Math.ceil(total / groupCount)));
  };

  const isAllTeamsAdvancing = playoffsTeamCount >= totalRegistrations;

  const advancingSlots = useMemo(
    () => generateAdvancingPreview(groupCount, winnersPerGroup, t),
    [groupCount, winnersPerGroup, t]
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const existingConfig =
        (category.formatConfig as Record<string, unknown>) ?? {};
      await CategoryService.updateCategory(category.id, {
        winnersPerGroup,
        formatConfig: {
          ...existingConfig,
          advancing: {
            rankingMethod,
            useWildcards,
          },
        },
      });
      toaster.success({ title: t('panels.rounds.teamsSaved') });
      onSaved();
      onClose();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : t('panels.rounds.advancingTeamsSaveFailed');
      toaster.error({ title: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      maxBodyHeight="70vh"
      primaryActionText={
        isSaving ? t('panels.rounds.saving') : t('panels.rounds.saveTeams')
      }
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
      secondaryActionText={t('panels.rounds.cancel')}
      showHeaderDivider={false}
      showFooterDivider
    >
      <Flex direction={{ base: 'column', md: 'row' }} gap={0} minH="400px">
        {/* Left panel - Configuration */}
        <Flex
          direction="column"
          gap={6}
          w={{ base: 'full', md: '300px' }}
          flexShrink={0}
          pr={{ md: 6 }}
          borderRightWidth={{ md: '1px' }}
          borderColor="gray.200"
        >
          {/* Header */}
          <Flex align="center" gap={3}>
            <Flex
              w="48px"
              h="48px"
              bg="yellow.100"
              borderRadius="lg"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Users size={22} color="#D69E2E" />
            </Flex>
            <Box>
              <Text fontWeight="bold" fontSize="lg">
                {t('panels.rounds.advancingTeams')}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {t('panels.rounds.advancingTeamsSubtitle')}
              </Text>
            </Box>
          </Flex>

          {/* Ranking method */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2} fontWeight="medium">
              {t('panels.rounds.rankingMethod')}
            </Text>
            <select
              value={rankingMethod}
              onChange={(e) => {
                setRankingMethod(e.target.value);
                if (e.target.value !== 'pool_rankings') setUseWildcards(false);
              }}
              style={{
                width: '100%',
                padding: '0 12px',
                height: '44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="pool_rankings">
                {t('panels.rounds.poolRankings')}
              </option>
              <option value="overall_rankings">
                {t('panels.rounds.overallRankings')}
              </option>
              <option value="cross_pool_rankings">
                {t('panels.rounds.crossPoolRankings')}
              </option>
            </select>
          </Box>

          {/* Wildcards — only for pool rankings */}
          {rankingMethod === 'pool_rankings' && (
            <Flex align="center" justify="space-between" gap={4}>
              <Flex align="center" gap={1.5}>
                <Text fontSize="sm">{t('panels.rounds.useWildcards')}</Text>
                <Box
                  title={t('panels.rounds.wildcardsTooltip')}
                  cursor="help"
                  color="gray.400"
                >
                  <Info size={14} />
                </Box>
              </Flex>
              <ToggleSwitch checked={useWildcards} onChange={setUseWildcards} />
            </Flex>
          )}

          {/* Playoffs team count */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2} fontWeight="medium">
              {t('panels.rounds.playoffsTeamCount')}
            </Text>
            <select
              value={playoffsTeamCount}
              onChange={(e) => handleTeamCountChange(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0 12px',
                height: '44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {teamCountOptions.map((count) => (
                <option key={count} value={count}>
                  {t('panels.rounds.teamsLabel', { count })}
                </option>
              ))}
            </select>
          </Box>

          {/* Info banner */}
          {isAllTeamsAdvancing && (
            <Flex bg="green.50" borderRadius="lg" p={3} align="center" gap={2}>
              <Info size={16} color="#38A169" />
              <Text fontSize="sm" color="green.700" fontWeight="medium">
                {t('panels.rounds.allTeamsWillAdvance')}
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Right panel - Preview */}
        <Box flex={1} bg="gray.50" borderRadius="lg" p={5} ml={{ md: 6 }}>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1.5px"
            borderColor="yellow.200"
            overflow="hidden"
          >
            <Box px={5} py={4} borderBottomWidth="1px" borderColor="gray.100">
              <Text fontWeight="bold" fontSize="md">
                {t('panels.rounds.playoffs')}
              </Text>
            </Box>
            <VStack gap={0} align="stretch">
              {advancingSlots.map((slot, idx) => (
                <Flex
                  key={idx}
                  px={5}
                  py={3}
                  align="center"
                  gap={3}
                  borderBottomWidth={
                    idx < advancingSlots.length - 1 ? '1px' : '0'
                  }
                  borderColor="gray.50"
                >
                  <Users size={16} color="#A0AEC0" />
                  <Text fontSize="sm">{slot}</Text>
                </Flex>
              ))}
            </VStack>
          </Box>
        </Box>
      </Flex>
    </VModal>
  );
}
