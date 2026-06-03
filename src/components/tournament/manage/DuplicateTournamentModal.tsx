'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Field,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { Tournament, Venue } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { VenueService } from '@/lib/api/venue.service';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { VModal } from '@/components/ui/VModal';
import { VTooltip } from '@/components/ui/VTooltip';
import { toaster } from '@/components/ui/toaster';
import { formatVenueName } from '@/utils';

interface DuplicateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
}

type CopyOptions = {
  schedule: boolean;
  teams: boolean;
  venues: boolean;
  matchResults: boolean;
  customHomePage: boolean;
};

type CopyOptionKey = keyof CopyOptions | 'format';

const DEFAULT_COPY_OPTIONS: CopyOptions = {
  schedule: true,
  teams: true,
  venues: true,
  matchResults: true,
  customHomePage: true,
};

const COPY_OPTION_KEYS: CopyOptionKey[] = [
  'format',
  'schedule',
  'teams',
  'matchResults',
  'venues',
  'customHomePage',
];

const formatDateForInput = (date: Date | string) =>
  new Date(date).toISOString().split('T')[0];

const toIsoDate = (date: string) => new Date(date).toISOString();

export default function DuplicateTournamentModal({
  isOpen,
  onClose,
  tournament,
}: DuplicateTournamentModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage.duplicateModal');
  const tVenue = useTranslations('venue');
  const router = useRouter();
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const defaultName = `${tournament.name} ${t('copySuffix')}`;
  const defaultStartDate = formatDateForInput(tournament.startDate);
  const defaultEndDate = formatDateForInput(tournament.endDate);

  const [name, setName] = useState(defaultName);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(
    tournament.venue ?? null
  );
  const [selectedVenueId, setSelectedVenueId] = useState(
    tournament.venueId ?? ''
  );
  const [copyOptions, setCopyOptions] =
    useState<CopyOptions>(DEFAULT_COPY_OPTIONS);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName(defaultName);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setSelectedVenue(tournament.venue ?? null);
    setSelectedVenueId(tournament.venueId ?? '');
    setCopyOptions(DEFAULT_COPY_OPTIONS);
  }, [
    defaultEndDate,
    defaultName,
    defaultStartDate,
    tournament.venue,
    tournament.venueId,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    resetForm();
    setIsVenueLoading(true);
    VenueService.searchVenues({ limit: 100 })
      .then((result) => setVenues(result.data || []))
      .catch((error) => {
        console.error('Failed to load venues:', error);
        toaster.error({ title: t('errors.loadVenuesFailed') });
      })
      .finally(() => setIsVenueLoading(false));
  }, [isOpen, resetForm, t]);

  useEffect(() => {
    return () => {
      if (venueSearchTimerRef.current) {
        clearTimeout(venueSearchTimerRef.current);
      }
    };
  }, []);

  const venueOptions = useMemo(() => {
    const options = venues.map((venue) => ({
      value: venue.id,
      label: formatVenueName(
        venue.name,
        tVenue('nameFormat', { name: '{name}' })
      ),
      sublabel: venue.address,
    }));

    if (
      selectedVenue &&
      !venues.some((venue) => venue.id === selectedVenue.id)
    ) {
      options.unshift({
        value: selectedVenue.id,
        label: formatVenueName(
          selectedVenue.name,
          tVenue('nameFormat', { name: '{name}' })
        ),
        sublabel: selectedVenue.address,
      });
    }

    return options;
  }, [selectedVenue, tVenue, venues]);

  const validationError = useMemo(() => {
    if (!name.trim()) return t('errors.nameRequired');
    if (!startDate || !endDate) return t('errors.datesRequired');
    if (new Date(endDate) < new Date(startDate)) {
      return t('errors.endBeforeStart');
    }
    return '';
  }, [endDate, name, startDate, t]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleVenueSearch = useCallback(
    (keyword: string) => {
      if (venueSearchTimerRef.current)
        clearTimeout(venueSearchTimerRef.current);

      venueSearchTimerRef.current = setTimeout(async () => {
        setIsVenueLoading(true);
        try {
          const result = await VenueService.searchVenues({
            keyword: keyword.trim() || undefined,
            limit: 100,
            sortBy: keyword.trim() ? 'relevance' : undefined,
          });
          setVenues(result.data || []);
        } catch (error) {
          console.error('Error searching venues:', error);
          toaster.error({ title: t('errors.loadVenuesFailed') });
        } finally {
          setIsVenueLoading(false);
        }
      }, 300);
    },
    [t]
  );

  const handleToggleCopyOption = (key: keyof CopyOptions, checked: boolean) => {
    setCopyOptions((current) => {
      const next = { ...current, [key]: checked };
      if (key === 'schedule' && !checked) {
        next.matchResults = false;
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (validationError) {
      toaster.error({ title: validationError });
      return;
    }

    try {
      setIsSubmitting(true);
      const duplicated = await TournamentService.duplicateTournament(
        tournament.id,
        {
          name: name.trim(),
          startDate: toIsoDate(startDate),
          endDate: toIsoDate(endDate),
          venueId: selectedVenueId || null,
          copy: {
            format: true,
            ...copyOptions,
          },
        }
      );
      toaster.success({ title: t('success') });
      onClose();
      router.push(`/tournament/${duplicated.slug}/manage`);
    } catch (error) {
      console.error('Error duplicating tournament:', error);
      toaster.error({ title: t('errors.duplicateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOption = (key: CopyOptionKey) => {
    const isFormat = key === 'format';
    const isMatchResults = key === 'matchResults';
    const checked = isFormat ? true : copyOptions[key];
    const disabled = isFormat || (isMatchResults && !copyOptions.schedule);

    return (
      <HStack key={key} gap={2} minH="32px">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(details) => {
            if (!isFormat) {
              handleToggleCopyOption(key, details.checked === true);
            }
          }}
        >
          <Text
            fontWeight="semibold"
            color={disabled && !isFormat ? 'gray.400' : 'gray.900'}
          >
            {t(`options.${key}.label`)}
          </Text>
        </Checkbox>
        <VTooltip content={t(`options.${key}.tooltip`)}>
          <IconButton
            aria-label={t(`options.${key}.tooltip`)}
            variant="ghost"
            size="xs"
            colorPalette="gray"
          >
            <Info size={16} />
          </IconButton>
        </VTooltip>
      </HStack>
    );
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('title')}
      description={t('description')}
      size="xl"
      maxBodyHeight={{ base: '70vh', md: '75vh' }}
      secondaryActionText={t('cancel')}
      primaryActionText={t('confirm')}
      primaryColorScheme="blue"
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!!validationError || isSubmitting}
      onPrimaryAction={handleConfirm}
      closeButtonAriaLabel={t('close')}
      showFooterDivider
    >
      <VStack align="stretch" gap={5}>
        <Field.Root required>
          <Field.Label>{t('fields.name')}</Field.Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
        </Field.Root>

        <Grid templateColumns={{ base: '1fr', md: '1fr auto 1fr' }} gap={4}>
          <Field.Root required>
            <Field.Label>{t('fields.startDate')}</Field.Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={isSubmitting}
            />
          </Field.Root>
          <Flex
            align="flex-end"
            justify="center"
            pb={{ base: 0, md: 2 }}
            color="gray.500"
          >
            <Text fontSize="2xl">→</Text>
          </Flex>
          <Field.Root required>
            <Field.Label>{t('fields.endDate')}</Field.Label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={isSubmitting}
            />
          </Field.Root>
        </Grid>

        <Field.Root>
          <Field.Label>{t('fields.location')}</Field.Label>
          <Flex align="center" gap={3}>
            <Box flex={1} minW={0}>
              <SearchableSelect
                value={selectedVenueId}
                onChange={(value) => {
                  setSelectedVenueId(value);
                  setSelectedVenue(
                    venues.find((venue) => venue.id === value) ?? null
                  );
                }}
                options={venueOptions}
                placeholder={t('fields.locationPlaceholder')}
                searchPlaceholder={t('fields.locationPlaceholder')}
                noOptionsMessage={t('fields.noVenues')}
                onSearchChange={handleVenueSearch}
                isLoading={isVenueLoading}
                isDisabled={isSubmitting}
              />
            </Box>
            {selectedVenueId && (
              <Flex color="green.600" flexShrink={0}>
                <Check size={22} />
              </Flex>
            )}
          </Flex>
        </Field.Root>

        {validationError && (
          <Text fontSize="sm" color="red.500">
            {validationError}
          </Text>
        )}

        <Box>
          <Text fontWeight="bold" fontSize="lg" mb={3}>
            {t('copyHeading')}
          </Text>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
            {COPY_OPTION_KEYS.map(renderOption)}
          </Grid>
        </Box>
      </VStack>
    </VModal>
  );
}
