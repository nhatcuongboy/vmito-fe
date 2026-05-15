'use client';

import { Badge, BadgeProps, Box, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { VTooltip } from '@/components/ui/VTooltip';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useLevelDescriptions } from '@/hooks/useLevelDescriptions';

interface LevelBadgeWithDescriptionProps extends BadgeProps {
  level: number;
  children: React.ReactNode;
}

export default function LevelBadgeWithDescription({
  level,
  children,
  ...badgeProps
}: LevelBadgeWithDescriptionProps) {
  const t = useTranslations('common.levelDescriptions');
  const { getLevelLabel } = useLevelLabel();
  const { descriptionMap } = useLevelDescriptions();
  const description = descriptionMap.get(level)?.trim();

  return (
    <VTooltip
      disabled={!description}
      showArrow
      openDelay={150}
      content={
        <Box maxW="280px">
          <Text fontWeight="bold" mb={1}>
            {getLevelLabel(level)}
          </Text>
          <Text fontWeight="normal" whiteSpace="pre-wrap">
            {description || t('empty')}
          </Text>
        </Box>
      }
    >
      <Badge {...badgeProps}>{children}</Badge>
    </VTooltip>
  );
}
