'use client';

import {
  Card,
  CardBody,
  Divider,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  Tournament,
  TournamentStatus,
  UserRole,
} from '@/lib/api/types';
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/chakra-compat';
import { format } from 'date-fns';
import {
  Calendar,
  Flag,
  MapPin,
  Trophy,
  Users,
  Building2,
  Mail,
  Phone,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import { useRouter as useNextIntlRouter } from '@/i18n/config';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import SlideOutMenu from '@/components/ui/SlideOutMenu';

// Helper function to format date in UTC (extract date part only)
const formatDateUTC = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const dateStr = date.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-');
  return format(
    new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
    'MMM dd, yyyy'
  );
};

const formatDateShort = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const dateStr = date.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-');
  return format(
    new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
    'MMM d'
  );
};

export default function TournamentDetailPage() {
  const t = useTranslations('pages.tournaments');
  const tStatus = useTranslations('pages.tournaments.status');
  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');
  const params = useParams();
  const locale = useLocale();
  const nextIntlRouter = useNextIntlRouter();
  const { user } = useAuthStore();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const handleLogout = () => {
    const userRole = user?.role;
    AuthService.logout();
    const callbackUrl = userRole === UserRole.HOST ? '/auth/signin' : '/join-by-code';
    nextIntlRouter.push(callbackUrl);
    onMenuClose();
  };

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
      loadCategories();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getTournament(tournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(tournamentId);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'PREPARING':
        return 'yellow';
      case 'IN_PROGRESS':
        return 'green';
      case 'FINISHED':
        return 'gray';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case 'PREPARING':
        return tStatus('preparing');
      case 'IN_PROGRESS':
        return tStatus('inProgress');
      case 'FINISHED':
        return tStatus('finished');
      case 'CANCELLED':
        return tStatus('cancelled');
      default:
        return status;
    }
  };

  const getCategoryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MENS_SINGLE: tCategory('mensSingle'),
      WOMENS_SINGLE: tCategory('womensSingle'),
      MENS_DOUBLE: tCategory('mensDouble'),
      WOMENS_DOUBLE: tCategory('womensDouble'),
      MIXED_DOUBLE: tCategory('mixedDouble'),
    };
    return labels[type] || type;
  };

  const pathname = usePathname();
  const router = useRouter();

  // More menu state - must be declared before any early returns
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Calculate total entries (registrations) across all categories
  const totalEntries = categories.reduce(
    (sum, cat) => sum + (cat._count?.registrations || 0),
    0
  );

  // Get active tab from pathname
  const getActiveTab = () => {
    if (pathname?.includes('/matches')) return 'matches';
    if (pathname?.includes('/players')) return 'players';
    if (pathname?.includes('/events')) return 'events';
    if (pathname?.includes('/winners')) return 'winners';
    return 'overview';
  };

  const activeTab = getActiveTab();

  // Format dates for display
  const startDateDisplay = tournament
    ? formatDateShort(tournament.startDate)
    : '';
  const endDateDisplay = tournament
    ? (() => {
        const endDate = new Date(tournament.endDate);
        const dateStr = endDate.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');
        let displayDay = parseInt(day);
        if (
          endDate.getUTCHours() === 0 &&
          endDate.getUTCMinutes() === 0 &&
          endDate.getUTCSeconds() === 0
        ) {
          displayDay = parseInt(day) - 1;
        }
        return format(
          new Date(parseInt(year), parseInt(month) - 1, displayDay),
          'MMM d'
        );
      })()
    : '';

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" p={4} pt={8}>
          <Text>{t('tournamentDetail.notFound')}</Text>
        </Container>
      </Box>
    );
  }

  const isHost = user?.role === UserRole.HOST;
  const canManage = isHost && tournament?.hostId === user?.id;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      path: `/${locale}/tournaments/${tournamentId}`,
    },
    {
      id: 'matches',
      label: 'Matches',
      path: `/${locale}/tournaments/${tournamentId}/matches`,
    },
    {
      id: 'players',
      label: 'Players',
      path: `/${locale}/tournaments/${tournamentId}/players`,
    },
    {
      id: 'events',
      label: 'Events',
      path: `/${locale}/tournaments/${tournamentId}/events`,
    },
    {
      id: 'winners',
      label: 'Winners',
      path: `/${locale}/tournaments/${tournamentId}/winners`,
    },
  ];

  // Main tabs (always visible)
  const mainTabs = tabs.slice(0, 2); // Overview, Matches
  // More menu tabs
  const moreTabs = tabs.slice(2); // Players, Events, Winners

  // Calculate header height for padding
  const headerHeight = '120px';

  return (
    <>
      <Box minH="100vh" bg="gray.50">
        {/* Fixed Blue Header Section */}
        <Box
          bg="blue.600"
          color="white"
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={1000}
          pb={4}
        >
          <Container maxW="7xl" px={4} pt={4}>
            <Flex justify="space-between" align="center" mb={4}>
              {/* Tournament Title */}
              <Heading size="lg" fontWeight="bold" color="white" flex={1}>
                {tournament.name}
              </Heading>

              {/* Menu Button - Top Right */}
              <IconButton
                aria-label="Open menu"
                onClick={onMenuOpen}
                bg="blue.700"
                color="white"
                _hover={{ bg: 'blue.800' }}
                borderRadius="md"
                size="md"
                variant="solid"
                ml={4}
              >
                <Menu size={20} />
              </IconButton>
            </Flex>

            {/* Navigation Tabs */}
            <HStack gap={2} flexWrap="nowrap" overflowX="auto">
              {/* All tabs - visible on large screens */}
              <Box display={{ base: 'none', md: 'flex' }} gap={2}>
                {tabs.map((tab) => (
                  <Link key={tab.id} href={tab.path}>
                    <Button
                      size="sm"
                      variant={activeTab === tab.id ? 'solid' : 'ghost'}
                      bg={activeTab === tab.id ? 'blue.700' : 'transparent'}
                      color="white"
                      _hover={{
                        bg: activeTab === tab.id ? 'blue.700' : 'blue.500',
                      }}
                      borderRadius="md"
                      whiteSpace="nowrap"
                    >
                      {tab.label}
                    </Button>
                  </Link>
                ))}
              </Box>

              {/* Mobile view - Main tabs + More dropdown */}
              <Box display={{ base: 'flex', md: 'none' }} gap={2}>
                {/* Main tabs - always visible on mobile */}
                {mainTabs.map((tab) => (
                  <Link key={tab.id} href={tab.path}>
                    <Button
                      size="sm"
                      variant={activeTab === tab.id ? 'solid' : 'ghost'}
                      bg={activeTab === tab.id ? 'blue.700' : 'transparent'}
                      color="white"
                      _hover={{
                        bg: activeTab === tab.id ? 'blue.700' : 'blue.500',
                      }}
                      borderRadius="md"
                      whiteSpace="nowrap"
                    >
                      {tab.label}
                    </Button>
                  </Link>
                ))}

                {/* More tab with dropdown - only on mobile */}
                <Box ref={moreMenuRef} position="relative">
                  <Button
                    size="sm"
                    variant={
                      moreTabs.some((tab) => activeTab === tab.id)
                        ? 'solid'
                        : 'ghost'
                    }
                    bg={
                      moreTabs.some((tab) => activeTab === tab.id)
                        ? 'blue.700'
                        : 'transparent'
                    }
                    color="white"
                    _hover={{
                      bg: moreTabs.some((tab) => activeTab === tab.id)
                        ? 'blue.700'
                        : 'blue.500',
                    }}
                    borderRadius="md"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    whiteSpace="nowrap"
                  >
                    <HStack gap={1}>
                      <Text>More</Text>
                      <ChevronDown size={16} />
                    </HStack>
                  </Button>

                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      mt={1}
                      bg="white"
                      borderRadius="md"
                      boxShadow="lg"
                      minW="200px"
                      zIndex={1001}
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <VStack align="stretch" gap={0}>
                        {moreTabs.map((tab) => (
                          <Link
                            key={tab.id}
                            href={tab.path}
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            <Box
                              px={4}
                              py={2}
                              cursor="pointer"
                              bg={
                                activeTab === tab.id ? 'blue.50' : 'transparent'
                              }
                              color={
                                activeTab === tab.id ? 'blue.700' : 'gray.700'
                              }
                              _hover={{
                                bg:
                                  activeTab === tab.id ? 'blue.100' : 'gray.50',
                              }}
                              borderTopRadius={
                                tab.id === moreTabs[0].id ? 'md' : 'none'
                              }
                              borderBottomRadius={
                                tab.id === moreTabs[moreTabs.length - 1].id
                                  ? 'md'
                                  : 'none'
                              }
                            >
                              <Text
                                fontSize="sm"
                                fontWeight={
                                  activeTab === tab.id ? 'semibold' : 'normal'
                                }
                              >
                                {tab.label}
                              </Text>
                            </Box>
                          </Link>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </Box>
              </Box>
            </HStack>
          </Container>
        </Box>

        {/* Main Content with padding for fixed header */}
        <Box pt={headerHeight}>
          <Container maxW="7xl" px={4} py={8}>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              {/* Left Column - Main Content */}
              <VStack align="stretch" gap={6}>
                {/* Overview Tab Content */}
                {activeTab === 'overview' && (
                  <>
                    {/* Summary Boxes */}
                    <HStack gap={4}>
                      <Box
                        bg="blue.500"
                        color="white"
                        p={6}
                        borderRadius="md"
                        flex={1}
                      >
                        <Text fontSize="sm" mb={2}>
                          Events
                        </Text>
                        <Heading size="2xl">
                          {tournament._count?.categories || 0}
                        </Heading>
                      </Box>
                      <Box
                        bg="blue.500"
                        color="white"
                        p={6}
                        borderRadius="md"
                        flex={1}
                      >
                        <Text fontSize="sm" mb={2}>
                          Entries
                        </Text>
                        <Heading size="2xl">{totalEntries}</Heading>
                      </Box>
                    </HStack>

                    {/* Tournament Dates Card */}
                    <Card>
                      <CardBody>
                        <VStack align="stretch" gap={4}>
                          <HStack>
                            <Flag size={20} color="gray" />
                            <VStack align="start" gap={0}>
                              <Text fontSize="xs" color="gray.500">
                                Start tournament
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {formatDateUTC(tournament.startDate)}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            <Box
                              as="button"
                              bg="red.500"
                              color="white"
                              p={2}
                              borderRadius="sm"
                            >
                              <Flag size={16} />
                            </Box>
                            <VStack align="start" gap={0}>
                              <Text fontSize="xs" color="gray.500">
                                End of tournament
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {(() => {
                                  const endDate = new Date(tournament.endDate);
                                  const dateStr = endDate
                                    .toISOString()
                                    .split('T')[0];
                                  const [year, month, day] = dateStr.split('-');
                                  let displayDay = parseInt(day);
                                  if (
                                    endDate.getUTCHours() === 0 &&
                                    endDate.getUTCMinutes() === 0 &&
                                    endDate.getUTCSeconds() === 0
                                  ) {
                                    displayDay = parseInt(day) - 1;
                                  }
                                  return format(
                                    new Date(
                                      parseInt(year),
                                      parseInt(month) - 1,
                                      displayDay
                                    ),
                                    'MMM dd, yyyy'
                                  );
                                })()}
                              </Text>
                            </VStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* General Information */}
                    <Card>
                      <CardBody>
                        <VStack align="stretch" gap={4}>
                          <Heading size="md">General information</Heading>
                          <Text fontSize="sm" color="gray.600">
                            Last changed:{' '}
                            {format(
                              new Date(tournament.updatedAt),
                              'EEEE, MMMM d, yyyy h:mm a'
                            )}
                          </Text>

                          {/* Events List */}
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>
                              Events
                            </Text>
                            {categories.length === 0 ? (
                              <Text color="gray.500" fontSize="sm">
                                {t('tournamentDetail.noCategoriesYet')}
                              </Text>
                            ) : (
                              <TableContainer>
                                <Table variant="simple" size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>Name</Th>
                                      <Th>Draws</Th>
                                      <Th>Entries</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {categories.map((category) => (
                                      <Tr key={category.id}>
                                        <Td>
                                          <Link
                                            href={`/tournaments/${tournamentId}/categories/${category.id}`}
                                            style={{ color: '#3182ce' }}
                                          >
                                            <Text
                                              as="span"
                                              color="blue.500"
                                              _hover={{
                                                textDecoration: 'underline',
                                              }}
                                              cursor="pointer"
                                            >
                                              {category.name}
                                            </Text>
                                          </Link>
                                        </Td>
                                        <Td>1</Td>
                                        <Td>
                                          {category._count?.registrations || 0}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            )}
                          </Box>

                          {/* Statistics */}
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>
                              Statistics
                            </Text>
                            <VStack align="start" gap={1} fontSize="sm">
                              <Text>
                                Events: {tournament._count?.categories || 0}
                              </Text>
                              <Text>
                                Draws: {tournament._count?.categories || 0}
                              </Text>
                              <Text>Entries: {totalEntries}</Text>
                              <Text>
                                Players: {tournament._count?.players || 0}
                              </Text>
                            </VStack>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </>
                )}

                {/* Other tabs are handled by separate pages */}
              </VStack>

              {/* Right Sidebar */}
              <VStack align="stretch" gap={4}>
                {/* Organization Section */}
                <Card>
                  <CardBody>
                    <VStack align="stretch" gap={3}>
                      <Heading size="sm">Organization</Heading>
                      <Link href="#" style={{ color: '#3182ce' }}>
                        <Text
                          as="span"
                          color="blue.500"
                          _hover={{ textDecoration: 'underline' }}
                          cursor="pointer"
                        >
                          {tournament.host?.name || 'N/A'}
                        </Text>
                      </Link>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Venue Section */}
                <Card>
                  <CardBody>
                    <VStack align="stretch" gap={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="sm">Venue</Heading>
                        <Button size="xs" variant="outline">
                          <HStack gap={1}>
                            <MapPin size={14} />
                            <Text>ROUTE</Text>
                          </HStack>
                        </Button>
                      </Flex>
                      <VStack align="start" gap={1}>
                        <Text fontWeight="semibold">
                          {tournament.host?.name || 'N/A'}
                        </Text>
                        <HStack gap={1} fontSize="sm" color="gray.600">
                          <MapPin size={14} />
                          <Text>Address information</Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Contact Section */}
                <Card>
                  <CardBody>
                    <VStack align="stretch" gap={3}>
                      <Heading size="sm">Contact</Heading>
                      <Text>{tournament.host?.name || 'N/A'}</Text>
                      {tournament.host?.email && (
                        <HStack gap={2} fontSize="sm">
                          <Mail size={14} />
                          <Text>{tournament.host.email}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Manage Button for Host */}
                {canManage && (
                  <NextLinkButton
                    href={`/tournaments/${tournamentId}/manage`}
                    colorScheme="blue"
                    size="md"
                  >
                    {t('tournamentDetail.manageTournament')}
                  </NextLinkButton>
                )}
              </VStack>
            </Grid>
          </Container>
        </Box>
      </Box>

      <SlideOutMenu
        isOpen={isMenuOpen}
        onClose={onMenuClose}
        onLogout={handleLogout}
      />
    </>
  );
}
