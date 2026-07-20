'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { VenueCourtSchedule, VenueCourtScheduleSlot } from '@/lib/api/types';

const minuteLabel = (minute: number) => {
  if (minute === 1440) return '24:00';
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: 'white', color: 'gray.700' },
  UNAVAILABLE: { bg: 'gray.200', color: 'gray.500' },
  HELD: { bg: 'yellow.200', color: 'yellow.950' },
  BOOKED: { bg: 'red.500', color: 'white' },
  PENDING_REQUEST: { bg: 'blue.200', color: 'blue.950' },
  MAINTENANCE: { bg: 'orange.300', color: 'orange.950' },
  CLOSED: { bg: 'gray.700', color: 'white' },
};

interface Selection {
  courtIds: string[];
  startMinute: number;
  endMinute: number;
}

export default function VenueCourtScheduleGrid({
  schedule,
  selection,
  onSelectionChange,
  manager = false,
  onSlotClick,
}: {
  schedule: VenueCourtSchedule;
  selection?: Selection | null;
  onSelectionChange?: (selection: Selection) => void;
  manager?: boolean;
  onSlotClick?: (courtId: string, slot: VenueCourtScheduleSlot) => void;
}) {
  const t = useTranslations('venueRental.schedule');
  const [draft, setDraft] = useState<Selection | null>(null);
  const anchor = useRef<{ courtIndex: number; slotIndex: number } | null>(null);
  const columns = `112px repeat(${schedule.slots.length}, minmax(68px, 1fr))`;
  const visibleSelection = draft || selection;

  const statusLegend = useMemo(
    () =>
      manager
        ? [
            'AVAILABLE',
            'BOOKED',
            'HELD',
            'PENDING_REQUEST',
            'MAINTENANCE',
            'CLOSED',
          ]
        : ['AVAILABLE', 'UNAVAILABLE'],
    [manager]
  );

  useEffect(() => {
    const finish = () => {
      if (draft) onSelectionChange?.(draft);
      anchor.current = null;
      setDraft(null);
    };
    window.addEventListener('pointerup', finish);
    return () => window.removeEventListener('pointerup', finish);
  }, [draft, onSelectionChange]);

  const buildDraft = (courtIndex: number, slotIndex: number) => {
    if (!anchor.current || manager || !onSelectionChange) return;
    const fromCourt = Math.min(anchor.current.courtIndex, courtIndex);
    const toCourt = Math.max(anchor.current.courtIndex, courtIndex);
    const fromSlot = Math.min(anchor.current.slotIndex, slotIndex);
    const toSlot = Math.max(anchor.current.slotIndex, slotIndex);
    const courts = schedule.courts.slice(fromCourt, toCourt + 1);
    const allAvailable = courts.every((court) =>
      court.slots
        .slice(fromSlot, toSlot + 1)
        .every((slot) => slot.status === 'AVAILABLE')
    );
    if (!allAvailable) return;
    setDraft({
      courtIds: courts.map((court) => court.id),
      startMinute: schedule.slots[fromSlot].startMinute,
      endMinute: schedule.slots[toSlot].endMinute,
    });
  };

  const isSelected = (courtId: string, slot: VenueCourtScheduleSlot) =>
    !!visibleSelection &&
    visibleSelection.courtIds.includes(courtId) &&
    slot.startMinute >= visibleSelection.startMinute &&
    slot.endMinute <= visibleSelection.endMinute;

  return (
    <Box>
      <Box overflowX="auto" borderWidth="1px" borderRadius="md">
        <Box minW={`${112 + schedule.slots.length * 68}px`} userSelect="none">
          <Box
            display="grid"
            gridTemplateColumns={columns}
            position="sticky"
            top="0"
            zIndex="2"
          >
            <Box
              position="sticky"
              left="0"
              zIndex="3"
              bg="gray.50"
              borderRightWidth="1px"
              borderBottomWidth="1px"
              p={2}
            />
            {schedule.slots.map((slot) => (
              <Box
                key={slot.startMinute}
                bg="gray.50"
                borderRightWidth="1px"
                borderBottomWidth="1px"
                py={2}
                px={1}
                textAlign="center"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  {minuteLabel(slot.startMinute)}
                </Text>
                {'pricePerHour' in slot && slot.pricePerHour ? (
                  <Text fontSize="10px" color="gray.500">
                    {new Intl.NumberFormat('vi-VN').format(slot.pricePerHour)}
                  </Text>
                ) : null}
              </Box>
            ))}
          </Box>
          {schedule.courts.map((court, courtIndex) => (
            <Box key={court.id} display="grid" gridTemplateColumns={columns}>
              <Box
                position="sticky"
                left="0"
                zIndex="1"
                bg="white"
                borderRightWidth="1px"
                borderBottomWidth="1px"
                px={3}
                py={3}
                minH="48px"
              >
                <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                  {court.name}
                </Text>
              </Box>
              {court.slots.map((slot, slotIndex) => {
                const selected = isSelected(court.id, slot);
                const palette =
                  STATUS_COLOR[slot.status] || STATUS_COLOR.CLOSED;
                return (
                  <Box
                    as="button"
                    key={`${court.id}-${slot.startMinute}`}
                    minH="48px"
                    borderRightWidth="1px"
                    borderBottomWidth="1px"
                    bg={selected ? 'green.500' : palette.bg}
                    color={selected ? 'white' : palette.color}
                    cursor={
                      (slot.status === 'AVAILABLE' && !!onSelectionChange) ||
                      manager
                        ? 'pointer'
                        : 'not-allowed'
                    }
                    aria-label={`${court.name} ${minuteLabel(slot.startMinute)} ${slot.status}`}
                    title={
                      manager
                        ? [slot.status, slot.contactName, slot.blockReason]
                            .filter(Boolean)
                            .join(' - ')
                        : undefined
                    }
                    onPointerDown={() => {
                      if (manager) {
                        onSlotClick?.(court.id, slot);
                        return;
                      }
                      if (slot.status !== 'AVAILABLE') return;
                      anchor.current = { courtIndex, slotIndex };
                      buildDraft(courtIndex, slotIndex);
                    }}
                    onPointerEnter={() => buildDraft(courtIndex, slotIndex)}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      <HStack gap={4} mt={3} flexWrap="wrap">
        {statusLegend.map((status) => (
          <HStack key={status} gap={1.5}>
            <Box
              boxSize="12px"
              bg={STATUS_COLOR[status].bg}
              borderWidth="1px"
            />
            <Text fontSize="xs">{t(`status.${status}`)}</Text>
          </HStack>
        ))}
        {!manager && (
          <HStack gap={1.5}>
            <Box boxSize="12px" bg="green.500" />
            <Text fontSize="xs">{t('status.SELECTED')}</Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
}
