'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import {
  IPointsAdminOverview,
  RankingService,
} from '@/lib/api/ranking.service';
import { PointsStatsCard } from './PointsStatsCard';
import { PointsRulesCard } from './PointsRulesCard';
import { PointsBackfillCard } from './PointsBackfillCard';

export default function AdminPointsPage() {
  const t = useTranslations('admin.points');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();

  const [overview, setOverview] = useState<IPointsAdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: tAdmin('accessDenied') });
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, tAdmin]);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      setOverview(await RankingService.getAdminOverview());
    } catch (error) {
      console.error('Failed to load points overview:', error);
      toaster.error({ title: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchOverview();
  }, [isAdmin, fetchOverview]);

  if (!isHydrated || !isAdmin) return null;

  return (
    <MainLayout title={t('title')}>
      <Container maxW="container.lg" py={8}>
        <VStack gap={8} align="stretch">
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <HStack gap={3}>
              <Box
                p={3}
                borderRadius="lg"
                bg="yellow.100"
                _dark={{ bg: 'yellow.900/30' }}
                color="yellow.600"
              >
                <Sparkles size={24} />
              </Box>
              <Box>
                <Heading size="lg">{t('title')}</Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                  {t('subtitle')}
                </Text>
              </Box>
            </HStack>
            <Button
              variant="outline"
              onClick={() => void fetchOverview()}
              loading={isLoading}
            >
              {t('refresh')}
            </Button>
          </Flex>

          <Separator />

          {isLoading && !overview ? (
            <Flex justify="center" py={16}>
              <Spinner size="lg" color="brand.500" />
            </Flex>
          ) : overview ? (
            <>
              <PointsStatsCard stats={overview.stats} />
              <PointsBackfillCard onCompleted={() => void fetchOverview()} />
              <PointsRulesCard config={overview.config} />
            </>
          ) : (
            <Text color="gray.500" textAlign="center" py={12}>
              {t('loadError')}
            </Text>
          )}
        </VStack>
      </Container>
    </MainLayout>
  );
}
