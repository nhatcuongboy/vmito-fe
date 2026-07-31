'use client';

import { Button } from '@/components/ui/chakra-compat';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
  ArrowDownAZ,
  ArrowUpDown,
  CalendarArrowDown,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export const TOURNAMENT_SORT_VALUES = [
  'start_asc',
  'newest',
  'name_asc',
  'name_desc',
] as const;

export type TournamentSortValue = (typeof TOURNAMENT_SORT_VALUES)[number];

interface TournamentSortMenuProps {
  value: string;
  onChange: (value: TournamentSortValue) => void;
}

/**
 * Sort control for the tournament browse page. Hand-rolled rather than using
 * the Chakra popover so the trigger can stay a pill-shaped Button matching the
 * filter chips next to it.
 */
export function TournamentSortMenu({
  value,
  onChange,
}: TournamentSortMenuProps) {
  const t = useTranslations('pages.tournaments');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options = [
    { value: 'start_asc', label: t('sort.startDate'), icon: CalendarArrowDown },
    { value: 'newest', label: t('sort.newest'), icon: CalendarArrowDown },
    { value: 'name_asc', label: t('sort.nameAsc'), icon: ArrowDownAZ },
    { value: 'name_desc', label: t('sort.nameDesc'), icon: ArrowDownAZ },
  ] as const;
  const activeOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        borderRadius="full"
        display="flex"
        alignItems="center"
        gap={1.5}
        h="32px"
        px={3}
        borderColor={{ base: 'gray.300', _dark: 'gray.600' }}
        bg={{ base: 'white', _dark: 'gray.800' }}
        color={{ base: 'gray.700', _dark: 'gray.200' }}
        fontWeight="normal"
        fontSize="sm"
        shadow="xs"
        _hover={{ bg: { base: 'gray.50', _dark: 'gray.700' } }}
        _active={{ bg: { base: 'gray.100', _dark: 'gray.600' } }}
        aria-label={activeOption.label}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ArrowUpDown size={14} />
        <Text as="span">{activeOption.label}</Text>
        <ChevronDown
          size={13}
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Button>
      {isOpen && (
        <Box
          position="absolute"
          right={0}
          top="calc(100% + 6px)"
          bg="bg"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="xl"
          boxShadow="0 12px 32px rgba(15, 23, 42, 0.12)"
          minW="190px"
          py={1}
          overflow="hidden"
          zIndex={20}
        >
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === activeOption.value;
            return (
              <Flex
                key={option.value}
                align="center"
                gap={2}
                px={3}
                py={2}
                cursor="pointer"
                color={isSelected ? 'green.600' : 'fg'}
                bg={isSelected ? 'green.50' : 'transparent'}
                _dark={{ bg: isSelected ? 'green.900' : 'transparent' }}
                _hover={{ bg: isSelected ? 'green.50' : 'bg.subtle' }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <OptionIcon size={14} />
                <Text flex={1} fontSize="sm">
                  {option.label}
                </Text>
                {isSelected && <Check size={14} />}
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default TournamentSortMenu;
