'use client';

import { Badge, Box, HStack, Image, Stack, Text } from '@chakra-ui/react';
import { Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { Link } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { IClass } from '@/types/class';

const tuitionLabel = (item: IClass) => {
  if (item.tuitionPeriod === 'CONTACT') return 'Liên hệ học phí';
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
}: {
  item: IClass;
  onFavorite?: (item: IClass) => void;
}) {
  const location =
    item.venue?.name || item.customLocationName || 'Chưa cập nhật địa điểm';
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      bg="bg.panel"
      position="relative"
    >
      <Link href={`/classes/${item.slug}`}>
        <Image
          src={item.coverPhoto || item.images?.[0] || DEFAULT_COVER_PHOTO}
          alt={item.name}
          h="150px"
          w="100%"
          objectFit="cover"
        />
      </Link>
      <Stack gap="2" p="4">
        <HStack justify="space-between" align="start">
          <Link href={`/classes/${item.slug}`}>
            <Text fontWeight="bold" lineClamp={2}>
              {item.name}
            </Text>
          </Link>
          {onFavorite && (
            <Button
              aria-label="Lưu lớp"
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
            {item.sportType === 'PICKLEBALL' ? 'Pickleball' : 'Cầu lông'}
          </Badge>
          <Text fontSize="sm" fontWeight="semibold">
            {tuitionLabel(item)}
          </Text>
        </HStack>
        {item.distance !== null && item.distance !== undefined && (
          <Text fontSize="xs" color="fg.muted">
            Cách bạn {item.distance} km
          </Text>
        )}
      </Stack>
    </Box>
  );
}
