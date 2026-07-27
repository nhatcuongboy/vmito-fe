'use client';

import { useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  HStack,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import UsersStatsSection from './_components/UsersStatsSection';
import SessionsTournamentsStatsSection from './_components/SessionsTournamentsStatsSection';
import ClubsVenuesStatsSection from './_components/ClubsVenuesStatsSection';

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, t]);

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title={t('dashboard.title')}>
      <Container maxW="container.xl" py={8}>
        <VStack gap={8} align="stretch">
          <HStack gap={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="green.100"
              _dark={{ bg: 'green.900/30' }}
              color="green.600"
            >
              <LayoutDashboard size={24} />
            </Box>
            <Box>
              <Heading size="lg">{t('dashboard.title')}</Heading>
              <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                {t('dashboard.subtitle')}
              </Text>
            </Box>
          </HStack>

          <Separator />

          <VStack gap={3} align="stretch">
            <Heading size="md">{t('dashboard.users.sectionTitle')}</Heading>
            <UsersStatsSection />
          </VStack>

          <VStack gap={3} align="stretch">
            <Heading size="md">
              {t('dashboard.sessionsTournaments.sectionTitle')}
            </Heading>
            <SessionsTournamentsStatsSection />
          </VStack>

          <VStack gap={3} align="stretch">
            <Heading size="md">
              {t('dashboard.clubsVenues.sectionTitle')}
            </Heading>
            <ClubsVenuesStatsSection />
          </VStack>
        </VStack>
      </Container>
    </MainLayout>
  );
}
