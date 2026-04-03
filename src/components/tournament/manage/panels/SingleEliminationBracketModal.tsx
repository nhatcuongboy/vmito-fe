'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Portal,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Edit, ListTree, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category, CategoryRegistration } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import { VSwitch } from '@/components/ui/VSwitch';
import BracketVisualization from './BracketVisualization';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ISingleEliminationBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  registrations: CategoryRegistration[];
  onSaved: () => void;
}

interface IConsolationMatch {
  id: string;
  afterMatchNumber: number;
  homeRegistrationId: string;
  awayRegistrationId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SingleEliminationBracketModal({
  isOpen,
  onClose,
  category,
  registrations,
  onSaved,
}: ISingleEliminationBracketModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const tf = useTranslations('pages.tournaments.detail.formatWizard.formats');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeedEnabled, setIsSeedEnabled] = useState(false);
  const [customSlots, setCustomSlots] = useState<string[]>([]);

  // Consolation matches
  const [consolationMatches, setConsolationMatches] = useState<
    IConsolationMatch[]
  >([]);
  const [isConsolationDialogOpen, setIsConsolationDialogOpen] = useState(false);
  const [editingConsolationId, setEditingConsolationId] = useState<
    string | null
  >(null);
  const [consolationForm, setConsolationForm] = useState({
    afterMatchNumber: 0,
    homeRegistrationId: '',
    awayRegistrationId: '',
  });

  const teamCount = registrations.length;

  // Generate registration name
  const getRegName = (reg: CategoryRegistration): string => {
    if (reg.player) return reg.player.name;
    if (reg.pair) {
      return (
        reg.pair.name ||
        reg.pair.members?.map((m) => m.player?.name).join(' & ') ||
        '?'
      );
    }
    return '?';
  };

  // Generate total match count for consolation "when" dropdown
  const totalBracketMatches = useMemo(() => {
    if (teamCount < 2) return 0;
    // For n teams in SE bracket, there are n-1 matches
    return teamCount - 1;
  }, [teamCount]);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    const fc = category.formatConfig as Record<string, unknown> | undefined;
    const seConfig = fc?.singleElimination as
      | Record<string, unknown>
      | undefined;
    setIsSeedEnabled(!!seConfig?.seedEnabled);
    const savedSeeds = seConfig?.seedOrder as string[] | undefined;
    setCustomSlots(savedSeeds ?? []);
    const savedConsolations = seConfig?.consolationMatches as
      | IConsolationMatch[]
      | undefined;
    setConsolationMatches(savedConsolations ?? []);
  }, [isOpen, category]);

  // Match number options for consolation dialog
  const matchOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [];
    const startMatch = 13; // GROUP_MATCH_OFFSET + 1 from BracketVisualization
    for (let i = 0; i < totalBracketMatches; i++) {
      opts.push({
        value: startMatch + i,
        label: t('panels.rounds.matchLabel', { number: startMatch + i }),
      });
    }
    return opts;
  }, [totalBracketMatches, t]);

  const handleOpenAddConsolation = () => {
    setEditingConsolationId(null);
    setConsolationForm({
      afterMatchNumber: matchOptions[matchOptions.length - 1]?.value ?? 0,
      homeRegistrationId: '',
      awayRegistrationId: '',
    });
    setIsConsolationDialogOpen(true);
  };

  const handleOpenEditConsolation = (match: IConsolationMatch) => {
    setEditingConsolationId(match.id);
    setConsolationForm({
      afterMatchNumber: match.afterMatchNumber,
      homeRegistrationId: match.homeRegistrationId,
      awayRegistrationId: match.awayRegistrationId,
    });
    setIsConsolationDialogOpen(true);
  };

  const handleConfirmConsolation = () => {
    if (editingConsolationId) {
      setConsolationMatches((prev) =>
        prev.map((m) =>
          m.id === editingConsolationId ? { ...m, ...consolationForm } : m
        )
      );
    } else {
      const newMatch: IConsolationMatch = {
        id: `consolation_${Date.now()}`,
        ...consolationForm,
      };
      setConsolationMatches((prev) => [...prev, newMatch]);
    }
    setIsConsolationDialogOpen(false);
  };

  const handleDeleteConsolation = (id: string) => {
    setConsolationMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const existingConfig =
        (category.formatConfig as Record<string, unknown>) ?? {};
      await CategoryService.updateCategory(category.id, {
        formatConfig: {
          ...existingConfig,
          singleElimination: {
            seedEnabled: isSeedEnabled,
            ...(customSlots.length > 0 ? { seedOrder: customSlots } : {}),
            ...(consolationMatches.length > 0 ? { consolationMatches } : {}),
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
            w={{ base: 'full', md: '380px' }}
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
                bg="green.100"
                borderRadius="lg"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <ListTree size={22} color="#38A169" />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {tf('SINGLE_ELIMINATION.name')}
                </Text>
                <Text fontSize="sm" color="gray.500">
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

            {/* Consolation Matches */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>
                {t('panels.rounds.consolationMatches')}
              </Text>
              <Text fontSize="xs" color="green.500" mb={3}>
                {t('panels.rounds.consolationDescription')}
              </Text>

              {/* Consolation match list */}
              {consolationMatches.length > 0 && (
                <VStack gap={2} align="stretch" mb={3}>
                  {consolationMatches.map((match) => {
                    const homeName = match.homeRegistrationId
                      ? registrations.find(
                          (r) => r.id === match.homeRegistrationId
                        )
                        ? getRegName(
                            registrations.find(
                              (r) => r.id === match.homeRegistrationId
                            )!
                          )
                        : 'TBD'
                      : 'TBD';
                    const awayName = match.awayRegistrationId
                      ? registrations.find(
                          (r) => r.id === match.awayRegistrationId
                        )
                        ? getRegName(
                            registrations.find(
                              (r) => r.id === match.awayRegistrationId
                            )!
                          )
                        : 'TBD'
                      : 'TBD';

                    return (
                      <Box
                        key={match.id}
                        borderWidth="1.5px"
                        borderColor="green.200"
                        borderRadius="lg"
                        overflow="hidden"
                      >
                        <Flex
                          px={3}
                          py={2}
                          align="center"
                          justify="space-between"
                        >
                          <Text fontSize="xs" fontWeight="medium">
                            {t('panels.rounds.matchLabel', {
                              number: match.afterMatchNumber,
                            })}
                          </Text>
                          <Flex gap={1}>
                            <Box
                              as="button"
                              p={1}
                              borderRadius="md"
                              _hover={{ bg: 'gray.100' }}
                              onClick={() => handleOpenEditConsolation(match)}
                            >
                              <Edit size={14} color="#718096" />
                            </Box>
                            <Box
                              as="button"
                              p={1}
                              borderRadius="md"
                              _hover={{ bg: 'red.50' }}
                              onClick={() => handleDeleteConsolation(match.id)}
                            >
                              <Trash2 size={14} color="#E53E3E" />
                            </Box>
                          </Flex>
                        </Flex>
                        <Box
                          px={3}
                          py={1.5}
                          borderTopWidth="1px"
                          borderColor="gray.100"
                        >
                          <Text fontSize="xs" color="gray.600">
                            {homeName}
                          </Text>
                        </Box>
                        <Box
                          px={3}
                          py={1.5}
                          borderTopWidth="1px"
                          borderColor="gray.100"
                        >
                          <Text fontSize="xs" color="gray.600">
                            {awayName}
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              )}

              <Button
                size="sm"
                variant="outline"
                w="full"
                onClick={handleOpenAddConsolation}
              >
                {t('panels.rounds.addMatch')}
              </Button>
            </Box>
          </Flex>

          {/* Right panel - Bracket Preview */}
          <Box flex={1} bg="gray.50" overflowX="auto" overflowY="auto" p={8}>
            <BracketVisualization
              teamCount={teamCount}
              groupCount={1}
              winnersPerGroup={teamCount}
              thirdPlaceMatch={false}
              customSlots={customSlots.length > 0 ? customSlots : undefined}
              onSlotsChange={isSeedEnabled ? setCustomSlots : undefined}
              consolationMatches={consolationMatches.map((m) => {
                const homeName = m.homeRegistrationId
                  ? registrations.find((r) => r.id === m.homeRegistrationId)
                    ? getRegName(
                        registrations.find(
                          (r) => r.id === m.homeRegistrationId
                        )!
                      )
                    : 'TBD'
                  : 'TBD';
                const awayName = m.awayRegistrationId
                  ? registrations.find((r) => r.id === m.awayRegistrationId)
                    ? getRegName(
                        registrations.find(
                          (r) => r.id === m.awayRegistrationId
                        )!
                      )
                    : 'TBD'
                  : 'TBD';
                return {
                  matchNumber: m.afterMatchNumber,
                  participant1Label: homeName,
                  participant2Label: awayName,
                };
              })}
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

      {/* Consolation Match Dialog */}
      {isConsolationDialogOpen && (
        <ConsolationMatchDialog
          matchOptions={matchOptions}
          registrations={registrations}
          getRegName={getRegName}
          form={consolationForm}
          onFormChange={setConsolationForm}
          onConfirm={handleConfirmConsolation}
          onCancel={() => setIsConsolationDialogOpen(false)}
          t={t}
        />
      )}
    </Portal>
  );
}

// ─── Consolation Match Dialog ────────────────────────────────────────────────

function ConsolationMatchDialog({
  matchOptions,
  registrations,
  getRegName,
  form,
  onFormChange,
  onConfirm,
  onCancel,
  t,
}: {
  matchOptions: { value: number; label: string }[];
  registrations: CategoryRegistration[];
  getRegName: (reg: CategoryRegistration) => string;
  form: {
    afterMatchNumber: number;
    homeRegistrationId: string;
    awayRegistrationId: string;
  };
  onFormChange: (form: {
    afterMatchNumber: number;
    homeRegistrationId: string;
    awayRegistrationId: string;
  }) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Box
      position="fixed"
      inset="0"
      zIndex={1500}
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
    >
      {/* Backdrop */}
      <Box
        position="absolute"
        inset="0"
        bg="blackAlpha.400"
        onClick={onCancel}
      />

      {/* Dialog */}
      <Box
        position="relative"
        bg="white"
        borderRadius="xl"
        boxShadow="xl"
        w="420px"
        maxW="90vw"
        mx="auto"
        mt="20vh"
        overflow="hidden"
      >
        {/* Header */}
        <Flex px={6} pt={5} pb={3} align="center" justify="space-between">
          <Text fontWeight="bold" fontSize="md">
            {t('panels.rounds.consolationMatch')}
          </Text>
          <Box
            as="button"
            p={1}
            borderRadius="md"
            _hover={{ bg: 'gray.100' }}
            onClick={onCancel}
          >
            <X size={18} />
          </Box>
        </Flex>

        {/* Form */}
        <VStack gap={4} px={6} pb={6} align="stretch">
          {/* When */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('panels.rounds.whenMatchPlayed')}
            </Text>
            <NativeSelectRoot>
              <NativeSelectField
                value={String(form.afterMatchNumber)}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    afterMatchNumber: parseInt(e.target.value),
                  })
                }
              >
                {matchOptions.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </Box>

          {/* Home Team */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('panels.rounds.whoHomeTeam')}
            </Text>
            <NativeSelectRoot>
              <NativeSelectField
                value={form.homeRegistrationId}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    homeRegistrationId: e.target.value,
                  })
                }
              >
                <option value="">TBD</option>
                {registrations.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {getRegName(reg)}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </Box>

          {/* Away Team */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('panels.rounds.whoAwayTeam')}
            </Text>
            <NativeSelectRoot>
              <NativeSelectField
                value={form.awayRegistrationId}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    awayRegistrationId: e.target.value,
                  })
                }
              >
                <option value="">TBD</option>
                {registrations.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {getRegName(reg)}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </Box>
        </VStack>

        {/* Footer */}
        <Flex
          px={6}
          py={4}
          borderTopWidth="1px"
          borderColor="gray.100"
          justify="space-between"
        >
          <Button variant="ghost" onClick={onCancel}>
            {t('panels.rounds.cancel')}
          </Button>
          <Button
            style={{ background: '#1a202c', color: 'white' }}
            onClick={onConfirm}
          >
            {t('panels.rounds.confirm')}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
