'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { VenueManager, VenueManagerRole } from '@/lib/api/types';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from './SectionCard';

/** Pending manager action awaiting confirmation. */
type ManagerAction =
  | { kind: 'remove'; manager: VenueManager }
  | { kind: 'role'; manager: VenueManager; nextRole: VenueManagerRole };

/** The role is binary, so "change" simply flips to the other value. */
const otherRole = (role: VenueManagerRole) =>
  role === VenueManagerRole.OWNER
    ? VenueManagerRole.MANAGER
    : VenueManagerRole.OWNER;

interface VenueManagersSectionProps {
  venueId: string;
  managers: VenueManager[];
  loadFailed: boolean;
  canManage: boolean;
  currentUserId?: string;
  onReload: () => Promise<void>;
}

export default function VenueManagersSection({
  venueId,
  managers,
  loadFailed,
  canManage,
  currentUserId,
  onReload,
}: VenueManagersSectionProps) {
  const t = useTranslations('venueRental.settings');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRole, setNewRole] = useState(VenueManagerRole.MANAGER);
  const [adding, setAdding] = useState(false);
  const confirm = useConfirmAction<ManagerAction>();

  const queryTooShort = query.trim().length < 2;

  useEffect(() => {
    if (!canManage || queryTooShort) {
      setCandidates([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = window.setTimeout(
      () =>
        VenueRentalService.searchManagerCandidates(venueId, query)
          .then(setCandidates)
          .catch(() => setCandidates([]))
          .finally(() => setIsSearching(false)),
      300
    );
    return () => window.clearTimeout(timer);
  }, [canManage, query, queryTooShort, venueId]);

  const roleOptions = useMemo(
    () =>
      Object.values(VenueManagerRole).map((value) => ({
        value,
        label: t(`role.${value}`),
        sublabel: t(`roleHelp.${value}`),
      })),
    [t]
  );

  const candidateOptions = useMemo(
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
    setAdding(true);
    try {
      await VenueRentalService.addManager(venueId, selectedUserId, newRole);
      setSelectedUserId('');
      setQuery('');
      setCandidates([]);
      await onReload();
      toaster.success({ title: t('managerAdded') });
    } finally {
      // Failures surface through the global API error modal.
      setAdding(false);
    }
  };

  const confirmCopy = () => {
    const action = confirm.target;
    if (!action) return { title: '', body: '', actionText: '' };
    const name = action.manager.user?.name || '';
    if (action.kind === 'remove') {
      return {
        title: t('confirmRemoveManagerTitle'),
        body: t('confirmRemoveManagerBody', { name }),
        actionText: t('remove'),
      };
    }
    return {
      title: t('confirmRoleTitle'),
      body: t('confirmRoleBody', {
        name,
        role: t(`role.${action.nextRole}`),
      }),
      actionText: t('confirm'),
    };
  };

  const { title, body, actionText } = confirmCopy();

  return (
    <>
      <SectionCard title={t('managers')}>
        <VStack align="stretch" gap={4}>
          {loadFailed ? (
            <VStack align="stretch" gap={2} py={2}>
              <Text fontSize="sm" color="red.600" role="alert">
                {t('managersLoadError')}
              </Text>
              <Button
                size="sm"
                variant="outline"
                alignSelf="start"
                onClick={onReload}
              >
                {t('retry')}
              </Button>
            </VStack>
          ) : managers.length === 0 ? (
            <Text fontSize="sm" color="gray.500" py={2}>
              {t('noManagers')}
            </Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {managers.map((manager) => {
                // Demoting yourself would lock you out of this page.
                const isSelf = manager.userId === currentUserId;
                return (
                  <HStack
                    key={manager.id}
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                    gap={3}
                    minW={0}
                    align="center"
                    flexWrap={{ base: 'wrap', md: 'nowrap' }}
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
                      {isSelf && canManage && (
                        <Text fontSize="xs" color="gray.500" mt={0.5}>
                          {t('cannotDemoteSelf')}
                        </Text>
                      )}
                    </Box>
                    {/* Role reads as a badge so the list can be scanned at a
                        glance; changing it is an explicit, confirmed action
                        rather than a live dropdown that fires on mis-click. */}
                    <HStack gap={1.5} flexShrink={0} ml="auto">
                      <Badge
                        colorPalette={
                          manager.role === VenueManagerRole.OWNER
                            ? 'green'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {t(`role.${manager.role}`)}
                      </Badge>
                      {canManage && (
                        <>
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={isSelf}
                            onClick={() =>
                              confirm.request({
                                kind: 'role',
                                manager,
                                nextRole: otherRole(manager.role),
                              })
                            }
                          >
                            {t('changeRole')}
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            aria-label={t('remove')}
                            disabled={isSelf}
                            onClick={() =>
                              confirm.request({ kind: 'remove', manager })
                            }
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
          )}

          {canManage && (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Text fontWeight="semibold" mb={3}>
                {t('addManager')}
              </Text>
              <VStack align="stretch" gap={3}>
                {/* One control, not two: the select searches accounts itself
                    via onSearchChange instead of a separate text input whose
                    results appeared in a different dropdown. */}
                <Field label={t('newManagerLabel')}>
                  <SearchableSelect
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    options={candidateOptions}
                    onSearchChange={setQuery}
                    isLoading={isSearching}
                    placeholder={t('selectUser')}
                    searchPlaceholder={t('searchPlaceholder')}
                    noOptionsMessage={
                      queryTooShort ? t('searchMinChars') : t('noCandidates')
                    }
                  />
                </Field>
                <Field label={t('roleLabel')}>
                  <SearchableSelect
                    value={newRole}
                    onChange={(value) => setNewRole(value as VenueManagerRole)}
                    options={roleOptions}
                  />
                </Field>
                <Button
                  alignSelf="start"
                  onClick={addManager}
                  loading={adding}
                  disabled={!selectedUserId || adding}
                >
                  <Plus size={16} aria-hidden="true" />
                  {t('add')}
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </SectionCard>

      <ConfirmDialog
        isOpen={confirm.target !== null}
        title={title}
        body={body}
        actionText={actionText}
        cancelText={t('cancel')}
        isDestructive={confirm.target?.kind === 'remove'}
        isLoading={confirm.isRunning}
        error={confirm.error}
        onClose={confirm.close}
        onConfirm={() =>
          confirm.run(async (action) => {
            if (action.kind === 'remove') {
              await VenueRentalService.removeManager(
                venueId,
                action.manager.id,
                { skipGlobalError: true }
              );
              toaster.success({ title: t('managerRemoved') });
            } else {
              await VenueRentalService.updateManager(
                venueId,
                action.manager.id,
                action.nextRole,
                { skipGlobalError: true }
              );
              toaster.success({ title: t('roleUpdated') });
            }
            await onReload();
          }, t('saveError'))
        }
      />
    </>
  );
}
