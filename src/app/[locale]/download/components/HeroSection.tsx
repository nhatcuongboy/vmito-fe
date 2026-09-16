'use client';

import { Box, Heading, Image, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('pages.download');

  return (
    <Box
      as="section"
      textAlign="center"
      px={4}
      pt={{ base: 8, md: 12 }}
      pb={{ base: 2, md: 4 }}
    >
      <VStack gap={3} maxW="2xl" mx="auto">
        <Image
          src="/icons/app-logo.png"
          alt=""
          boxSize="72px"
          borderRadius="xl"
          boxShadow="md"
        />
        <Heading size="2xl" color="green.600" _dark={{ color: 'green.400' }}>
          {t('hero.title')}
        </Heading>
        <Text fontSize="lg" color="fg.muted">
          {t('hero.subtitle')}
        </Text>
      </VStack>
    </Box>
  );
}
