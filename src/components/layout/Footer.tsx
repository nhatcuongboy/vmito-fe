'use client';

import { Box, Container, Stack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';

export default function Footer() {
  const t = useTranslations('common');
  const isBottomNavVisible = useBottomNavVisibility();

  return (
    <Box
      bg="white"
      color="gray.700"
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor="gray.200"
      _dark={{
        bg: 'gray.900',
        color: 'gray.200',
        borderColor: 'gray.700',
      }}
      mt={'auto'}
      pb={
        isBottomNavVisible
          ? 'calc(64px + env(safe-area-inset-bottom) + 16px)'
          : 'env(safe-area-inset-bottom)'
      }
    >
      <Container maxW={'6xl'} py={4}>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          justify="center"
          align="center"
        >
          <Text>
            © {new Date().getFullYear()} {t('appName')}. All rights reserved
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
