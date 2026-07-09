'use client';

import { Button } from '@/components/ui/chakra-compat';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { Icon, Text } from '@chakra-ui/react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FavoriteFilterButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

export function FavoriteFilterButton({
  isActive,
  onToggle,
}: FavoriteFilterButtonProps) {
  const t = useTranslations('common.favorites');
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();

  // Hide the favorites filter for guests (once auth state is hydrated to avoid flash)
  if (isHydrated && !isAuthenticated) return null;

  return (
    <Button
      size="sm"
      variant={isActive ? 'solid' : 'outline'}
      colorPalette={isActive ? 'green' : 'gray'}
      h="32px"
      px={{ base: 2.5, md: 3 }}
      borderRadius="full"
      bg={isActive ? 'green.600' : { base: 'white', _dark: 'gray.800' }}
      color={isActive ? 'white' : { base: 'gray.700', _dark: 'gray.200' }}
      borderColor={isActive ? 'green.600' : 'gray.200'}
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label={t('filter')}
      _hover={{
        bg: isActive ? 'green.700' : { base: 'gray.50', _dark: 'gray.700' },
      }}
    >
      <Icon as={Heart} boxSize={4} fill={isActive ? 'currentColor' : 'none'} />
      <Text as="span" display={{ base: 'none', md: 'inline' }}>
        {t('shortLabel')}
      </Text>
    </Button>
  );
}
