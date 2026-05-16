import React, { useState, useRef, useEffect } from 'react';
import { Box, Badge, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlayerStatus } from '@/lib/api/types';

interface PlayerStatusFilterProps {
  selected: PlayerStatus[];
  onChange: (selected: PlayerStatus[]) => void;
  counts: Record<string, number>;
  totalCount: number;
}

const PlayerStatusFilter: React.FC<PlayerStatusFilterProps> = ({
  selected,
  onChange,
  counts,
  totalCount,
}) => {
  const t = useTranslations('SessionDetail.playersTab');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allStatuses: PlayerStatus[] = [
    PlayerStatus.PLAYING,
    PlayerStatus.WAITING,
    PlayerStatus.READY,
    PlayerStatus.INACTIVE,
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (status: PlayerStatus) => {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const selectedCount = selected.length;
  const isAllSelected = selectedCount === 0;

  const getLabel = (status: PlayerStatus) => {
    switch (status) {
      case PlayerStatus.PLAYING:
        return t('playing');
      case PlayerStatus.WAITING:
        return t('waiting');
      case PlayerStatus.READY:
        return t('ready');
      case PlayerStatus.INACTIVE:
        return t('inactive');
      default:
        return status;
    }
  };

  const getColorScheme = (status: PlayerStatus) => {
    switch (status) {
      case PlayerStatus.PLAYING:
        return 'brand';
      case PlayerStatus.WAITING:
        return 'orange';
      case PlayerStatus.READY:
        return 'green';
      case PlayerStatus.INACTIVE:
        return 'red';
      default:
        return 'gray';
    }
  };

  // Custom Checkbox Component
  const CheckIndicator = ({
    checked,
    colorPalette,
  }: {
    checked: boolean;
    colorPalette: string;
  }) => (
    <Box
      w="18px"
      h="18px"
      border="1px solid"
      borderColor={
        checked
          ? `${colorPalette}.500`
          : { base: 'gray.300', _dark: 'whiteAlpha.300' }
      }
      bg={checked ? `${colorPalette}.500` : 'transparent'}
      borderRadius="sm"
      display="flex"
      alignItems="center"
      justifyContent="center"
      transition="all 0.2s"
      flexShrink={0}
    >
      {checked && <Check size={12} color="white" strokeWidth={3} />}
    </Box>
  );

  const CountBadge = ({
    count,
    colorPalette = 'gray',
  }: {
    count: number;
    colorPalette?: string;
  }) => (
    <Badge
      variant="subtle"
      colorPalette={colorPalette}
      minW="30px"
      h="24px"
      px={2}
      borderRadius="md"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      fontSize="xs"
      fontWeight="semibold"
      fontVariantNumeric="tabular-nums"
    >
      {count}
    </Badge>
  );

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        colorPalette={!isAllSelected ? 'green' : 'gray'}
        borderWidth="1px"
        borderRadius="full"
        h="36px"
        px={3}
        bg={!isAllSelected ? { base: 'green.50', _dark: 'green.900/20' } : 'bg'}
        borderColor={!isAllSelected ? 'green.200' : 'border'}
        _hover={{
          bg: !isAllSelected
            ? { base: 'green.100', _dark: 'green.900/30' }
            : { base: 'gray.50', _dark: 'whiteAlpha.100' },
        }}
      >
        <HStack gap={1.5}>
          <Filter size={14} />
          <Text fontSize="sm" fontWeight="medium">
            {t('filter')}
          </Text>
          {!isAllSelected && (
            <Badge
              colorPalette="green"
              variant="solid"
              borderRadius="full"
              fontSize="2xs"
              px={1.5}
              minW="18px"
              textAlign="center"
            >
              {selectedCount}
            </Badge>
          )}
          <Box
            as={ChevronDown}
            boxSize={3.5}
            color="fg.muted"
            transform={isOpen ? 'rotate(180deg)' : 'none'}
            transition="transform 0.16s ease"
          />
        </HStack>
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          mt={2}
          bg={{ base: 'white', _dark: 'gray.800' }}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          boxShadow="lg"
          borderRadius="lg"
          border="1px solid"
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          zIndex={10}
          width="224px"
          overflow="hidden"
          p={1.5}
        >
          <VStack align="stretch" spacing={1}>
            <Box
              px={2.5}
              py={2}
              borderRadius="md"
              cursor="pointer"
              bg={
                isAllSelected
                  ? { base: 'gray.50', _dark: 'gray.700' }
                  : undefined
              }
              _hover={{ bg: { base: 'gray.50', _dark: 'gray.700' } }}
              onClick={handleSelectAll}
            >
              <HStack justify="space-between" gap={3}>
                <HStack gap={2.5}>
                  <CheckIndicator
                    checked={isAllSelected}
                    colorPalette="green"
                  />
                  <Text fontWeight="semibold" fontSize="sm">
                    {t('all')}
                  </Text>
                </HStack>
                <CountBadge count={totalCount} />
              </HStack>
            </Box>

            {allStatuses.map((status) => {
              const checked = selected.includes(status);
              const colorPalette = getColorScheme(status);
              return (
                <Box
                  key={status}
                  px={2.5}
                  py={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={
                    checked
                      ? {
                          base: `${colorPalette}.50`,
                          _dark: `${colorPalette}.900/20`,
                        }
                      : undefined
                  }
                  _hover={{
                    bg: checked
                      ? {
                          base: `${colorPalette}.100`,
                          _dark: `${colorPalette}.900/30`,
                        }
                      : { base: 'gray.50', _dark: 'gray.700' },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(status);
                  }}
                >
                  <HStack justify="space-between" width="100%" gap={3}>
                    <HStack gap={2.5} minW={0}>
                      <CheckIndicator
                        checked={checked}
                        colorPalette={colorPalette}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight={checked ? 'semibold' : 'medium'}
                        color={checked ? 'fg' : 'fg.muted'}
                      >
                        {getLabel(status)}
                      </Text>
                    </HStack>
                    <CountBadge
                      count={counts[status]}
                      colorPalette={colorPalette}
                    />
                  </HStack>
                </Box>
              );
            })}
            {!isAllSelected && (
              <Box pt={1}>
                <Button
                  size="xs"
                  width="full"
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleSelectAll}
                >
                  <HStack gap={1} justify="center">
                    <X size={12} />
                    <Text>{t('clearFilter')}</Text>
                  </HStack>
                </Button>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default PlayerStatusFilter;
