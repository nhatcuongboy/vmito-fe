'use client';
import { Input } from '@/components/ui/Input';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Field,
  Flex,
  Grid,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardBody,
  HStack,
  IconButton,
  VStack,
} from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { UserOption } from '@/lib/api/user.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NewPlayer } from './types';
import { IClub } from '@/types/club';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const GENDER_OPTIONS = ['MALE', 'FEMALE'] as const;
const CONTROL_BG = { base: 'white', _dark: 'gray.900' } as const;
const CONTROL_BORDER_COLOR = 'var(--chakra-colors-border)';
const CONTROL_ERROR_BORDER_COLOR = 'var(--chakra-colors-red-400)';
const CONTROL_BG_COLOR = 'var(--chakra-colors-bg)';
const CONTROL_TEXT_COLOR = 'var(--chakra-colors-fg)';

type AddPlayerFormValues = {
  players: {
    userId?: string;
    name: string;
    phone?: string;
    gender: (typeof GENDER_OPTIONS)[number];
    level: number | null;
    levelDescription?: string;
    isClubMember: boolean;
    clubId?: string;
  }[];
};

const toFormPlayer = (
  player: NewPlayer
): AddPlayerFormValues['players'][0] => ({
  userId: player.userId || '',
  name: player.name || '',
  phone: player.phone || '',
  gender: GENDER_OPTIONS.includes(
    player.gender as (typeof GENDER_OPTIONS)[number]
  )
    ? (player.gender as (typeof GENDER_OPTIONS)[number])
    : 'MALE',
  level: player.level ?? null,
  levelDescription: player.levelDescription || '',
  isClubMember: !!player.isClubMember,
  clubId: player.clubId || '',
});

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPlayers: NewPlayer[];
  availableUsers: UserOption[];
  clubs?: IClub[];
  isLoadingUsers: boolean;
  errors: { [key: string]: string };
  availableLevels: number[];
  isSaving: boolean;
  onUpdatePlayer: (
    index: number,
    field: string,
    value: string | boolean | number | null | undefined
  ) => void;
  onRemovePlayer: (index: number) => void;
  onUserSelect: (index: number, userId: string) => void;
  onAddPlayer: () => void;
  onSaveAll: () => Promise<boolean>;
  onCancelAll: () => void;
  isUserAlreadyUsed: (userId: string, currentIndex?: number) => boolean;
  onSearchUsers: (query: string) => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  newPlayers,
  availableUsers,
  clubs = [],
  isLoadingUsers,
  errors,
  availableLevels,
  isSaving,
  onUpdatePlayer,
  onRemovePlayer,
  onUserSelect,
  onAddPlayer,
  onSaveAll,
  onCancelAll,
  isUserAlreadyUsed,
  onSearchUsers,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();

  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevPlayersLength = useRef(newPlayers.length);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const formSchema = useMemo(
    () =>
      z.object({
        players: z.array(
          z
            .object({
              userId: z.string().optional(),
              name: z.string().trim().min(1, t('playerNameRequired')),
              phone: z.string().optional(),
              gender: z.enum(GENDER_OPTIONS),
              level: z
                .number({
                  required_error: t('levelRequired'),
                  invalid_type_error: t('levelRequired'),
                })
                .nullable()
                .refine((value) => value !== null, t('levelRequired')),
              levelDescription: z.string().optional(),
              isClubMember: z.boolean(),
              clubId: z.string().optional(),
            })
            .superRefine((player, ctx) => {
              if (player.isClubMember && !player.clubId) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: ['clubId'],
                  message: t('clubRequired'),
                });
              }
            })
        ),
      }),
    [t]
  );

  const {
    control,
    formState: { errors: formErrors },
    handleSubmit,
    reset,
  } = useForm<AddPlayerFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    values: {
      players: newPlayers.map(toFormPlayer),
    },
  });

  useEffect(() => {
    if (isOpen) {
      onSearchUsers(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearchUsers, isOpen]);

  useEffect(() => {
    if (newPlayers.length > prevPlayersLength.current) {
      const lastIndex = newPlayers.length - 1;
      setTimeout(() => {
        nameInputRefs.current[lastIndex]?.focus();
      }, 50);
    }
    prevPlayersLength.current = newPlayers.length;
  }, [newPlayers.length]);

  useEffect(() => {
    if (isOpen) {
      reset({ players: newPlayers.map(toFormPlayer) });
    }
  }, [isOpen, newPlayers, reset]);

  const handleClose = () => {
    onCancelAll();
    onClose();
  };

  const handleValidSubmit = async () => {
    const didSave = await onSaveAll();
    if (didSave) {
      onClose();
    }
  };

  const getFieldError = (index: number, field: string) =>
    formErrors.players?.[index]?.[
      field as keyof AddPlayerFormValues['players'][number]
    ]?.message || errors[`${index}.${field}`];
  const hasFormErrors = Object.keys(formErrors).length > 0;

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <HStack spacing={3}>
          <Box as={UserPlus} boxSize={5} color="green.600" />
          <Text fontWeight="semibold">
            {t('addPlayerModalTitle', { count: newPlayers.length })}
          </Text>
        </HStack>
      }
      size="lg"
      maxBodyHeight="70vh"
      primaryActionText={t('saveAll', { count: newPlayers.length })}
      onPrimaryAction={handleSubmit(handleValidSubmit)}
      isPrimaryLoading={isSaving}
      isPrimaryDisabled={
        hasFormErrors ||
        Object.keys(errors).length > 0 ||
        newPlayers.length === 0
      }
      primaryColorScheme="green"
      secondaryActionText={tCommon('cancel')}
      onSecondaryAction={handleClose}
    >
      <VStack spacing={4} align="stretch">
        {/* Player cards */}
        {newPlayers.map((player, index) => {
          const nameError = getFieldError(index, 'name');
          const levelError = getFieldError(index, 'level');
          const clubError = getFieldError(index, 'clubId');

          return (
            <Card
              key={index}
              width="100%"
              variant="subtle"
              bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}
            >
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack spacing={3} align="stretch">
                  {/* Header with player number and delete button */}
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Badge
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={3}
                      >
                        #{player.playerNumber}
                      </Badge>
                      <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                        {t('newPlayer')}
                      </Text>
                    </HStack>
                    <IconButton
                      aria-label="Remove player"
                      icon={<Box as={Trash2} boxSize={4} />}
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => onRemovePlayer(index)}
                    />
                  </Flex>

                  {/* Select existing player */}
                  <Field.Root>
                    <Field.Label>{t('selectExistingPlayer')}</Field.Label>
                    <Controller
                      control={control}
                      name={`players.${index}.userId`}
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value || ''}
                          onChange={(val) => {
                            field.onChange(val);
                            onUserSelect(index, val);
                          }}
                          options={availableUsers.map((user) => ({
                            value: user.id,
                            label: user.name,
                            sublabel: user.email,
                            disabled: isUserAlreadyUsed(user.id, index),
                          }))}
                          placeholder={t('createNewPlayer')}
                          searchPlaceholder={tCommon('search')}
                          onSearchChange={setSearchQuery}
                          isLoading={isLoadingUsers}
                          size="md"
                        />
                      )}
                    />
                  </Field.Root>

                  {/* Player name and phone */}
                  <Grid templateColumns="1fr 1fr" gap={3}>
                    <Field.Root invalid={!!nameError} required>
                      <Field.Label>
                        {t('playerName')}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Controller
                        control={control}
                        name={`players.${index}.name`}
                        render={({ field }) => (
                          <Input
                            ref={(el) => {
                              nameInputRefs.current[index] = el;
                              field.ref(el);
                            }}
                            placeholder={t('enterPlayerName')}
                            value={field.value}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              field.onChange(e);
                              onUpdatePlayer(index, 'name', e.target.value);
                            }}
                            size="md"
                            bg={CONTROL_BG}
                          />
                        )}
                      />
                      {nameError && (
                        <Field.ErrorText>{nameError}</Field.ErrorText>
                      )}
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{tCommon('phone')}</Field.Label>
                      <Controller
                        control={control}
                        name={`players.${index}.phone`}
                        render={({ field }) => (
                          <Input
                            placeholder={tCommon('phone')}
                            value={field.value || ''}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              field.onChange(e);
                              onUpdatePlayer(index, 'phone', e.target.value);
                            }}
                            size="md"
                            bg={CONTROL_BG}
                          />
                        )}
                      />
                    </Field.Root>
                  </Grid>

                  {/* Gender and Level - responsive grid */}
                  <Grid templateColumns="1fr 1fr" gap={3}>
                    <Field.Root required>
                      <Field.Label>
                        {t('gender')}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Controller
                        control={control}
                        name={`players.${index}.gender`}
                        render={({ field }) => (
                          <select
                            value={field.value}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) => {
                              field.onChange(e);
                              onUpdatePlayer(index, 'gender', e.target.value);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              height: '40px',
                              borderRadius: '6px',
                              border: `1px solid ${CONTROL_BORDER_COLOR}`,
                              backgroundColor: CONTROL_BG_COLOR,
                              color: CONTROL_TEXT_COLOR,
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            {GENDER_OPTIONS.map((gender) => (
                              <option
                                key={gender}
                                value={gender}
                                style={{
                                  backgroundColor: CONTROL_BG_COLOR,
                                  color: CONTROL_TEXT_COLOR,
                                }}
                              >
                                {gender === 'MALE' ? t('male') : t('female')}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </Field.Root>
                    <Field.Root invalid={!!levelError} required>
                      <Field.Label>
                        {t('level')}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Controller
                        control={control}
                        name={`players.${index}.level`}
                        render={({ field }) => (
                          <select
                            value={field.value === null ? '' : field.value}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) => {
                              const value = e.target.value
                                ? parseInt(e.target.value, 10)
                                : null;
                              field.onChange(value);
                              onUpdatePlayer(index, 'level', value);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              height: '40px',
                              borderRadius: '6px',
                              border: `1px solid ${
                                levelError
                                  ? CONTROL_ERROR_BORDER_COLOR
                                  : CONTROL_BORDER_COLOR
                              }`,
                              backgroundColor: CONTROL_BG_COLOR,
                              color: CONTROL_TEXT_COLOR,
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            <option
                              value=""
                              style={{
                                backgroundColor: CONTROL_BG_COLOR,
                                color: CONTROL_TEXT_COLOR,
                              }}
                            >
                              {t('selectLevel')}
                            </option>
                            {Array.from(new Set(availableLevels)).map(
                              (level) => (
                                <option
                                  key={level}
                                  value={level}
                                  style={{
                                    backgroundColor: CONTROL_BG_COLOR,
                                    color: CONTROL_TEXT_COLOR,
                                  }}
                                >
                                  {getLevelShortLabel(level)}
                                </option>
                              )
                            )}
                          </select>
                        )}
                      />
                      {levelError && (
                        <Field.ErrorText>{levelError}</Field.ErrorText>
                      )}
                    </Field.Root>
                  </Grid>

                  {/* Level description */}
                  <Field.Root>
                    <Field.Label>{t('levelDescription')}</Field.Label>
                    <Controller
                      control={control}
                      name={`players.${index}.levelDescription`}
                      render={({ field }) => (
                        <Textarea
                          placeholder={t('levelDescriptionPlaceholder')}
                          size="md"
                          bg={CONTROL_BG}
                          value={field.value || ''}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) => {
                            field.onChange(e);
                            onUpdatePlayer(
                              index,
                              'levelDescription',
                              e.target.value
                            );
                          }}
                          rows={1}
                          minH="52px"
                          h="52px"
                          py={2}
                        />
                      )}
                    />
                  </Field.Root>

                  {/* Club membership */}
                  <Box mt={-1}>
                    <Flex
                      align={{ base: 'stretch', sm: 'center' }}
                      direction={{ base: 'column', sm: 'row' }}
                      gap={3}
                    >
                      <Controller
                        control={control}
                        name={`players.${index}.isClubMember`}
                        render={({ field }) => (
                          <Flex align="center" gap={3} flexShrink={0}>
                            <input
                              type="checkbox"
                              id={`isClubMember-${index}`}
                              checked={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                onUpdatePlayer(
                                  index,
                                  'isClubMember',
                                  e.target.checked
                                );
                                if (!e.target.checked) {
                                  onUpdatePlayer(index, 'clubId', null);
                                }
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                accentColor: '#38a169',
                              }}
                            />
                            <label
                              htmlFor={`isClubMember-${index}`}
                              style={{
                                fontSize: '14px',
                                color: 'inherit',
                                opacity: 0.8,
                                lineHeight: '1.4',
                              }}
                            >
                              {t('isClubMember')}
                            </label>
                          </Flex>
                        )}
                      />

                      {player.isClubMember && (
                        <Field.Root
                          flex="1"
                          minW={{ base: '100%', sm: '220px' }}
                          invalid={!!clubError}
                          required
                        >
                          <Controller
                            control={control}
                            name={`players.${index}.clubId`}
                            render={({ field }) => (
                              <select
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e);
                                  onUpdatePlayer(
                                    index,
                                    'clubId',
                                    e.target.value
                                  );
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  border: `1px solid ${
                                    clubError
                                      ? CONTROL_ERROR_BORDER_COLOR
                                      : CONTROL_BORDER_COLOR
                                  }`,
                                  backgroundColor: CONTROL_BG_COLOR,
                                  color: CONTROL_TEXT_COLOR,
                                  fontSize: '14px',
                                  height: '40px',
                                }}
                              >
                                <option value="">{t('selectClub')}</option>
                                {clubs.map((club) => (
                                  <option key={club.id} value={club.id}>
                                    {club.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {clubError && (
                            <Field.ErrorText>{clubError}</Field.ErrorText>
                          )}
                        </Field.Root>
                      )}
                    </Flex>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          );
        })}

        {/* Add another player button */}
        <Button
          size="sm"
          leftIcon={<Box as={Plus} boxSize={4} />}
          onClick={onAddPlayer}
          colorPalette="green"
          variant="outline"
          w="full"
        >
          {t('addPlayer')}
        </Button>
      </VStack>
    </VModal>
  );
};

export default AddPlayerModal;
