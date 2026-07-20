'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { VenueCourt, VenueCourtStatus } from '@/lib/api/types';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from './SectionCard';

interface CourtInventorySectionProps {
  venueId: string;
  courts: VenueCourt[];
  onReload: () => Promise<void>;
}

export default function CourtInventorySection({
  venueId,
  courts: serverCourts,
  onReload,
}: CourtInventorySectionProps) {
  const t = useTranslations('venueRental.courts');
  const [drafts, setDrafts] = useState<VenueCourt[]>(serverCourts);
  const [busy, setBusy] = useState('');
  const [newCourt, setNewCourt] = useState({ name: '', code: '' });
  const confirm = useConfirmAction<VenueCourt>();

  // Adopt server data whenever it is refetched.
  useEffect(() => setDrafts(serverCourts), [serverCourts]);

  const dirtyIds = useMemo(() => {
    const original = new Map(serverCourts.map((court) => [court.id, court]));
    return new Set(
      drafts
        .filter((court) => {
          const source = original.get(court.id);
          return (
            !!source &&
            (source.name !== court.name ||
              source.code !== court.code ||
              source.status !== court.status)
          );
        })
        .map((court) => court.id)
    );
  }, [drafts, serverCourts]);

  const hasUnsaved = dirtyIds.size > 0;
  useUnsavedChanges(hasUnsaved);

  const statusOptions = useMemo(
    () =>
      Object.values(VenueCourtStatus).map((value) => ({
        value,
        label: t(`status.${value}`),
      })),
    [t]
  );

  const updateDraft = (id: string, data: Partial<VenueCourt>) =>
    setDrafts((current) =>
      current.map((court) => (court.id === id ? { ...court, ...data } : court))
    );

  const moveCourt = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= drafts.length) return;
    const first = drafts[index];
    const second = drafts[target];
    setBusy(first.id);
    try {
      await Promise.all([
        VenueRentalService.updateCourt(venueId, first.id, {
          displayOrder: second.displayOrder,
        }),
        VenueRentalService.updateCourt(venueId, second.id, {
          displayOrder: first.displayOrder,
        }),
      ]);
      await onReload();
    } finally {
      setBusy('');
    }
  };

  const saveCourt = async (court: VenueCourt) => {
    setBusy(court.id);
    try {
      await VenueRentalService.updateCourt(venueId, court.id, {
        name: court.name,
        code: court.code,
        status: court.status,
      });
      await onReload();
      toaster.success({ title: t('courtSaved') });
    } finally {
      setBusy('');
    }
  };

  const createCourt = async () => {
    setBusy('new-court');
    try {
      await VenueRentalService.createCourt(venueId, {
        ...newCourt,
        displayOrder: drafts.length + 1,
      });
      setNewCourt({ name: '', code: '' });
      await onReload();
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <SectionCard
        title={t('inventoryTitle')}
        description={t('inventoryHelp')}
        headerRight={
          hasUnsaved ? (
            <Badge colorPalette="orange" size="sm">
              {t('unsavedBadge')}
            </Badge>
          ) : undefined
        }
      >
        <VStack align="stretch" gap={2}>
          {drafts.length === 0 ? (
            <Text fontSize="sm" color="gray.500" py={2}>
              {t('noCourts')}
            </Text>
          ) : (
            <>
              {/* Column headers: the rows are otherwise bare inputs. */}
              <HStack
                gap={2}
                display={{ base: 'none', md: 'flex' }}
                px={1}
                color="gray.500"
                fontSize="xs"
                fontWeight="semibold"
              >
                <Box w="72px" flexShrink={0} />
                <Box flex="1">{t('name')}</Box>
                <Box flex="1">{t('code')}</Box>
                <Box w="176px" flexShrink={0}>
                  {t('statusLabel')}
                </Box>
                <Box w="96px" flexShrink={0} textAlign="right">
                  {t('columnActions')}
                </Box>
              </HStack>

              {drafts.map((court, index) => (
                <HStack
                  key={court.id}
                  gap={2}
                  align="center"
                  flexWrap={{ base: 'wrap', md: 'nowrap' }}
                >
                  <HStack gap={0} w="72px" flexShrink={0}>
                    {/* Reordering refetches the list, which would discard edits
                        pending on any row — block it until they are saved. */}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('moveUp')}
                      disabled={index === 0 || !!busy || hasUnsaved}
                      onClick={() => moveCourt(index, -1)}
                    >
                      <ArrowUp size={15} aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('moveDown')}
                      disabled={
                        index === drafts.length - 1 || !!busy || hasUnsaved
                      }
                      onClick={() => moveCourt(index, 1)}
                    >
                      <ArrowDown size={15} aria-hidden="true" />
                    </Button>
                  </HStack>

                  <Box flex="1" minW="120px">
                    <Input
                      name={`court-name-${court.id}`}
                      autoComplete="off"
                      aria-label={t('name')}
                      value={court.name}
                      onChange={(event) =>
                        updateDraft(court.id, { name: event.target.value })
                      }
                    />
                  </Box>
                  <Box flex="1" minW="120px">
                    <Input
                      name={`court-code-${court.id}`}
                      autoComplete="off"
                      aria-label={t('code')}
                      value={court.code}
                      onChange={(event) =>
                        updateDraft(court.id, { code: event.target.value })
                      }
                    />
                  </Box>
                  {/* Fixed width: SearchableSelect is width:100% and would
                      otherwise starve the inputs beside it. */}
                  <Box w={{ base: '100%', md: '176px' }} flexShrink={0}>
                    <SearchableSelect
                      value={court.status}
                      onChange={(value) =>
                        updateDraft(court.id, {
                          status: value as VenueCourtStatus,
                        })
                      }
                      options={statusOptions}
                    />
                  </Box>

                  <HStack
                    gap={1}
                    w={{ base: '100%', md: '96px' }}
                    flexShrink={0}
                    justify="flex-end"
                  >
                    {/* Only offered once the row differs, so it is obvious
                        which rows still need saving. */}
                    {dirtyIds.has(court.id) && (
                      <Button
                        size="sm"
                        colorPalette="green"
                        loading={busy === court.id}
                        onClick={() => saveCourt(court)}
                      >
                        <Save size={14} aria-hidden="true" />
                        {t('save')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      aria-label={t('remove')}
                      onClick={() => confirm.request(court)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </HStack>
                </HStack>
              ))}
            </>
          )}

          <HStack mt={3} gap={2} flexWrap="wrap" align="flex-end">
            <Box flex="1" minW="140px">
              <Field label={t('name')}>
                <Input
                  name="new-court-name"
                  autoComplete="off"
                  value={newCourt.name}
                  onChange={(event) =>
                    setNewCourt((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
            </Box>
            <Box flex="1" minW="140px">
              <Field label={t('code')}>
                <Input
                  name="new-court-code"
                  autoComplete="off"
                  value={newCourt.code}
                  onChange={(event) =>
                    setNewCourt((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                />
              </Field>
            </Box>
            <Button
              loading={busy === 'new-court'}
              disabled={
                !newCourt.name.trim() ||
                !newCourt.code.trim() ||
                !!busy ||
                // Creating refetches the list and would drop pending edits.
                hasUnsaved
              }
              onClick={createCourt}
            >
              <Plus size={16} aria-hidden="true" />
              {t('addCourt')}
            </Button>
          </HStack>
        </VStack>
      </SectionCard>

      <ConfirmDialog
        isOpen={confirm.target !== null}
        title={t('confirmRemoveCourtTitle')}
        body={t('confirmRemoveCourtBody', { name: confirm.target?.name || '' })}
        actionText={t('delete')}
        cancelText={t('cancel')}
        isLoading={confirm.isRunning}
        error={confirm.error}
        onClose={confirm.close}
        onConfirm={() =>
          confirm.run(async (court) => {
            await VenueRentalService.removeCourt(venueId, court.id, {
              skipGlobalError: true,
            });
            await onReload();
            toaster.success({ title: t('courtRemoved') });
          }, t('saveError'))
        }
      />
    </>
  );
}
