'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { TransactionSummary, HostTransactionSummary } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { User, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { StarRatingDisplay } from '@/components/rating';

interface TransactionSummaryListProps {
  summaries: (TransactionSummary | HostTransactionSummary)[];
  viewType: 'player' | 'host'; // player sees hosts, host sees players
  onSelectSummary: (
    summary: TransactionSummary | HostTransactionSummary
  ) => void;
  isLoading?: boolean;
}

export default function TransactionSummaryList({
  summaries,
  viewType,
  onSelectSummary,
  isLoading = false,
}: TransactionSummaryListProps) {
  const t = useTranslations('payment');

  // Calculate totals
  const totalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidAmount = summaries.reduce((sum, s) => sum + s.paidAmount, 0);
  const pendingAmount = summaries.reduce((sum, s) => sum + s.pendingAmount, 0);

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">{t('loading')}</Text>
      </Box>
    );
  }

  if (summaries.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">{t('noTransactions')}</Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Overall Summary */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <HStack mb={3}>
          <TrendingUp size={18} color="#179a3b" />
          <Text fontWeight="semibold">{t('overallSummary')}</Text>
        </HStack>

        <Flex gap={4} wrap="wrap">
          <Box flex={1} minW="100px">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
              {t('total')}
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {FeeService.formatPaymentAmount(totalAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="100px">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
              {t('paid')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {FeeService.formatPaymentAmount(paidAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="100px">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
              {t('pending')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="yellow.600">
              {FeeService.formatPaymentAmount(pendingAmount)}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Summary List */}
      <VStack gap={2} align="stretch">
        {summaries.map((summary) => {
          const isPlayerView = viewType === 'player';
          const name = isPlayerView
            ? (summary as TransactionSummary).hostName
            : (summary as HostTransactionSummary).userName;
          const image = !isPlayerView
            ? (summary as HostTransactionSummary).userImage
            : undefined;

          return (
            <Box
              key={
                isPlayerView
                  ? (summary as TransactionSummary).hostId
                  : (summary as HostTransactionSummary).userId
              }
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
              onClick={() => onSelectSummary(summary)}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Avatar.Root size="md">
                    {image ? (
                      <Avatar.Image src={image} />
                    ) : (
                      <Avatar.Fallback>
                        <User size={20} />
                      </Avatar.Fallback>
                    )}
                  </Avatar.Root>
                  <Box>
                    <Text fontWeight="medium">{name}</Text>
                    <HStack gap={2} mt={1}>
                      <Calendar size={12} color="#718096" />
                      <Text fontSize="xs" color="gray.500">
                        {summary.totalSessions} {t('sessions')}
                      </Text>
                    </HStack>
                    {summary.averageRating !== undefined && (
                      <Box mt={1}>
                        <StarRatingDisplay
                          rating={summary.averageRating}
                          count={summary.totalRatings}
                          size="xs"
                          variant="compact"
                        />
                      </Box>
                    )}
                  </Box>
                </HStack>

                <HStack gap={3}>
                  <VStack gap={0} align="flex-end">
                    <Text fontSize="sm" fontWeight="bold">
                      {FeeService.formatPaymentAmount(summary.totalAmount)}
                    </Text>
                    {summary.pendingAmount > 0 ? (
                      <Badge colorPalette="yellow" fontSize="xs">
                        {t('pending')}:{' '}
                        {FeeService.formatPaymentAmount(summary.pendingAmount)}
                      </Badge>
                    ) : (
                      <Badge colorPalette="green" fontSize="xs">
                        {t('fullyPaid')}
                      </Badge>
                    )}
                  </VStack>
                  <ChevronRight size={20} color="#A0AEC0" />
                </HStack>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
}
