'use client';
import { Input } from '@/components/ui/Input';

import { Box, Flex, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { Card, CardBody, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useState, useEffect } from 'react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NewTournamentPage() {
  const t = useTranslations('pages.tournaments.create');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(
    formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [venueId, setVenueId] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    VenueService.getAllVenues().then(setVenues).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) {
      toaster.error({ title: t('fillAllFields') });
      return;
    }

    try {
      setIsLoading(true);
      const tournament = await TournamentService.createTournament({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        venueId: venueId || undefined,
      });

      router.push(`/tournament/${tournament.slug}`);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      toaster.error({
        title: error.response?.data?.error || 'Failed to create tournament',
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
        backHref="/browse/tournaments"
        maxW="4xl"
      >
        <form onSubmit={handleSubmit}>
          <VStack gap={6} alignItems="stretch">
            <Heading size="lg">{t('createNewTournament')}</Heading>

            <Card>
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
                    <select
                      value={venueId}
                      onChange={(e) => setVenueId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        borderWidth: '1px',
                        borderColor: '#CBD5E0',
                      }}
                    >
                      <option value="">{t('selectVenue')}</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.address}
                        </option>
                      ))}
                    </select>
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
