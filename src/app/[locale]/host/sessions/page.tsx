'use client';
import { UserRole, SessionStatus } from '@/lib/api/types';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import SessionsList from '@/components/session/SessionsList';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { Box, Container, Flex, Heading, VStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

function HostSessionsContent() {
  const t = useTranslations('pages.host');
  // const common = useTranslations('common');
  const [status, setStatus] = useState<string>('ALL');

  const statusOptions = [
    { value: 'ALL', label: t('sessionStatus.all') },
    { value: SessionStatus.PREPARING, label: t('sessionStatus.preparing') },
    { value: SessionStatus.IN_PROGRESS, label: t('sessionStatus.inProgress') },
    { value: SessionStatus.FINISHED, label: t('sessionStatus.finished') },
  ];

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Box minH="100vh">
        {/* Top Bar */}
        <TopBar
          showBackButton={true}
          backHref="/host/dashboard"
          title={t('title')}
        />

        <Container
          maxW="7xl"
          p={4}
          pt={{
            base: 'calc(44px + env(safe-area-inset-top) + 24px)',
            md: 'calc(56px + env(safe-area-inset-top) + 24px)',
          }}
          pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        >
          {/* Filter */}
          <Flex mb={4} justify="flex-end">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E0',
                minWidth: 160,
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Flex>
          {/* My Sessions Content Only */}
          <Flex mb={6} justify="space-between" alignItems="center">
            <Heading as="h2" size="xl" textAlign="left">
              {t('header')}
            </Heading>
            <NextLinkButton href="/host/sessions/new" colorPalette="blue">
              <Plus className="mr-2 h-4 w-4" /> {t('createNewSession')}
            </NextLinkButton>
          </Flex>
          <VStack gap={6} alignItems="stretch">
            <SessionsList status={status} mode="manage" />
          </VStack>
        </Container>
      </Box>
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
