'use client';
import { UserRole } from '@/lib/api/types';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import SessionsList from '@/components/session/SessionsList';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { Box, Container, Flex, Heading, VStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '@/constants';
import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import PageWrapper from '@/components/layout/PageWrapper';

function HostSessionsContent() {
  const t = useTranslations('pages.host');
  const [filters, setFilters] = useState<ISessionFilterState>({});

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <PageWrapper minH="100vh">
        {/* Top Bar */}
        <TopBar
          showBackButton={true}
          backHref="/host/dashboard"
          title={t('title')}
        />

        <Container
          maxW="7xl"
          px={CONTAINER_PX}
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          }}
          pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        >
          {/* My Sessions Content Only */}
          <Flex mb={6} justify="space-between" alignItems="center">
            <Heading as="h2" size="xl" textAlign="left">
              {t('header')}
            </Heading>
            <NextLinkButton href="/sessions/new" colorPalette="blue">
              <Plus className="mr-2 h-4 w-4" /> {t('createNewSession')}
            </NextLinkButton>
          </Flex>

          <SessionFilters
            onFilterChange={handleFilterChange}
            showStatusFilter={true}
            showDateFilter={true}
            showSearchFilter={true}
            showLevelFilter={false}
          />

          <VStack gap={6} alignItems="stretch">
            <SessionsList status={filters.status || 'ALL'} mode="manage" />
          </VStack>
        </Container>
      </PageWrapper>
    </ProtectedRouteGuard>
  );
}

export default function HostSessionsPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense>
        <HostSessionsContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
