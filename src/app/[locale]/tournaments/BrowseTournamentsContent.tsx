'use client';

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Image,
} from '@chakra-ui/react';
import { SimpleGrid, Button } from '@/components/ui/chakra-compat';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament, TournamentStatus } from '@/lib/api/types';
import { Suspense, useEffect, useState } from 'react';
import { Calendar, Heart, Share2, ChevronDown } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

const BADMINTON_PLACEHOLDER = '/icons/app-logo.png';

import { AppSearchBar } from '@/components/common/AppSearchBar';

function TournamentsContent() {
  const t = useTranslations('pages.tournaments');
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeLabel = (status: TournamentStatus): string | null => {
    switch (status) {
      case 'PREPARING':
        return t('registrationOpen');
      case 'IN_PROGRESS':
        return t('status.inProgress');
      case 'CANCELLED':
        return t('status.cancelled');
      default:
        return null;
    }
  };

  const getStatusBadgeColor = (status: TournamentStatus) => {
    switch (status) {
      case 'PREPARING':
        return { bg: 'green.500', color: 'white' };
      case 'IN_PROGRESS':
        return { bg: 'blue.500', color: 'white' };
      case 'CANCELLED':
        return { bg: 'red.500', color: 'white' };
      default:
        return { bg: 'gray.500', color: 'white' };
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isSameDay(start, end)) {
      return format(start, 'EEE, MMM d, yyyy');
    }
    // Same month and year
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${format(start, 'EEE, MMM d')} - ${format(end, 'EEE, MMM d, yyyy')}`;
    }
    return `${format(start, 'EEE, MMM d, yyyy')} - ${format(end, 'EEE, MMM d, yyyy')}`;
  };

  const getLocationText = (tournament: Tournament) => {
    if (tournament.venue) {
      const parts: string[] = [];
      if (tournament.venue.name) parts.push(tournament.venue.name);
      if (tournament.venue.address) parts.push(tournament.venue.address);
      return parts.join(', ') || null;
    }
    return null;
  };

  const getCoverImage = (tournament: Tournament) => {
    if (tournament.venue?.coverPhoto) return tournament.venue.coverPhoto;
    if (tournament.venue?.images && tournament.venue.images.length > 0)
      return tournament.venue.images[0];
    return BADMINTON_PLACEHOLDER;
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterLabel =
    statusFilter === 'ALL'
      ? t('upcoming')
      : statusFilter === 'PREPARING'
        ? t('status.preparing')
        : statusFilter === 'IN_PROGRESS'
          ? t('status.inProgress')
          : statusFilter === 'FINISHED'
            ? t('status.finished')
            : t('status.cancelled');

  const filterOptions = [
    { value: 'ALL', label: t('upcoming') },
    { value: 'PREPARING', label: t('status.preparing') },
    { value: 'IN_PROGRESS', label: t('status.inProgress') },
    { value: 'FINISHED', label: t('status.finished') },
    { value: 'CANCELLED', label: t('status.cancelled') },
  ];

  return (
    <PageLayout
      title={t('title')}
      maxW="7xl"
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      minH="100vh"
    >
      <VStack gap={6} alignItems="stretch">
        {/* Search Bar */}
        <Box
          position="sticky"
          top={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE + 44}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          left={0}
          right={0}
          width="100vw"
          marginLeft="calc(50% - 50vw)"
          zIndex={100}
          bg="transparent"
          py={2}
          transition="all 0.2s"
        >
          <Flex align="center" gap={2} w="100%" maxW="650px" mx="auto">
            <Box flex={1} w="100%">
              <AppSearchBar
                placeholder={t('searchEvents')}
                value={searchTerm}
                onChange={setSearchTerm}
                showFilter={false}
              />
            </Box>
          </Flex>
        </Box>

        {/* Run your own event link */}
        <Text
          display={{ base: 'none', md: 'block' }}
          textAlign="center"
          fontSize="sm"
          color="fg.muted"
          fontWeight="medium"
          cursor="pointer"
          _hover={{ textDecoration: 'underline' }}
          onClick={() => router.push('/host/tournaments/new')}
        >
          {t('runYourOwnEvent')}
        </Text>

        {/* Explore Section */}
        <Flex justify="space-between" alignItems="center" pt={4}>
          <Heading size="lg" fontWeight="bold" color="fg">
            {t('explore')}
          </Heading>

          {/* Status Filter Dropdown */}
          <Box position="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              borderRadius="full"
              borderColor="border"
              bg="bg"
              color="fg.muted"
              fontWeight="medium"
              px={4}
              _hover={{ bg: 'gray.50' }}
            >
              <Calendar size={14} />
              {filterLabel}
              <ChevronDown size={14} />
            </Button>

            {isFilterOpen && (
              <Box
                position="absolute"
                right={0}
                top="100%"
                mt={1}
                bg="bg"
                borderRadius="md"
                boxShadow="lg"
                border="1px solid"
                borderColor="border"
                zIndex={10}
                minW="180px"
                overflow="hidden"
              >
                {filterOptions.map((option) => (
                  <Box
                    key={option.value}
                    px={4}
                    py={2}
                    cursor="pointer"
                    bg={statusFilter === option.value ? 'blue.50' : 'white'}
                    color={
                      statusFilter === option.value ? 'blue.600' : 'gray.700'
                    }
                    fontWeight={
                      statusFilter === option.value ? 'semibold' : 'normal'
                    }
                    fontSize="sm"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsFilterOpen(false);
                    }}
                  >
                    {option.label}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Flex>

        {/* Loading State */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <>
            {/* Tournament Cards Grid */}
            {filteredTournaments.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="fg.muted" fontSize="lg">
                  {t('noTournamentsFound')}
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {filteredTournaments.map((tournament) => {
                  const coverImage = getCoverImage(tournament);
                  const isPlaceholder = coverImage === BADMINTON_PLACEHOLDER;
                  const badgeLabel = getStatusBadgeLabel(tournament.status);
                  const badgeColor = getStatusBadgeColor(tournament.status);
                  const locationText = getLocationText(tournament);

                  return (
                    <Box
                      key={tournament.id}
                      bg="bg"
                      borderRadius="xl"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="border"
                      cursor="pointer"
                      transition="all 0.25s ease"
                      _hover={{
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-3px)',
                      }}
                      onClick={() =>
                        router.push(
                          `/tournament/${tournament.slug ?? tournament.id}`
                        )
                      }
                    >
                      {/* Cover Image */}
                      <Box
                        position="relative"
                        h="180px"
                        bg="bg.muted"
                        overflow="hidden"
                      >
                        <Image
                          src={coverImage}
                          alt={tournament.name}
                          w="100%"
                          h="100%"
                          objectFit={isPlaceholder ? 'contain' : 'cover'}
                          objectPosition="center"
                          p={isPlaceholder ? 8 : 0}
                          opacity={isPlaceholder ? 0.6 : 1}
                        />

                        {/* Status Badge Overlay */}
                        {badgeLabel && (
                          <Badge
                            position="absolute"
                            top={3}
                            right={3}
                            bg={badgeColor.bg}
                            color={badgeColor.color}
                            fontSize="xs"
                            fontWeight="semibold"
                            px={3}
                            py={1}
                            borderRadius="md"
                          >
                            {badgeLabel}
                          </Badge>
                        )}
                      </Box>

                      {/* Card Content */}
                      <Box p={4}>
                        <VStack align="stretch" gap={2}>
                          {/* Date Range */}
                          <Text
                            fontSize="xs"
                            color="fg.muted"
                            fontWeight="medium"
                          >
                            {formatDateRange(
                              tournament.startDate,
                              tournament.endDate
                            )}
                          </Text>

                          {/* Tournament Name */}
                          <Heading
                            size="sm"
                            color="fg"
                            fontWeight="bold"
                            lineClamp={2}
                          >
                            {tournament.name}
                          </Heading>

                          {/* Location */}
                          {locationText && (
                            <Text fontSize="xs" color="blue.600" lineClamp={2}>
                              {locationText}
                            </Text>
                          )}

                          {/* Follow / Share Row */}
                          <HStack
                            gap={0}
                            pt={2}
                            borderTop="1px solid"
                            borderColor="border"
                            mt={1}
                          >
                            <HStack
                              gap={1}
                              flex={1}
                              justify="center"
                              py={1}
                              cursor="pointer"
                              borderRadius="md"
                              _hover={{ bg: 'gray.50' }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Heart size={14} color="#6B7280" />
                              <Text
                                fontSize="xs"
                                color="fg.muted"
                                fontWeight="medium"
                              >
                                {t('follow')}
                              </Text>
                            </HStack>

                            <HStack
                              gap={1}
                              flex={1}
                              justify="center"
                              py={1}
                              cursor="pointer"
                              borderRadius="md"
                              _hover={{ bg: 'gray.50' }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Share2 size={14} color="#6B7280" />
                              <Text
                                fontSize="xs"
                                color="fg.muted"
                                fontWeight="medium"
                              >
                                {t('share')}
                              </Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </Box>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </>
        )}
      </VStack>

      {/* Click-away overlay for filter dropdown */}
      {isFilterOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={5}
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </PageLayout>
  );
}

export default function BrowseTournamentsContent() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      }
    >
      <TournamentsContent />
    </Suspense>
  );
}
