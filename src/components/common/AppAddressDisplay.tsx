'use client';

import { Box, Text } from '@chakra-ui/react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

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
  newDistrict,
  fontSize = 'xs',
  newAddressFontSize,
  color = 'gray.500',
  newAddressColor = 'blue.500',
  lineClamp,
}: IAppAddressDisplayProps) => {
  const { showNewAddress } = useAppSettings();

  const fullAddress = [address, district].filter(Boolean).join(', ');
  const fullNewAddress = [newAddress, newDistrict].filter(Boolean).join(', ');

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
        <Box
          fontSize={newAddressFontSize || fontSize}
          color={newAddressColor}
          fontStyle="italic"
          display="inline-flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Text as="span">({fullNewAddress})</Text>
          <Text as="span" color="red.500" fontWeight="semibold">
            (New)
          </Text>
        </Box>
      )}
    </Box>
  );
};
