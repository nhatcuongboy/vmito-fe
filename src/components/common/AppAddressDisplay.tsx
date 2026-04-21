'use client';

import { Box, Text } from '@chakra-ui/react';

export interface IAppAddressDisplayProps {
  address?: string;
  newAddress?: string;
  fontSize?: string;
  newAddressFontSize?: string;
  color?: string;
  newAddressColor?: string;
  lineClamp?: number;
}

export const AppAddressDisplay = ({
  address,
  newAddress,
  fontSize = 'xs',
  newAddressFontSize,
  color = 'gray.500',
  newAddressColor = 'blue.500',
  lineClamp,
}: IAppAddressDisplayProps) => {
  const hasNewAddress = newAddress && newAddress !== address;

  return (
    <Box>
      <Text fontSize={fontSize} color={color} lineClamp={lineClamp}>
        {address}
      </Text>
      {hasNewAddress && (
        <Text
          fontSize={newAddressFontSize || fontSize}
          color={newAddressColor}
          fontStyle="italic"
          display="inline-flex"
          alignItems="center"
          gap={1}
        >
          ({newAddress})
          <Text as="span" color="red.500" fontWeight="semibold">
            (New)
          </Text>
        </Text>
      )}
    </Box>
  );
};
