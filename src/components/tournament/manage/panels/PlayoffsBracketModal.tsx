'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { ListTree } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import BracketVisualization from './BracketVisualization';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IPlayoffsBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  groupCount: number;
  onSaved: () => void;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  label,
  indentLevel = 0,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  indentLevel?: number;
}) {
  return (
    <Flex
      as="button"
      align="center"
      gap={2.5}
      onClick={() => onChange(!checked)}
      pl={`${indentLevel * 24}px`}
    >
      <Flex
        w="20px"
        h="20px"
        borderWidth="2px"
        borderColor={checked ? 'blue.500' : 'gray.300'}
        borderRadius="md"
        align="center"
        justify="center"
        bg={checked ? 'blue.500' : 'white'}
        flexShrink={0}
        transition="all 0.15s"
      >
        {checked && (
          <Text fontSize="xs" color="white" fontWeight="bold" lineHeight="1">
            ✓
          </Text>
        )}
      </Flex>
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlayoffsBracketModal({
  isOpen,
  onClose,
  category,
  groupCount,
  onSaved,
}: IPlayoffsBracketModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [isSaving, setIsSaving] = useState(false);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(
    category.thirdPlaceMatch ?? false
  );
  const [fifthPlaceMatch, setFifthPlaceMatch] = useState(false);
  const [seventhPlaceMatch, setSeventhPlaceMatch] = useState(false);
  const [customSlots, setCustomSlots] = useState<string[]>([]);

  const winnersPerGroup = category.winnersPerGroup ?? 2;
  const teamCount = winnersPerGroup * groupCount;

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setThirdPlaceMatch(category.thirdPlaceMatch ?? false);
    const fc = category.formatConfig as Record<string, unknown> | undefined;
    const playoffs = fc?.playoffs as Record<string, unknown> | undefined;
    setFifthPlaceMatch(!!playoffs?.fifthPlaceMatch);
    setSeventhPlaceMatch(!!playoffs?.seventhPlaceMatch);
    const savedSeeds = playoffs?.seedOrder as string[] | undefined;
    setCustomSlots(savedSeeds ?? []);
  }, [isOpen, category]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const existingConfig =
        (category.formatConfig as Record<string, unknown>) ?? {};
      await CategoryService.updateCategory(category.id, {
        thirdPlaceMatch,
        formatConfig: {
          ...existingConfig,
          playoffs: {
            fifthPlaceMatch,
            seventhPlaceMatch,
            ...(customSlots.length > 0 ? { seedOrder: customSlots } : {}),
          },
        },
      });
      toaster.success({ title: t('panels.rounds.bracketSaved') });
      onSaved();
      onClose();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Failed to save bracket';
      toaster.error({ title: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        zIndex={1400}
        bg="white"
        display="flex"
        flexDirection="column"
      >
        {/* Top-right Close button */}
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <Button size="sm" variant="outline" onClick={onClose}>
            {t('panels.rounds.close')}
          </Button>
        </Box>

        {/* Content */}
        <Flex
          flex={1}
          overflow="hidden"
          direction={{ base: 'column', md: 'row' }}
        >
          {/* Left panel - Configuration */}
          <Flex
            direction="column"
            gap={6}
            w={{ base: 'full', md: '340px' }}
            flexShrink={0}
            p={8}
            borderRightWidth={{ md: '1px' }}
            borderColor="gray.200"
            overflowY="auto"
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
                <ListTree size={22} color="#D69E2E" />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {t('panels.rounds.playoffs')}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {t('panels.rounds.configurePoolsAndConfirm')}
                </Text>
              </Box>
            </Flex>

            {/* Placement Matches */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>
                {t('panels.rounds.placementMatches')}
              </Text>
              <Text fontSize="xs" color="gray.500" mb={3}>
                {t('panels.rounds.selectPlacements')}
              </Text>
              <VStack gap={3} align="stretch">
                <Checkbox
                  checked={thirdPlaceMatch}
                  onChange={setThirdPlaceMatch}
                  label={t('panels.rounds.playFor3rdPlace')}
                />
                <Checkbox
                  checked={fifthPlaceMatch}
                  onChange={(v) => {
                    setFifthPlaceMatch(v);
                    if (!v) setSeventhPlaceMatch(false);
                  }}
                  label={t('panels.rounds.playFor5thPlace')}
                />
                {fifthPlaceMatch && (
                  <Checkbox
                    checked={seventhPlaceMatch}
                    onChange={setSeventhPlaceMatch}
                    label={t('panels.rounds.playFor7thPlace')}
                    indentLevel={1}
                  />
                )}
              </VStack>
            </Box>

            {/* Consolation Matches */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>
                {t('panels.rounds.consolationMatches')}
              </Text>
              <Text fontSize="xs" color="gray.500" mb={3}>
                {t('panels.rounds.consolationDescription')}
              </Text>
              <Button size="sm" variant="outline" w="full">
                {t('panels.rounds.addMatch')}
              </Button>
            </Box>
          </Flex>

          {/* Right panel - Bracket Preview */}
          <Box flex={1} bg="gray.50" overflowX="auto" overflowY="auto" p={8}>
            <BracketVisualization
              teamCount={teamCount}
              groupCount={groupCount}
              winnersPerGroup={winnersPerGroup}
              thirdPlaceMatch={thirdPlaceMatch}
              customSlots={customSlots.length > 0 ? customSlots : undefined}
              onSlotsChange={setCustomSlots}
            />
          </Box>
        </Flex>

        {/* Footer */}
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTopWidth="1px"
          borderColor="gray.200"
          px={8}
          py={4}
          align="center"
          justify="space-between"
        >
          <Button variant="ghost" onClick={onClose}>
            {t('panels.rounds.cancel')}
          </Button>
          <Button
            style={{ background: '#1a202c', color: 'white' }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? t('panels.rounds.saving')
              : t('panels.rounds.saveMatches')}
          </Button>
        </Flex>
      </Box>
    </Portal>
  );
}
