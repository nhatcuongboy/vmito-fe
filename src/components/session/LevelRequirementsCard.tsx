'use client';

import {
  Control,
  useController,
  useWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { VALID_LEVELS } from '@/constants/levels';
import { CourtDirection } from '@/lib/api/types';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface ILevelRequirementsFormValues {
  allLevelsSelected: boolean;
  requiredLevels?: number[];
  name: string;
  selectedVenueId: string;
  hostName: string;
  hostPhone?: string;
  startTime: string;
  endTime: string;
  courts: {
    direction: CourtDirection;
    courtNumber: number;
    courtName?: string;
  }[];
  courtColor: string;
  maxPlayersPerCourt: number;
  description?: string;
  requirePlayerInfo: boolean;
  allowGuestJoin: boolean;
  allowNewPlayers: boolean;
  shuttlecock?: string;
  defaultMatchType: 'SINGLES' | 'DOUBLES';
}

interface LevelRequirementsCardProps {
  control: Control<ILevelRequirementsFormValues>;
  setValue: UseFormSetValue<ILevelRequirementsFormValues>;
}

export default function LevelRequirementsCard({
  control,
  setValue,
}: LevelRequirementsCardProps) {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  // Watch the current values
  const allLevelsSelected = useWatch({ control, name: 'allLevelsSelected' });
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

    setValue('requiredLevels', newLevels);

    // If no levels are selected, revert to "All levels"
    if (newLevels.length === 0) {
      setValue('allLevelsSelected', true);
    }
  };

  const handleSelectAllLevels = () => {
    setValue('allLevelsSelected', true);
    setValue('requiredLevels', []);
  };

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="border"
    >
      <Heading size="md" mb={4}>
        {t('generalSettings.requiredPlayerLevels')}
      </Heading>

      {/* <Text fontSize="sm" color="fg.muted" mb={4}>
        {t('generalSettings.selectRequiredLevels')}
      </Text> */}

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
          h="34px"
          borderRadius="full"
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
        <Grid templateColumns="repeat(4, 1fr)" gap={1.5}>
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
                h="30px"
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
                  <Text fontSize="xs" fontWeight="medium">
                    {getLevelShortLabel(level)}
                  </Text>
                </HStack>
              </Button>
            );
          })}
        </Grid>

        {/* Selected Levels Summary */}
        {!allLevelsSelected && requiredLevels.length > 0 && (
          <Box
            p={3}
            bg={{ base: 'brand.50', _dark: 'brand.900/30' }}
            borderRadius="md"
            border="1px solid"
            borderColor={{ base: 'brand.200', _dark: 'brand.700' }}
          >
            <Flex align="center" gap={2} wrap="wrap">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={{ base: 'brand.800', _dark: 'brand.200' }}
              >
                {t('generalSettings.selectedLevels')}:
              </Text>
              <Flex gap={1.5} wrap="wrap">
                {requiredLevels
                  .sort((a: number, b: number) => a - b)
                  .map((level: number) => {
                    const levelColor = getSkillLevelColor([level]);
                    return (
                      <Badge
                        key={level}
                        colorPalette={levelColor.colorPalette}
                        variant="solid"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2.5}
                        py={0.5}
                        borderRadius="full"
                        borderWidth="1px"
                        borderColor={levelColor.borderColor}
                      >
                        {getLevelShortLabel(level)}
                      </Badge>
                    );
                  })}
              </Flex>
            </Flex>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
