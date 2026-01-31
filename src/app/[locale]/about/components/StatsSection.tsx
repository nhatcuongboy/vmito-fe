'use client';

import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function StatsSection() {
  const t = useTranslations('pages.about.stats');

  const stats = [
    { value: '10k+', label: t('users') },
    { value: '50k+', label: t('matches') },
    { value: '100+', label: t('courts') },
    { value: '5k+', label: t('sessions') },
  ];

  return (
    <Box as="section" py={12} bg="gray.900" color="white">
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={8} textAlign="center">
          {stats.map((stat, index) => (
            <VStack key={index} gap={2}>
              <Heading size="3xl" color="teal.300">
                {stat.value}
              </Heading>
              <Text fontSize="lg" fontWeight="medium" color="gray.400">
                {stat.label}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
