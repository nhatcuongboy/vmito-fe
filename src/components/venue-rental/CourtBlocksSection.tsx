'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CalendarX, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  VenueCourt,
  VenueCourtBlock,
  VenueCourtBlockType,
} from '@/lib/api/types';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from './SectionCard';
import { venueDateTimeToIso, venueDateValue } from './date-time';
import { validateBlock } from './schedule-validation';

interface CourtBlocksSectionProps {
  venueId: string;
  timezone?: string;
  courts: VenueCourt[];
  blocks: VenueCourtBlock[];
  onReload: () => Promise<void>;
}

export default function CourtBlocksSection({
  venueId,
  timezone,
  courts,
  blocks,
  onReload,
}: CourtBlocksSectionProps) {
  const t = useTranslations('venueRental.courts');
  const locale = useLocale();
  const [saving, setSaving] = useState(false);
  const confirm = useConfirmAction<VenueCourtBlock>();

  const [draft, setDraft] = useState({
    courtId: '',
    type: VenueCourtBlockType.MAINTENANCE,
    date: venueDateValue(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timezone
    ),
    start: '08:00',
    end: '10:00',
    reason: '',
  });

  const error = useMemo(() => validateBlock(draft), [draft]);

  const formatRange = (item: VenueCourtBlock) => {
    const full = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    });
    const timeOnly = new Intl.DateTimeFormat(locale, {
      timeStyle: 'short',
      timeZone: timezone,
    });
    return `${full.format(new Date(item.startTime))} – ${timeOnly.format(
      new Date(item.endTime)
    )}`;
  };

  const createBlock = async () => {
    setSaving(true);
    try {
      await VenueRentalService.createCourtBlock(venueId, {
        courtId: draft.courtId || undefined,
        type: draft.type,
        startTime: venueDateTimeToIso(draft.date, draft.start, timezone),
        endTime: venueDateTimeToIso(draft.date, draft.end, timezone),
        reason: draft.reason || undefined,
      });
      await onReload();
      toaster.success({ title: t('blockCreated') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard title={t('blocksTitle')}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            <Field label={t('blockCourt')}>
              <SearchableSelect
                value={draft.courtId}
                onChange={(courtId) =>
                  setDraft((current) => ({ ...current, courtId }))
                }
                options={[
                  { value: '', label: t('wholeVenue') },
                  ...courts.map((court) => ({
                    value: court.id,
                    label: court.name,
                  })),
                ]}
              />
            </Field>
            <Field label={t('blockType')}>
              <SearchableSelect
                value={draft.type}
                onChange={(type) =>
                  setDraft((current) => ({
                    ...current,
                    type: type as VenueCourtBlockType,
                  }))
                }
                options={Object.values(VenueCourtBlockType).map((value) => ({
                  value,
                  label: t(`blockTypeValue.${value}`),
                }))}
              />
            </Field>
            <Field label={t('blockDate')}>
              <Input
                type="date"
                name="block-date"
                value={draft.date}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t('from')}>
              <Input
                type="time"
                step={1800}
                name="block-start"
                value={draft.start}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
              />
            </Field>
            <Field
              label={t('to')}
              invalid={!!error}
              errorText={error ? t(`errors.${error}`) : undefined}
            >
              <Input
                type="time"
                step={1800}
                name="block-end"
                value={draft.end}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t('reason')}>
              <Input
                name="block-reason"
                autoComplete="off"
                value={draft.reason}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </Field>
          </SimpleGrid>

          <Button
            alignSelf="start"
            loading={saving}
            disabled={!!error || saving}
            onClick={createBlock}
          >
            <CalendarX size={16} aria-hidden="true" />
            {t('addBlock')}
          </Button>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              {t('blocksListTitle')}
            </Heading>
            {blocks.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                {t('noBlocks')}
              </Text>
            ) : (
              <VStack align="stretch" gap={2}>
                {blocks.map((item) => (
                  <HStack key={item.id} borderBottomWidth="1px" py={2}>
                    <Box flex="1" minW={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {item.court?.name || t('wholeVenue')} —{' '}
                        {t(`blockTypeValue.${item.type}`)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatRange(item)}
                        {item.reason ? ` · ${item.reason}` : ''}
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      aria-label={t('removeBlock')}
                      flexShrink={0}
                      onClick={() => confirm.request(item)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </SectionCard>

      <ConfirmDialog
        isOpen={confirm.target !== null}
        title={t('confirmRemoveBlockTitle')}
        body={t('confirmRemoveBlockBody')}
        actionText={t('delete')}
        cancelText={t('cancel')}
        isLoading={confirm.isRunning}
        error={confirm.error}
        onClose={confirm.close}
        onConfirm={() =>
          confirm.run(async (block) => {
            await VenueRentalService.removeCourtBlock(venueId, block.id, {
              skipGlobalError: true,
            });
            await onReload();
            toaster.success({ title: t('blockRemoved') });
          }, t('saveError'))
        }
      />
    </>
  );
}
