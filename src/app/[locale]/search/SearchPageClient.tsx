'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Box, Container, Heading, Input, Tabs, Text } from '@chakra-ui/react';
import { useIntl } from '@/hooks/useIntl';

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useIntl();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      // TODO: Perform search with the query
    }
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      router.push(`?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading size="lg" mb={4}>
          {t('search.title', 'Tìm kiếm')}
        </Heading>
        <Input
          placeholder={t('search.placeholder', 'Tìm kèo, giải đấu, sân...')}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          size="lg"
        />
      </Box>

      <Tabs.Root
        value={String(activeTab)}
        onValueChange={(e) => setActiveTab(Number(e.value))}
      >
        <Tabs.List>
          <Tabs.Trigger value="0">
            {t('search.tabs.sessions', 'Kèo cầu lông')}
          </Tabs.Trigger>
          <Tabs.Trigger value="1">
            {t('search.tabs.tournaments', 'Giải đấu')}
          </Tabs.Trigger>
          <Tabs.Trigger value="2">
            {t('search.tabs.venues', 'Sân cầu lông')}
          </Tabs.Trigger>
          <Tabs.Trigger value="3">
            {t('search.tabs.clubs', 'Câu lạc bộ')}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="0">
          <Box py={8}>
            {query ? (
              <Text>
                {t('search.results.sessions', 'Đang tìm kèo cầu lông...')}
              </Text>
            ) : (
              <Text color="gray.500">
                {t('search.empty', 'Nhập từ khóa để tìm kiếm')}
              </Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="1">
          <Box py={8}>
            {query ? (
              <Text>
                {t('search.results.tournaments', 'Đang tìm giải đấu...')}
              </Text>
            ) : (
              <Text color="gray.500">
                {t('search.empty', 'Nhập từ khóa để tìm kiếm')}
              </Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="2">
          <Box py={8}>
            {query ? (
              <Text>
                {t('search.results.venues', 'Đang tìm sân cầu lông...')}
              </Text>
            ) : (
              <Text color="gray.500">
                {t('search.empty', 'Nhập từ khóa để tìm kiếm')}
              </Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="3">
          <Box py={8}>
            {query ? (
              <Text>{t('search.results.clubs', 'Đang tìm câu lạc bộ...')}</Text>
            ) : (
              <Text color="gray.500">
                {t('search.empty', 'Nhập từ khóa để tìm kiếm')}
              </Text>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
