'use client';

import { Badge, Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useLevelDescriptions } from '@/hooks/useLevelDescriptions';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';

interface LevelDescriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelDescriptionsModal({
  isOpen,
  onClose,
}: LevelDescriptionsModalProps) {
  const t = useTranslations('common.levelDescriptions');
  const { getLevelLabel, getLevelShortLabel } = useLevelLabel();
  const { descriptions, isLoading, error } = useLevelDescriptions({
    enabled: isOpen,
  });

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      size="lg"
      hideSecondaryAction
      maxBodyHeight={{ base: '70vh', md: '65vh' }}
    >
      {isLoading ? (
        <HStack justify="center" py={8}>
          <Spinner size="sm" />
          <Text color="fg.muted">{t('loading')}</Text>
        </HStack>
      ) : error ? (
        <Box
          borderWidth="1px"
          borderColor="red.200"
          bg={{ base: 'red.50', _dark: 'red.950/30' }}
          color={{ base: 'red.700', _dark: 'red.200' }}
          borderRadius="md"
          p={4}
        >
          {t('loadFailed')}
        </Box>
      ) : (
        <VStack align="stretch" gap={3}>
          {descriptions.map(({ level, description }) => {
            const levelColor = getSkillLevelColor([level]);

            return (
              <Box
                key={level}
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                p={3}
              >
                <HStack align="center" gap={2} mb={2}>
                  <Badge
                    colorPalette={levelColor.colorPalette}
                    variant="solid"
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                    borderWidth="1px"
                    borderColor={levelColor.borderColor}
                  >
                    {getLevelShortLabel(level)}
                  </Badge>
                  <Text fontWeight="semibold">{getLevelLabel(level)}</Text>
                </HStack>
                <Text color="fg.muted" whiteSpace="pre-wrap">
                  {description.trim() || t('empty')}
                </Text>
              </Box>
            );
          })}
        </VStack>
      )}
    </VModal>
  );
}
