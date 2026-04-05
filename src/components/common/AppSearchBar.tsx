'use client';

import { Box, Flex, Badge } from '@chakra-ui/react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/chakra-compat';

export interface AppSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  showFilter?: boolean;
}

export function AppSearchBar({
  value,
  onChange,
  placeholder,
  onFilterClick,
  activeFilterCount = 0,
  showFilter = true,
}: AppSearchBarProps) {
  return (
    <Box position="relative" w="100%">
      <Box
        position="absolute"
        left="14px"
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        color="fg.muted"
        pointerEvents="none"
      >
        <Search size={18} />
      </Box>

      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        pl="42px"
        pr={showFilter ? '48px' : '16px'}
        borderRadius="24px"
        h="44px"
        border="1px solid"
        borderColor="border"
        bg="bg"
        fontSize="15px"
        color="fg"
        _placeholder={{ color: 'fg.muted' }}
        _focus={{
          borderColor: 'green.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-green-500)',
        }}
      />

      {showFilter && (
        <Box
          position="absolute"
          right="6px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        >
          <Flex
            as="button"
            onClick={onFilterClick}
            h="32px"
            w="32px"
            align="center"
            justify="center"
            borderRadius="full"
            color="fg.muted"
            transition="all 0.2s"
            _hover={{ bg: 'bg.muted', color: 'fg' }}
            cursor="pointer"
            position="relative"
          >
            <Box>
              <SlidersHorizontal size={18} />
            </Box>
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-2px"
                right="-2px"
                borderRadius="full"
                colorPalette="red"
                variant="solid"
                px={1.5}
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="10px"
                fontWeight="bold"
                border="2px solid"
                borderColor="bg.panel"
                zIndex={1}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
