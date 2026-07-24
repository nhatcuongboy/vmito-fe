'use client';

import { Badge, Box, Text } from '@chakra-ui/react';
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
  lineClamp?: number;
}

export const AppAddressDisplay = ({
  address,
  district,
  city,
  newAddress,
  fontSize = 'xs',
  color = 'fg.subtle',
  lineClamp,
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

  return (
    <Box>
      <Text fontSize={fontSize} color={color} lineClamp={lineClamp}>
        {text}{' '}
        {showingNew && (
          <Badge colorPalette="blue" size="xs" verticalAlign="middle">
            {t('newAddressBadge')}
          </Badge>
        )}
      </Text>
    </Box>
  );
};
