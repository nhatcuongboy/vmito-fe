'use client';

import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CalendarClock, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { VenueRentalRequest } from '@/lib/api/types';
import RentalStatusBadge from './RentalStatusBadge';

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value);

export default function RentalRequestCard({
  request,
  manage = false,
}: {
  request: VenueRentalRequest;
  manage?: boolean;
}) {
  const t = useTranslations('venueRental');
  const router = useRouter();
  const startTime =
    request.confirmedStartTime || request.quote?.startTime || request.createdAt;
  const amount = request.confirmedAmount ?? request.quote?.totalAmount ?? 0;
  const currency =
    request.confirmedCurrency || request.quote?.currency || 'VND';

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={4}
      bg={{ base: 'white', _dark: 'gray.900' }}
      cursor="pointer"
      _hover={{ borderColor: 'green.400', shadow: 'sm' }}
      onClick={() =>
        router.push(
          manage
            ? `/manage/venues/rentals/${request.id}`
            : `/my/rentals/${request.id}`
        )
      }
    >
      <HStack justify="space-between" align="start" mb={3}>
        <VStack align="start" gap={0} minW={0}>
          <Text fontWeight="bold" lineClamp={1}>
            {request.venue.name}
          </Text>
          <HStack color="gray.500" fontSize="sm">
            <MapPin size={14} />
            <Text lineClamp={1}>{request.venue.address}</Text>
          </HStack>
        </VStack>
        <RentalStatusBadge status={request.status} />
      </HStack>
      <HStack justify="space-between" align="end">
        <HStack color="gray.600">
          <CalendarClock size={16} />
          <Text fontSize="sm">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: request.venue.timezone,
            }).format(new Date(startTime))}
          </Text>
        </HStack>
        <VStack align="end" gap={0}>
          <Text fontWeight="bold" color="green.700">
            {money(amount, currency)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {t('card.courts', {
              count:
                request.confirmedNumberOfCourts ||
                request.quote?.numberOfCourts ||
                0,
            })}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
