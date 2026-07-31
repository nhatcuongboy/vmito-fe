'use client';

import { Button } from '@/components/ui/chakra-compat';
import { TournamentStatus } from '@/lib/api/types';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Check, ChevronDown, ListFilter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const QUICK_STATUSES: TournamentStatus[] = [
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.PREPARING,
  TournamentStatus.FINISHED,
];

interface ITournamentStatusSelectProps {
  value: TournamentStatus[];
  onChange: (statuses: TournamentStatus[]) => void;
}

export function TournamentStatusSelect({
  value,
  onChange,
}: ITournamentStatusSelectProps) {
  const t = useTranslations('pages.tournaments');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMultipleStatuses = value.length > 1;
  const selectedValue = value.length === 1 ? value[0] : '';

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

  const options: Array<{ value: TournamentStatus | ''; label: string }> = [
    { value: '', label: t('filters.status.all') },
    ...QUICK_STATUSES.map((status) => ({
      value: status,
      label: t(`filters.status.${status}`),
    })),
  ];
  const activeOption = hasMultipleStatuses
    ? { value: 'multiple', label: t('filters.status.title') }
    : (options.find((option) => option.value === selectedValue) ?? options[0]);

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
        aria-label={t('filters.status.title')}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ListFilter size={14} />
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
          left={0}
          top="calc(100% + 6px)"
          bg="bg"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="xl"
          boxShadow="0 12px 32px rgba(15, 23, 42, 0.12)"
          minW="170px"
          py={1}
          overflow="hidden"
          zIndex={20}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;
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
                  onChange(option.value ? [option.value] : []);
                  setIsOpen(false);
                }}
              >
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

export default TournamentStatusSelect;
