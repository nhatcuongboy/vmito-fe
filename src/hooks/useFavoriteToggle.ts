'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { FavoriteService, type FavoriteType } from '@/lib/api/favorite.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { FAVORITE_TOAST_ID, toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';

interface UseFavoriteToggleOptions {
  type: FavoriteType;
  targetId: string;
  initialIsFavorite?: boolean;
  onLoginRequired?: () => void;
  onChange?: (isFavorite: boolean) => void;
}

export const getFavoriteListHref = (type: FavoriteType) => {
  switch (type) {
    case 'SESSION':
      return `${ROUTES.HOME}?favorite=1`;
    case 'VENUE':
      return `${ROUTES.BROWSE.VENUES.LIST}?favorite=1`;
    case 'CLUB':
      return `${ROUTES.CLUBS.BROWSE}?favorite=1`;
    case 'TOURNAMENT':
      return `${ROUTES.BROWSE.TOURNAMENTS.LIST}?favorite=1`;
    default:
      return ROUTES.HOME;
  }
};

export function useFavoriteToggle({
  type,
  targetId,
  initialIsFavorite = false,
  onLoginRequired,
  onChange,
}: UseFavoriteToggleOptions) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('common.favorites');
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite, targetId]);

  const showSavedToast = useCallback(() => {
    toaster.create({
      id: FAVORITE_TOAST_ID,
      type: 'success',
      title: t('saved'),
      action: {
        label: t('viewList'),
        onClick: () => router.push(getFavoriteListHref(type)),
      },
    });
  }, [router, t, type]);

  const showRemovedToast = useCallback(() => {
    toaster.create({
      id: FAVORITE_TOAST_ID,
      type: 'success',
      title: t('removed'),
      action: {
        label: t('undo'),
        onClick: async () => {
          setIsToggling(true);
          setIsFavorite(true);
          onChange?.(true);

          try {
            await FavoriteService.addFavorite(type, targetId);
            showSavedToast();
          } catch (error) {
            console.error('Failed to undo favorite removal:', error);
            setIsFavorite(false);
            onChange?.(false);
            toaster.error({ title: t('addFailed') });
          } finally {
            setIsToggling(false);
          }
        },
      },
    });
  }, [onChange, showSavedToast, t, targetId, type]);

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
          showSavedToast();
        } else {
          await FavoriteService.removeFavorite(type, targetId);
          showRemovedToast();
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
    [
      isAuthenticated,
      isFavorite,
      onChange,
      onLoginRequired,
      showRemovedToast,
      showSavedToast,
      t,
      targetId,
      type,
    ]
  );

  return { isFavorite, isToggling, toggleFavorite };
}
