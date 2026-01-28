'use client';

import { Box, Container, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations('session.validation');
  const tCommon = useTranslations('common');

  return (
    <Container maxW="4xl" py={20}>
      <Box textAlign="center">
        <Heading size="2xl" mb={4}>
          404
        </Heading>
        <Heading size="lg" mb={4}>
          {t('sessionNotFound')}
        </Heading>
        <Text mb={8} color="gray.600">
          {t('sessionNotFoundDescription')}
        </Text>
        <Link href="/browse/sessions">
          <Button colorPalette="blue">{tCommon('backToSessions') || 'Back to Sessions'}</Button>
        </Link>
      </Box>
    </Container>
  );
}
