'use client';
import { Input } from '@/components/ui/Input';

import { Box, Flex, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { Card, CardBody, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { VenueService } from '@/lib/api/venue.service';
import { useRouter } from '@/i18n/config';
import { useState } from 'react';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

export default function NewTournamentPage() {
  const t = useTranslations('pages.tournaments.create');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState<{
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    district?: string;
    city?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) {
      toaster.error({ title: t('fillAllFields') });
      return;
    }

    try {
      setIsLoading(true);

      let finalVenueId: string | undefined = undefined;

      if (location) {
        const venuePayload: Parameters<typeof VenueService.createVenue>[0] = {
          placeId: location.placeId,
          name: location.name,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          district: location.district,
          city: location.city,
        };
        // Create venue first
        const newVenue = await VenueService.createVenue(venuePayload);
        finalVenueId = newVenue.id;
      }

      const tournament = await TournamentService.createTournament({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        venueId: finalVenueId,
      });

      router.push(`/tournament/${tournament.slug}`);
    } catch (error: unknown) {
      console.error('Error creating tournament:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toaster.error({
        title: apiError.response?.data?.error || 'Failed to create tournament',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST]}>
      <PageLayout
        title={t('title')}
        showBackButton={true}
        backHref="/tournaments"
        maxW="4xl"
      >
        <form onSubmit={handleSubmit}>
          <VStack gap={6} alignItems="stretch">
            <Heading size="lg">{t('createNewTournament')}</Heading>

            <Card overflow="visible">
              <CardBody>
                <VStack align="stretch" gap={4}>
                  <Heading size="md">{t('basicInformation')}</Heading>

                  <Box>
                    <Text mb={2} fontWeight="medium">
                      {t('tournamentName')}{' '}
                      <Box as="span" color="red.500">
                        *
                      </Box>
                    </Text>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('enterTournamentName')}
                      required
                    />
                  </Box>

                  <HStack>
                    <Box flex={1}>
                      <Text mb={2} fontWeight="medium">
                        {t('startDate')}{' '}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </Box>

                    <Box flex={1}>
                      <Text mb={2} fontWeight="medium">
                        {t('endDate')}{' '}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </Box>
                  </HStack>

                  <Box>
                    <Text mb={2} fontWeight="medium">
                      {t('venue')}
                    </Text>
                    <LocationAutocomplete
                      onSelect={(loc) => setLocation(loc)}
                      placeholder={t('locationPlaceholder')}
                    />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            <Flex justify="flex-end" gap={4}>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                colorPalette="green"
                loading={isLoading}
                loadingText={t('creating')}
              >
                {t('createTournament')}
              </Button>
            </Flex>
          </VStack>
        </form>
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
