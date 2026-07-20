'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { Box, Flex, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import VenuePricingManager from '@/components/venue/VenuePricingManager';
import { VButton } from '@/components/ui/VButton';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { UserRole, Venue, VenuePriceBook } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';

function PricingPageSkeleton() {
  return (
    <VStack align="stretch" gap={5} aria-label="Loading">
      <Flex justify="space-between" gap={4}>
        <Box flex={1}>
          <Skeleton height="24px" maxW="240px" />
          <Skeleton height="16px" maxW="420px" mt={2} />
        </Box>
        <Skeleton height="40px" width="180px" />
      </Flex>
      <Skeleton height="180px" borderRadius="xl" />
      <Skeleton height="320px" borderRadius="xl" />
    </VStack>
  );
}

export default function VenuePricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('adminVenuePricing');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [priceBooks, setPriceBooks] = useState<VenuePriceBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [venueData, bookData] = await Promise.all([
        VenueService.getVenue(id),
        VenueService.getPriceBooks(id),
      ]);
      setVenue(venueData);
      setPriceBooks(bookData);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.AUTH.SIGNIN);
      return;
    }
    if (user?.role !== UserRole.ADMIN) {
      toaster.error({ title: tAdmin('accessDenied') });
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    loadPageData();
  }, [isAuthenticated, isHydrated, loadPageData, router, tAdmin, user?.role]);

  const title = venue
    ? t('pageTitleWithVenue', { name: venue.name })
    : t('pageTitle');

  return (
    <PageLayout title={title} showBackButton backHref={ROUTES.ADMIN.VENUES}>
      <Box maxW="container.xl" mx="auto" w="full">
        {!isHydrated || !isAuthenticated || user?.role !== UserRole.ADMIN ? (
          <PricingPageSkeleton />
        ) : isLoading ? (
          <PricingPageSkeleton />
        ) : loadError || !venue ? (
          <VStack
            bg={{ base: 'white', _dark: 'gray.900' }}
            borderWidth="1px"
            borderColor={{ base: 'red.200', _dark: 'red.800' }}
            borderRadius="xl"
            p={{ base: 8, md: 12 }}
            textAlign="center"
            gap={3}
          >
            <Text fontWeight="semibold">{t('loadErrorTitle')}</Text>
            <Text fontSize="sm" color="gray.500">
              {t('loadErrorDescription')}
            </Text>
            <VButton type="button" mt={2} onClick={loadPageData}>
              {t('retry')}
            </VButton>
          </VStack>
        ) : (
          <Suspense fallback={<PricingPageSkeleton />}>
            <VenuePricingManager venue={venue} initialPriceBooks={priceBooks} />
          </Suspense>
        )}
      </Box>
    </PageLayout>
  );
}
