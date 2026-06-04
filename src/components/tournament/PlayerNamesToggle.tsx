'use client';

import { Box } from '@chakra-ui/react';
import { Check, Users } from 'lucide-react';

interface PlayerNamesToggleProps {
  active: boolean;
  onToggle: () => void;
  title: string;
  fullWidthOnMobile?: boolean;
}

const PlayerNamesToggle = ({
  active,
  onToggle,
  title,
  fullWidthOnMobile = false,
}: PlayerNamesToggleProps) => {
  return (
    <Box
      position="relative"
      cursor="pointer"
      role="button"
      aria-pressed={active}
      title={title}
      onClick={onToggle}
      flex={fullWidthOnMobile ? { base: 1, sm: '0 0 auto' } : '0 0 auto'}
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      h={9}
      w={fullWidthOnMobile ? { base: 'full', sm: '36px' } : '36px'}
      borderRadius="md"
      borderWidth="1px"
      borderColor={active ? 'green.400' : 'gray.200'}
      bg={active ? 'green.500' : 'transparent'}
      color={active ? 'white' : 'gray.500'}
      transition="all 0.15s ease"
      _hover={{
        bg: active ? 'green.600' : 'gray.100',
        borderColor: active ? 'green.500' : 'gray.300',
      }}
      _dark={{
        borderColor: active ? 'green.500' : 'gray.600',
        bg: active ? 'green.600' : 'transparent',
        color: active ? 'white' : 'gray.400',
        _hover: {
          bg: active ? 'green.700' : 'gray.700',
        },
      }}
    >
      <Users size={16} />
      {active && (
        <Box
          position="absolute"
          top="-4px"
          right="-4px"
          w="14px"
          h="14px"
          borderRadius="full"
          bg="green.400"
          borderWidth="2px"
          borderColor="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          _dark={{ borderColor: 'gray.900' }}
        >
          <Check size={8} strokeWidth={3} color="white" />
        </Box>
      )}
    </Box>
  );
};

export default PlayerNamesToggle;
