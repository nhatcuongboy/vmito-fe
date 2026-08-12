'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { HostSessionsSectionTabs } from '@/components/session/HostSessionsSectionTabs';
import { PendingJoinRequestsPanel } from '@/components/session/PendingJoinRequestsPanel';
import PageLayout from '@/components/layout/PageLayout';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

function PendingJoinRequestsPageContent() {
  const t = useTranslations('navigation');

  return (
    <PageLayout
      title={t('sessions')}
      showBackButton={false}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      subHeader={<HostSessionsSectionTabs />}
      mobileSubHeaderOffset="52px"
      maxW="full"
      px={{ base: '24px', md: 0 }}
      hideTopBarBorder
      centerTitle
    >
      <Flex pt={{ md: 6 }} px={{ md: 6 }}>
        <Box flex={1} minW={0}>
          <Box maxW="960px" mx="auto" mt={4}>
            <PendingJoinRequestsPanel />
          </Box>
        </Box>
      </Flex>
    </PageLayout>
  );
}

export default function PendingJoinRequestsPage() {
  return (
    <ProtectedRouteGuard>
      <Suspense
        fallback={
          <Flex justify="center" align="center" minH="100vh">
            <Spinner size="xl" />
          </Flex>
        }
      >
        <PendingJoinRequestsPageContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
