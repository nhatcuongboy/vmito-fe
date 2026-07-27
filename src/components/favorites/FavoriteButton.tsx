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

type FavoriteVariant = 'overlay' | 'overlay-dark' | 'ghost' | 'outline';

// Per-variant chrome, expressed as plain style props rather than Chakra recipe
// variants so a responsive `variant` can resolve to a different look at each
// breakpoint (recipe variants don't accept responsive values). SessionCardCompact
// needs `ghost` where the button sits over the white card body on mobile and
// `overlay` where it sits over the cover photo on md+.
const VARIANT_CHROME: Record<
  FavoriteVariant,
  {
    bg?: string;
    hoverBg?: string;
    shadow?: string;
    blur?: string;
    fg: string;
    hoverFg: string;
  }
> = {
  overlay: {
    bg: 'whiteAlpha.900',
    hoverBg: 'white',
    shadow: 'md',
    fg: 'gray.600',
    hoverFg: 'red.500',
  },
  'overlay-dark': {
    bg: 'transparent',
    hoverBg: 'whiteAlpha.200',
    fg: 'white',
    hoverFg: 'white',
  },
  // bg is spelled out (rather than left to the recipe) so that a responsive
  // variant emits a real declaration at every breakpoint — otherwise the
  // overlay background at md has nothing to override below it. hoverBg stays
  // unset so the ghost recipe's own hover feedback still applies.
  ghost: { bg: 'transparent', fg: 'gray.600', hoverFg: 'red.500' },
  outline: { fg: 'gray.600', hoverFg: 'red.500' },
};

interface FavoriteButtonProps {
  type: FavoriteType;
  targetId: string;
  isFavorite?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: FavoriteVariant | { base: FavoriteVariant; md: FavoriteVariant };
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

  const breakpoints =
    typeof variant === 'string' ? { base: variant, md: variant } : variant;
  // Collapse to a bare value when both breakpoints agree, so the common
  // single-variant case emits the same styles it always has.
  const byBreakpoint = <T,>(
    pick: (chrome: (typeof VARIANT_CHROME)[FavoriteVariant]) => T
  ): T | { base: T; md: T } => {
    const base = pick(VARIANT_CHROME[breakpoints.base]);
    const md = pick(VARIANT_CHROME[breakpoints.md]);
    return base === md ? base : { base, md };
  };
  // All chrome lives in style props above, so the recipe only has to supply
  // the outline border when that's what both breakpoints ask for.
  const recipeVariant =
    breakpoints.base === 'outline' && breakpoints.md === 'outline'
      ? 'outline'
      : 'ghost';

  return (
    <>
      <IconButton
        size={size}
        aria-label={isFavorite ? t('remove') : t('add')}
        title={isFavorite ? t('remove') : t('add')}
        variant={recipeVariant}
        bg={byBreakpoint((c) => c.bg)}
        backdropFilter={byBreakpoint((c) => c.blur)}
        color={isFavorite ? 'red.500' : byBreakpoint((c) => c.fg)}
        borderRadius="full"
        shadow={byBreakpoint((c) => c.shadow)}
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
          bg: byBreakpoint((c) => c.hoverBg),
          color: isFavorite ? 'red.600' : byBreakpoint((c) => c.hoverFg),
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
