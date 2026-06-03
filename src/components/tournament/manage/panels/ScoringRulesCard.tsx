'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Heading, Text, Badge, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Category, UpdateCategoryRequest } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';

interface ScoringRulesCardProps {
  category: Category;
  onCategoryUpdated?: (category: Category) => void;
}

type TPresetId = 'BWF_21' | 'CLASSIC_15' | 'RALLY_15' | 'SHORT_11' | 'CUSTOM';
type TStage = 'GROUP' | 'KNOCKOUT' | 'FINAL';

interface IPreset {
  id: TPresetId;
  pointsToWin: number;
  winByTwo: boolean;
  /** null = no hard cap. */
  pointCap: number | null;
}

interface IStageValues {
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

const DEFAULT_POINTS = 21;
const DEFAULT_CAP: number | null = 30;
const DEFAULT_WIN_BY_TWO = true;

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

  if (stage === 'GROUP') {
    return {
      pointsToWin: basePoints,
      winByTwo: baseWinByTwo,
      pointCap: baseCap,
      inherit: false,
    };
  }
  if (stage === 'KNOCKOUT') {
    const hasOverride =
      category.knockoutPointsToWin !== null &&
      category.knockoutPointsToWin !== undefined;
    return {
      pointsToWin: category.knockoutPointsToWin ?? basePoints,
      winByTwo: category.knockoutWinByTwo ?? baseWinByTwo,
      pointCap:
        category.knockoutPointCap !== undefined
          ? category.knockoutPointCap
          : baseCap,
      inherit: !hasOverride,
    };
  }
  // FINAL — falls back to knockout, then base.
  const hasFinalOverride =
    category.finalPointsToWin !== null &&
    category.finalPointsToWin !== undefined;
  const koPoints = category.knockoutPointsToWin ?? basePoints;
  const koWin = category.knockoutWinByTwo ?? baseWinByTwo;
  const koCap =
    category.knockoutPointCap !== undefined
      ? category.knockoutPointCap
      : baseCap;
  return {
    pointsToWin: category.finalPointsToWin ?? koPoints,
    winByTwo: category.finalWinByTwo ?? koWin,
    pointCap:
      category.finalPointCap !== undefined ? category.finalPointCap : koCap,
    inherit: !hasFinalOverride,
  };
};

const valuesEqual = (a: IStageValues, b: IStageValues): boolean =>
  a.inherit === b.inherit &&
  a.pointsToWin === b.pointsToWin &&
  a.winByTwo === b.winByTwo &&
  a.pointCap === b.pointCap;

export default function ScoringRulesCard({
  category,
  onCategoryUpdated,
}: ScoringRulesCardProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.format');

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

  const activePreset = useMemo<TPresetId>(
    () =>
      detectPreset({
        pointsToWin: current.pointsToWin,
        winByTwo: current.winByTwo,
        pointCap: current.pointCap,
      }),
    [current.pointsToWin, current.winByTwo, current.pointCap]
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

  const handleSave = async (): Promise<void> => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload: UpdateCategoryRequest = {
        pointsToWin: values.GROUP.pointsToWin,
        winByTwo: values.GROUP.winByTwo,
        pointCap: values.GROUP.pointCap,
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
    >
      <Flex justify="space-between" align="center" mb={1}>
        <Heading size="sm">{t('scoringRules.title')}</Heading>
        {!current.inherit && (
          <Badge colorPalette={activePreset === 'CUSTOM' ? 'orange' : 'green'}>
            {t(`scoringRules.presets.${activePreset}`)}
          </Badge>
        )}
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={4}>
        {t('scoringRules.description')}
      </Text>

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

      <Text fontSize="xs" color="gray.500" mb={4}>
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
        >
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium">
              {t('scoringRules.inheritTitle')}
            </Text>
            <Text fontSize="xs" color="gray.600">
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
            onClick={() => updateStage(activeStage, { inherit: true })}
          >
            {t('scoringRules.inheritOn')}
          </Button>
          <Button
            size="sm"
            variant={!current.inherit ? 'solid' : 'outline'}
            onClick={() => updateStage(activeStage, { inherit: false })}
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
        <Field.Root maxW="160px">
          <Field.Label fontSize="sm">
            {t('scoringRules.pointsToWin')}
          </Field.Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={current.pointsToWin}
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
              variant={current.winByTwo ? 'solid' : 'outline'}
              disabled={fieldsDisabled}
              onClick={() => updateStage(activeStage, { winByTwo: true })}
            >
              {t('scoringRules.yes')}
            </Button>
            <Button
              size="sm"
              variant={!current.winByTwo ? 'solid' : 'outline'}
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
              min={current.pointsToWin}
              max={99}
              value={current.pointCap ?? ''}
              placeholder={t('scoringRules.noCap')}
              disabled={fieldsDisabled || current.pointCap === null}
              onChange={(e) => {
                const next = Number(e.target.value);
                updateStage(activeStage, {
                  pointCap: Number.isFinite(next) && next > 0 ? next : null,
                });
              }}
            />
            <Button
              size="sm"
              variant={current.pointCap === null ? 'solid' : 'outline'}
              disabled={fieldsDisabled}
              onClick={() =>
                updateStage(activeStage, {
                  pointCap: current.pointCap === null ? DEFAULT_CAP : null,
                })
              }
            >
              {current.pointCap === null
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
