'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import {
  Button,
  IconButton,
  Input,
  VStack,
} from '@/components/ui/chakra-compat';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';

import { TournamentManagerService } from '@/lib/api/tournament-manager.service';
import { UserService, UserOption } from '@/lib/api/user.service';
import {
  Tournament,
  TournamentManager,
  TournamentPermission,
  TOURNAMENT_PERMISSIONS,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface Props {
  tournament: Tournament;
}

/** Toggleable permission checkboxes shared by the add form and the row editor. */
function PermissionPicker({
  selected,
  onToggle,
  t,
}: {
  selected: Set<TournamentPermission>;
  onToggle: (permission: TournamentPermission, checked: boolean) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Flex gap={3} wrap="wrap">
      {TOURNAMENT_PERMISSIONS.map((permission) => (
        <Checkbox
          key={permission}
          checked={selected.has(permission)}
          onCheckedChange={(details) =>
            onToggle(permission, details.checked === true)
          }
        >
          <Text fontSize="sm">{t(`permissions.${permission}`)}</Text>
        </Checkbox>
      ))}
    </Flex>
  );
}

export default function ManagersPanel({ tournament }: Props) {
  const t = useTranslations('pages.tournaments.managers');
  const { user } = useAuthStore();

  const isHostOrAdmin =
    user?.id === tournament.hostId || user?.role === 'ADMIN';

  const [managers, setManagers] = useState<TournamentManager[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [newPerms, setNewPerms] = useState<Set<TournamentPermission>>(
    () => new Set()
  );
  const [adding, setAdding] = useState(false);

  // Row editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Set<TournamentPermission>>(
    () => new Set()
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadManagers = useCallback(async () => {
    const data = await TournamentManagerService.list(tournament.id);
    setManagers(data);
  }, [tournament.id]);

  useEffect(() => {
    void loadManagers().finally(() => setLoading(false));
  }, [loadManagers]);

  // Debounced user search; excludes the host and existing managers.
  const managerIds = useMemo(
    () => new Set(managers.map((m) => m.userId)),
    [managers]
  );

  useEffect(() => {
    const term = query.trim();
    if (selectedUser || term.length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const users = await UserService.getAllUsers(term);
        setResults(
          users.filter(
            (u) => u.id !== tournament.hostId && !managerIds.has(u.id)
          )
        );
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedUser, tournament.hostId, managerIds]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<TournamentPermission>>>,
    permission: TournamentPermission,
    checked: boolean
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!selectedUser || newPerms.size === 0) return;
    setAdding(true);
    try {
      await TournamentManagerService.add(tournament.id, {
        userId: selectedUser.id,
        permissions: [...newPerms],
      });
      setSelectedUser(null);
      setQuery('');
      setResults([]);
      setNewPerms(new Set());
      await loadManagers();
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (manager: TournamentManager) => {
    setEditingUserId(manager.userId);
    setEditPerms(new Set(manager.permissions));
  };

  const saveEdit = async (userId: string) => {
    if (editPerms.size === 0) return;
    setSavingId(userId);
    try {
      await TournamentManagerService.updatePermissions(tournament.id, userId, {
        permissions: [...editPerms],
      });
      setEditingUserId(null);
      await loadManagers();
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    await TournamentManagerService.remove(tournament.id, userId);
    await loadManagers();
  };

  if (!isHostOrAdmin) {
    return (
      <Text color="gray.500" fontSize="sm">
        {t('accessDenied')}
      </Text>
    );
  }

  if (loading) {
    return <TournamentMatchListSkeleton count={3} />;
  }

  return (
    <Box>
      <Heading size="md" mb={1}>
        {t('title')}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={5}>
        {t('description')}
      </Text>

      {/* Add manager */}
      <Box
        borderWidth="1px"
        borderColor="gray.100"
        _dark={{ borderColor: 'gray.700' }}
        borderRadius="lg"
        p={4}
        mb={6}
      >
        {selectedUser ? (
          <Flex align="center" gap={2} mb={3}>
            <Box flex="1" minW={0}>
              <Text fontWeight="semibold" truncate>
                {selectedUser.name}
              </Text>
              <Text fontSize="xs" color="gray.500" truncate>
                {selectedUser.email}
              </Text>
            </Box>
            <IconButton
              aria-label={t('cancel')}
              size="sm"
              variant="ghost"
              onClick={() => setSelectedUser(null)}
            >
              <X size={14} />
            </IconButton>
          </Flex>
        ) : (
          <Box position="relative" mb={3}>
            <Input
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim().length > 0 && (
              <Box
                mt={2}
                borderWidth="1px"
                borderColor="gray.100"
                _dark={{ borderColor: 'gray.700' }}
                borderRadius="md"
                maxH="220px"
                overflowY="auto"
              >
                {searching ? (
                  <Text fontSize="sm" color="gray.500" p={3}>
                    {t('searching')}
                  </Text>
                ) : results.length === 0 ? (
                  <Text fontSize="sm" color="gray.500" p={3}>
                    {t('noResults')}
                  </Text>
                ) : (
                  results.map((u) => (
                    <Flex
                      key={u.id}
                      align="center"
                      p={2}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                      onClick={() => {
                        setSelectedUser(u);
                        setNewPerms(new Set(['RESULTS']));
                      }}
                    >
                      <Box minW={0}>
                        <Text fontSize="sm" fontWeight="medium" truncate>
                          {u.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" truncate>
                          {u.email}
                        </Text>
                      </Box>
                    </Flex>
                  ))
                )}
              </Box>
            )}
          </Box>
        )}

        <Text fontSize="sm" fontWeight="medium" mb={2}>
          {t('permissionsLabel')}
        </Text>
        <PermissionPicker
          selected={newPerms}
          onToggle={(p, checked) => toggle(setNewPerms, p, checked)}
          t={t}
        />

        <Flex justify="flex-end" mt={4}>
          <Button
            colorPalette="blue"
            onClick={() => void handleAdd()}
            loading={adding}
            disabled={!selectedUser || newPerms.size === 0}
          >
            <Plus size={16} /> {t('add')}
          </Button>
        </Flex>
      </Box>

      {/* Current managers */}
      <VStack align="stretch" gap={2}>
        {managers.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            {t('noManagers')}
          </Text>
        ) : (
          managers.map((manager) => {
            const isEditing = editingUserId === manager.userId;
            return (
              <Box
                key={manager.id}
                borderWidth="1px"
                borderColor="gray.100"
                _dark={{ borderColor: 'gray.700' }}
                borderRadius="lg"
                p={3}
              >
                <Flex align="center" gap={3}>
                  <Box flex="1" minW={0}>
                    <Text fontWeight="semibold" truncate>
                      {manager.user?.name ?? manager.userId}
                    </Text>
                    {manager.user?.email && (
                      <Text fontSize="xs" color="gray.500" truncate>
                        {manager.user.email}
                      </Text>
                    )}
                  </Box>
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => void saveEdit(manager.userId)}
                        loading={savingId === manager.userId}
                        disabled={editPerms.size === 0}
                      >
                        <Check size={14} /> {t('save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUserId(null)}
                      >
                        {t('cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(manager)}
                    >
                      <Pencil size={14} /> {t('edit')}
                    </Button>
                  )}
                  <IconButton
                    aria-label={t('remove')}
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => void handleRemove(manager.userId)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Flex>

                <Box mt={3}>
                  {isEditing ? (
                    <>
                      <PermissionPicker
                        selected={editPerms}
                        onToggle={(p, checked) =>
                          toggle(setEditPerms, p, checked)
                        }
                        t={t}
                      />
                      {editPerms.size === 0 && (
                        <Text fontSize="xs" color="orange.500" mt={2}>
                          {t('selectAtLeastOne')}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Flex gap={2} wrap="wrap">
                      {manager.permissions.map((permission) => (
                        <Badge key={permission} colorPalette="blue">
                          {t(`permissions.${permission}`)}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </VStack>
    </Box>
  );
}
