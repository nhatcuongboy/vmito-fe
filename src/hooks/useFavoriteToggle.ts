'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { FavoriteService, type FavoriteType } from '@/lib/api/favorite.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';

interface UseFavoriteToggleOptions {
  type: FavoriteType;
  targetId: string;
  initialIsFavorite?: boolean;
  onLoginRequired?: () => void;
  onChange?: (isFavorite: boolean) => void;
}

export function useFavoriteToggle({
  type,
  targetId,
  initialIsFavorite = false,
  onLoginRequired,
  onChange,
}: UseFavoriteToggleOptions) {
  const { isAuthenticated } = useAuthStore();
  const t = useTranslations('common.favorites');
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite, targetId]);

  const toggleFavorite = useCallback(
    async (event?: MouseEvent) => {
      event?.stopPropagation();

      if (!isAuthenticated) {
        onLoginRequired?.();
        return;
      }

      const nextValue = !isFavorite;
      setIsFavorite(nextValue);
      setIsToggling(true);
      onChange?.(nextValue);

      try {
        if (nextValue) {
          await FavoriteService.addFavorite(type, targetId);
        } else {
          await FavoriteService.removeFavorite(type, targetId);
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        setIsFavorite(isFavorite);
        onChange?.(isFavorite);
        toaster.error({
          title: nextValue ? t('addFailed') : t('removeFailed'),
        });
      } finally {
        setIsToggling(false);
      }
    },
    [isAuthenticated, isFavorite, onChange, onLoginRequired, t, targetId, type]
  );

  return { isFavorite, isToggling, toggleFavorite };
}
