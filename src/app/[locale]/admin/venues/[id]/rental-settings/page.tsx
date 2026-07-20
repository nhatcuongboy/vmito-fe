'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Box, Flex, Skeleton, Text, VStack } from '@chakra-ui/react';
import { Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import VenueRentalSettings from '@/components/venue-rental/VenueRentalSettings';
import { VButton } from '@/components/ui/VButton';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Link, useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { UserRole, Venue } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';

function RentalSettingsSkeleton() {
  return (
    <VStack align="stretch" gap={4} aria-label="Loading">
      <Skeleton height="44px" maxW="280px" />
      <Skeleton height="180px" borderRadius="xl" />
      <Skeleton height="320px" borderRadius="xl" />
    </VStack>
  );
}

export default function VenueRentalSettingsPage({
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadVenue = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      setVenue(await VenueService.getVenue(id));
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
    loadVenue();
  }, [isAuthenticated, isHydrated, loadVenue, router, tAdmin, user?.role]);

  const title = venue
    ? t('rentalSettingsTitleWithVenue', { name: venue.name })
    : t('rentalSettingsTitle');

  return (
    <PageLayout title={title} showBackButton backHref={ROUTES.ADMIN.VENUES}>
      <Box maxW="container.lg" mx="auto" w="full">
        {!isHydrated || !isAuthenticated || user?.role !== UserRole.ADMIN ? (
          <RentalSettingsSkeleton />
        ) : isLoading ? (
          <RentalSettingsSkeleton />
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
            <Text fontWeight="semibold">{t('loadVenueErrorTitle')}</Text>
            <Text fontSize="sm" color="gray.500">
              {t('loadVenueErrorDescription')}
            </Text>
            <VButton type="button" mt={2} onClick={loadVenue}>
              {t('retry')}
            </VButton>
          </VStack>
        ) : (
          <VStack align="stretch" gap={5}>
            <Flex justify="flex-end">
              <VButton
                as={Link}
                href={ROUTES.ADMIN.VENUE_PRICING(venue.id)}
                variant="outline"
                leftIcon={<Banknote size={16} aria-hidden="true" />}
              >
                {t('backToPricing')}
              </VButton>
            </Flex>
            {/* Each settings section renders its own card. */}
            <VenueRentalSettings venue={venue} onUpdated={setVenue} />
          </VStack>
        )}
      </Box>
    </PageLayout>
  );
}
