'use client';

import { Box, Text } from '@chakra-ui/react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTranslations } from 'next-intl';

export interface IAppAddressDisplayProps {
  address?: string;
  district?: string;
  newAddress?: string;
  newDistrict?: string;
  fontSize?: string;
  newAddressFontSize?: string;
  color?: string;
  newAddressColor?: string;
  lineClamp?: number;
}

export const AppAddressDisplay = ({
  address,
  district,
  newAddress,
  fontSize = 'xs',
  newAddressFontSize,
  color = 'fg.subtle',
  newAddressColor = 'blue.500',
  lineClamp,
}: IAppAddressDisplayProps) => {
  const { showNewAddress } = useAppSettings();
  const t = useTranslations('admin');

  const fullAddress = [address, district].filter(Boolean).join(', ');
  const fullNewAddress = newAddress || '';

  const hasNewAddress =
    showNewAddress &&
    fullNewAddress &&
    (fullNewAddress !== fullAddress || (newAddress && !address));

  return (
    <Box>
      <Text fontSize={fontSize} color={color} lineClamp={lineClamp}>
        {fullAddress}
      </Text>
      {hasNewAddress && (
        <Text
          fontSize={newAddressFontSize || fontSize}
          color={newAddressColor}
          fontStyle="italic"
          lineClamp={lineClamp}
        >
          ({fullNewAddress})
        </Text>
      )}
    </Box>
  );
};
