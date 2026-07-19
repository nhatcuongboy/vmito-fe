'use client';

import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VButton } from '@/components/ui/VButton';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/VTable';
import {
  VenueCustomerType,
  VenueDayType,
  VenuePriceRule,
} from '@/lib/api/types';
import {
  formatCurrency,
  formatDate,
  minuteToTime,
  sortPriceRules,
} from './pricing-utils';

interface PriceRuleListProps {
  rules: VenuePriceRule[];
  currency: string;
  locale: string;
  onCreate: () => void;
  onEdit: (rule: VenuePriceRule) => void;
  onDelete: (rule: VenuePriceRule) => void;
}

export function PriceRuleList({
  rules,
  currency,
  locale,
  onCreate,
  onEdit,
  onDelete,
}: PriceRuleListProps) {
  const t = useTranslations('adminVenuePricing');
  const orderedRules = sortPriceRules(rules);

  const getDayLabel = (rule: VenuePriceRule) => {
    const base = t(`dayTypes.${rule.dayType}`);
    if (rule.dayType === VenueDayType.WEEKDAY && rule.daysOfWeek.length > 0) {
      return `${base}: ${rule.daysOfWeek.map((day) => t(`weekdays.${day}`)).join(', ')}`;
    }
    if (
      (rule.dayType === VenueDayType.HOLIDAY ||
        rule.dayType === VenueDayType.SPECIFIC_DATE) &&
      rule.specificDate
    ) {
      return `${base}: ${formatDate(rule.specificDate, locale)}`;
    }
    return base;
  };

  const getCustomerLabel = (customerType: VenueCustomerType) =>
    t(`customerTypes.${customerType}`);

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.900' }}
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
      borderRadius="xl"
      shadow="sm"
      overflow="hidden"
    >
      <Flex
        justify="space-between"
        align="center"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
        borderBottomWidth={orderedRules.length > 0 ? '1px' : '0'}
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
      >
        <Box>
          <Heading size="md" textWrap="balance">
            {t('rulesTitle')}
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {t('rulesDescription')}
          </Text>
        </Box>
        <VButton
          type="button"
          size="sm"
          leftIcon={<Plus size={16} aria-hidden="true" />}
          onClick={onCreate}
          flexShrink={0}
        >
          {t('addRule')}
        </VButton>
      </Flex>

      {orderedRules.length === 0 ? (
        <VStack p={{ base: 8, md: 12 }} gap={3} textAlign="center">
          <Text fontWeight="semibold">{t('emptyRulesTitle')}</Text>
          <Text fontSize="sm" color="gray.500" maxW="440px">
            {t('emptyRulesDescription')}
          </Text>
          <VButton type="button" mt={2} onClick={onCreate}>
            {t('addFirstRule')}
          </VButton>
        </VStack>
      ) : (
        <>
          <TableContainer
            display={{ base: 'none', md: 'block' }}
            borderWidth="0"
            borderRadius="0"
            shadow="none"
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('scope')}</Th>
                  <Th>{t('timeRange')}</Th>
                  <Th>{t('customerType')}</Th>
                  <Th textAlign="right">{t('pricePerHour')}</Th>
                  <Th>{t('advanced')}</Th>
                  <Th textAlign="right">{t('actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orderedRules.map((rule) => (
                  <Tr key={rule.id}>
                    <Td maxW="240px">
                      <Text fontWeight="medium" lineClamp={2}>
                        {getDayLabel(rule)}
                      </Text>
                    </Td>
                    <Td fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                      {minuteToTime(rule.startMinute)}–
                      {minuteToTime(rule.endMinute)}
                    </Td>
                    <Td>
                      <Badge variant="subtle">
                        {getCustomerLabel(rule.customerType)}
                      </Badge>
                    </Td>
                    <Td
                      textAlign="right"
                      fontWeight="semibold"
                      whiteSpace="nowrap"
                    >
                      {formatCurrency(rule.pricePerHour, currency, locale)}
                    </Td>
                    <Td color="gray.500" maxW="220px">
                      <Text fontSize="xs" lineClamp={2}>
                        {t('advancedSummary', {
                          minimum: rule.minimumMinutes || t('defaultValue'),
                          step: rule.billingStepMinutes || t('defaultValue'),
                          priority: rule.priority || 0,
                        })}
                      </Text>
                    </Td>
                    <Td>
                      <HStack justify="flex-end" gap={2}>
                        <VButton
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => onEdit(rule)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          {t('edit')}
                        </VButton>
                        <VButton
                          type="button"
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => onDelete(rule)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          {t('delete')}
                        </VButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <VStack
            display={{ base: 'flex', md: 'none' }}
            align="stretch"
            gap={0}
          >
            {orderedRules.map((rule) => (
              <Box
                key={rule.id}
                p={4}
                borderBottomWidth="1px"
                borderColor={{ base: 'gray.100', _dark: 'gray.800' }}
              >
                <Flex justify="space-between" gap={3} align="flex-start">
                  <Box minW={0}>
                    <Text fontWeight="semibold">{getDayLabel(rule)}</Text>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      fontVariantNumeric="tabular-nums"
                    >
                      {minuteToTime(rule.startMinute)}–
                      {minuteToTime(rule.endMinute)} ·{' '}
                      {getCustomerLabel(rule.customerType)}
                    </Text>
                  </Box>
                  <Text fontWeight="bold" whiteSpace="nowrap">
                    {formatCurrency(rule.pricePerHour, currency, locale)}
                  </Text>
                </Flex>
                {rule.notes && (
                  <Text fontSize="sm" color="gray.500" lineClamp={2} mt={2}>
                    {rule.notes}
                  </Text>
                )}
                <HStack mt={3} gap={2}>
                  <VButton
                    type="button"
                    size="sm"
                    variant="outline"
                    flex={1}
                    onClick={() => onEdit(rule)}
                  >
                    {t('edit')}
                  </VButton>
                  <VButton
                    type="button"
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    flex={1}
                    onClick={() => onDelete(rule)}
                  >
                    {t('delete')}
                  </VButton>
                </HStack>
              </Box>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
}
