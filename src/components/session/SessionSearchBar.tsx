'use client';

import { IconButton, Input } from '@/components/ui/chakra-compat';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { Badge, Box, Flex } from '@chakra-ui/react';
import { Filter, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SessionSearchBarProps } from './SessionSearchBar.types';

export default function SessionSearchBar({
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount,
}: SessionSearchBarProps) {
  const t = useTranslations('session');

  return (
    <Box
      position="sticky"
      top={{
        base: `${TOP_BAR_HEIGHT_MOBILE}px`,
        md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
      }}
      zIndex={100}
      // bg={{ base: 'green.50', _dark: 'gray.900' }}
      // py={4}
      mb={6}
      // boxShadow="sm"
      // borderBottom="1px solid"
      // borderColor={{ base: 'green.100', _dark: 'gray.700' }}
    >
      <Flex
        gap={3}
        align="center"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={3}
        borderRadius="xl"
        boxShadow="md"
      >
        {/* Search Input */}
        <Box flex="1" position="relative" minW="200px">
          <Input
            pl={10}
            pr={4}
            h="44px"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            bg="gray.50"
            _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
            borderRadius="xl"
            borderWidth="2px"
            borderColor="gray.200"
            _hover={{
              borderColor: 'green.400',
              _dark: { borderColor: 'green.600' },
            }}
            _focus={{
              borderColor: 'green.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-green-500)',
              bg: 'white',
              _dark: {
                bg: 'gray.600',
                borderColor: 'green.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-green-500)',
              },
            }}
            fontSize="md"
            transition="all 0.2s"
          />
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
            _dark={{ color: 'gray.500' }}
          >
            <Search size={20} />
          </Box>
        </Box>

        {/* Filter Button */}
        <Box position="relative">
          <IconButton
            h="44px"
            w="44px"
            variant="solid"
            colorPalette="green"
            onClick={onToggleFilters}
            aria-label={t('filters.title')}
            icon={<Filter size={20} />}
            borderRadius="xl"
            transition="all 0.2s"
            _hover={{
              transform: 'scale(1.05)',
            }}
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
      </Flex>
    </Box>
  );
}
