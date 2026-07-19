'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Calculator, Plus, RefreshCw, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { stringField, useUrlFilters } from '@/hooks/useUrlFilters';
import { IconButton, VButton } from '@/components/ui/VButton';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { VenueService } from '@/lib/api/venue.service';
import { Venue, VenuePriceBook, VenuePriceRule } from '@/lib/api/types';
import { PriceBookEditorDrawer } from './pricing/PriceBookEditorDrawer';
import { PriceBookSummary } from './pricing/PriceBookSummary';
import { PriceCalculatorDrawer } from './pricing/PriceCalculatorDrawer';
import { PriceRuleEditorDrawer } from './pricing/PriceRuleEditorDrawer';
import { PriceRuleList } from './pricing/PriceRuleList';
import {
  dateInputToIso,
  PriceBookFormValues,
  PriceRuleFormValues,
  selectPriceBook,
  timeToMinute,
} from './pricing/pricing-utils';

const bookQuerySchema = { book: stringField('') };

type BookDrawerMode = 'create' | 'edit' | null;
type DeleteTarget =
  | { type: 'book'; book: VenuePriceBook }
  | { type: 'rule'; rule: VenuePriceRule }
  | null;

interface VenuePricingManagerProps {
  venue: Venue;
  initialPriceBooks: VenuePriceBook[];
}

export default function VenuePricingManager({
  venue,
  initialPriceBooks,
}: VenuePricingManagerProps) {
  const t = useTranslations('adminVenuePricing');
  const locale = useLocale();
  const [filters, setFilters] = useUrlFilters(bookQuerySchema);
  const [priceBooks, setPriceBooks] = useState(initialPriceBooks);
  const [bookDrawerMode, setBookDrawerMode] = useState<BookDrawerMode>(null);
  const [ruleEditor, setRuleEditor] = useState<
    VenuePriceRule | 'create' | null
  >(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const selectedBook = useMemo(
    () => selectPriceBook(priceBooks, filters.book),
    [filters.book, priceBooks]
  );

  useEffect(() => {
    if (selectedBook && filters.book !== selectedBook.id) {
      setFilters({ book: selectedBook.id });
    }
    if (!selectedBook && filters.book) setFilters({ book: '' });
  }, [filters.book, selectedBook, setFilters]);

  const selectBook = (bookId: string) => setFilters({ book: bookId });

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await VenueService.getPriceBooks(venue.id);
      setPriceBooks(data);
      const next = selectPriceBook(data, selectedBook?.id);
      setFilters({ book: next?.id || '' });
    } catch {
      toaster.error({ title: t('errors.loadBooks') });
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveBook = async (
    values: PriceBookFormValues,
    currentBook: VenuePriceBook | null
  ) => {
    const payload = {
      ...values,
      effectiveFrom: dateInputToIso(values.effectiveFrom)!,
      effectiveTo: dateInputToIso(values.effectiveTo),
    };

    if (currentBook) {
      const updated = await VenueService.updatePriceBook(
        venue.id,
        currentBook.id,
        payload
      );
      setPriceBooks((books) =>
        books.map((book) =>
          book.id === currentBook.id
            ? { ...book, ...updated, rules: updated.rules || book.rules }
            : book
        )
      );
      toaster.success({ title: t('messages.bookSaved') });
      return;
    }

    const created = await VenueService.createPriceBook(venue.id, payload);
    setPriceBooks((books) => [
      { ...created, rules: created.rules || [] },
      ...books,
    ]);
    setFilters({ book: created.id });
    toaster.success({ title: t('messages.bookCreated') });
  };

  const saveRule = async (
    values: PriceRuleFormValues,
    currentRule: VenuePriceRule | null
  ) => {
    if (!selectedBook) return;
    const payload = {
      dayType: values.dayType,
      daysOfWeek: values.daysOfWeek,
      specificDate: dateInputToIso(values.specificDate),
      startMinute: timeToMinute(values.startTime),
      endMinute: timeToMinute(values.endTime),
      customerType: values.customerType,
      pricePerHour: values.pricePerHour,
      minimumMinutes: values.minimumMinutes
        ? Number(values.minimumMinutes)
        : null,
      billingStepMinutes: values.billingStepMinutes
        ? Number(values.billingStepMinutes)
        : null,
      priority: values.priority,
      notes: values.notes || null,
    };

    if (currentRule) {
      const updated = await VenueService.updatePriceRule(
        venue.id,
        selectedBook.id,
        currentRule.id,
        payload
      );
      setPriceBooks((books) =>
        books.map((book) =>
          book.id === selectedBook.id
            ? {
                ...book,
                rules: (book.rules || []).map((rule) =>
                  rule.id === currentRule.id ? updated : rule
                ),
              }
            : book
        )
      );
      toaster.success({ title: t('messages.ruleSaved') });
      return;
    }

    const created = await VenueService.createPriceRule(
      venue.id,
      selectedBook.id,
      payload
    );
    setPriceBooks((books) =>
      books.map((book) =>
        book.id === selectedBook.id
          ? { ...book, rules: [...(book.rules || []), created] }
          : book
      )
    );
    toaster.success({ title: t('messages.ruleCreated') });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      if (deleteTarget.type === 'book') {
        await VenueService.deletePriceBook(venue.id, deleteTarget.book.id);
        const remaining = priceBooks.filter(
          (book) => book.id !== deleteTarget.book.id
        );
        setPriceBooks(remaining);
        setFilters({ book: selectPriceBook(remaining, null)?.id || '' });
        setBookDrawerMode(null);
        toaster.success({ title: t('messages.bookDeleted') });
      } else if (selectedBook) {
        await VenueService.deletePriceRule(
          venue.id,
          selectedBook.id,
          deleteTarget.rule.id
        );
        setPriceBooks((books) =>
          books.map((book) =>
            book.id === selectedBook.id
              ? {
                  ...book,
                  rules: (book.rules || []).filter(
                    (rule) => rule.id !== deleteTarget.rule.id
                  ),
                }
              : book
          )
        );
        toaster.success({ title: t('messages.ruleDeleted') });
      }
      setDeleteTarget(null);
    } catch {
      setDeleteError(
        deleteTarget.type === 'book'
          ? t('errors.deleteBook')
          : t('errors.deleteRule')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <VStack align="stretch" gap={5}>
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Box>
          <Heading size="md" textWrap="balance">
            {t('pageHeading')}
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {t('pageDescription')}
          </Text>
        </Box>
        <HStack gap={2} wrap="wrap">
          <VButton
            type="button"
            variant="outline"
            leftIcon={<Calculator size={16} aria-hidden="true" />}
            onClick={() => setCalculatorOpen(true)}
            disabled={!selectedBook}
          >
            {t('calculatorAction')}
          </VButton>
          <VButton
            as={Link}
            href={ROUTES.ADMIN.VENUE_RENTAL_SETTINGS(venue.id)}
            variant="outline"
            leftIcon={<Settings size={16} aria-hidden="true" />}
          >
            {t('rentalSettingsAction')}
          </VButton>
          <IconButton
            type="button"
            variant="outline"
            aria-label={t('refresh')}
            icon={<RefreshCw size={16} aria-hidden="true" />}
            isLoading={isRefreshing}
            onClick={refresh}
          />
        </HStack>
      </Flex>

      {selectedBook ? (
        <>
          <PriceBookSummary
            book={selectedBook}
            books={priceBooks}
            locale={locale}
            legacyFixed={venue.hourlyRateFixed}
            legacyWalkIn={venue.hourlyRateWalkIn}
            onSelect={selectBook}
            onEdit={() => setBookDrawerMode('edit')}
            onCreate={() => setBookDrawerMode('create')}
          />
          <PriceRuleList
            rules={selectedBook.rules || []}
            currency={selectedBook.currency || 'VND'}
            locale={locale}
            onCreate={() => setRuleEditor('create')}
            onEdit={setRuleEditor}
            onDelete={(rule) => {
              setDeleteError('');
              setDeleteTarget({ type: 'rule', rule });
            }}
          />
        </>
      ) : (
        <VStack
          bg={{ base: 'white', _dark: 'gray.900' }}
          borderWidth="1px"
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          borderRadius="xl"
          p={{ base: 8, md: 12 }}
          textAlign="center"
          gap={3}
        >
          <Heading size="md">{t('emptyBooksTitle')}</Heading>
          <Text fontSize="sm" color="gray.500" maxW="480px">
            {t('emptyBooksDescription')}
          </Text>
          <VButton
            type="button"
            mt={2}
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setBookDrawerMode('create')}
          >
            {t('createFirstBook')}
          </VButton>
        </VStack>
      )}

      <PriceBookEditorDrawer
        isOpen={bookDrawerMode !== null}
        mode={bookDrawerMode || 'create'}
        book={bookDrawerMode === 'edit' ? selectedBook : null}
        onClose={() => setBookDrawerMode(null)}
        onSave={saveBook}
        onDelete={() => {
          if (!selectedBook) return;
          setDeleteError('');
          setDeleteTarget({ type: 'book', book: selectedBook });
        }}
      />

      <PriceRuleEditorDrawer
        isOpen={ruleEditor !== null}
        rule={ruleEditor === 'create' ? null : ruleEditor}
        onClose={() => setRuleEditor(null)}
        onSave={saveRule}
      />

      <PriceCalculatorDrawer
        isOpen={calculatorOpen}
        venueId={venue.id}
        locale={locale}
        defaultCurrency={selectedBook?.currency || 'VND'}
        onClose={() => setCalculatorOpen(false)}
      />

      <VModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === 'book'
            ? t('deleteBookTitle')
            : t('deleteRuleTitle')
        }
        primaryActionText={t('confirmDelete')}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
        onPrimaryAction={confirmDelete}
        isPrimaryLoading={isDeleting}
        isPrimaryDisabled={isDeleting}
        isSecondaryDisabled={isDeleting}
        closeOnOverlayClick={!isDeleting}
      >
        <VStack align="stretch" gap={3}>
          <Text>
            {deleteTarget?.type === 'book'
              ? t('deleteBookDescription', {
                  name: deleteTarget.book.name,
                  count: deleteTarget.book.rules?.length || 0,
                })
              : t('deleteRuleDescription')}
          </Text>
          {deleteError && (
            <Text color="red.600" fontSize="sm" role="alert" aria-live="polite">
              {deleteError}
            </Text>
          )}
        </VStack>
      </VModal>
    </VStack>
  );
}
