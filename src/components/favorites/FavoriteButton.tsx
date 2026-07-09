'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import type { FavoriteType } from '@/lib/api/favorite.service';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { Icon } from '@chakra-ui/react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface FavoriteButtonProps {
  type: FavoriteType;
  targetId: string;
  isFavorite?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'overlay' | 'overlay-dark' | 'ghost' | 'outline';
  returnUrl?: string;
  onChange?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  type,
  targetId,
  isFavorite: initialIsFavorite = false,
  size = 'sm',
  variant = 'overlay',
  returnUrl,
  onChange,
}: FavoriteButtonProps) {
  const t = useTranslations('common.favorites');
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isFavorite, isToggling, toggleFavorite } = useFavoriteToggle({
    type,
    targetId,
    initialIsFavorite,
    onLoginRequired: () => setIsLoginOpen(true),
    onChange,
  });

  // Hide favorite controls for guests (once auth state is hydrated to avoid flash)
  if (isHydrated && !isAuthenticated) return null;

  const isDark = variant === 'overlay-dark';
  const isOverlay = variant === 'overlay' || isDark;

  return (
    <>
      <IconButton
        size={size}
        aria-label={isFavorite ? t('remove') : t('add')}
        title={isFavorite ? t('remove') : t('add')}
        variant={isOverlay ? 'solid' : variant}
        bg={
          isDark ? 'blackAlpha.500' : isOverlay ? 'whiteAlpha.900' : undefined
        }
        backdropFilter={isDark ? 'blur(6px)' : undefined}
        color={isFavorite ? 'red.500' : isDark ? 'white' : 'gray.600'}
        borderRadius="full"
        shadow={
          isDark ? '0 2px 8px rgba(0,0,0,0.45)' : isOverlay ? 'md' : undefined
        }
        loading={isToggling}
        icon={
          <Icon
            as={Heart}
            boxSize={size === 'xs' ? 3.5 : 4}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        }
        onClick={toggleFavorite}
        _hover={{
          bg: isDark ? 'blackAlpha.700' : isOverlay ? 'white' : undefined,
          color: isFavorite ? 'red.600' : isDark ? 'white' : 'red.500',
        }}
      />
      {isLoginOpen && (
        <LoginPromptModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          featureName={t('featureName')}
          returnUrl={returnUrl}
        />
      )}
    </>
  );
}
