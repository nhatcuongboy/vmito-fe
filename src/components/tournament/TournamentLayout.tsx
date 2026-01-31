'use client';

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Menu as MenuIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import SlideOutMenu from '@/components/ui/SlideOutMenu';

interface TournamentLayoutProps {
  tournament: Tournament;
  children: React.ReactNode;
}

export default function TournamentLayout({
  tournament,
  children,
}: TournamentLayoutProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const tournamentId = tournament.id;

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  // Get active tab from pathname
  const getActiveTab = () => {
    if (pathname?.includes('/matches')) return 'matches';
    if (pathname?.includes('/players')) return 'players';
    if (pathname?.includes('/events')) return 'events';
    if (pathname?.includes('/winners')) return 'winners';
    return 'overview';
  };

  const activeTab = getActiveTab();

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

  // Calculate header height for padding
  const headerHeight = '120px'; // Approximate height of fixed header

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
                <MenuIcon size={20} />
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
        <Box pt={headerHeight}>{children}</Box>
      </Box>

      <SlideOutMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}
