'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Edit, ListTree, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import VModal from '@/components/ui/VModal';
import BracketVisualization from './BracketVisualization';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IPlayoffsBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  groupCount: number;
  onSaved: () => void;
}

interface IConsolationMatch {
  id: string;
  afterMatchNumber: number;
  homeRegistrationId: string;
  awayRegistrationId: string;
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

  // Consolation matches state
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

  const winnersPerGroup = category.winnersPerGroup ?? 2;
  const teamCount = winnersPerGroup * groupCount;

  // Calculate total bracket matches for consolation match options
  const totalBracketMatches = useMemo(() => {
    if (teamCount < 2) return 0;
    // For n teams in playoffs bracket, there are n-1 matches
    return teamCount - 1;
  }, [teamCount]);

  // Generate match number options for consolation dialog
  const matchOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [];
    const GROUP_MATCH_OFFSET = 12; // From BracketVisualization
    const startMatch = GROUP_MATCH_OFFSET + 1;
    for (let i = 0; i < totalBracketMatches; i++) {
      opts.push({
        value: startMatch + i,
        label: t('panels.rounds.matchLabel', { number: startMatch + i }),
      });
    }
    return opts;
  }, [totalBracketMatches, t]);

  // Team label resolution logic
  const resolveTeamLabel = (registrationId: string): string => {
    if (!registrationId) return t('panels.rounds.tbd');

    // Check if it's a winner reference
    if (registrationId.startsWith('win_')) {
      const matchNum = registrationId.replace('win_', '');
      return t('panels.rounds.winnerOf', { match: matchNum });
    }

    // Check if it's a loser reference
    if (registrationId.startsWith('lose_')) {
      const matchNum = registrationId.replace('lose_', '');
      return t('panels.rounds.loserOf', { match: matchNum });
    }

    return t('panels.rounds.tbd');
  };

  // Event handlers for consolation matches
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
      // Update existing match
      setConsolationMatches((prev) =>
        prev.map((m) =>
          m.id === editingConsolationId ? { ...m, ...consolationForm } : m
        )
      );
    } else {
      // Create new match
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
    // Restore consolation matches from category.formatConfig.playoffs.consolationMatches
    const savedConsolations = playoffs?.consolationMatches as
      | IConsolationMatch[]
      | undefined;
    setConsolationMatches(savedConsolations ?? []);
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
            ...(consolationMatches.length > 0 ? { consolationMatches } : {}),
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
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={
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
      }
      size="full"
      showCloseButton={true}
      closeOnOverlayClick={false}
      maxBodyHeight={{ base: '70vh', md: '75vh' }}
      footer={
        <Flex w="full" justify="space-between">
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
      }
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={6}
        h="full"
        overflow="hidden"
      >
        {/* Left panel - Configuration */}
        <Flex
          direction="column"
          gap={6}
          w={{ base: 'full', md: '340px' }}
          flexShrink={0}
          overflowY="auto"
        >
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

            {/* Consolation match list */}
            {consolationMatches.length > 0 && (
              <VStack gap={2} align="stretch" mb={3}>
                {consolationMatches.map((match) => {
                  const homeLabel = resolveTeamLabel(match.homeRegistrationId);
                  const awayLabel = resolveTeamLabel(match.awayRegistrationId);

                  return (
                    <Box
                      key={match.id}
                      borderWidth="1.5px"
                      borderColor="green.200"
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      {/* Match Card Header */}
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
                      {/* Home Team Row */}
                      <Box
                        px={3}
                        py={1.5}
                        borderTopWidth="1px"
                        borderColor="gray.100"
                      >
                        <Text fontSize="xs" color="gray.600">
                          {homeLabel}
                        </Text>
                      </Box>
                      {/* Away Team Row */}
                      <Box
                        px={3}
                        py={1.5}
                        borderTopWidth="1px"
                        borderColor="gray.100"
                      >
                        <Text fontSize="xs" color="gray.600">
                          {awayLabel}
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
        <Box
          flex={1}
          bg="gray.50"
          overflowX="auto"
          overflowY="auto"
          p={6}
          borderRadius="md"
        >
          <BracketVisualization
            teamCount={teamCount}
            groupCount={groupCount}
            winnersPerGroup={winnersPerGroup}
            thirdPlaceMatch={thirdPlaceMatch}
            fifthPlaceMatch={fifthPlaceMatch}
            seventhPlaceMatch={seventhPlaceMatch}
            customSlots={customSlots.length > 0 ? customSlots : undefined}
            validateAdvancingSlots
            onSlotsChange={setCustomSlots}
            consolationMatches={consolationMatches.map((m) => ({
              matchNumber: m.afterMatchNumber,
              participant1Label: resolveTeamLabel(m.homeRegistrationId),
              participant2Label: resolveTeamLabel(m.awayRegistrationId),
            }))}
          />
        </Box>
      </Flex>

      {/* Consolation Match Dialog */}
      {isConsolationDialogOpen && (
        <ConsolationMatchDialog
          matchOptions={matchOptions}
          form={consolationForm}
          onFormChange={setConsolationForm}
          onConfirm={handleConfirmConsolation}
          onCancel={() => setIsConsolationDialogOpen(false)}
          t={t}
          totalBracketMatches={totalBracketMatches}
        />
      )}
    </VModal>
  );
}

// ─── Consolation Match Dialog ────────────────────────────────────────────────

function ConsolationMatchDialog({
  matchOptions,
  form,
  onFormChange,
  onConfirm,
  onCancel,
  t,
  totalBracketMatches,
}: {
  matchOptions: { value: number; label: string }[];
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
  totalBracketMatches: number;
}) {
  // Generate team options for dropdowns
  const teamOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: '', label: t('panels.rounds.tbd') },
    ];

    const GROUP_MATCH_OFFSET = 12;
    const startMatch = GROUP_MATCH_OFFSET + 1;

    // Generate "Winner of Match X" and "Loser of Match X" options
    for (let i = 0; i < totalBracketMatches; i++) {
      const matchNum = startMatch + i;
      opts.push({
        value: `win_${matchNum}`,
        label: t('panels.rounds.winnerOf', { match: matchNum }),
      });
      opts.push({
        value: `lose_${matchNum}`,
        label: t('panels.rounds.loserOf', { match: matchNum }),
      });
    }

    return opts;
  }, [totalBracketMatches, t]);

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
                {teamOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                {teamOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
