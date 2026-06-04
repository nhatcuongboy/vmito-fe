'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Text, Badge, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
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
      <Flex justify="space-between" align="center" mb={1}>
        <Heading size="sm">{t('scoringRules.title')}</Heading>
        {!current.inherit && (
          <Badge colorPalette={activePreset === 'CUSTOM' ? 'orange' : 'green'}>
            {t(`scoringRules.presets.${activePreset}`)}
          </Badge>
        )}
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={4} _dark={{ color: 'gray.300' }}>
        {t('scoringRules.description')}
      </Text>

      {/* Per-stage summary of currently configured rules */}
      <Box
        mb={4}
        p={3}
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
        <Box>
          {STAGES.map((stage) => {
            const eff = getEffectiveStageValues(values, stage);
            const isInherited = stage !== 'GROUP' && values[stage].inherit;
            const parts: string[] = [
              t(`scoringRules.matchFormats.${eff.matchFormat}`),
              t('scoringRules.summary.points', { points: eff.pointsToWin }),
            ];
            if (eff.winByTwo) {
              parts.push(t('scoringRules.summary.winByTwo'));
            }
            parts.push(
              eff.pointCap === null
                ? t('scoringRules.summary.noCap')
                : t('scoringRules.summary.cap', { cap: eff.pointCap })
            );

            return (
              <Flex
                key={stage}
                gap={2}
                fontSize="sm"
                py={1}
                wrap="wrap"
                align="baseline"
              >
                <Text
                  fontWeight="medium"
                  color="gray.700"
                  minW={{ base: 'auto', sm: '110px' }}
                  _dark={{ color: 'gray.200' }}
                >
                  {t(`scoringRules.stages.${stage}`)}:
                </Text>
                <Text color="gray.600" _dark={{ color: 'gray.300' }}>
                  {isInherited && (
                    <Text as="span" fontStyle="italic" color="gray.500">
                      {t('scoringRules.summary.inherited')} ·{' '}
                    </Text>
                  )}
                  {parts.join(' · ')}
                </Text>
              </Flex>
            );
          })}
        </Box>
      </Box>

      {/* Stage tabs */}
      <Flex gap={2} mb={3} wrap="wrap">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage;
          const stageOverridden = stage !== 'GROUP' && !values[stage].inherit;
          return (
            <Button
              key={stage}
              size="sm"
              variant={isActive ? 'solid' : 'outline'}
              colorPalette={isActive ? 'green' : undefined}
              onClick={() => setActiveStage(stage)}
            >
              {t(`scoringRules.stages.${stage}`)}
              {stageOverridden && (
                <Box
                  as="span"
                  ml={2}
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg={isActive ? 'white' : 'green.500'}
                  display="inline-block"
                />
              )}
            </Button>
          );
        })}
      </Flex>

      <Text fontSize="xs" color="gray.500" mb={4} _dark={{ color: 'gray.400' }}>
        {t(`scoringRules.stageHints.${activeStage}`)}
      </Text>

      {/* Inherit toggle for KNOCKOUT/FINAL */}
      {stageInheritable && (
        <Flex
          align="center"
          gap={3}
          p={3}
          mb={4}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          bg="gray.50"
          _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
        >
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium">
              {t('scoringRules.inheritTitle')}
            </Text>
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
              {t(
                activeStage === 'FINAL'
                  ? 'scoringRules.inheritHintFinal'
                  : 'scoringRules.inheritHintKnockout'
              )}
            </Text>
          </Box>
          <Button
            size="sm"
            variant={current.inherit ? 'solid' : 'outline'}
            onClick={() => handleInheritChange(true)}
          >
            {t('scoringRules.inheritOn')}
          </Button>
          <Button
            size="sm"
            variant={!current.inherit ? 'solid' : 'outline'}
            onClick={() => handleInheritChange(false)}
          >
            {t('scoringRules.inheritOff')}
          </Button>
        </Flex>
      )}

      {/* Preset chips */}
      <Flex gap={2} wrap="wrap" mb={5} opacity={fieldsDisabled ? 0.4 : 1}>
        {PRESETS.map((preset) => {
          const isActive = !fieldsDisabled && activePreset === preset.id;
          return (
            <Button
              key={preset.id}
              size="sm"
              variant={isActive ? 'solid' : 'outline'}
              disabled={fieldsDisabled}
              onClick={() => handlePresetClick(preset)}
            >
              {t(`scoringRules.presets.${preset.id}`)}
            </Button>
          );
        })}
      </Flex>

      {/* Custom fields */}
      <Flex gap={4} wrap="wrap" opacity={fieldsDisabled ? 0.4 : 1}>
        <Field.Root maxW="280px">
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

        <Field.Root maxW="160px">
          <Field.Label fontSize="sm">
            {t('scoringRules.pointsToWin')}
          </Field.Label>
          <Input
            type="number"
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

        <Field.Root maxW="200px">
          <Field.Label fontSize="sm">{t('scoringRules.winByTwo')}</Field.Label>
          <Flex gap={2} align="center" h="40px">
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

        <Field.Root maxW="240px">
          <Field.Label fontSize="sm">{t('scoringRules.pointCap')}</Field.Label>
          <Flex gap={2} align="center">
            <Input
              type="number"
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
              variant={effectiveCurrent.pointCap === null ? 'solid' : 'outline'}
              disabled={fieldsDisabled}
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
      </Flex>

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
