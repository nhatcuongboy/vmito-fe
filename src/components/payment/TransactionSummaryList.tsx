'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  Badge,
  Button,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TransactionSummary, HostTransactionSummary } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Receipt,
  TrendingUp,
  BellRing,
} from 'lucide-react';
import { StarRatingDisplay } from '@/components/rating';
import { getAvatarBgColor } from '@/lib/utils/avatarColor';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import TransactionSummarySkeleton from './TransactionSummarySkeleton';

interface TransactionSummaryListProps {
  summaries: (TransactionSummary | HostTransactionSummary)[];
  viewType: 'player' | 'host'; // player sees hosts, host sees players
  onSelectSummary: (
    summary: TransactionSummary | HostTransactionSummary
  ) => void;
  onRemindAggregate?: (summary: HostTransactionSummary) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  showOverallSummary?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function TransactionSummaryList({
  summaries,
  viewType,
  onSelectSummary,
  onRemindAggregate,
  isLoading = false,
  hasActiveFilters = false,
  showOverallSummary = true,
}: TransactionSummaryListProps) {
  const t = useTranslations('payment');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Reset pagination whenever the summaries list changes (filter applied etc.)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [summaries]);

  const visibleSummaries = summaries.slice(0, visibleCount);
  const hasMore = visibleCount < summaries.length;

  // Calculate totals
  const totalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidAmount = summaries.reduce((sum, s) => sum + s.paidAmount, 0);
  const pendingAmount = summaries.reduce((sum, s) => sum + s.pendingAmount, 0);
  const totalSessions = summaries.reduce((sum, s) => sum + s.totalSessions, 0);
  const collectedPercent =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  if (isLoading) {
    return <TransactionSummarySkeleton />;
  }

  if (summaries.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Flex
          w="64px"
          h="64px"
          mx="auto"
          mb={4}
          align="center"
          justify="center"
          borderRadius="full"
          bg="gray.100"
          _dark={{ bg: 'gray.800' }}
          color="fg.muted"
        >
          <Receipt size={28} />
        </Flex>
        <Text fontWeight="medium" mb={1}>
          {t('noTransactions')}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {hasActiveFilters
            ? t('noTransactionsFilterHint')
            : t('noTransactionsHint')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Overall Summary */}
      {showOverallSummary && (
        <Box
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
        >
          <HStack mb={2} justify="space-between" wrap="wrap">
            <HStack>
              <Box color="green.600" _dark={{ color: 'green.400' }}>
                <TrendingUp size={18} />
              </Box>
              <Text fontWeight="semibold">{t('overallSummary')}</Text>
            </HStack>
            <Text fontSize="xs" color="fg.muted">
              {t('playerCount', { count: summaries.length })} · {totalSessions}{' '}
              {t('sessions')}
            </Text>
          </HStack>

          {/* Collection progress */}
          <Box mb={3}>
            <Box
              h="8px"
              bg="gray.100"
              _dark={{ bg: 'gray.700' }}
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${collectedPercent}%`}
                bgGradient="to-r"
                gradientFrom="green.400"
                gradientTo="green.600"
                borderRadius="full"
                transition="width 0.4s ease"
              />
            </Box>
            <Text
              fontSize="xs"
              color="green.600"
              _dark={{ color: 'green.400' }}
              fontWeight="medium"
              mt={1}
            >
              {t('percentCollected', { percent: collectedPercent })}
            </Text>
          </Box>

          <Flex gap={4} wrap="wrap">
            <Box flex={1} minW="100px">
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                {t('total')}
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {FeeService.formatPaymentAmount(totalAmount)}
              </Text>
            </Box>
            <Box flex={1} minW="100px">
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                {t('paid')}
              </Text>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="green.600"
                _dark={{ color: 'green.400' }}
              >
                {FeeService.formatPaymentAmount(paidAmount)}
              </Text>
            </Box>
            <Box flex={1} minW="100px">
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                {t('pending')}
              </Text>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="yellow.600"
                _dark={{ color: 'yellow.400' }}
              >
                {FeeService.formatPaymentAmount(pendingAmount)}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Summary List */}
      <VStack gap={2} align="stretch">
        {visibleSummaries.map((summary) => {
          const isPlayerView = viewType === 'player';
          const name = isPlayerView
            ? (summary as TransactionSummary).hostName
            : (summary as HostTransactionSummary).userName;
          const image = !isPlayerView
            ? (summary as HostTransactionSummary).userImage
            : undefined;
          const hasPending = summary.pendingAmount > 0;

          return (
            <Box
              key={
                isPlayerView
                  ? (summary as TransactionSummary).hostId
                  : (summary as HostTransactionSummary).userId
              }
              bg="white"
              _dark={{
                bg: 'gray.800',
                borderColor: hasPending ? 'gray.700' : 'green.800',
              }}
              border="1px solid"
              borderColor={hasPending ? 'gray.200' : 'green.100'}
              borderLeft="4px solid"
              borderLeftColor={hasPending ? 'orange.400' : 'green.400'}
              borderRadius="lg"
              p={4}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
              onClick={() => onSelectSummary(summary)}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Avatar.Root size="md" bg={getAvatarBgColor(name)}>
                    {image ? (
                      <Avatar.Image src={normalizeImageUrl(image)} />
                    ) : (
                      <Avatar.Fallback name={name} color="white" />
                    )}
                  </Avatar.Root>
                  <Box>
                    <Text fontWeight="medium">{name}</Text>
                    <HStack gap={2} mt={1} color="fg.muted">
                      <Calendar size={12} />
                      <Text fontSize="xs">
                        {summary.totalSessions} {t('sessions')}
                      </Text>
                    </HStack>
                    {summary.averageRating !== undefined &&
                      (summary.totalRatings ?? 0) > 0 && (
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
                        <CheckCircle2 size={10} />
                        {t('fullyPaid')}
                      </Badge>
                    )}
                    {viewType === 'host' &&
                      summary.pendingAmount > 0 &&
                      onRemindAggregate && (
                        <Button
                          size="2xs"
                          variant="outline"
                          colorPalette="orange"
                          mt={1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemindAggregate(
                              summary as HostTransactionSummary
                            );
                          }}
                        >
                          <BellRing size={12} />
                          {t('remindPayment')}
                        </Button>
                      )}
                  </VStack>
                  <Box color="fg.muted">
                    <ChevronRight size={20} />
                  </Box>
                </HStack>
              </HStack>
            </Box>
          );
        })}

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            width="full"
            colorPalette="gray"
            mt={1}
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
          >
            <ChevronDown size={16} />
            {t('showMore', {
              count: Math.min(ITEMS_PER_PAGE, summaries.length - visibleCount),
            })}
          </Button>
        )}
      </VStack>
    </VStack>
  );
}
