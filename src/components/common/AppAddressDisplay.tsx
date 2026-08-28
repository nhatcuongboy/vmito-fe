'use client';

import type { ReactNode } from 'react';
import { Badge, Box, Text, type SystemStyleObject } from '@chakra-ui/react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTranslations } from 'next-intl';

export interface IAppAddressDisplayProps {
  address?: string | null;
  district?: string | null;
  city?: string | null;
  newAddress?: string | null;
  newDistrict?: string | null;
  fontSize?: string;
  color?: string;
  _dark?: SystemStyleObject;
  lineClamp?: number;
  suffix?: ReactNode;
  badgePlacement?: 'after' | 'inline';
  showNewBadge?: boolean;
}

export const AppAddressDisplay = ({
  address,
  district,
  city,
  newAddress,
  fontSize = 'xs',
  color = 'fg.subtle',
  _dark = { color: 'gray.300' },
  lineClamp,
  suffix,
  badgePlacement = 'after',
  showNewBadge = true,
}: IAppAddressDisplayProps) => {
  const { showNewAddress } = useAppSettings();
  const t = useTranslations('admin');

  const fullAddress = [address, district, city].filter(Boolean).join(', ');
  const fullNewAddress = newAddress || '';

  // Show exactly one line: new address when the setting is on and available,
  // falling back to the old address (e.g. venue not migrated yet). Same
  // color/size as the old address in both cases — the "Mới" badge is the
  // only visual distinction, so the text itself never reads as a link.
  const showingNew = showNewAddress && !!fullNewAddress;
  const text = showingNew ? fullNewAddress : fullAddress;

  const isInlineBadge = badgePlacement === 'inline';

  return (
    <Box
      display={isInlineBadge ? 'block' : 'flex'}
      alignItems="flex-start"
      gap={1}
      flexWrap="wrap"
    >
      <Text
        fontSize={fontSize}
        color={color}
        _dark={_dark}
        lineClamp={isInlineBadge ? undefined : lineClamp}
        display={isInlineBadge ? 'inline' : undefined}
        flex="0 1 auto"
        minW="0"
      >
        {text}
      </Text>
      {showingNew && showNewBadge && (
        <Badge
          colorPalette="blue"
          size="xs"
          verticalAlign="middle"
          flexShrink={0}
          mt="2px"
          ml={isInlineBadge ? 1 : undefined}
          display={isInlineBadge ? 'inline-flex' : undefined}
        >
          {t('newAddressBadge')}
        </Badge>
      )}
      {suffix}
    </Box>
  );
};
