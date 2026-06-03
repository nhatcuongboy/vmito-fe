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

interface IPreset {
  id: TPresetId;
  pointsToWin: number;
  winByTwo: boolean;
  /** null = no hard cap. */
  pointCap: number | null;
}

const PRESETS: readonly IPreset[] = [
  { id: 'BWF_21', pointsToWin: 21, winByTwo: true, pointCap: 30 },
  { id: 'CLASSIC_15', pointsToWin: 15, winByTwo: true, pointCap: null },
  { id: 'RALLY_15', pointsToWin: 15, winByTwo: true, pointCap: 21 },
  { id: 'SHORT_11', pointsToWin: 11, winByTwo: true, pointCap: 15 },
];

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

export default function ScoringRulesCard({
  category,
  onCategoryUpdated,
}: ScoringRulesCardProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.format');

  const initialPoints = category.pointsToWin ?? DEFAULT_POINTS;
  const initialWinByTwo = category.winByTwo ?? DEFAULT_WIN_BY_TWO;
  const initialCap =
    category.pointCap === undefined ? DEFAULT_CAP : category.pointCap;

  const [pointsToWin, setPointsToWin] = useState<number>(initialPoints);
  const [winByTwo, setWinByTwo] = useState<boolean>(initialWinByTwo);
  const [pointCap, setPointCap] = useState<number | null>(initialCap);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePreset = useMemo<TPresetId>(
    () => detectPreset({ pointsToWin, winByTwo, pointCap }),
    [pointsToWin, winByTwo, pointCap]
  );

  const isDirty =
    pointsToWin !== initialPoints ||
    winByTwo !== initialWinByTwo ||
    pointCap !== initialCap;

  const isValid =
    Number.isFinite(pointsToWin) &&
    pointsToWin >= 1 &&
    pointsToWin <= 99 &&
    (pointCap === null ||
      (Number.isFinite(pointCap) && pointCap >= pointsToWin && pointCap <= 99));

  const handlePresetClick = (preset: IPreset) => {
    setPointsToWin(preset.pointsToWin);
    setWinByTwo(preset.winByTwo);
    setPointCap(preset.pointCap);
    setError(null);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload: UpdateCategoryRequest = {
        pointsToWin,
        winByTwo,
        pointCap,
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
        <Badge colorPalette={activePreset === 'CUSTOM' ? 'orange' : 'green'}>
          {t(`scoringRules.presets.${activePreset}`)}
        </Badge>
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={4}>
        {t('scoringRules.description')}
      </Text>

      {/* Preset chips */}
      <Flex gap={2} wrap="wrap" mb={5}>
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <Button
              key={preset.id}
              size="sm"
              variant={isActive ? 'solid' : 'outline'}
              onClick={() => handlePresetClick(preset)}
            >
              {t(`scoringRules.presets.${preset.id}`)}
            </Button>
          );
        })}
      </Flex>

      {/* Custom fields (always visible — preset just fills them) */}
      <Flex gap={4} wrap="wrap">
        <Field.Root maxW="160px">
          <Field.Label fontSize="sm">
            {t('scoringRules.pointsToWin')}
          </Field.Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={pointsToWin}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPointsToWin(Number.isFinite(next) ? next : 0);
            }}
          />
        </Field.Root>

        <Field.Root maxW="200px">
          <Field.Label fontSize="sm">{t('scoringRules.winByTwo')}</Field.Label>
          <Flex gap={2} align="center" h="40px">
            <Button
              size="sm"
              variant={winByTwo ? 'solid' : 'outline'}
              onClick={() => setWinByTwo(true)}
            >
              {t('scoringRules.yes')}
            </Button>
            <Button
              size="sm"
              variant={!winByTwo ? 'solid' : 'outline'}
              onClick={() => setWinByTwo(false)}
            >
              {t('scoringRules.no')}
            </Button>
          </Flex>
        </Field.Root>

        <Field.Root maxW="200px">
          <Field.Label fontSize="sm">{t('scoringRules.pointCap')}</Field.Label>
          <Flex gap={2} align="center">
            <Input
              type="number"
              min={pointsToWin}
              max={99}
              value={pointCap ?? ''}
              placeholder={t('scoringRules.noCap')}
              disabled={pointCap === null}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPointCap(Number.isFinite(next) && next > 0 ? next : null);
              }}
            />
            <Button
              size="sm"
              variant={pointCap === null ? 'solid' : 'outline'}
              onClick={() =>
                setPointCap((prev) => (prev === null ? DEFAULT_CAP : null))
              }
            >
              {pointCap === null
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
      {!isValid && (
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
