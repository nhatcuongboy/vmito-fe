'use client';

import { Box, Flex, Badge } from '@chakra-ui/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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
  const hasClear = value.length > 0;

  const getPaddingRight = () => {
    if (hasClear && showFilter) return '84px';
    if (hasClear || showFilter) return '48px';
    return '16px';
  };

  return (
    <Box position="relative" w="100%" px="16px">
      <Box
        position="absolute"
        left="30px"
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
        pr={getPaddingRight()}
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

      {hasClear && (
        <Box
          position="absolute"
          right={showFilter ? '56px' : '20px'}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        >
          <Flex
            as="button"
            onClick={() => onChange('')}
            h="32px"
            w="32px"
            align="center"
            justify="center"
            borderRadius="full"
            color="fg.muted"
            transition="all 0.2s"
            _hover={{ bg: 'bg.muted', color: 'fg' }}
            cursor="pointer"
            aria-label="Clear search"
          >
            <X size={16} />
          </Flex>
        </Box>
      )}

      {showFilter && (
        <Box
          position="absolute"
          right="20px"
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
