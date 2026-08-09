'use client';

import { Badge, Box, Flex, HStack, Image, Stack, Text } from '@chakra-ui/react';
import { CalendarDays, Clock, Heart, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { Link } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { IClass } from '@/types/class';
import { useTranslations } from 'next-intl';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { sortLevelsByRank } from '@/constants/levels';

export const tuitionLabel = (item: IClass, contactLabel: string) => {
  if (item.tuitionPeriod === 'CONTACT') return contactLabel;
  const period = {
    PER_SESSION: '/ buổi',
    MONTHLY: '/ tháng',
    COURSE: '/ khóa',
  }[item.tuitionPeriod];
  return `${(item.tuitionAmount || 0).toLocaleString('vi-VN')}đ ${period}`;
};

export function ClassCard({
  item,
  onFavorite,
  variant = 'grid',
  imagePriority = false,
}: {
  item: IClass;
  onFavorite?: (item: IClass) => void;
  variant?: 'grid' | 'list';
  imagePriority?: boolean;
}) {
  const t = useTranslations('classes');
  const { getLevelShortLabel } = useLevelLabel();
  const location =
    item.venue?.name || item.customLocationName || t('locationPending');
  const levelText = item.requiredLevels.length
    ? sortLevelsByRank(item.requiredLevels).map(getLevelShortLabel).join(', ')
    : t('allLevels');
  const schedule = item.schedules[0];
  const scheduleText = schedule
    ? `${t(`dayNames.${schedule.dayOfWeek}`)} · ${schedule.startTime}-${schedule.endTime}`
    : t('schedulePending');
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderColor="gray.200"
      position="relative"
      cursor="pointer"
      transition="all .25s ease"
      _hover={{
        shadow: 'xl',
        transform: 'translateY(-2px)',
        borderColor: 'green.400',
      }}
      display={variant === 'list' ? 'flex' : 'block'}
      flexDirection={variant === 'list' ? 'column' : undefined}
    >
      <Link href={`/classes/${item.slug}`} style={{ display: 'block' }}>
        <Image
          src={item.coverPhoto || item.images?.[0] || DEFAULT_COVER_PHOTO}
          alt={item.name}
          h="150px"
          w="100%"
          objectFit="cover"
          loading={imagePriority ? 'eager' : 'lazy'}
          fetchPriority={imagePriority ? 'high' : 'auto'}
        />
      </Link>
      <Stack gap="2" p="4" flex="1" minW="0">
        <HStack justify="space-between" align="start">
          <Link href={`/classes/${item.slug}`}>
            <Text fontWeight="bold" lineClamp={2}>
              {item.name}
            </Text>
          </Link>
          {onFavorite && (
            <Button
              aria-label={t('saveClass')}
              variant="ghost"
              size="sm"
              onClick={() => onFavorite(item)}
            >
              <Heart
                size={18}
                fill={item.isFavorite ? 'currentColor' : 'none'}
              />
            </Button>
          )}
        </HStack>
        <HStack fontSize="sm" color="fg.muted">
          <MapPin size={15} />
          <Text lineClamp={1}>{location}</Text>
        </HStack>
        <HStack justify="space-between">
          <Badge colorPalette="green">
            {item.sportType === 'PICKLEBALL' ? t('pickleball') : t('badminton')}
          </Badge>
          <Text fontSize="sm" fontWeight="semibold">
            {tuitionLabel(item, t('contactTuition'))}
          </Text>
        </HStack>
        {item.status !== 'PUBLISHED' && (
          <Badge
            width="fit-content"
            colorPalette={item.status === 'CLOSED' ? 'red' : 'gray'}
          >
            {item.status === 'CLOSED' ? t('closed') : t('notPublished')}
          </Badge>
        )}
        <Flex gap={3} fontSize="xs" color="fg.muted" wrap="wrap">
          <HStack gap={1}>
            <TrendingUp size={13} />
            <Text>{levelText}</Text>
          </HStack>
          <HStack gap={1}>
            <Clock size={13} />
            <Text>{scheduleText}</Text>
          </HStack>
          {item.schedules.length > 1 && (
            <HStack gap={1}>
              <CalendarDays size={13} />
              <Text>+{item.schedules.length - 1}</Text>
            </HStack>
          )}
        </Flex>
        {item.distance !== null && item.distance !== undefined && (
          <Text fontSize="xs" color="fg.muted">
            {t('distance', { distance: item.distance })}
          </Text>
        )}
      </Stack>
    </Box>
  );
}
