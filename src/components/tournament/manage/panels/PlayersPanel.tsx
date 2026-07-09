'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toaster } from '@/components/ui/toaster';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Image,
  Textarea,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { VSelect } from '@/components/ui/VSelect';
import { VModal, useModal } from '@/components/ui/VModal';
import {
  ImagePlus,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Link2,
  Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Tournament,
  TournamentPlayer,
  GenderType,
  EImageCategory,
} from '@/lib/api/types';
import {
  CreateTournamentPlayerPayload,
  TournamentPlayerService,
  UpdateTournamentPlayerPayload,
} from '@/lib/api/tournament-player.service';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { generateNextTournamentPlayerCode } from '@/lib/tournament/codes';

interface PlayersPanelProps {
  tournament: Tournament;
}

type ApiErrorLike = {
  message?: string;
  response?: {
    data?: {
      message?: unknown;
      error?: string;
    };
  };
};

const GENDER_VALUES: GenderType[] = [
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiErrorLike;
  const responseMessage = apiError?.response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(', ');
  if (
    responseMessage &&
    typeof responseMessage === 'object' &&
    'message' in responseMessage &&
    typeof responseMessage.message === 'string'
  ) {
    return responseMessage.message;
  }
  if (typeof responseMessage === 'string') return responseMessage;
  if (apiError?.response?.data?.error) return apiError.response.data.error;
  if (error instanceof Error) return error.message;
  return fallback;
};

interface PlayerFormState {
  code: string;
  name: string;
  image: string;
  imagePublicId: string;
  gender: string;
  level: string;
  levelDescription: string;
  email: string;
  phone: string;
}

interface BulkImportRow {
  lineNumber: number;
  code: string;
  name: string;
  gender: GenderType | '';
  phone: string;
  errors: string[];
}

const EMPTY_FORM: PlayerFormState = {
  code: '',
  name: '',
  image: '',
  imagePublicId: '',
  gender: '',
  level: '',
  levelDescription: '',
  email: '',
  phone: '',
};

const PANEL_MODAL_Z_INDEX = 1600;
const NESTED_PANEL_MODAL_Z_INDEX = PANEL_MODAL_Z_INDEX + 100;
const DEEP_NESTED_PANEL_MODAL_Z_INDEX = NESTED_PANEL_MODAL_Z_INDEX + 100;

const playerToForm = (player: TournamentPlayer): PlayerFormState => ({
  code: player.code ?? '',
  name: player.name ?? '',
  image: player.image ?? player.user?.image ?? '',
  imagePublicId: player.imagePublicId ?? '',
  gender: player.gender ?? '',
  level: player.level != null ? String(player.level) : '',
  levelDescription: player.levelDescription ?? '',
  email: player.email ?? '',
  phone: player.phone ?? '',
});

const normalizeImportToken = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const parseDelimitedLine = (line: string): string[] => {
  if (line.includes('\t')) {
    return line.split('\t').map((part) => part.trim());
  }

  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const normalizeGender = (value: string): GenderType | '' | null => {
  const normalized = normalizeImportToken(value);
  if (!normalized) return '';
  if (['m', 'male', 'man', 'nam'].includes(normalized)) return 'MALE';
  if (['f', 'female', 'woman', 'nu'].includes(normalized)) return 'FEMALE';
  if (['o', 'other', 'khac'].includes(normalized)) return 'OTHER';
  if (
    [
      'prefer not to say',
      'prefer_not_to_say',
      'khong tiet lo',
      'khong muon tiet lo',
    ].includes(normalized)
  ) {
    return 'PREFER_NOT_TO_SAY';
  }
  return null;
};

const isImportHeaderRow = (values: string[]): boolean => {
  const first = normalizeImportToken(values[0] ?? '');
  const second = normalizeImportToken(values[1] ?? '');
  return (
    ['ma', 'code', 'id', 'player code'].includes(first) &&
    ['ten', 'name', 'ho ten', 'player name'].includes(second)
  );
};

export default function PlayersPanel({ tournament }: PlayersPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.players');
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editModal = useModal();
  const bulkImportModal = useModal();
  const avatarModal = useModal();
  const deleteModal = useModal();
  const detailModal = useModal();
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | null>(
    null
  );
  const [detailPlayer, setDetailPlayer] = useState<TournamentPlayer | null>(
    null
  );
  const [form, setForm] = useState<PlayerFormState>(EMPTY_FORM);
  const [deletingPlayer, setDeletingPlayer] = useState<TournamentPlayer | null>(
    null
  );
  const [bulkImportText, setBulkImportText] = useState('');

  const GENDER_LABELS: Record<GenderType, string> = useMemo(
    () => ({
      MALE: t('genderMale'),
      FEMALE: t('genderFemale'),
      OTHER: t('genderOther'),
      PREFER_NOT_TO_SAY: t('genderPreferNotToSay'),
    }),
    [t]
  );

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TournamentPlayerService.getPlayers(tournament.id);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players;
    return players.filter((p) =>
      [p.name, p.code, p.email, p.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [players, search]);

  const bulkImportRows = useMemo((): BulkImportRow[] => {
    const existingCodes = new Set(
      players
        .map((player) => player.code?.trim().toLocaleLowerCase())
        .filter((code): code is string => Boolean(code))
    );
    const existingNames = new Set(
      players
        .map((player) => player.name?.trim().toLocaleLowerCase())
        .filter(Boolean)
    );
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();
    const generatedCodes: string[] = [];

    return bulkImportText
      .split(/\r?\n/)
      .map((rawLine, index) => ({ rawLine, lineNumber: index + 1 }))
      .filter(({ rawLine }) => rawLine.trim().length > 0)
      .filter(({ rawLine }, index) => {
        if (index > 0) return true;
        return !isImportHeaderRow(parseDelimitedLine(rawLine));
      })
      .map(({ rawLine, lineNumber }) => {
        const values = parseDelimitedLine(rawLine);
        const rawCode = values[0]?.trim() ?? '';
        const name = values[1]?.trim() ?? '';
        const rawGender = values[2]?.trim() ?? '';
        const phone = values[3]?.trim() ?? '';
        const gender = normalizeGender(rawGender);
        const code =
          rawCode ||
          generateNextTournamentPlayerCode(
            [
              ...players,
              ...generatedCodes.map(
                (generatedCode, index) =>
                  ({
                    id: `bulk-import-${index}`,
                    name: '',
                    code: generatedCode,
                  }) as TournamentPlayer
              ),
            ],
            players.length + generatedCodes.length + 1
          );
        const normalizedCode = code.trim().toLocaleLowerCase();
        const normalizedName = name.trim().toLocaleLowerCase();
        const errors: string[] = [];

        if (!name) {
          errors.push(t('bulkImport.errors.nameRequired'));
        }
        if (rawGender && gender === null) {
          errors.push(t('bulkImport.errors.invalidGender'));
        }
        if (normalizedCode && existingCodes.has(normalizedCode)) {
          errors.push(t('bulkImport.errors.duplicateCodeExisting'));
        }
        if (normalizedCode && seenCodes.has(normalizedCode)) {
          errors.push(t('bulkImport.errors.duplicateCodeBatch'));
        }
        if (normalizedName && existingNames.has(normalizedName)) {
          errors.push(t('bulkImport.errors.duplicateNameExisting'));
        }
        if (normalizedName && seenNames.has(normalizedName)) {
          errors.push(t('bulkImport.errors.duplicateNameBatch'));
        }

        if (normalizedCode) {
          seenCodes.add(normalizedCode);
        }
        if (normalizedName) {
          seenNames.add(normalizedName);
        }
        if (!rawCode) {
          generatedCodes.push(code);
        }

        return {
          lineNumber,
          code,
          name,
          gender: gender ?? '',
          phone,
          errors,
        };
      });
  }, [bulkImportText, players, t]);

  const bulkImportErrorCount = bulkImportRows.reduce(
    (count, row) => count + row.errors.length,
    0
  );
  const canConfirmBulkImport =
    bulkImportRows.length > 0 && bulkImportErrorCount === 0 && !isSubmitting;

  const updateField = (key: keyof PlayerFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildCreatePayload = (): CreateTournamentPlayerPayload => {
    const trimmedLevel = form.level.trim();
    return {
      code: form.code.trim() || generateNextTournamentPlayerCode(players),
      name: form.name.trim(),
      image: form.image.trim() || undefined,
      imagePublicId: form.imagePublicId.trim() || undefined,
      gender: (form.gender || undefined) as GenderType | undefined,
      level: trimmedLevel ? Number(trimmedLevel) : undefined,
      levelDescription: form.levelDescription.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
  };

  const buildUpdatePayload = (): UpdateTournamentPlayerPayload => {
    const trimmedLevel = form.level.trim();
    return {
      code: form.code.trim() || undefined,
      name: form.name.trim(),
      image: form.image.trim() || undefined,
      imagePublicId: form.imagePublicId.trim() || undefined,
      gender: (form.gender || undefined) as GenderType | undefined,
      level: trimmedLevel ? Number(trimmedLevel) : undefined,
      levelDescription: form.levelDescription.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
  };

  // ── Add / Edit ──────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setForm({
      ...EMPTY_FORM,
      code: generateNextTournamentPlayerCode(players),
    });
    avatarModal.onClose();
    editModal.onOpen();
  };

  const handleOpenBulkImport = () => {
    setBulkImportText('');
    bulkImportModal.onOpen();
  };

  const handleOpenEdit = (player: TournamentPlayer) => {
    setEditingPlayer(player);
    setForm(playerToForm(player));
    avatarModal.onClose();
    editModal.onOpen();
  };

  const handleOpenDetail = (player: TournamentPlayer) => {
    setDetailPlayer(player);
    detailModal.onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      setIsSubmitting(true);
      if (editingPlayer) {
        await TournamentPlayerService.updatePlayer(
          editingPlayer.id,
          buildUpdatePayload(),
          {
            showToast: false,
          }
        );
        toaster.success({ title: t('updateSuccess') });
      } else {
        await TournamentPlayerService.createPlayer(
          tournament.id,
          buildCreatePayload(),
          {
            showToast: false,
          }
        );
        toaster.success({ title: t('addSuccess') });
      }
      await loadPlayers();
      avatarModal.onClose();
      editModal.onClose();
    } catch (error) {
      console.error('Error saving player:', error);
      toaster.error({
        title: editingPlayer ? t('updateFailed') : t('addFailed'),
        description: getErrorMessage(error, t('unknownError')),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!canConfirmBulkImport) return;
    try {
      setIsSubmitting(true);
      await TournamentPlayerService.createBulkPlayers(
        tournament.id,
        bulkImportRows.map((row) => ({
          lineNumber: row.lineNumber,
          code: row.code,
          name: row.name,
          gender: row.gender || undefined,
          phone: row.phone || undefined,
        })),
        { showToast: false }
      );
      toaster.success({
        title: t('bulkImport.success', { count: bulkImportRows.length }),
      });
      await loadPlayers();
      setBulkImportText('');
      bulkImportModal.onClose();
    } catch (error) {
      console.error('Error bulk importing players:', error);
      toaster.error({
        title: t('bulkImport.failed'),
        description: getErrorMessage(error, t('unknownError')),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    avatarModal.onClose();
    editModal.onClose();
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleOpenDelete = (player: TournamentPlayer) => {
    setDeletingPlayer(player);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingPlayer) return;
    try {
      setIsSubmitting(true);
      await TournamentPlayerService.deletePlayer(deletingPlayer.id, {
        showToast: false,
      });
      toaster.success({ title: t('deleteSuccess') });
      await loadPlayers();
      deleteModal.onClose();
    } catch (error) {
      console.error('Error deleting player:', error);
      toaster.error({
        title: t('deleteFailed'),
        description: getErrorMessage(error, t('unknownError')),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletingUsage = deletingPlayer?._count;
  const deletingHasUsage =
    !!deletingUsage &&
    (deletingUsage.registrations > 0 || deletingUsage.pairMembers > 0);

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" gap={3}>
          <Heading size="md">{t('title')}</Heading>
          <Flex gap={2} flexWrap="wrap" justify="flex-end">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Upload size={14} />}
              onClick={handleOpenBulkImport}
            >
              {t('bulkImport.button')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              {t('addPlayer')}
            </Button>
          </Flex>
        </Flex>

        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          {t('subtitle')}
        </Text>

        {/* Search */}
        <Box position="relative">
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
            pointerEvents="none"
          >
            <Search size={16} />
          </Box>
          <Input
            pl={9}
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {/* List */}
        {loading ? (
          <TournamentMatchListSkeleton count={4} />
        ) : players.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            py={8}
            gap={2}
            color="gray.400"
          >
            <Users size={32} />
            <Text fontSize="sm">{t('noPlayers')}</Text>
          </Flex>
        ) : filteredPlayers.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            py={8}
            gap={2}
            color="gray.400"
          >
            <Search size={32} />
            <Text fontSize="sm">{t('noResults')}</Text>
          </Flex>
        ) : (
          <VStack gap={0} align="stretch">
            {filteredPlayers.map((player) => {
              const usageCount =
                (player._count?.registrations ?? 0) +
                (player._count?.pairMembers ?? 0);
              const meta = [
                player.code ? player.code : null,
                player.gender ? GENDER_LABELS[player.gender] : null,
                player.level != null ? `${t('level')} ${player.level}` : null,
                player.levelDescription || null,
                player.email || null,
                player.phone || null,
              ].filter(Boolean);
              return (
                <Flex
                  key={player.id}
                  py={3}
                  px={2}
                  align="center"
                  gap={3}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  textAlign="left"
                  cursor="pointer"
                  role="button"
                  tabIndex={0}
                  _hover={{ bg: 'gray.50' }}
                  _dark={{
                    borderColor: 'gray.700',
                    _hover: { bg: 'gray.700' },
                  }}
                  onClick={() => handleOpenDetail(player)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleOpenDetail(player);
                    }
                  }}
                >
                  <Flex
                    w="32px"
                    h="32px"
                    bg="gray.100"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    overflow="hidden"
                    _dark={{ bg: 'gray.700' }}
                  >
                    {player.image || player.user?.image ? (
                      <Image
                        src={player.image || player.user?.image}
                        alt={player.name}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Users size={16} color="#A0AEC0" />
                    )}
                  </Flex>
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={1.5}>
                      <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                        {player.name}
                      </Text>
                      {player.userId && (
                        <Box color="blue.400" title={t('linkedAccount')}>
                          <Link2 size={12} />
                        </Box>
                      )}
                    </Flex>
                    {meta.length > 0 && (
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        lineClamp={1}
                        _dark={{ color: 'gray.400' }}
                      >
                        {meta.join(' · ')}
                      </Text>
                    )}
                  </Box>
                  {usageCount > 0 && (
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      flexShrink={0}
                      _dark={{ color: 'gray.500' }}
                    >
                      {t('usageBadge', { count: usageCount })}
                    </Text>
                  )}
                  <Flex gap={1} flexShrink={0}>
                    <Box
                      as="button"
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'gray.100', color: 'gray.600' }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'gray.700', color: 'gray.200' },
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEdit(player);
                      }}
                    >
                      <Pencil size={16} />
                    </Box>
                    <Box
                      as="button"
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'red.50', color: 'red.500' }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'red.900', color: 'red.200' },
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDelete(player);
                      }}
                    >
                      <Trash2 size={16} />
                    </Box>
                  </Flex>
                </Flex>
              );
            })}
            <Text
              fontSize="xs"
              color="gray.400"
              textAlign="center"
              pt={3}
              _dark={{ color: 'gray.500' }}
            >
              {t('playersCount', { count: filteredPlayers.length })}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Add / Edit Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        zIndex={PANEL_MODAL_Z_INDEX}
        title={editingPlayer ? t('editPlayer') : t('addPlayerTitle')}
        primaryActionText={t('save')}
        onPrimaryAction={handleSave}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!form.name.trim()}
        secondaryActionText={t('cancel')}
      >
        <VStack gap={4} align="stretch">
          <Flex align="center" gap={3}>
            <Flex
              as="button"
              {...({ type: 'button' } as Record<string, unknown>)}
              w="56px"
              h="56px"
              bg="gray.100"
              borderRadius="full"
              align="center"
              justify="center"
              flexShrink={0}
              overflow="hidden"
              position="relative"
              cursor="pointer"
              _hover={{
                boxShadow: '0 0 0 3px var(--chakra-colors-green-200)',
              }}
              _focusVisible={{
                outline: '2px solid var(--chakra-colors-green-500)',
                outlineOffset: '2px',
              }}
              onClick={avatarModal.onOpen}
              aria-label={t('avatar')}
            >
              {form.image ? (
                <Image
                  src={form.image}
                  alt={form.name || t('avatar')}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              ) : (
                <Users size={22} color="#A0AEC0" />
              )}
              <Flex
                position="absolute"
                right={0}
                bottom={0}
                w="22px"
                h="22px"
                borderRadius="full"
                bg="green.600"
                color="white"
                align="center"
                justify="center"
                borderWidth="2px"
                borderColor="white"
                _dark={{ borderColor: 'gray.800' }}
              >
                <ImagePlus size={12} />
              </Flex>
            </Flex>
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                {form.name || t('namePlaceholder')}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {form.image ? t('avatarSelected') : t('avatarEmpty')}
              </Text>
            </Box>
          </Flex>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('playerCode')}
            </Text>
            <Input
              name="playerCode"
              autoComplete="off"
              placeholder={t('playerCodePlaceholder')}
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('name')}
            </Text>
            <Input
              placeholder={t('namePlaceholder')}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              autoFocus
            />
          </Box>

          <Flex gap={3}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {t('gender')}
              </Text>
              <VSelect
                placeholder={t('genderPlaceholder')}
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
              >
                <option value="">—</option>
                {GENDER_VALUES.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </VSelect>
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {t('level')}
              </Text>
              <VSelect
                placeholder={t('levelPlaceholder')}
                value={form.level}
                onChange={(e) => updateField('level', e.target.value)}
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </VSelect>
            </Box>
          </Flex>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('levelDescription')}
            </Text>
            <Input
              placeholder={t('levelDescriptionPlaceholder')}
              value={form.levelDescription}
              onChange={(e) => updateField('levelDescription', e.target.value)}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('email')}
            </Text>
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('phone')}
            </Text>
            <Input
              placeholder={t('phonePlaceholder')}
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </Box>
        </VStack>
      </VModal>

      {/* Bulk Import Modal */}
      <VModal
        isOpen={bulkImportModal.isOpen}
        onClose={bulkImportModal.onClose}
        zIndex={PANEL_MODAL_Z_INDEX}
        title={t('bulkImport.title')}
        description={t('bulkImport.description')}
        primaryActionText={t('bulkImport.confirm')}
        onPrimaryAction={handleBulkImport}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!canConfirmBulkImport}
        secondaryActionText={t('cancel')}
        size="xl"
        maxBodyHeight={{ base: '72vh', md: '75vh' }}
      >
        <VStack gap={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('bulkImport.inputLabel')}
            </Text>
            <Textarea
              value={bulkImportText}
              onChange={(event) => setBulkImportText(event.target.value)}
              placeholder={t('bulkImport.placeholder')}
              rows={7}
              resize="vertical"
              disabled={isSubmitting}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {t('bulkImport.help')}
            </Text>
          </Box>

          {bulkImportRows.length > 0 && (
            <Box>
              <Flex justify="space-between" align="center" mb={2} gap={3}>
                <Text fontSize="sm" fontWeight="semibold">
                  {t('bulkImport.previewTitle', {
                    count: bulkImportRows.length,
                  })}
                </Text>
                <Text
                  fontSize="xs"
                  color={bulkImportErrorCount > 0 ? 'red.500' : 'green.600'}
                >
                  {bulkImportErrorCount > 0
                    ? t('bulkImport.errorSummary', {
                        count: bulkImportErrorCount,
                      })
                    : t('bulkImport.readySummary')}
                </Text>
              </Flex>
              <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                overflowX="auto"
                _dark={{ borderColor: 'gray.700' }}
              >
                <Box as="table" w="full" minW="720px" fontSize="sm">
                  <Box as="thead" bg="gray.50" _dark={{ bg: 'gray.800' }}>
                    <Box as="tr">
                      {[
                        t('bulkImport.columns.line'),
                        t('bulkImport.columns.code'),
                        t('bulkImport.columns.name'),
                        t('bulkImport.columns.gender'),
                        t('bulkImport.columns.phone'),
                        t('bulkImport.columns.status'),
                      ].map((label) => (
                        <Box
                          key={label}
                          as="th"
                          px={3}
                          py={2}
                          textAlign="left"
                          fontWeight="semibold"
                          color="gray.600"
                          _dark={{ color: 'gray.300' }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {bulkImportRows.map((row) => (
                      <Box
                        key={row.lineNumber}
                        as="tr"
                        borderTopWidth="1px"
                        borderColor="gray.100"
                        bg={row.errors.length > 0 ? 'red.50' : undefined}
                        _dark={{
                          borderColor: 'gray.700',
                          bg:
                            row.errors.length > 0
                              ? 'rgba(239, 68, 68, 0.12)'
                              : undefined,
                        }}
                      >
                        <Box as="td" px={3} py={2}>
                          {row.lineNumber}
                        </Box>
                        <Box as="td" px={3} py={2}>
                          {row.code || '—'}
                        </Box>
                        <Box as="td" px={3} py={2}>
                          {row.name || '—'}
                        </Box>
                        <Box as="td" px={3} py={2}>
                          {row.gender ? GENDER_LABELS[row.gender] : '—'}
                        </Box>
                        <Box as="td" px={3} py={2}>
                          {row.phone || '—'}
                        </Box>
                        <Box as="td" px={3} py={2}>
                          {row.errors.length > 0 ? (
                            <Text color="red.600" fontSize="xs">
                              {row.errors.join(', ')}
                            </Text>
                          ) : (
                            <Text color="green.600" fontSize="xs">
                              {t('bulkImport.valid')}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </VStack>
      </VModal>

      <VModal
        isOpen={avatarModal.isOpen}
        onClose={avatarModal.onClose}
        zIndex={NESTED_PANEL_MODAL_Z_INDEX}
        title={t('avatar')}
        secondaryActionText={t('close')}
        hideSecondaryAction={false}
        maxBodyHeight={{ base: '70vh', md: '72vh' }}
      >
        <AppSingleImageUpload
          value={form.image}
          publicId={form.imagePublicId}
          category={EImageCategory.OTHER}
          alt={form.name || t('avatar')}
          emptyTitle={t('avatarEmpty')}
          uploadText={t('avatarUpload')}
          galleryText={t('avatarGallery')}
          galleryZIndex={DEEP_NESTED_PANEL_MODAL_Z_INDEX}
          onChange={(image) => {
            updateField('image', image.url);
            updateField('imagePublicId', image.publicId ?? '');
          }}
          onClear={() => {
            updateField('image', '');
            updateField('imagePublicId', '');
          }}
        />
      </VModal>

      {/* Player Detail Modal */}
      <VModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        zIndex={PANEL_MODAL_Z_INDEX}
        title={t('playerDetails')}
        primaryActionText={t('editPlayer')}
        onPrimaryAction={() => {
          if (!detailPlayer) return;
          detailModal.onClose();
          handleOpenEdit(detailPlayer);
        }}
        primaryColorScheme="green"
        secondaryActionText={t('close')}
      >
        {detailPlayer && (
          <VStack gap={5} align="stretch">
            <Flex direction="column" align="center" gap={3}>
              <Flex
                w="112px"
                h="112px"
                bg="gray.100"
                borderRadius="full"
                align="center"
                justify="center"
                overflow="hidden"
              >
                {detailPlayer.image || detailPlayer.user?.image ? (
                  <Image
                    src={detailPlayer.image || detailPlayer.user?.image}
                    alt={detailPlayer.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Users size={40} color="#A0AEC0" />
                )}
              </Flex>
              <Box textAlign="center" maxW="full">
                <Text fontSize="lg" fontWeight="semibold" lineClamp={2}>
                  {detailPlayer.name}
                </Text>
                {detailPlayer.code && (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                  >
                    {detailPlayer.code}
                  </Text>
                )}
              </Box>
            </Flex>

            <VStack gap={0} align="stretch" borderTopWidth="1px">
              {[
                [
                  t('gender'),
                  detailPlayer.gender
                    ? GENDER_LABELS[detailPlayer.gender]
                    : '—',
                ],
                [
                  t('level'),
                  detailPlayer.level != null ? String(detailPlayer.level) : '—',
                ],
                [t('levelDescription'), detailPlayer.levelDescription || '—'],
                [t('email'), detailPlayer.email || '—'],
                [t('phone'), detailPlayer.phone || '—'],
                [
                  t('usage'),
                  t('usageDetail', {
                    registrations: detailPlayer._count?.registrations ?? 0,
                    teams: detailPlayer._count?.pairMembers ?? 0,
                  }),
                ],
              ].map(([label, value]) => (
                <Flex
                  key={label}
                  py={3}
                  justify="space-between"
                  gap={4}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  _dark={{ borderColor: 'gray.700' }}
                >
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    flexShrink={0}
                    _dark={{ color: 'gray.400' }}
                  >
                    {label}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" textAlign="right">
                    {value}
                  </Text>
                </Flex>
              ))}
            </VStack>

            {detailPlayer.userId && (
              <Flex align="center" justify="center" gap={2} color="blue.500">
                <Link2 size={14} />
                <Text fontSize="sm">{t('linkedAccount')}</Text>
              </Flex>
            )}
          </VStack>
        )}
      </VModal>

      {/* Delete Confirmation Modal */}
      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        zIndex={PANEL_MODAL_Z_INDEX}
        title={t('deletePlayer')}
        primaryActionText={t('delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isSubmitting}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
      >
        <Text fontSize="sm" color="gray.600">
          {t('deleteConfirm')}
        </Text>
        {deletingPlayer && (
          <Text fontSize="sm" fontWeight="semibold" mt={2}>
            &quot;{deletingPlayer.name}&quot;
          </Text>
        )}
        {deletingHasUsage && (
          <Text fontSize="sm" color="orange.600" mt={3}>
            {t('deleteWarning', {
              registrations: deletingUsage!.registrations,
              teams: deletingUsage!.pairMembers,
            })}
          </Text>
        )}
      </VModal>
    </>
  );
}
