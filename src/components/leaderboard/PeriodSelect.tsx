'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TLeaderboardPeriod } from '@/lib/api/ranking.service';
import { formatPeriodLabel, getRecentPeriods, IPeriodOption } from './periods';

interface PeriodSelectProps {
  period: TLeaderboardPeriod;
  /** null means the current period. */
  periodKey: string | null;
  onChange: (option: IPeriodOption) => void;
}

export default function PeriodSelect({
  period,
  periodKey,
  onChange,
}: PeriodSelectProps) {
  const t = useTranslations('leaderboard');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<IPeriodOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Computed after mount so the server and client markup cannot disagree.
  useEffect(() => setOptions(getRecentPeriods(period)), [period]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (period === 'all') return null;

  const selected =
    options.find((option) => option.key === periodKey) ?? options[0];

  return (
    <Box ref={containerRef} position="relative">
      <Flex
        as="button"
        align="center"
        gap={2}
        px={3}
        py={2}
        minH="40px"
        borderWidth="1px"
        borderColor={isOpen ? 'brand.400' : 'border.subtle'}
        borderRadius="lg"
        bg="bg.panel"
        cursor="pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Text fontSize="sm" fontWeight="600">
          {selected ? formatPeriodLabel(t, period, selected) : '—'}
        </Text>
        <Box
          color="fg.muted"
          transform={isOpen ? 'rotate(180deg)' : undefined}
          transition="transform 0.2s"
        >
          <ChevronDown size={16} />
        </Box>
      </Flex>

      {isOpen && (
        <VStack
          role="listbox"
          align="stretch"
          gap={0}
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          minW="200px"
          zIndex={20}
          py={1}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="lg"
          boxShadow="lg"
        >
          {options.map((option) => {
            const isSelected = option.key === selected?.key;
            return (
              <Flex
                key={option.key}
                as="button"
                role="option"
                aria-selected={isSelected}
                align="center"
                justify="space-between"
                gap={3}
                px={3}
                py={2}
                cursor="pointer"
                bg={isSelected ? 'brand.50' : 'transparent'}
                _hover={{ bg: isSelected ? 'brand.100' : 'bg.subtle' }}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                <Text
                  fontSize="sm"
                  fontWeight={isSelected ? '600' : '500'}
                  whiteSpace="nowrap"
                >
                  {formatPeriodLabel(t, period, option)}
                </Text>
                {isSelected && (
                  <Box color="brand.500">
                    <Check size={14} />
                  </Box>
                )}
              </Flex>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
