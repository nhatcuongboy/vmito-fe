'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Box, Flex, Heading, Text, Input, Image } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { VSelect } from '@/components/ui/VSelect';
import { VModal, useModal } from '@/components/ui/VModal';
import { Plus, Pencil, Trash2, Users, Search, Link2 } from 'lucide-react';
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
  response?: { data?: { message?: string | string[]; error?: string } };
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
  if (responseMessage) return responseMessage;
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

export default function PlayersPanel({ tournament }: PlayersPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.players');
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editModal = useModal();
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
    editModal.onOpen();
  };

  const handleOpenEdit = (player: TournamentPlayer) => {
    setEditingPlayer(player);
    setForm(playerToForm(player));
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
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenAdd}
          >
            {t('addPlayer')}
          </Button>
        </Flex>

        <Text fontSize="sm" color="gray.500">
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
                      <Text fontSize="xs" color="gray.500" lineClamp={1}>
                        {meta.join(' · ')}
                      </Text>
                    )}
                  </Box>
                  {usageCount > 0 && (
                    <Text fontSize="xs" color="gray.400" flexShrink={0}>
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
            <Text fontSize="xs" color="gray.400" textAlign="center" pt={3}>
              {t('playersCount', { count: filteredPlayers.length })}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Add / Edit Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
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
              w="56px"
              h="56px"
              bg="gray.100"
              borderRadius="full"
              align="center"
              justify="center"
              flexShrink={0}
              overflow="hidden"
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
              {t('avatar')}
            </Text>
            <AppSingleImageUpload
              value={form.image}
              publicId={form.imagePublicId}
              category={EImageCategory.OTHER}
              alt={form.name || t('avatar')}
              emptyTitle={t('avatarEmpty')}
              uploadText={t('avatarUpload')}
              galleryText={t('avatarGallery')}
              onChange={(image) => {
                updateField('image', image.url);
                updateField('imagePublicId', image.publicId ?? '');
              }}
              onClear={() => {
                updateField('image', '');
                updateField('imagePublicId', '');
              }}
            />
          </Box>

          {!editingPlayer && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {t('playerCode')}
              </Text>
              <Input
                placeholder={t('playerCodePlaceholder')}
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
              />
            </Box>
          )}

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

      {/* Player Detail Modal */}
      <VModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
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
                  <Text fontSize="sm" color="gray.500">
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
                >
                  <Text fontSize="sm" color="gray.500" flexShrink={0}>
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
