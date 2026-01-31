'use client';

import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

export default function CTASection() {
  const t = useTranslations('pages.about.cta');

  return (
    <Box py={20} bgGradient="linear(to-r, blue.600, teal.500)" color="white">
      <Container maxW="container.md" textAlign="center">
        <VStack gap={8}>
          <Heading size="3xl">{t('title')}</Heading>
          <NextLinkButton
            href="/auth/signin"
            size="2xl"
            variant="surface"
            colorPalette="white"
            px={10}
            py={8}
            fontSize="2xl"
            fontWeight="bold"
            bg="white"
            color="blue.600"
            _hover={{ bg: 'gray.100', transform: 'scale(1.05)' }}
          >
            {t('button')}
            <ArrowRight className="ml-2" size={24} />
          </NextLinkButton>
        </VStack>
      </Container>
    </Box>
  );
}
