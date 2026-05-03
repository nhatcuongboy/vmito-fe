'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Box, Container, Heading, Input, Tabs, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('search');
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
          {t('title')}
        </Heading>
        <Input
          placeholder={t('placeholder')}
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
          <Tabs.Trigger value="0">{t('tabs.sessions')}</Tabs.Trigger>
          <Tabs.Trigger value="1">{t('tabs.tournaments')}</Tabs.Trigger>
          <Tabs.Trigger value="2">{t('tabs.venues')}</Tabs.Trigger>
          <Tabs.Trigger value="3">{t('tabs.clubs')}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="0">
          <Box py={8}>
            {query ? (
              <Text>{t('results.sessions')}</Text>
            ) : (
              <Text color="gray.500">{t('empty')}</Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="1">
          <Box py={8}>
            {query ? (
              <Text>{t('results.tournaments')}</Text>
            ) : (
              <Text color="gray.500">{t('empty')}</Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="2">
          <Box py={8}>
            {query ? (
              <Text>{t('results.venues')}</Text>
            ) : (
              <Text color="gray.500">{t('empty')}</Text>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="3">
          <Box py={8}>
            {query ? (
              <Text>{t('results.clubs')}</Text>
            ) : (
              <Text color="gray.500">{t('empty')}</Text>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
