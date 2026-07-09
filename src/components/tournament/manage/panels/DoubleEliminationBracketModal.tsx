'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { GitFork } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category, CategoryRegistration } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import { VSwitch } from '@/components/ui/VSwitch';
import DoubleEliminationBracketViz from './DoubleEliminationBracketViz';

export interface IDoubleEliminationBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  registrations: CategoryRegistration[];
  onSaved: () => void;
}

export default function DoubleEliminationBracketModal({
  isOpen,
  onClose,
  category,
  registrations,
  onSaved,
}: IDoubleEliminationBracketModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const tf = useTranslations('pages.tournaments.detail.formatWizard.formats');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeedEnabled, setIsSeedEnabled] = useState(false);
  const [isTrueDoubleElimination, setIsTrueDoubleElimination] = useState(true);
  const [customSlots, setCustomSlots] = useState<string[]>([]);

  const teamCount = registrations.length;

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    const fc = category.formatConfig as Record<string, unknown> | undefined;
    const deConfig = fc?.doubleElimination as
      | Record<string, unknown>
      | undefined;
    setIsSeedEnabled(!!deConfig?.seedEnabled);
    setIsTrueDoubleElimination(deConfig?.isTrueDoubleElimination !== false);
    const savedSeeds = deConfig?.seedOrder as string[] | undefined;
    setCustomSlots(savedSeeds ?? []);
  }, [isOpen, category]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const existingConfig =
        (category.formatConfig as Record<string, unknown>) ?? {};
      await CategoryService.updateCategory(category.id, {
        formatConfig: {
          ...existingConfig,
          doubleElimination: {
            seedEnabled: isSeedEnabled,
            isTrueDoubleElimination,
            ...(customSlots.length > 0 ? { seedOrder: customSlots } : {}),
          },
        },
      });
      toaster.success({ title: t('panels.rounds.bracketSaved') });
      onSaved();
      onClose();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : t('panels.rounds.bracketSaveFailed');
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
        _dark={{ bg: 'gray.900' }}
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
            w={{ base: 'full', md: '380px' }}
            flexShrink={0}
            p={8}
            borderRightWidth={{ md: '1px' }}
            borderColor="gray.200"
            overflowY="auto"
            _dark={{ borderColor: 'gray.700' }}
          >
            {/* Header */}
            <Flex align="center" gap={3}>
              <Flex
                w="48px"
                h="48px"
                bg="green.100"
                _dark={{ bg: 'green.900' }}
                borderRadius="lg"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <GitFork size={22} color="#38A169" />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {tf('DOUBLE_ELIMINATION.name')}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('panels.rounds.configureAndConfirmMatches')}
                </Text>
              </Box>
            </Flex>

            {/* Seed Teams Toggle */}
            <Flex align="center" justify="space-between">
              <Text fontSize="sm">{t('panels.rounds.seedTeams')}</Text>
              <VSwitch
                checked={isSeedEnabled}
                onCheckedChange={(e) => setIsSeedEnabled(!!e.checked)}
              />
            </Flex>

            {/* True Double Elimination Toggle */}
            <Flex align="center" justify="space-between" gap={3}>
              <Box>
                <Text fontSize="sm">
                  {t('panels.rounds.trueDoubleElimination')}
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('panels.rounds.trueDoubleEliminationDesc')}
                </Text>
              </Box>
              <VSwitch
                checked={isTrueDoubleElimination}
                onCheckedChange={(e) => setIsTrueDoubleElimination(!!e.checked)}
              />
            </Flex>
          </Flex>

          {/* Right panel - Bracket Preview */}
          <Box
            flex={1}
            bg="gray.50"
            overflowX="auto"
            overflowY="auto"
            p={8}
            _dark={{ bg: 'gray.900' }}
          >
            <DoubleEliminationBracketViz
              teamCount={teamCount}
              isTrueDoubleElimination={isTrueDoubleElimination}
              customSlots={customSlots.length > 0 ? customSlots : undefined}
              onSlotsChange={isSeedEnabled ? setCustomSlots : undefined}
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
          _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
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
