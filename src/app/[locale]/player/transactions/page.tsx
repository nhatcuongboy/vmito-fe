'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  HStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Receipt } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { TransactionSummaryList } from '@/components/payment';
import { PaymentService } from '@/lib/api/payment.service';
import {
  TransactionSummary,
  HostTransactionSummary,
  UserRole,
} from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

function PlayerTransactionsContent() {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [summaries, setSummaries] = useState<TransactionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await PaymentService.getMyTransactionSummary();
      setSummaries(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('loadTransactionsFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSelectSummary = (
    summary: TransactionSummary | HostTransactionSummary
  ) => {
    // TODO: Navigate to detailed view or open modal
    console.log('Selected summary:', summary);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">
          {tCommon('loading')}
        </Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={6} pt={20}>
      <HStack mb={6}>
        <Receipt size={24} color="#3182ce" />
        <Heading size="lg">{t('transactionHistory')}</Heading>
      </HStack>

      <Text color="gray.600" mb={6}>
        {t('playerTransactionsDescription')}
      </Text>

      <TransactionSummaryList
        summaries={summaries}
        viewType="player"
        onSelectSummary={handleSelectSummary}
        isLoading={isLoading}
      />
    </Container>
  );
}

export default function PlayerTransactionsPage() {
  const t = useTranslations('payment');

  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}
    >
      <Suspense>
        <Box minH="100vh">
          <TopBar title={t('transactionHistory')} />
          <PlayerTransactionsContent />
        </Box>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
