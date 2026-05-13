'use client';

import { Newspaper, Sparkles } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';

export default function NewsfeedContent() {
  const t = useTranslations();

  return (
    <PageLayout title={t('navigation.newsfeed')}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        px={4}
      >
        <VStack gap={6} textAlign="center" maxW="md">
          {/* Icon with animation */}
          <Box position="relative">
            <Box
              as={Newspaper}
              size={80}
              color="green.500"
              className="animate-pulse"
            />
            <Box
              as={Sparkles}
              size={24}
              color="yellow.400"
              position="absolute"
              top={-2}
              right={-2}
              className="animate-bounce"
            />
          </Box>

          {/* Heading */}
          <Heading
            size="2xl"
            bgGradient="to-r"
            gradientFrom="green.400"
            gradientTo="blue.500"
            bgClip="text"
          >
            {t('posts.comingSoon.title')}
          </Heading>

          {/* Description */}
          <VStack gap={2}>
            <Text fontSize="lg" color="gray.600" fontWeight="medium">
              {t('posts.comingSoon.subtitle')}
            </Text>
            <Text fontSize="md" color="gray.500">
              {t('posts.comingSoon.description')}
            </Text>
          </VStack>

          {/* Coming soon badge */}
          <Box
            px={6}
            py={3}
            bg="green.50"
            borderRadius="full"
            border="2px solid"
            borderColor="green.200"
          >
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="green.600"
              letterSpacing="wide"
            >
              {t('posts.comingSoon.badge')}
            </Text>
          </Box>
        </VStack>
      </Box>
    </PageLayout>
  );
}
