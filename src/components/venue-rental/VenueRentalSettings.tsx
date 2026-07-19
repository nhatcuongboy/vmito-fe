'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
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
import VenueCourtManagement from './VenueCourtManagement';

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
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRole, setNewRole] = useState(VenueManagerRole.MANAGER);
  const [timezone, setTimezone] = useState(
    venue.timezone || 'Asia/Ho_Chi_Minh'
  );
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
    try {
      setManagers(await VenueRentalService.getManagers(venue.id));
    } catch {
      setManagers([]);
    }
  }, [venue.id]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);
  useEffect(() => {
    if (!canManageMembers || query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    const timer = window.setTimeout(
      () =>
        VenueRentalService.searchManagerCandidates(venue.id, query)
          .then(setCandidates)
          .catch(() => setCandidates([])),
      300
    );
    return () => window.clearTimeout(timer);
  }, [canManageMembers, query, venue.id]);

  const options = useMemo(
    () =>
      candidates.map((item) => ({
        value: item.id,
        label: item.name,
        sublabel: item.email,
      })),
    [candidates]
  );
  const addManager = async () => {
    if (!selectedUserId) return;
    try {
      await VenueRentalService.addManager(venue.id, selectedUserId, newRole);
      setSelectedUserId('');
      setQuery('');
      setCandidates([]);
      await loadManagers();
      toaster.success({ title: t('managerAdded') });
    } catch {
      toaster.error({ title: t('saveError') });
    }
  };
  const saveSettings = async () => {
    try {
      setSaving(true);
      const updated = await VenueRentalService.updateRentalSettings(
        venue.id,
        enabled,
        timezone,
        visualEnabled
      );
      onUpdated?.(updated);
      toaster.success({ title: t('saved') });
    } catch {
      toaster.error({ title: t('saveError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box borderTopWidth="1px" mt={8} pt={6}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        {t('title')}
      </Text>
      <VStack align="stretch" gap={5}>
        <HStack justify="space-between">
          <Box>
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
          <Input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          />
        </Field>
        <HStack justify="space-between">
          <Box>
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
        <Button
          alignSelf="start"
          colorPalette="green"
          loading={saving}
          onClick={saveSettings}
        >
          {t('save')}
        </Button>
        <Box>
          <Text fontWeight="semibold" mb={3}>
            {t('managers')}
          </Text>
          <VStack align="stretch" gap={2}>
            {managers.map((manager) => (
              <HStack
                key={manager.id}
                borderWidth="1px"
                borderRadius="md"
                p={3}
              >
                <Avatar.Root size="sm">
                  <Avatar.Image src={manager.user?.image || undefined} />
                  <Avatar.Fallback name={manager.user?.name || ''} />
                </Avatar.Root>
                <Box flex="1" minW={0}>
                  <Text fontWeight="medium" lineClamp={1}>
                    {manager.user?.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500" lineClamp={1}>
                    {manager.user?.email}
                  </Text>
                </Box>
                {canManageMembers ? (
                  <SearchableSelect
                    value={manager.role}
                    onChange={async (value) => {
                      try {
                        await VenueRentalService.updateManager(
                          venue.id,
                          manager.id,
                          value as VenueManagerRole
                        );
                        await loadManagers();
                      } catch {
                        toaster.error({ title: t('saveError') });
                      }
                    }}
                    options={Object.values(VenueManagerRole).map((value) => ({
                      value,
                      label: t(`role.${value}`),
                    }))}
                  />
                ) : (
                  <Text fontSize="sm">{t(`role.${manager.role}`)}</Text>
                )}
                {canManageMembers && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    aria-label={t('remove')}
                    onClick={async () => {
                      try {
                        await VenueRentalService.removeManager(
                          venue.id,
                          manager.id
                        );
                        await loadManagers();
                      } catch {
                        toaster.error({ title: t('saveError') });
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
        {canManageMembers && (
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <Text fontWeight="semibold" mb={3}>
              {t('addManager')}
            </Text>
            <VStack align="stretch" gap={3}>
              <Input
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <SearchableSelect
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={options}
                placeholder={t('selectUser')}
              />
              <SearchableSelect
                value={newRole}
                onChange={(value) => setNewRole(value as VenueManagerRole)}
                options={Object.values(VenueManagerRole).map((value) => ({
                  value,
                  label: t(`role.${value}`),
                }))}
              />
              <Button
                alignSelf="start"
                onClick={addManager}
                disabled={!selectedUserId}
              >
                <Plus size={16} />
                {t('add')}
              </Button>
            </VStack>
          </Box>
        )}
        <VenueCourtManagement venue={venue} enabled={canManageMembers} />
      </VStack>
    </Box>
  );
}
