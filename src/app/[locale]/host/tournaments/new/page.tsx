'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SVGProps,
} from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  MapPin,
  Trophy,
} from 'lucide-react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';

import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import VModal from '@/components/ui/VModal';
import { ROUTES } from '@/constants';
import { useRouter } from '@/i18n/config';
import { TournamentService } from '@/lib/api/tournament.service';
import { SportType, UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

import {
  createTournamentFormSchema,
  getLocalDateInputValue,
  TOURNAMENT_SPORT_TYPES,
  toCreateTournamentPayload,
  type TournamentFormValues,
} from './form-utils';
import LocalizedDateInput from './LocalizedDateInput';

const FIRST_ERROR_FIELDS: Array<keyof TournamentFormValues> = [
  'name',
  'sportType',
  'startDate',
  'endDate',
];

function BadmintonSportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      <path d="M7 4.5c3-2 7-2 10 0l-5 9-5-9Z" />
      <path d="m9.5 3 2.5 10.5L14.5 3" />
      <path d="M9 13.5h6l1 3H8l1-3Z" />
      <path d="M9 16.5h6a3 3 0 0 1-6 0Z" />
    </svg>
  );
}

function PickleballSportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      <path d="M14.5 3a6.5 6.5 0 0 1 4.2 10.9 6.4 6.4 0 0 1-4.6 2.1L10 21l-3-2 3.1-4.2A6.5 6.5 0 0 1 14.5 3Z" />
      <circle cx="13" cy="7" r=".7" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9.5" r=".7" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SPORT_ICONS = {
  BADMINTON: BadmintonSportIcon,
  PICKLEBALL: PickleballSportIcon,
} as const;

export default function NewTournamentPage() {
  const t = useTranslations('pages.tournaments.create');
  const locale = useLocale();
  const dateLocale =
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US';
  const router = useRouter();
  const [today, setToday] = useState('');
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const allowNavigationRef = useRef(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    setToday(getLocalDateInputValue());
  }, []);

  const schema = useMemo(
    () =>
      createTournamentFormSchema(
        {
          nameRequired: t('validation.nameRequired'),
          startDateRequired: t('validation.startDateRequired'),
          endDateRequired: t('validation.endDateRequired'),
          startDatePast: t('validation.startDatePast'),
          endBeforeStart: t('validation.endBeforeStart'),
        },
        today
      ),
    [t, today]
  );

  const {
    control,
    getValues,
    handleSubmit,
    register,
    setFocus,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      sportType: 'BADMINTON',
      startDate: '',
      endDate: '',
      locationQuery: '',
      location: null,
    },
  });

  const selectedSport = watch('sportType');
  const selectedLocation = watch('location');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || allowNavigationRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const requestNavigation = useCallback(
    (navigate: () => void) => {
      if (!isDirty || allowNavigationRef.current) {
        navigate();
        return;
      }

      pendingNavigationRef.current = navigate;
      setIsLeaveDialogOpen(true);
    },
    [isDirty]
  );

  const handleBack = useCallback(() => {
    requestNavigation(() => router.push(ROUTES.HOST.TOURNAMENTS.LIST));
  }, [requestNavigation, router]);

  const handleConfirmLeave = useCallback(() => {
    const navigate = pendingNavigationRef.current;
    allowNavigationRef.current = true;
    pendingNavigationRef.current = null;
    setIsLeaveDialogOpen(false);
    navigate?.();
  }, []);

  const handleCloseLeaveDialog = useCallback(() => {
    pendingNavigationRef.current = null;
    setIsLeaveDialogOpen(false);
  }, []);

  const handleLocationQueryChange = useCallback(
    (nextValue: string) => {
      setValue('locationQuery', nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });

      const currentLocation = getValues('location');
      if (
        currentLocation &&
        nextValue !== currentLocation.address &&
        nextValue !== currentLocation.name
      ) {
        setValue('location', null, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [getValues, setValue]
  );

  const handleClearLocation = useCallback(() => {
    setValue('location', null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('locationQuery', '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const handleValidSubmit = async (values: TournamentFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      const payload = toCreateTournamentPayload(values);
      const tournament = await TournamentService.createTournament({
        ...payload,
        sportType: payload.sportType as SportType,
      });

      allowNavigationRef.current = true;
      router.push(`/tournament/${tournament.slug}`);
    } catch (error: unknown) {
      submitLockRef.current = false;
      console.error('Error creating tournament:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toaster.error({
        title: apiError.response?.data?.error || t('createFailed'),
      });
    }
  };

  const handleInvalidSubmit = (
    fieldErrors: FieldErrors<TournamentFormValues>
  ) => {
    const firstError = FIRST_ERROR_FIELDS.find((field) => fieldErrors[field]);
    if (firstError) setFocus(firstError);
  };

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST]}>
      <PageLayout
        title={t('title')}
        showBackButton
        backHref={ROUTES.HOST.TOURNAMENTS.LIST}
        onBack={handleBack}
        maxW="4xl"
        bg={{
          base: 'linear-gradient(180deg, #f0fdf7 0%, #f8fffb 52%, #ffffff 100%)',
          _dark:
            'linear-gradient(180deg, #0b1f18 0%, #101714 52%, #111827 100%)',
        }}
        overflowX="hidden"
        pb={{
          base: 'calc(104px + env(safe-area-inset-bottom))',
          md: 10,
        }}
        scrollPaddingBottom={{
          base: 'calc(104px + env(safe-area-inset-bottom))',
          md: 0,
        }}
      >
        <Box maxW="760px" mx="auto">
          <form
            onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
            noValidate
          >
            <VStack align="stretch" gap={{ base: 4, md: 6 }}>
              <Box
                position="relative"
                overflow="hidden"
                borderRadius={{ base: '2xl', md: '3xl' }}
                p={{ base: 4, md: 5 }}
                color="white"
                bg="linear-gradient(135deg, #08783e 0%, #0f9f57 55%, #1fbd72 100%)"
                boxShadow="0 18px 50px rgba(8, 120, 62, 0.2)"
              >
                <Box
                  aria-hidden="true"
                  position="absolute"
                  w={{ base: '150px', md: '220px' }}
                  h={{ base: '150px', md: '220px' }}
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  top="-70px"
                  right="-50px"
                />
                <Box
                  aria-hidden="true"
                  position="absolute"
                  w="90px"
                  h="90px"
                  borderRadius="full"
                  borderWidth="18px"
                  borderColor="whiteAlpha.100"
                  bottom="-42px"
                  right={{ base: '20px', md: '110px' }}
                />

                <Flex
                  position="relative"
                  gap={{ base: 3, md: 4 }}
                  align={{ base: 'flex-start', md: 'center' }}
                >
                  <Flex
                    w={{ base: 10, md: 12 }}
                    h={{ base: 10, md: 12 }}
                    flexShrink={0}
                    align="center"
                    justify="center"
                    borderRadius="2xl"
                    bg="whiteAlpha.200"
                    borderWidth="1px"
                    borderColor="whiteAlpha.300"
                  >
                    <Trophy size={22} aria-hidden="true" />
                  </Flex>
                  <Box minW={0}>
                    <Heading
                      as="h1"
                      size={{ base: 'lg', md: 'xl' }}
                      lineHeight="1.15"
                      textWrap="balance"
                    >
                      {t('createNewTournament')}
                    </Heading>
                    <Text
                      mt={{ base: 1.5, md: 1 }}
                      maxW="640px"
                      color="whiteAlpha.900"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight={{ base: '1.5', md: '1.5' }}
                      lineClamp={{ base: 2, md: 'none' }}
                      textWrap="pretty"
                    >
                      {t('introDescription')}
                    </Text>
                  </Box>
                </Flex>
              </Box>

              <Box
                bg={{ base: 'white', _dark: 'gray.900' }}
                borderWidth="1px"
                borderColor={{ base: 'green.100', _dark: 'whiteAlpha.200' }}
                borderRadius={{ base: '2xl', md: '3xl' }}
                boxShadow={{
                  base: '0 8px 30px rgba(15, 118, 66, 0.08)',
                  _dark: '0 8px 30px rgba(0, 0, 0, 0.25)',
                }}
                overflow="visible"
              >
                <VStack
                  align="stretch"
                  gap={{ base: 4, md: 6 }}
                  p={{ base: 4, md: 7 }}
                >
                  <Box>
                    <Heading as="h2" size="lg" color="fg">
                      {t('basicInformation')}
                    </Heading>
                    {/* <Text mt={1.5} color="fg.muted" fontSize="sm">
                      {t('formDescription')}
                    </Text> */}
                  </Box>

                  <Field
                    label={t('tournamentName')}
                    required
                    invalid={Boolean(errors.name)}
                    errorText={errors.name?.message}
                    // helperText={t('tournamentNameHelper')}
                  >
                    <Input
                      {...register('name')}
                      autoComplete="off"
                      placeholder={t('enterTournamentName')}
                      minH="48px"
                      borderRadius="xl"
                      bg={{ base: 'white', _dark: 'gray.800' }}
                    />
                  </Field>

                  <Field
                    label={t('sport')}
                    required
                    invalid={Boolean(errors.sportType)}
                    errorText={errors.sportType?.message}
                    helperText={t('sportHelper')}
                  >
                    <Grid
                      templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                      gap={3}
                      w="full"
                    >
                      {TOURNAMENT_SPORT_TYPES.map((type) => {
                        const selected = selectedSport === type;
                        const SportIcon = SPORT_ICONS[type];

                        return (
                          <Box
                            key={type}
                            as="label"
                            position="relative"
                            minH={{ base: '72px', md: '84px' }}
                            p={{ base: 3, md: 4 }}
                            borderWidth="1.5px"
                            borderColor={
                              selected
                                ? 'green.500'
                                : { base: 'gray.200', _dark: 'gray.700' }
                            }
                            borderRadius="2xl"
                            bg={
                              selected
                                ? { base: 'green.50', _dark: 'green.950' }
                                : { base: 'white', _dark: 'gray.800' }
                            }
                            cursor="pointer"
                            touchAction="manipulation"
                            css={{ WebkitTapHighlightColor: 'transparent' }}
                            transitionProperty="border-color, background-color, box-shadow, transform"
                            transitionDuration="160ms"
                            _hover={{
                              borderColor: 'green.400',
                              transform: 'translateY(-1px)',
                              boxShadow: 'sm',
                            }}
                            _focusWithin={{
                              borderColor: 'green.500',
                              boxShadow:
                                '0 0 0 3px var(--chakra-colors-green-200)',
                            }}
                            _motionReduce={{
                              transition: 'none',
                              transform: 'none',
                            }}
                          >
                            <input
                              type="radio"
                              value={type}
                              {...register('sportType')}
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                width: '1px',
                                height: '1px',
                              }}
                            />
                            <Flex align="center" gap={3}>
                              <Flex
                                w={{ base: 10, md: 11 }}
                                h={{ base: 10, md: 11 }}
                                flexShrink={0}
                                align="center"
                                justify="center"
                                borderRadius="xl"
                                bg={
                                  selected
                                    ? 'green.500'
                                    : {
                                        base: 'gray.100',
                                        _dark: 'gray.700',
                                      }
                                }
                                color={selected ? 'white' : 'fg.muted'}
                              >
                                <SportIcon
                                  width={23}
                                  height={23}
                                  aria-hidden="true"
                                />
                              </Flex>
                              <Box minW={0} pe={selected ? 5 : 0}>
                                <Text fontWeight="bold" color="fg">
                                  {t(`sports.${type}`)}
                                </Text>
                              </Box>
                            </Flex>
                            {selected ? (
                              <Flex
                                position="absolute"
                                top={3}
                                right={3}
                                w={5}
                                h={5}
                                align="center"
                                justify="center"
                                borderRadius="full"
                                bg="green.500"
                                color="white"
                              >
                                <Check size={13} aria-hidden="true" />
                              </Flex>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Grid>
                  </Field>

                  <Box>
                    <HStack gap={2} mb={3} color="fg">
                      <CalendarDays size={18} aria-hidden="true" />
                      <Text fontWeight="semibold">{t('schedule')}</Text>
                    </HStack>
                    <Grid
                      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                      gap={4}
                    >
                      <Field
                        label={t('startDate')}
                        required
                        invalid={Boolean(errors.startDate)}
                        errorText={errors.startDate?.message}
                      >
                        <LocalizedDateInput
                          {...register('startDate')}
                          displayValue={startDate}
                          locale={dateLocale}
                          placeholder={t('datePlaceholder')}
                          ariaLabel={t('startDate')}
                          invalid={Boolean(errors.startDate)}
                          min={today || undefined}
                        />
                      </Field>

                      <Field
                        label={t('endDate')}
                        required
                        invalid={Boolean(errors.endDate)}
                        errorText={errors.endDate?.message}
                      >
                        <LocalizedDateInput
                          {...register('endDate')}
                          displayValue={endDate}
                          locale={dateLocale}
                          placeholder={t('datePlaceholder')}
                          ariaLabel={t('endDate')}
                          invalid={Boolean(errors.endDate)}
                          min={startDate || today || undefined}
                        />
                      </Field>
                    </Grid>
                  </Box>

                  <Field
                    label={t('venue')}
                    optionalText={t('optional')}
                    helperText={t('locationHelper')}
                  >
                    <Controller
                      name="locationQuery"
                      control={control}
                      render={({ field }) => (
                        <LocationAutocomplete
                          inputName={field.name}
                          ariaLabel={t('venue')}
                          value={field.value}
                          onInputChange={handleLocationQueryChange}
                          onSelect={(location) => {
                            setValue('location', location, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue('locationQuery', location.address, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          placeholder={t('locationPlaceholder')}
                        />
                      )}
                    />
                  </Field>

                  {selectedLocation ? (
                    <Flex
                      align="flex-start"
                      justify="space-between"
                      gap={3}
                      p={3.5}
                      borderRadius="xl"
                      bg={{ base: 'green.50', _dark: 'green.950' }}
                      borderWidth="1px"
                      borderColor={{
                        base: 'green.200',
                        _dark: 'green.800',
                      }}
                      role="status"
                      aria-live="polite"
                    >
                      <HStack align="flex-start" gap={3} minW={0}>
                        <CheckCircle2
                          size={19}
                          color="var(--chakra-colors-green-500)"
                          aria-hidden="true"
                        />
                        <Box minW={0}>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="green.700"
                            _dark={{ color: 'green.300' }}
                          >
                            {t('selectedVenue')}
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="fg"
                            overflowWrap="anywhere"
                          >
                            {selectedLocation.name}
                          </Text>
                          {selectedLocation.address ? (
                            <Text
                              mt={0.5}
                              fontSize="xs"
                              color="fg.muted"
                              overflowWrap="anywhere"
                            >
                              {selectedLocation.address}
                            </Text>
                          ) : null}
                        </Box>
                      </HStack>
                      <Button
                        type="button"
                        variant="ghost"
                        colorPalette="gray"
                        size="sm"
                        flexShrink={0}
                        onClick={handleClearLocation}
                      >
                        {t('clearVenue')}
                      </Button>
                    </Flex>
                  ) : null}

                  <Flex
                    gap={3}
                    align="flex-start"
                    p={4}
                    borderRadius="2xl"
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                  >
                    <MapPin
                      size={18}
                      color="var(--chakra-colors-green-500)"
                      aria-hidden="true"
                    />
                    <Box>
                      <Text fontWeight="semibold" fontSize="sm" color="fg">
                        {t('nextStepsTitle')}
                      </Text>
                      <Text
                        mt={0.5}
                        color={{ base: 'gray.600', _dark: 'gray.400' }}
                        fontSize="sm"
                        lineHeight="1.55"
                      >
                        {t('nextStepsDescription')}
                      </Text>
                    </Box>
                  </Flex>
                </VStack>

                <Box
                  position={{ base: 'fixed', md: 'static' }}
                  bottom={0}
                  insetInlineStart={0}
                  insetInlineEnd={0}
                  zIndex={20}
                  px={{ base: 4, md: 6 }}
                  pt={{ base: 3, md: 6 }}
                  pb={{
                    base: 'calc(12px + env(safe-area-inset-bottom))',
                    md: 6,
                  }}
                  borderTopWidth="1px"
                  borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.200' }}
                  bg={{ base: 'whiteAlpha.950', _dark: 'blackAlpha.800' }}
                  backdropFilter="blur(14px)"
                  boxShadow={{
                    base: '0 -8px 28px rgba(15, 23, 42, 0.08)',
                    md: 'none',
                  }}
                  borderBottomRadius={{ md: '3xl' }}
                >
                  <Flex
                    maxW={{ base: '760px', md: 'none' }}
                    mx="auto"
                    gap={3}
                    justify="flex-end"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      colorPalette="gray"
                      minH="48px"
                      flex={{ base: '0 0 34%', md: '0 0 auto' }}
                      px={{ md: 6 }}
                      onClick={handleBack}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      colorPalette="green"
                      minH="48px"
                      flex={{ base: 1, md: '0 0 auto' }}
                      px={{ md: 7 }}
                      loading={isSubmitting}
                      loadingText={t('creating')}
                      rightIcon={<ArrowRight size={18} aria-hidden="true" />}
                    >
                      {t('createTournament')}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            </VStack>
          </form>
        </Box>
      </PageLayout>

      <VModal
        isOpen={isLeaveDialogOpen}
        onClose={handleCloseLeaveDialog}
        title={t('unsaved.title')}
        description={t('unsaved.description')}
        primaryActionText={t('unsaved.leave')}
        primaryColorScheme="red"
        secondaryActionText={t('unsaved.stay')}
        onPrimaryAction={handleConfirmLeave}
        closeButtonAriaLabel={t('unsaved.close')}
        size="sm"
      >
        <Text color="fg.muted">{t('unsaved.body')}</Text>
      </VModal>
    </ProtectedRouteGuard>
  );
}
