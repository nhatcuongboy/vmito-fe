'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { VSwitch } from '@/components/ui/VSwitch';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  UserRole,
  Venue,
  VenueManager,
  VenueManagerRole,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import SectionCard from './SectionCard';
import VenueCourtManagement from './VenueCourtManagement';
import VenueManagersSection from './VenueManagersSection';
import { getTimeZoneOptions, DEFAULT_TIMEZONE } from './timezones';

export default function VenueRentalSettings({
  venue,
  onUpdated,
}: {
  venue: Venue;
  onUpdated?: (venue: Venue) => void;
}) {
  const t = useTranslations('venueRental.settings');
  const user = useAuthStore((state) => state.user);
  const [managers, setManagers] = useState<VenueManager[]>([]);
  const [managersError, setManagersError] = useState(false);
  const [timezone, setTimezone] = useState(venue.timezone || DEFAULT_TIMEZONE);
  const [enabled, setEnabled] = useState(!!venue.rentalEnabled);
  const [visualEnabled, setVisualEnabled] = useState(
    !!venue.courtSelectionEnabled
  );
  const [saving, setSaving] = useState(false);

  const canManageMembers =
    user?.role === UserRole.ADMIN ||
    managers.some(
      (item) => item.userId === user?.id && item.role === VenueManagerRole.OWNER
    );

  const loadManagers = useCallback(async () => {
    setManagersError(false);
    try {
      setManagers(await VenueRentalService.getManagers(venue.id));
    } catch {
      // Keep the failure distinguishable from a genuinely empty list.
      setManagers([]);
      setManagersError(true);
    }
  }, [venue.id]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const timezoneOptions = useMemo(
    () => getTimeZoneOptions(timezone),
    [timezone]
  );

  const settingsDirty =
    enabled !== !!venue.rentalEnabled ||
    visualEnabled !== !!venue.courtSelectionEnabled ||
    timezone !== (venue.timezone || DEFAULT_TIMEZONE);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await VenueRentalService.updateRentalSettings(
        venue.id,
        enabled,
        timezone,
        visualEnabled
      );
      onUpdated?.(updated);
      toaster.success({ title: t('saved') });
    } finally {
      // Failures surface through the global API error modal.
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" gap={5}>
      <SectionCard
        title={t('generalSection')}
        headerRight={
          settingsDirty ? (
            <Badge colorPalette="orange" size="sm">
              {t('unsavedBadge')}
            </Badge>
          ) : undefined
        }
        footer={
          <Button colorPalette="green" loading={saving} onClick={saveSettings}>
            {t('save')}
          </Button>
        }
      >
        <VStack align="stretch" gap={5}>
          <HStack justify="space-between" gap={4}>
            <Box minW={0}>
              <Text fontWeight="semibold">{t('onlineRental')}</Text>
              <Text fontSize="sm" color="gray.500">
                {t('onlineRentalHelp')}
              </Text>
            </Box>
            <VSwitch
              checked={enabled}
              onCheckedChange={(details) => setEnabled(details.checked)}
            />
          </HStack>

          <Field label={t('timezone')}>
            <SearchableSelect
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
            />
          </Field>

          <HStack justify="space-between" gap={4}>
            <Box minW={0}>
              <Text fontWeight="semibold">{t('visualSelection')}</Text>
              <Text fontSize="sm" color="gray.500">
                {t('visualSelectionHelp')}
              </Text>
            </Box>
            <VSwitch
              checked={visualEnabled}
              disabled={!enabled}
              onCheckedChange={(details) => setVisualEnabled(details.checked)}
            />
          </HStack>
        </VStack>
      </SectionCard>

      <VenueManagersSection
        venueId={venue.id}
        managers={managers}
        loadFailed={managersError}
        canManage={canManageMembers}
        currentUserId={user?.id}
        onReload={loadManagers}
      />

      <VenueCourtManagement venue={venue} enabled={canManageMembers} />
    </VStack>
  );
}
