'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  VenueRentalPaymentSummary,
  VenueRentalRequest,
  VenueRentalTransactionPurpose,
  VenueRentalTransactionStatus,
} from '@/lib/api/types';
import { useNotificationStore } from '@/stores/useNotificationStore';

type AttentionItem = {
  rental: VenueRentalRequest;
  summary: VenueRentalPaymentSummary;
};

export default function RentalPaymentAttention({
  rentals,
}: {
  rentals: VenueRentalRequest[];
}) {
  const t = useTranslations('venueRental.payment.dashboard');
  const notifications = useNotificationStore((state) => state.notifications);
  const [items, setItems] = useState<AttentionItem[]>([]);

  const latestPaymentNotification = notifications.find(
    (item) =>
      String(item.type).toUpperCase() === 'VENUE_RENTAL' &&
      item.data?.route === 'rental-payment'
  )?.id;

  const load = useCallback(async () => {
    if (!rentals.length) {
      setItems([]);
      return;
    }
    const results = await Promise.allSettled(
      rentals.map((rental) =>
        VenueRentalService.getPaymentSummary(rental.id, {
          skipGlobalError: true,
        })
      )
    );
    setItems(
      results.flatMap((result, index) =>
        result.status === 'fulfilled'
          ? [{ rental: rentals[index], summary: result.value }]
          : []
      )
    );
  }, [rentals]);

  useEffect(() => {
    load();
  }, [latestPaymentNotification, load]);

  const now = Date.now();
  const sections = [
    {
      key: 'depositDue',
      color: 'orange',
      items: items.filter(({ summary }) => {
        if (
          !summary.depositDueAt ||
          summary.depositPaid >= summary.depositAmount
        )
          return false;
        const dueAt = new Date(summary.depositDueAt).getTime();
        return dueAt > now && dueAt - now <= 2 * 60 * 60 * 1000;
      }),
    },
    {
      key: 'balanceOverdue',
      color: 'red',
      items: items.filter(({ summary }) => summary.balanceStatus === 'OVERDUE'),
    },
    {
      key: 'refundPending',
      color: 'purple',
      items: items.filter(({ summary }) =>
        summary.transactions.some(
          (transaction) =>
            transaction.purpose === VenueRentalTransactionPurpose.REFUND &&
            transaction.status === VenueRentalTransactionStatus.PENDING
        )
      ),
    },
  ].filter((section) => section.items.length > 0);

  if (!sections.length) return null;

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={3}>
      {sections.map((section) => (
        <Box key={section.key} borderWidth="1px" borderRadius="lg" p={3}>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="semibold">{t(section.key)}</Text>
            <Badge colorPalette={section.color}>{section.items.length}</Badge>
          </HStack>
          <VStack align="stretch" gap={1}>
            {section.items.slice(0, 4).map(({ rental }) => (
              <Link
                key={rental.id}
                href={`/manage/venues/rentals/${rental.id}#rental-payment`}
              >
                <Box
                  px={2}
                  py={1.5}
                  borderRadius="md"
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                >
                  <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                    {rental.contactName} · {rental.venue.name}
                  </Text>
                </Box>
              </Link>
            ))}
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
}
