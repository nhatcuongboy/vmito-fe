'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Text, Badge, Input } from '@chakra-ui/react';
import { Button, SimpleGrid } from '@/components/ui/chakra-compat';
import { Field } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Category, MatchFormat, UpdateCategoryRequest } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';

interface ScoringRulesCardProps {
  category: Category;
  onCategoryUpdated?: (category: Category) => void;
}

type TPresetId = 'BWF_21' | 'CLASSIC_15' | 'RALLY_15' | 'SHORT_11' | 'CUSTOM';
type TStage = 'GROUP' | 'KNOCKOUT' | 'FINAL';
type TRoundKey = 'R16' | 'QF' | 'SF' | 'F' | '3RD';

interface IPreset {
  id: TPresetId;
  pointsToWin: number;
  winByTwo: boolean;
  /** null = no hard cap. */
  pointCap: number | null;
}

interface IStageValues {
  matchFormat: MatchFormat;
  pointsToWin: number;
  winByTwo: boolean;
  pointCap: number | null;
  /** GROUP is always defined; KNOCKOUT/FINAL may inherit. */
  inherit: boolean;
}

const PRESETS: readonly IPreset[] = [
  { id: 'BWF_21', pointsToWin: 21, winByTwo: true, pointCap: 30 },
  { id: 'CLASSIC_15', pointsToWin: 15, winByTwo: true, pointCap: null },
  { id: 'RALLY_15', pointsToWin: 15, winByTwo: true, pointCap: 21 },
  { id: 'SHORT_11', pointsToWin: 11, winByTwo: true, pointCap: 15 },
];

const STAGES: readonly TStage[] = ['GROUP', 'KNOCKOUT', 'FINAL'];
const MATCH_FORMATS: readonly MatchFormat[] = [
  MatchFormat.BEST_OF_1,
  MatchFormat.BEST_OF_3,
  MatchFormat.BEST_OF_5,
];

const DEFAULT_POINTS = 21;
const DEFAULT_CAP: number | null = 30;
const DEFAULT_WIN_BY_TWO = true;
const DEFAULT_MATCH_FORMAT = MatchFormat.BEST_OF_3;

const getRoundFormats = (
  formatConfig: Category['formatConfig']
): Partial<Record<TRoundKey, MatchFormat>> => {
  const raw =
    formatConfig &&
    typeof formatConfig === 'object' &&
    'roundFormats' in formatConfig
      ? formatConfig.roundFormats
      : undefined;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const roundFormats = raw as Partial<Record<TRoundKey, unknown>>;
  return Object.fromEntries(
    Object.entries(roundFormats).filter(([, value]) => hasMatchFormat(value))
  ) as Partial<Record<TRoundKey, MatchFormat>>;
};

const hasMatchFormat = (value: unknown): value is MatchFormat =>
  MATCH_FORMATS.includes(value as MatchFormat);

const matchesPreset = (
  preset: IPreset,
  values: Pick<IPreset, 'pointsToWin' | 'winByTwo' | 'pointCap'>
): boolean =>
  preset.pointsToWin === values.pointsToWin &&
  preset.winByTwo === values.winByTwo &&
  preset.pointCap === values.pointCap;

const detectPreset = (
  values: Pick<IPreset, 'pointsToWin' | 'winByTwo' | 'pointCap'>
): TPresetId =>
  PRESETS.find((preset) => matchesPreset(preset, values))?.id ?? 'CUSTOM';

const initialFor = (category: Category, stage: TStage): IStageValues => {
  const basePoints = category.pointsToWin ?? DEFAULT_POINTS;
  const baseWinByTwo = category.winByTwo ?? DEFAULT_WIN_BY_TWO;
  const baseCap =
    category.pointCap === undefined ? DEFAULT_CAP : category.pointCap;
  const baseMatchFormat = category.matchFormat ?? DEFAULT_MATCH_FORMAT;

  if (stage === 'GROUP') {
    return {
      matchFormat: baseMatchFormat,
      pointsToWin: basePoints,
      winByTwo: baseWinByTwo,
      pointCap: baseCap,
      inherit: false,
    };
  }
  if (stage === 'KNOCKOUT') {
    const knockoutMatchFormat = category.eliminationMatchFormat;
    const hasScoringOverride =
      category.knockoutPointsToWin !== null &&
      category.knockoutPointsToWin !== undefined;
    const hasMatchFormatOverride =
      knockoutMatchFormat !== null &&
      knockoutMatchFormat !== undefined &&
      knockoutMatchFormat !== baseMatchFormat;
    return {
      matchFormat: knockoutMatchFormat ?? baseMatchFormat,
      pointsToWin: category.knockoutPointsToWin ?? basePoints,
      winByTwo: category.knockoutWinByTwo ?? baseWinByTwo,
      pointCap:
        category.knockoutPointCap !== undefined
          ? category.knockoutPointCap
          : baseCap,
      inherit: !hasScoringOverride && !hasMatchFormatOverride,
    };
  }
  // FINAL — falls back to knockout, then base.
  const roundFormats = getRoundFormats(category.formatConfig);
  const finalMatchFormat = hasMatchFormat(roundFormats.F)
    ? roundFormats.F
    : undefined;
  const hasFinalScoringOverride =
    category.finalPointsToWin !== null &&
    category.finalPointsToWin !== undefined;
  const koMatchFormat = category.eliminationMatchFormat ?? baseMatchFormat;
  const hasFinalMatchFormatOverride =
    finalMatchFormat !== null &&
    finalMatchFormat !== undefined &&
    finalMatchFormat !== koMatchFormat;
  const koPoints = category.knockoutPointsToWin ?? basePoints;
  const koWin = category.knockoutWinByTwo ?? baseWinByTwo;
  const koCap =
    category.knockoutPointCap !== undefined
      ? category.knockoutPointCap
      : baseCap;
  return {
    matchFormat: finalMatchFormat ?? koMatchFormat,
    pointsToWin: category.finalPointsToWin ?? koPoints,
    winByTwo: category.finalWinByTwo ?? koWin,
    pointCap:
      category.finalPointCap !== undefined ? category.finalPointCap : koCap,
    inherit: !hasFinalScoringOverride && !hasFinalMatchFormatOverride,
  };
};

const valuesEqual = (a: IStageValues, b: IStageValues): boolean =>
  a.inherit === b.inherit &&
  a.matchFormat === b.matchFormat &&
  a.pointsToWin === b.pointsToWin &&
  a.winByTwo === b.winByTwo &&
  a.pointCap === b.pointCap;

const getEffectiveStageValues = (
  values: Record<TStage, IStageValues>,
  stage: TStage
): IStageValues => {
  if (stage === 'GROUP' || !values[stage].inherit) {
    return values[stage];
  }

  if (stage === 'KNOCKOUT') {
    return { ...values.GROUP, inherit: true };
  }

  const source = values.KNOCKOUT.inherit ? values.GROUP : values.KNOCKOUT;
  return { ...source, inherit: true };
};

export default function ScoringRulesCard({
  category,
  onCategoryUpdated,
}: ScoringRulesCardProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.format');

  const categoryRuleKey = useMemo(
    () =>
      JSON.stringify([
        category.id,
        category.pointsToWin,
        category.winByTwo,
        category.pointCap,
        category.knockoutPointsToWin,
        category.knockoutWinByTwo,
        category.knockoutPointCap,
        category.finalPointsToWin,
        category.finalWinByTwo,
        category.finalPointCap,
        category.matchFormat,
        category.eliminationMatchFormat,
        getRoundFormats(category.formatConfig).F,
      ]),
    [
      category.id,
      category.pointsToWin,
      category.winByTwo,
      category.pointCap,
      category.knockoutPointsToWin,
      category.knockoutWinByTwo,
      category.knockoutPointCap,
      category.finalPointsToWin,
      category.finalWinByTwo,
      category.finalPointCap,
      category.matchFormat,
      category.eliminationMatchFormat,
      category.formatConfig,
    ]
  );

  const initial = useMemo<Record<TStage, IStageValues>>(
    () => ({
      GROUP: initialFor(category, 'GROUP'),
      KNOCKOUT: initialFor(category, 'KNOCKOUT'),
      FINAL: initialFor(category, 'FINAL'),
    }),
    [category]
  );

  const [activeStage, setActiveStage] = useState<TStage>('GROUP');
  const [values, setValues] = useState<Record<TStage, IStageValues>>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = values[activeStage];
  const effectiveCurrent = getEffectiveStageValues(values, activeStage);

  useEffect(() => {
    setValues(initial);
    setError(null);
  }, [categoryRuleKey, initial]);

  const activePreset = useMemo<TPresetId>(
    () =>
      detectPreset({
        pointsToWin: effectiveCurrent.pointsToWin,
        winByTwo: effectiveCurrent.winByTwo,
        pointCap: effectiveCurrent.pointCap,
      }),
    [
      effectiveCurrent.pointsToWin,
      effectiveCurrent.winByTwo,
      effectiveCurrent.pointCap,
    ]
  );

  const isDirty = STAGES.some(
    (stage) => !valuesEqual(values[stage], initial[stage])
  );

  const isStageValid = (stage: TStage): boolean => {
    const v = values[stage];
    if (v.inherit) return true;
    return (
      Number.isFinite(v.pointsToWin) &&
      v.pointsToWin >= 1 &&
      v.pointsToWin <= 99 &&
      (v.pointCap === null ||
        (Number.isFinite(v.pointCap) &&
          v.pointCap >= v.pointsToWin &&
          v.pointCap <= 99))
    );
  };

  const isValid = STAGES.every(isStageValid);

  const updateStage = (stage: TStage, patch: Partial<IStageValues>): void => {
    setValues((prev) => ({ ...prev, [stage]: { ...prev[stage], ...patch } }));
    setError(null);
  };

  const handlePresetClick = (preset: IPreset): void => {
    updateStage(activeStage, {
      pointsToWin: preset.pointsToWin,
      winByTwo: preset.winByTwo,
      pointCap: preset.pointCap,
      inherit: false,
    });
  };

  const handleInheritChange = (inherit: boolean): void => {
    if (inherit) {
      updateStage(activeStage, { inherit: true });
      return;
    }

    updateStage(activeStage, {
      matchFormat: effectiveCurrent.matchFormat,
      pointsToWin: effectiveCurrent.pointsToWin,
      winByTwo: effectiveCurrent.winByTwo,
      pointCap: effectiveCurrent.pointCap,
      inherit: false,
    });
  };

  const handleSave = async (): Promise<void> => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const nextFormatConfig: Record<string, unknown> = {
        ...(category.formatConfig ?? {}),
      };
      const nextRoundFormats: Partial<Record<TRoundKey, MatchFormat>> = {
        ...getRoundFormats(category.formatConfig),
      };
      const effectiveKnockout = getEffectiveStageValues(
        values,
        'KNOCKOUT'
      ).matchFormat;

      if (values.FINAL.inherit) {
        delete nextRoundFormats.F;
      } else if (values.FINAL.matchFormat !== effectiveKnockout) {
        nextRoundFormats.F = values.FINAL.matchFormat;
      } else {
        delete nextRoundFormats.F;
      }

      if (Object.keys(nextRoundFormats).length > 0) {
        nextFormatConfig.roundFormats = nextRoundFormats;
      } else {
        delete nextFormatConfig.roundFormats;
      }

      const payload: UpdateCategoryRequest = {
        matchFormat: values.GROUP.matchFormat,
        pointsToWin: values.GROUP.pointsToWin,
        winByTwo: values.GROUP.winByTwo,
        pointCap: values.GROUP.pointCap,
        eliminationMatchFormat: values.KNOCKOUT.inherit
          ? values.GROUP.matchFormat
          : values.KNOCKOUT.matchFormat,
        knockoutPointsToWin: values.KNOCKOUT.inherit
          ? null
          : values.KNOCKOUT.pointsToWin,
        knockoutWinByTwo: values.KNOCKOUT.inherit
          ? null
          : values.KNOCKOUT.winByTwo,
        knockoutPointCap: values.KNOCKOUT.inherit
          ? null
          : values.KNOCKOUT.pointCap,
        finalPointsToWin: values.FINAL.inherit
          ? null
          : values.FINAL.pointsToWin,
        finalWinByTwo: values.FINAL.inherit ? null : values.FINAL.winByTwo,
        finalPointCap: values.FINAL.inherit ? null : values.FINAL.pointCap,
      };

      if (
        category.formatConfig !== undefined ||
        Object.keys(nextFormatConfig).length > 0
      ) {
        payload.formatConfig = nextFormatConfig;
      }
      const updated = await CategoryService.updateCategory(
        category.id,
        payload
      );
      onCategoryUpdated?.(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('scoringRules.saveError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const stageInheritable = activeStage !== 'GROUP';
  const fieldsDisabled = current.inherit;

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={5}
      mt={6}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        gap={3}
        mb={2}
        direction={{ base: 'column', sm: 'row' }}
      >
        <Box>
          <Heading size="sm">{t('scoringRules.title')}</Heading>
          <Text
            fontSize="sm"
            color="gray.600"
            mt={1}
            _dark={{ color: 'gray.300' }}
          >
            {t('scoringRules.description')}
          </Text>
        </Box>
        {!current.inherit && (
          <Badge
            colorPalette={activePreset === 'CUSTOM' ? 'orange' : 'green'}
            flexShrink={0}
          >
            {t(`scoringRules.presets.${activePreset}`)}
          </Badge>
        )}
      </Flex>

      {/* Per-stage summary and stage selector */}
      <Box
        mt={5}
        mb={4}
        p={{ base: 3, md: 4 }}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        bg="gray.50"
        _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
      >
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          color="gray.500"
          mb={2}
          _dark={{ color: 'gray.400' }}
        >
          {t('scoringRules.summary.title')}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          {STAGES.map((stage) => {
            const eff = getEffectiveStageValues(values, stage);
            const stagePreset = detectPreset({
              pointsToWin: eff.pointsToWin,
              winByTwo: eff.winByTwo,
              pointCap: eff.pointCap,
            });
            const isActive = activeStage === stage;
            const isInherited = stage !== 'GROUP' && values[stage].inherit;
            const stageOverridden = stage !== 'GROUP' && !values[stage].inherit;

            return (
              <Button
                key={stage}
                type="button"
                variant="outline"
                colorPalette="green"
                h="auto"
                minH="auto"
                p={0}
                whiteSpace="normal"
                textAlign="left"
                justifyContent="stretch"
                borderColor={isActive ? 'green.500' : 'gray.200'}
                borderWidth={isActive ? '2px' : '1px'}
                bg={isActive ? 'green.50' : 'white'}
                _hover={{
                  borderColor: 'green.400',
                  bg: 'green.50',
                }}
                _dark={{
                  bg: isActive ? 'green.950' : 'gray.800',
                  borderColor: isActive ? 'green.500' : 'gray.700',
                }}
                onClick={() => setActiveStage(stage)}
              >
                <Box w="100%" p={3} minW={0}>
                  <Flex align="center" justify="space-between" gap={2} mb={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.900"
                      truncate
                      _dark={{ color: 'gray.50' }}
                    >
                      {t(`scoringRules.stages.${stage}`)}
                    </Text>
                    {isInherited ? (
                      <Badge colorPalette="gray" flexShrink={0}>
                        {t('scoringRules.summary.inherited')}
                      </Badge>
                    ) : (
                      <Badge
                        colorPalette={stageOverridden ? 'green' : 'gray'}
                        flexShrink={0}
                      >
                        {t(`scoringRules.presets.${stagePreset}`)}
                      </Badge>
                    )}
                  </Flex>
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color="gray.900"
                    lineHeight="1.25"
                    _dark={{ color: 'gray.50' }}
                  >
                    {t(`scoringRules.matchFormats.${eff.matchFormat}`)} ·{' '}
                    {t('scoringRules.summary.points', {
                      points: eff.pointsToWin,
                    })}
                  </Text>
                  <Flex gap={2} mt={2} wrap="wrap">
                    {eff.winByTwo && (
                      <Badge colorPalette="blue">
                        {t('scoringRules.summary.winByTwo')}
                      </Badge>
                    )}
                    <Badge
                      colorPalette={eff.pointCap === null ? 'gray' : 'purple'}
                    >
                      {eff.pointCap === null
                        ? t('scoringRules.summary.noCap')
                        : t('scoringRules.summary.cap', {
                            cap: eff.pointCap,
                          })}
                    </Badge>
                  </Flex>
                </Box>
              </Button>
            );
          })}
        </SimpleGrid>
      </Box>

      <Box
        p={3}
        mb={4}
        borderWidth="1px"
        borderColor="green.200"
        borderRadius="md"
        bg="green.50"
        _dark={{ bg: 'green.950', borderColor: 'green.700' }}
      >
        <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="semibold" color="green.900">
              {t(`scoringRules.stages.${activeStage}`)}
            </Text>
            <Text
              fontSize="sm"
              color="green.800"
              mt={1}
              _dark={{ color: 'green.100' }}
            >
              {t(`scoringRules.stageHints.${activeStage}`)}
            </Text>
          </Box>
          {activeStage !== 'GROUP' && current.inherit && (
            <Badge colorPalette="green" flexShrink={0}>
              {t('scoringRules.summary.inherited')}
            </Badge>
          )}
        </Flex>
      </Box>

      {/* Inherit toggle for KNOCKOUT/FINAL */}
      {stageInheritable && (
        <Box
          p={3}
          mb={4}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Flex
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            direction={{ base: 'column', md: 'row' }}
          >
            <Box flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="medium">
                {t('scoringRules.inheritTitle')}
              </Text>
              <Text
                fontSize="xs"
                color="gray.600"
                mt={1}
                _dark={{ color: 'gray.300' }}
              >
                {t(
                  activeStage === 'FINAL'
                    ? 'scoringRules.inheritHintFinal'
                    : 'scoringRules.inheritHintKnockout'
                )}
              </Text>
            </Box>
            <Flex
              gap={1}
              p={1}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="gray.50"
              flexShrink={0}
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
            >
              <Button
                size="sm"
                variant={current.inherit ? 'solid' : 'ghost'}
                onClick={() => handleInheritChange(true)}
              >
                {t('scoringRules.inheritOn')}
              </Button>
              <Button
                size="sm"
                variant={!current.inherit ? 'solid' : 'ghost'}
                onClick={() => handleInheritChange(false)}
              >
                {t('scoringRules.inheritOff')}
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Preset chips */}
      <Box
        p={3}
        mb={4}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        opacity={fieldsDisabled ? 0.45 : 1}
        _dark={{ borderColor: 'gray.700' }}
      >
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          color="gray.500"
          mb={3}
          _dark={{ color: 'gray.400' }}
        >
          {t('scoringRules.presetTitle')}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={2}>
          {PRESETS.map((preset) => {
            const isActive = !fieldsDisabled && activePreset === preset.id;
            return (
              <Button
                key={preset.id}
                size="sm"
                variant={isActive ? 'solid' : 'outline'}
                disabled={fieldsDisabled}
                h="auto"
                minH="48px"
                justifyContent="flex-start"
                textAlign="left"
                whiteSpace="normal"
                onClick={() => handlePresetClick(preset)}
              >
                <Box>
                  <Text fontWeight="semibold">
                    {t(`scoringRules.presets.${preset.id}`)}
                  </Text>
                  <Text fontSize="xs" opacity={0.8}>
                    {t('scoringRules.summary.points', {
                      points: preset.pointsToWin,
                    })}
                    {' · '}
                    {preset.pointCap === null
                      ? t('scoringRules.summary.noCap')
                      : t('scoringRules.summary.cap', {
                          cap: preset.pointCap,
                        })}
                  </Text>
                </Box>
              </Button>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Custom fields */}
      <Box
        p={3}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        opacity={fieldsDisabled ? 0.45 : 1}
        _dark={{ borderColor: 'gray.700' }}
      >
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          color="gray.500"
          mb={3}
          _dark={{ color: 'gray.400' }}
        >
          {t('scoringRules.customTitle')}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Field.Root>
            <Field.Label fontSize="sm">
              {t('scoringRules.matchFormat')}
            </Field.Label>
            <Flex gap={2} align="center" minH="40px" wrap="wrap">
              {MATCH_FORMATS.map((format) => {
                const isSelected = effectiveCurrent.matchFormat === format;
                return (
                  <Button
                    key={format}
                    size="sm"
                    variant={isSelected ? 'solid' : 'outline'}
                    disabled={fieldsDisabled}
                    onClick={() =>
                      updateStage(activeStage, {
                        matchFormat: format,
                      })
                    }
                  >
                    {t(`scoringRules.matchFormats.${format}`)}
                  </Button>
                );
              })}
            </Flex>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm">
              {t('scoringRules.pointsToWin')}
            </Field.Label>
            <Input
              type="number"
              name="pointsToWin"
              inputMode="numeric"
              autoComplete="off"
              min={1}
              max={99}
              value={effectiveCurrent.pointsToWin}
              disabled={fieldsDisabled}
              onChange={(e) => {
                const next = Number(e.target.value);
                updateStage(activeStage, {
                  pointsToWin: Number.isFinite(next) ? next : 0,
                });
              }}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm">
              {t('scoringRules.winByTwo')}
            </Field.Label>
            <Flex gap={2} align="center" minH="40px">
              <Button
                size="sm"
                variant={effectiveCurrent.winByTwo ? 'solid' : 'outline'}
                disabled={fieldsDisabled}
                onClick={() => updateStage(activeStage, { winByTwo: true })}
              >
                {t('scoringRules.yes')}
              </Button>
              <Button
                size="sm"
                variant={!effectiveCurrent.winByTwo ? 'solid' : 'outline'}
                disabled={fieldsDisabled}
                onClick={() => updateStage(activeStage, { winByTwo: false })}
              >
                {t('scoringRules.no')}
              </Button>
            </Flex>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm">
              {t('scoringRules.pointCap')}
            </Field.Label>
            <Flex gap={2} align="center">
              <Input
                type="number"
                name="pointCap"
                inputMode="numeric"
                autoComplete="off"
                min={effectiveCurrent.pointsToWin}
                max={99}
                value={effectiveCurrent.pointCap ?? ''}
                placeholder={t('scoringRules.noCap')}
                disabled={fieldsDisabled || effectiveCurrent.pointCap === null}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  updateStage(activeStage, {
                    pointCap: Number.isFinite(next) && next > 0 ? next : null,
                  });
                }}
              />
              <Button
                size="sm"
                variant={
                  effectiveCurrent.pointCap === null ? 'solid' : 'outline'
                }
                disabled={fieldsDisabled}
                flexShrink={0}
                onClick={() =>
                  updateStage(activeStage, {
                    pointCap:
                      effectiveCurrent.pointCap === null ? DEFAULT_CAP : null,
                  })
                }
              >
                {effectiveCurrent.pointCap === null
                  ? t('scoringRules.noCap')
                  : t('scoringRules.disableCap')}
              </Button>
            </Flex>
          </Field.Root>
        </SimpleGrid>
      </Box>

      {error && (
        <Text fontSize="sm" color="red.500" mt={3}>
          {error}
        </Text>
      )}
      {!isStageValid(activeStage) && (
        <Text fontSize="sm" color="red.500" mt={3}>
          {t('scoringRules.invalid')}
        </Text>
      )}

      <Flex justify="flex-end" mt={4}>
        <Button
          size="sm"
          colorPalette="blue"
          onClick={handleSave}
          disabled={!isDirty || !isValid || isSaving}
          loading={isSaving}
        >
          {t('scoringRules.save')}
        </Button>
      </Flex>
    </Box>
  );
}
