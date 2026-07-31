'use client';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { TRankingTier } from '@/lib/api/ranking.service';

export const TIER_COLORS: Record<
  TRankingTier,
  { bg: string; color: string; solid: string }
> = {
  BRONZE: { bg: '#f5e0d0', color: '#8d5524', solid: '#cd7f32' },
  SILVER: { bg: '#e8e8ee', color: '#5a5a6e', solid: '#9ea3b0' },
  GOLD: { bg: '#fdf0c8', color: '#8a6d00', solid: '#e6b800' },
  PLATINUM: { bg: '#d9f4f0', color: '#0e6e63', solid: '#2ec4b6' },
  DIAMOND: { bg: '#e0ecff', color: '#1d4fd7', solid: '#5b8def' },
};

export const TIER_ICONS: Record<TRankingTier, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💠',
  DIAMOND: '💎',
};

interface TierBadgeProps {
  tier: TRankingTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function TierBadge({
  tier,
  size = 'sm',
  showIcon = true,
}: TierBadgeProps) {
  const t = useTranslations('leaderboard.tiers');
  const colors = TIER_COLORS[tier];

  return (
    <Badge
      style={{ backgroundColor: colors.bg, color: colors.color }}
      fontSize={size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'xs'}
      px={size === 'lg' ? 3 : 2}
      py={size === 'lg' ? 1 : 0.5}
      borderRadius="full"
      fontWeight="700"
    >
      {showIcon ? `${TIER_ICONS[tier]} ` : ''}
      {t(tier)}
    </Badge>
  );
}
