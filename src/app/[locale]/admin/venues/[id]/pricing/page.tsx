'use client';

import { use, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import VenuePricingManager from '@/components/venue/VenuePricingManager';
import { toaster } from '@/components/ui/toaster';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';

export default function VenuePricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setIsLoading(true);
        const data = await VenueService.getVenue(id);
        setVenue(data);
      } catch (error) {
        console.error('Failed to fetch venue:', error);
        toaster.error({ title: 'Không thể tải thông tin sân' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  const backHref = venue
    ? `/venues/${venue.slug || venue.id}`
    : '/admin/venues';

  if (isLoading) {
    return (
      <PageLayout
        title="Bảng giá thuê sân"
        showBackButton
        backHref="/admin/venues"
      >
        <Flex justify="center" align="center" minH="50vh">
          <Text color="gray.500">Đang tải...</Text>
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={venue ? `Bảng giá: ${venue.name}` : 'Bảng giá thuê sân'}
      showBackButton
      backHref={backHref}
    >
      <Box
        bg={{ base: 'white', _dark: 'gray.900' }}
        p={{ base: 4, md: 6 }}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        maxW="container.lg"
        mx="auto"
      >
        <VenuePricingManager
          venueId={id}
          legacyFixed={venue?.hourlyRateFixed}
          legacyWalkIn={venue?.hourlyRateWalkIn}
        />
      </Box>
    </PageLayout>
  );
}
