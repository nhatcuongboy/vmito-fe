'use client';

import { Container, Tabs, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import ToCollectTab from './_components/ToCollectTab';
import ToPayTab from './_components/ToPayTab';

function RemindersContent() {
  const t = useTranslations('paymentReminder');

  return (
    <Container maxW="4xl" px={{ base: 3, md: 6 }} py={{ base: 3, md: 5 }}>
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="fg.muted">
          {t('pageDescription')}
        </Text>

        <Tabs.Root defaultValue="toCollect" variant="enclosed" lazyMount>
          <Tabs.List>
            <Tabs.Trigger value="toCollect">{t('tabToCollect')}</Tabs.Trigger>
            <Tabs.Trigger value="toPay">{t('tabToPay')}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="toCollect" pt={4}>
            <ToCollectTab />
          </Tabs.Content>

          <Tabs.Content value="toPay" pt={4}>
            <ToPayTab />
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

export default function RemindersPage() {
  const t = useTranslations('paymentReminder');

  return (
    <ProtectedRouteGuard>
      <PageLayout title={t('title')}>
        <RemindersContent />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
