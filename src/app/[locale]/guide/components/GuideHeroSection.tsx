'use client';

import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { BookOpen } from 'lucide-react';
import * as React from 'react';

const GuideHeroSection = () => {
  const t = useTranslations('pages.guide.hero');

  return (
    <Box
      py={{ base: 12, md: 20 }}
      bg="green.50"
      _dark={{ bg: 'green.950' }}
      textAlign="center"
    >
      <Container maxW="container.lg">
        <VStack gap={5}>
          <Box
            bg="green.500"
            p={4}
            borderRadius="full"
            color="white"
            boxShadow="lg"
          >
            <BookOpen size={40} />
          </Box>
          <Heading
            size={{ base: '2xl', md: '3xl' }}
            color="green.700"
            _dark={{ color: 'green.300' }}
          >
            {t('title')}
          </Heading>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color="fg.muted"
            maxW="600px"
          >
            {t('subtitle')}
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default GuideHeroSection;
