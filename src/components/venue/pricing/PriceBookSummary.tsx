'use client';

import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  NativeSelect,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Edit3, ImageIcon, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui/Field';
import { VButton } from '@/components/ui/VButton';
import { VenuePriceBook } from '@/lib/api/types';
import { formatCurrency, formatDate } from './pricing-utils';

interface PriceBookSummaryProps {
  book: VenuePriceBook;
  books: VenuePriceBook[];
  locale: string;
  legacyFixed?: number;
  legacyWalkIn?: number;
  onSelect: (bookId: string) => void;
  onEdit: () => void;
  onCreate: () => void;
}

export function PriceBookSummary({
  book,
  books,
  locale,
  legacyFixed,
  legacyWalkIn,
  onSelect,
  onEdit,
  onCreate,
}: PriceBookSummaryProps) {
  const t = useTranslations('adminVenuePricing');
  const hasLegacy = legacyFixed != null || legacyWalkIn != null;
  const orderedBooks = [
    ...books.filter((item) => item.isActive),
    ...books.filter((item) => !item.isActive),
  ];

  return (
    <VStack align="stretch" gap={4}>
      <Flex
        gap={3}
        align={{ base: 'stretch', md: 'flex-end' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Field label={t('bookSelector')} flex={1}>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="priceBook"
              value={book.id}
              onChange={(event) => onSelect(event.target.value)}
              bg={{ base: 'white', _dark: 'gray.900' }}
            >
              {orderedBooks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.isActive ? t('active') : t('inactive')}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field>
        <VButton
          type="button"
          variant="outline"
          leftIcon={<Plus size={16} aria-hidden="true" />}
          onClick={onCreate}
        >
          {t('createBook')}
        </VButton>
      </Flex>

      <Box
        bg={{ base: 'white', _dark: 'gray.900' }}
        borderWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        borderRadius="xl"
        p={{ base: 4, md: 5 }}
        shadow="sm"
      >
        <Flex gap={4} align="flex-start">
          {book.priceImageUrl ? (
            <Image
              src={book.priceImageUrl}
              alt={t('referenceImageAlt')}
              width="112px"
              height="84px"
              objectFit="cover"
              borderRadius="lg"
              borderWidth="1px"
              borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
              loading="lazy"
              display={{ base: 'none', sm: 'block' }}
              flexShrink={0}
            />
          ) : (
            <Flex
              width="112px"
              height="84px"
              display={{ base: 'none', sm: 'flex' }}
              align="center"
              justify="center"
              bg={{ base: 'gray.50', _dark: 'gray.800' }}
              borderRadius="lg"
              color="gray.400"
              flexShrink={0}
            >
              <ImageIcon size={24} aria-hidden="true" />
            </Flex>
          )}

          <Box flex={1} minW={0}>
            <Flex justify="space-between" gap={3} align="flex-start">
              <Box minW={0}>
                <HStack gap={2} wrap="wrap">
                  <Text fontWeight="bold" fontSize="lg" lineClamp={1}>
                    {book.name}
                  </Text>
                  <Badge colorPalette={book.isActive ? 'green' : 'gray'}>
                    {book.isActive ? t('active') : t('inactive')}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {book.effectiveTo
                    ? t('effectiveRange', {
                        from: formatDate(book.effectiveFrom, locale),
                        to: formatDate(book.effectiveTo, locale),
                      })
                    : t('effectiveFrom', {
                        date: formatDate(book.effectiveFrom, locale),
                      })}
                </Text>
              </Box>
              <VButton
                type="button"
                size="sm"
                variant="outline"
                flexShrink={0}
                leftIcon={<Edit3 size={15} aria-hidden="true" />}
                onClick={onEdit}
              >
                {t('editBook')}
              </VButton>
            </Flex>

            <SimpleGrid columns={{ base: 2, md: 3 }} gap={3} mt={4}>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  {t('ruleCountLabel')}
                </Text>
                <Text fontWeight="semibold">
                  {t('ruleCount', { count: book.rules?.length || 0 })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  {t('currency')}
                </Text>
                <Text fontWeight="semibold" translate="no">
                  {book.currency || 'VND'}
                </Text>
              </Box>
              <Box display={{ base: 'none', md: 'block' }}>
                <Text fontSize="xs" color="gray.500">
                  {t('priority')}
                </Text>
                <Text fontWeight="semibold">{book.priority || 0}</Text>
              </Box>
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>

      {hasLegacy && (
        <Box
          bg={{ base: 'orange.50', _dark: 'orange.950' }}
          borderWidth="1px"
          borderColor={{ base: 'orange.200', _dark: 'orange.800' }}
          borderRadius="lg"
          p={3}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {t('legacyTitle')}
          </Text>
          <Text
            fontSize="sm"
            color={{ base: 'orange.800', _dark: 'orange.200' }}
          >
            {t('legacyValues', {
              fixed:
                legacyFixed != null
                  ? formatCurrency(legacyFixed, book.currency || 'VND', locale)
                  : t('notConfigured'),
              walkIn:
                legacyWalkIn != null
                  ? formatCurrency(legacyWalkIn, book.currency || 'VND', locale)
                  : t('notConfigured'),
            })}
          </Text>
        </Box>
      )}
    </VStack>
  );
}
