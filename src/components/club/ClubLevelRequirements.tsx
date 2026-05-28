'use client';

import {
  Control,
  useController,
  useWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { VALID_LEVELS } from '@/constants/levels';
import { Box, Grid, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useState } from 'react';
import LevelDescriptionsModal from '@/components/session/LevelDescriptionsModal';

interface ClubLevelRequirementsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
}

export default function ClubLevelRequirements({
  control,
  setValue,
}: ClubLevelRequirementsProps) {
  const t = useTranslations('session');
  const tLevelDescriptions = useTranslations('common.levelDescriptions');
  const { getLevelShortLabel } = useLevelLabel();
  const [isDescriptionsOpen, setIsDescriptionsOpen] = useState(false);

  // Watch the current values
  const allLevelsSelected =
    useWatch({ control, name: 'allLevelsSelected' }) ?? true;
  const requiredLevels = useWatch({ control, name: 'requiredLevels' }) || [];

  // Controller for the checkbox
  useController({
    control,
    name: 'allLevelsSelected',
  });

  const handleLevelToggle = (level: number) => {
    const currentLevels = requiredLevels || [];
    let newLevels;

    if (allLevelsSelected) {
      // If switching from "All levels" to specific selection, start with just this level
      newLevels = [level];
      setValue('allLevelsSelected', false);
    } else {
      // Toggle logic
      newLevels = currentLevels.includes(level)
        ? currentLevels.filter((l: number) => l !== level)
        : [...currentLevels, level];
    }

    setValue('requiredLevels', newLevels, { shouldDirty: true });

    // If no levels are selected, revert to "All levels"
    if (newLevels.length === 0) {
      setValue('allLevelsSelected', true);
    }
  };

  const handleSelectAllLevels = () => {
    setValue('allLevelsSelected', true, { shouldDirty: true });
    setValue('requiredLevels', [], { shouldDirty: true });
  };

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      p={5}
      borderRadius="2xl"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
      _dark={{ borderColor: 'gray.700' }}
    >
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md">{t('requiredLevels')}</Heading>
        <IconButton
          aria-label={tLevelDescriptions('open')}
          type="button"
          size="xs"
          variant="ghost"
          colorPalette="gray"
          icon={<Info size={13} />}
          onClick={(event) => {
            event.stopPropagation();
            setIsDescriptionsOpen(true);
          }}
        />
      </HStack>

      <Stack gap={3}>
        {/* All Levels Button */}
        <Button
          type="button"
          size="sm"
          width="full"
          variant={allLevelsSelected ? 'subtle' : 'outline'}
          colorPalette="green"
          onClick={handleSelectAllLevels}
          fontWeight="semibold"
          h="36px"
          borderRadius="xl"
          transition="all 0.15s ease"
          _hover={{
            transform: 'translateY(-1px)',
            shadow: 'sm',
          }}
        >
          <HStack gap={2}>
            {allLevelsSelected && <Check size={18} strokeWidth={3} />}
            <Text>{t('generalSettings.allLevels')}</Text>
          </HStack>
        </Button>

        {/* All Levels in One Row */}
        <Grid templateColumns="repeat(4, 1fr)" gap={2}>
          {VALID_LEVELS.map((level) => {
            const isSelected =
              !allLevelsSelected && requiredLevels.includes(level);
            const levelColor = getSkillLevelColor([level]);

            return (
              <Button
                key={level}
                size="sm"
                type="button"
                w="full"
                variant={isSelected ? 'solid' : 'outline'}
                colorPalette={levelColor.colorPalette}
                borderColor={isSelected ? undefined : levelColor.borderColor}
                borderWidth="2px"
                onClick={() => handleLevelToggle(level)}
                borderRadius="full"
                fontWeight="medium"
                h="34px"
                px={2}
                _hover={{
                  transform: 'translateY(-1px)',
                  shadow: 'sm',
                  borderColor: levelColor.borderColor,
                }}
                transition="all 0.15s ease"
              >
                <HStack gap={1.5}>
                  {isSelected && <Check size={13} strokeWidth={3} />}
                  <Text fontSize="xs" fontWeight="bold">
                    {getLevelShortLabel(level)}
                  </Text>
                </HStack>
              </Button>
            );
          })}
        </Grid>
      </Stack>

      <LevelDescriptionsModal
        isOpen={isDescriptionsOpen}
        onClose={() => setIsDescriptionsOpen(false)}
      />
    </Box>
  );
}
