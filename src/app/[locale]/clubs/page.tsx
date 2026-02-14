'use client';
import { Input } from '@/components/ui/Input';

import { useState, useEffect, useCallback } from 'react';
import { Badge, Box, Flex, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ClubsService } from '@/lib/api/clubs.service';
import ClubCard from '@/components/clubs/ClubCard';
import { IClubListItem } from '@/types/club';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDebounce } from '@/hooks/useDebounce';

export default function BrowseClubsPage() {
  const t = useTranslations();

  const [clubs, setClubs] = useState<IClubListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const fetchClubs = useCallback(
    async (pageNum: number, searchQuery?: string, append = false) => {
      try {
        setIsLoading(true);
        const response = await ClubsService.browseClubs({
          page: pageNum,
          limit: 12,
          search: searchQuery || undefined,
        });

        if (append) {
          setClubs((prev) => [...prev, ...(response.items || [])]);
        } else {
          setClubs(response.items || []);
        }
        setTotalPages(response.totalPages || 1);
        setHasMore(pageNum < (response.totalPages || 0));
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
        setClubs([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchClubs(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const activeFilterCount = search ? 1 : 0;

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClubs(nextPage, search, true);
  };

  return (
    <PageLayout title={t('clubs.browseClubs')}>
      {/* Search Bar */}
      <Box mb={6}>
        <Flex
          gap={3}
          align="center"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="sm"
        >
          <Box flex="1" minW="200px">
            <Input
              h="44px"
              placeholder={t('clubs.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="gray.50"
              _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
              borderRadius="md"
              leftElement={<Search size={20} />}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                bg: 'white',
                _dark: {
                  bg: 'gray.600',
                },
              }}
              fontSize="md"
              transition="all 0.2s"
            />
          </Box>

          {/* Filter Button */}
          <Box position="relative">
            <IconButton
              h="44px"
              w="44px"
              variant="solid"
              colorPalette="green"
              onClick={toggleFilters}
              aria-label={t('common.filter') || 'Bộ lọc'}
              icon={<Filter size={20} />}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{
                transform: 'scale(1.05)',
              }}
            />
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-6px"
                right="-6px"
                borderRadius="full"
                colorPalette="red"
                variant="solid"
                px={1.5}
                minW="20px"
                h="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                border="2px solid"
                borderColor="white"
                _dark={{ borderColor: 'gray.800' }}
                zIndex={1}
                boxShadow="sm"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Content */}
      {isLoading && clubs.length === 0 ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      ) : clubs.length === 0 ? (
        <Box
          textAlign="center"
          py={16}
          px={6}
          bg="gray.50"
          _dark={{ bg: 'gray.800' }}
          borderRadius="2xl"
        >
          <Text
            fontSize="xl"
            fontWeight="medium"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
          >
            {t('clubs.noClubsFound')}
          </Text>
          <Text mt={2} color="gray.500" _dark={{ color: 'gray.500' }}>
            {t('clubs.noClubsFoundDescription')}
          </Text>
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </SimpleGrid>

          {/* Load More Button */}
          {hasMore && (
            <Flex justify="center" mt={8}>
              <Button
                onClick={handleLoadMore}
                loading={isLoading}
                colorPalette="green"
                variant="outline"
                size="lg"
              >
                <RefreshCw size={16} />
                {t('common.loadMore')}
              </Button>
            </Flex>
          )}
        </>
      )}
    </PageLayout>
  );
}
