'use client';

import React, { Suspense } from 'react';
import { Flex, Icon, Spinner } from '@chakra-ui/react';
import { Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SuggestionsList from '@/components/session/SuggestionsList';
import PageLayout from '@/components/layout/PageLayout';

function SuggestionsContent() {
  const t = useTranslations('suggestions');

  // This page is dedicated to suggestions only, no mode toggle
  const handleModeChange = () => {
    // No-op: this page doesn't support mode switching
  };

  return (
    <PageLayout
      title={t('title')}
      icon={<Icon as={Lightbulb} boxSize={6} color="yellow.500" />}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      <SuggestionsList mode="auto" onModeChange={handleModeChange} />
    </PageLayout>
  );
}

export default function SuggestionsPage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" minH="100vh">
          <Spinner size="xl" color="green.500" />
        </Flex>
      }
    >
      <SuggestionsContent />
    </Suspense>
  );
}
