'use client';

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import * as React from 'react';

const RatingGuideSection = () => {
  const t = useTranslations('pages.guide.ratings');

  const features = [
    {
      icon: Star,
      titleKey: 'rate.title',
      descKey: 'rate.description',
      color: 'yellow.500',
      bg: 'yellow.50',
      darkBg: 'yellow.950',
    },
    {
      icon: MessageSquare,
      titleKey: 'review.title',
      descKey: 'review.description',
      color: 'blue.500',
      bg: 'blue.50',
      darkBg: 'blue.950',
    },
    {
      icon: TrendingUp,
      titleKey: 'stats.title',
      descKey: 'stats.description',
      color: 'green.500',
      bg: 'green.50',
      darkBg: 'green.950',
    },
  ];

  return (
    <Box id="ratings" py={{ base: 12, md: 16 }}>
      <Container maxW="container.lg">
        <VStack gap={10}>
          <VStack gap={3} textAlign="center">
            <Heading size={{ base: 'xl', md: '2xl' }}>{t('title')}</Heading>
            <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
              {t('subtitle')}
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
            {features.map((feature, index) => (
              <VStack
                key={index}
                bg="bg"
                _dark={{ bg: 'gray.800' }}
                p={6}
                borderRadius="xl"
                boxShadow="sm"
                gap={4}
                textAlign="center"
              >
                <Box
                  bg={feature.bg}
                  _dark={{ bg: feature.darkBg }}
                  p={4}
                  borderRadius="full"
                  color={feature.color}
                >
                  <feature.icon size={28} />
                </Box>
                <Heading size="md">{t(feature.titleKey)}</Heading>
                <Text color="fg.muted" fontSize="sm">
                  {t(feature.descKey)}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default RatingGuideSection;
