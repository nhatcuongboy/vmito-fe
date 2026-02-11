'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Flex, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { Search, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ClubsService } from '@/lib/api/clubs.service';
import ClubCard from '@/components/clubs/ClubCard';
import { IClubListItem } from '@/types/club';
import { Input } from '@/components/ui/Input';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';

export default function BrowseClubsPage() {
  const t = useTranslations();

  const [clubs, setClubs] = useState<IClubListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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
    fetchClubs(1, search);
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchClubs(1, search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClubs(nextPage, search, true);
  };

  return (
    <PageLayout title={t('clubs.browseClubs')}>
      {/* Search Bar */}
      <Box mb={6}>
        <Flex gap={2}>
          <Input
            placeholder={t('clubs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            size="lg"
          />
          <Button onClick={handleSearch} size="lg" px={6}>
            <Search size={20} />
            {t('common.search')}
          </Button>
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
