'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { Plus } from 'lucide-react';
import SessionsList from '@/components/session/SessionsList';
import { useState } from 'react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';

export default function HostSessionsPage() {
  const t = useTranslations('pages.host');
  const common = useTranslations('common');
  const [status, setStatus] = useState<string>('ALL');

  const statusOptions = [
    { value: 'ALL', label: t('sessionStatus.all') },
    { value: 'PREPARING', label: t('sessionStatus.preparing') },
    { value: 'IN_PROGRESS', label: t('sessionStatus.inProgress') },
    { value: 'FINISHED', label: t('sessionStatus.finished') },
  ];

  return (
    <ProtectedRouteGuard requiredRole={['HOST']}>
      <Box minH="100vh">
        {/* Top Bar */}
        <TopBar showBackButton={true} backHref="/dashboard" title={t('dashboard')} />

        <Container maxW="7xl" p={4} pt={24}>
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
            <Heading size="md">{t('mySessions')}</Heading>
            <NextLinkButton href="/host/sessions/new">
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
