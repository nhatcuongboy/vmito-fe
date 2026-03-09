'use client';

import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/VButton';
import { Badge, Box, Flex } from '@chakra-ui/react';
import { Filter, Search } from 'lucide-react';
import { ReactNode } from 'react';

interface SearchFilterBarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  placeholder?: string;
  activeFilterCount: number;
  onFilterToggle: () => void;
  trailing?: ReactNode;
}

export function SearchFilterBar({
  keyword,
  onKeywordChange,
  placeholder = 'Tìm kiếm...',
  activeFilterCount,
  onFilterToggle,
  trailing,
}: SearchFilterBarProps) {
  return (
    <Flex
      gap={2}
      align="center"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      px={3}
      h="48px"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <Box flex="1" minW="200px">
        <Input
          h="36px"
          placeholder={placeholder}
          value={keyword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onKeywordChange(e.target.value)
          }
          bg="white"
          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
          borderRadius="md"
          leftElement={<Search size={18} />}
          _focus={{
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            bg: 'white',
            _dark: { bg: 'gray.600' },
          }}
          fontSize="sm"
          transition="all 0.2s"
        />
      </Box>

      <Box position="relative">
        <IconButton
          h="36px"
          w="36px"
          minW="36px"
          variant="solid"
          colorPalette="green"
          onClick={onFilterToggle}
          aria-label="Bộ lọc"
          icon={<Filter size={18} />}
          borderRadius="md"
          transition="all 0.2s"
          _hover={{ transform: 'scale(1.05)' }}
        />
        {activeFilterCount > 0 && (
          <Badge
            position="absolute"
            top="-6px"
            right="-6px"
            borderRadius="full"
            colorPalette="red"
            variant="solid"
            px={1.5}
            minW="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xs"
            fontWeight="bold"
            border="2px solid"
            borderColor="white"
            _dark={{ borderColor: 'gray.800' }}
            zIndex={1}
            boxShadow="sm"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Box>

      {trailing}
    </Flex>
  );
}
