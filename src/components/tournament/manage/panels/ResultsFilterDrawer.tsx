'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, Input, VStack } from '@/components/ui/chakra-compat';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/ChakraDrawer';
import { useTranslations } from 'next-intl';
import {
  Check,
  CircleSlash,
  Clock,
  Flag,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

import {
  ChipOption,
  EMPTY_FILTERS,
  ListFilterKey,
  ResultFilters,
  ResultStatusFilter,
} from './resultsFilters';

export function ResultsFilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  categoryOptions,
  roundOptions,
  courtOptions,
  statusOptions,
  teamOptions,
  onToggle,
  showPlayerNames,
  onTogglePlayerNames,
  showRefereeFilter,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: ResultFilters;
  setFilters: React.Dispatch<React.SetStateAction<ResultFilters>>;
  categoryOptions: ChipOption[];
  roundOptions: ChipOption[];
  courtOptions: ChipOption[];
  statusOptions: ChipOption[];
  teamOptions: ChipOption[];
  onToggle: <K extends ListFilterKey>(
    key: K,
    value: ResultFilters[K][number]
  ) => void;
  showPlayerNames: boolean;
  onTogglePlayerNames: () => void;
  showRefereeFilter: boolean;
}) {
  const t = useTranslations('pages.tournaments.manualScore');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width={{ base: 'calc(100vw - 48px)', sm: '420px', md: '500px' }}
      maxWidth={{ base: '420px', md: '500px' }}
    >
      <DrawerContent>
        <DrawerHeader>
          <Flex align="center" justify="space-between" gap={3}>
            <Text>{t('filters.title')}</Text>
            <Button
              variant="ghost"
              size="sm"
              colorPalette="gray"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" gap={6}>
            <Flex gap={2} wrap="wrap">
              <Button
                size="md"
                variant={showPlayerNames ? 'solid' : 'outline'}
                colorPalette={showPlayerNames ? 'green' : 'gray'}
                borderRadius="full"
                onClick={onTogglePlayerNames}
              >
                {t('showPlayerNamesBadge')}
              </Button>

              {showRefereeFilter && (
                <Button
                  size="md"
                  variant={filters.refereeOnly ? 'solid' : 'outline'}
                  colorPalette={filters.refereeOnly ? 'green' : 'gray'}
                  borderRadius="full"
                  borderWidth="2px"
                  borderColor={filters.refereeOnly ? 'green.500' : 'green.200'}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      refereeOnly: !prev.refereeOnly,
                    }))
                  }
                  leftIcon={<ShieldCheck size={16} />}
                >
                  {t('filters.referee')}
                </Button>
              )}
            </Flex>

            <FilterSection title={t('filters.categories')}>
              <ChipGroup
                options={categoryOptions}
                selected={filters.categoryIds}
                onToggle={(id) => onToggle('categoryIds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.rounds')}>
              <ChipGroup
                options={roundOptions}
                selected={filters.rounds}
                onToggle={(id) => onToggle('rounds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.courts')}>
              <ChipGroup
                options={courtOptions}
                selected={filters.courtIds}
                onToggle={(id) => onToggle('courtIds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.status')}>
              <ChipGroup
                options={statusOptions}
                selected={filters.statuses}
                onToggle={(id) =>
                  onToggle('statuses', id as ResultStatusFilter)
                }
                iconFor={(id) => statusIcon(id as ResultStatusFilter)}
              />
            </FilterSection>

            <FilterSection title={t('filters.dates')}>
              <Flex
                gap={2}
                align="center"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="full"
                px={4}
                py={3}
                _dark={{ borderColor: 'gray.700' }}
              >
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: event.target.value,
                    }))
                  }
                  border="0"
                  px={0}
                />
                <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                  →
                </Text>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateTo: event.target.value,
                    }))
                  }
                  border="0"
                  px={0}
                />
              </Flex>
            </FilterSection>

            <FilterSection title={t('filters.teams')}>
              <ChipGroup
                options={teamOptions}
                selected={filters.teamIds}
                onToggle={(id) => onToggle('teamIds', id)}
              />
            </FilterSection>
          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <Flex gap={3}>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <RotateCcw size={16} /> {t('filters.clear')}
            </Button>
            <Button flex="1" onClick={onClose}>
              {t('filters.apply')}
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Heading size="sm" mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  iconFor,
}: {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  iconFor?: (id: string) => React.ReactNode;
}) {
  if (options.length === 0) {
    return (
      <Text color="gray.400" _dark={{ color: 'gray.500' }}>
        —
      </Text>
    );
  }

  return (
    <Flex gap={2} wrap="wrap">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <Button
            key={option.id}
            size="md"
            variant={active ? 'solid' : 'outline'}
            colorPalette={active ? 'green' : 'gray'}
            borderRadius="full"
            onClick={() => onToggle(option.id)}
            leftIcon={
              option.color ? (
                <Box w="10px" h="10px" borderRadius="full" bg={option.color} />
              ) : (
                iconFor?.(option.id)
              )
            }
          >
            <Box textAlign="left">
              <Text as="span">{option.label}</Text>
              {option.description && (
                <Text display="block" fontSize="xs" opacity={0.72}>
                  {option.description}
                </Text>
              )}
            </Box>
          </Button>
        );
      })}
    </Flex>
  );
}

function statusIcon(status: ResultStatusFilter) {
  if (status === 'upcoming') return <Clock size={16} />;
  if (status === 'finished') return <Check size={16} />;
  if (status === 'cancelled') return <CircleSlash size={16} />;
  return <Flag size={16} />;
}
