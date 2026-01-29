'use client';

import { Control, useController, useWatch, UseFormSetValue } from 'react-hook-form';
import { VALID_LEVELS } from '@/constants/levels';
import { CourtDirection } from '@/lib/api/types';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { BarChart, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';

const CustomCheckbox = ({
  isChecked,
  onChange,
}: {
  isChecked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const boxSize = '24px';
  const iconSize = 16;

  return (
    <Box
      as="label"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <Box
        w={boxSize}
        h={boxSize}
        border="2px solid"
        borderColor={isChecked ? 'blue.500' : 'gray.300'}
        bg={isChecked ? 'blue.500' : 'white'}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.2s"
        _hover={{ borderColor: 'blue.600' }}
      >
        {isChecked && <Check size={iconSize} color="white" strokeWidth={3} />}
      </Box>
    </Box>
  );
};

interface LevelRequirementsCardProps {
  control: Control<any>;
  setValue: UseFormSetValue<{
    allLevelsSelected: boolean;
    requiredLevels?: number[];
    name: string;
    selectedVenueId: string;
    hostName: string;
    hostPhone: string;
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
  }>;
}

export default function LevelRequirementsCard({ control, setValue }: LevelRequirementsCardProps) {
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
    <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
      <Heading size="md" mb={2}>
        {t('generalSettings.requiredPlayerLevels')}
      </Heading>

      <Text fontSize="sm" color="gray.600" mb={4}>
        {t('generalSettings.selectRequiredLevels')}
      </Text>

      <Stack gap={4}>
        {/* All Levels Button */}
        <Box>
          <Button
            size="md"
            variant={allLevelsSelected ? 'solid' : 'outline'}
            colorPalette="blue"
            bg={allLevelsSelected ? 'blue.600' : 'gray.50'}
            color={allLevelsSelected ? 'white' : 'gray.800'}
            borderColor={allLevelsSelected ? 'blue.600' : 'gray.200'}
            onClick={handleSelectAllLevels}
            fontWeight={allLevelsSelected ? 'bold' : 'normal'}
            _hover={{
              bg: allLevelsSelected ? 'blue.700' : 'gray.100',
              borderColor: allLevelsSelected ? 'blue.700' : 'gray.300',
            }}
          >
            {t('generalSettings.allLevels')}
          </Button>
        </Box>

        {/* Level Selection */}
        <Wrap gap={3}>
          {VALID_LEVELS.map((level) => {
            const isSelected = !allLevelsSelected && requiredLevels.includes(level);
            const levelColor = getSkillLevelColor([level]);

            return (
              <WrapItem key={level}>
                <Button
                  size="md"
                  type="button"
                  // Using custom aesthetics to match the request
                  variant={isSelected ? 'solid' : 'outline'}
                  colorPalette={levelColor.colorPalette}
                  bg={isSelected ? levelColor.color : 'white'}
                  color={isSelected ? 'white' : 'gray.800'}
                  borderColor={isSelected ? levelColor.color : 'gray.200'}
                  borderWidth="1px"
                  onClick={() => handleLevelToggle(level)}
                  borderRadius="md"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  px={4}
                  py={2}
                  minW="80px"
                  _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'sm',
                    bg: isSelected ? undefined : 'gray.50'
                  }}
                  transition="all 0.2s"
                >
                  <HStack gap={2}>
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={isSelected ? 'white' : levelColor.color}
                      boxShadow={isSelected ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.1)"}
                    />
                    <Text>
                      {getLevelShortLabel(level)}
                    </Text>
                  </HStack>
                </Button>
              </WrapItem>
            );
          })}
        </Wrap>

        {/* Selected Levels Summary */}
        {!allLevelsSelected && requiredLevels.length > 0 && (
          <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.100">
            <Text fontSize="md" color="blue.800">
              <Text as="span" fontWeight="medium">{t('generalSettings.selectedLevels')}: </Text>
              {requiredLevels
                .sort((a: number, b: number) => a - b)
                .map((level: number) => getLevelShortLabel(level))
                .join(', ')}
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
