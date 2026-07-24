'use client';

import { SessionService } from '@/lib/api/session.service';
import {
  CourtDirection,
  ISession,
  SessionStatus,
  UserRole,
  FeeType,
} from '@/lib/api/types';
import SessionFeeConfigForm from '@/components/fee/SessionFeeConfigForm';
import { Box, Stack, Text } from '@chakra-ui/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createSessionFormSchema,
  type SessionFormData,
} from '@/components/session/session-form/sessionFormSchema';
import { buildSessionFormDefaults } from '@/components/session/session-form/sessionFormDefaults';
import { scrollToFirstSessionError } from '@/components/session/session-form/sessionFormUtils';
import { useSessionImages } from '@/components/session/session-form/useSessionImages';
import { useVenueClubData } from '@/components/session/session-form/useVenueClubData';
import { useSessionTimeFields } from '@/components/session/session-form/useSessionTimeFields';
import { useAISuccessHandler } from '@/components/session/session-form/useAISuccessHandler';
import { BasicInfoSection } from '@/components/session/session-form/sections/BasicInfoSection';
import { HostInfoSection } from '@/components/session/session-form/sections/HostInfoSection';
import { TimeSection } from '@/components/session/session-form/sections/TimeSection';
import { CourtsSection } from '@/components/session/session-form/sections/CourtsSection';
import { SessionSettingsSection } from '@/components/session/session-form/sections/SessionSettingsSection';
import { AdvancedSection } from '@/components/session/session-form/sections/AdvancedSection';
import { FormFooter } from '@/components/session/session-form/sections/FormFooter';

import { useAuthStore } from '@/stores/useAuthStore';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import AISessionModal from '@/components/session/AISessionModal';
import LevelRequirementsCard from '@/components/session/LevelRequirementsCard';
import { BulkSessionDateSelector } from '@/components/session/BulkSessionDateSelector';
import {
  BulkCreationMode,
  SpecificDatesConfig,
  RecurringWeekdaysConfig,
  VenueRequestType,
} from '@/lib/api/types';
import dynamic from 'next/dynamic';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import VenueRequestModal from '@/components/venue/VenueRequestModal';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

interface SessionFormProps {
  mode: 'create' | 'edit';
  sessionId?: string;
  initialData?: ISession;
  backHref?: string;
  onSuccess: (session: ISession) => void | Promise<void>;
  onCancel?: () => void;
  showTopBar?: boolean;
  title?: string;
  submitButtonText?: string;
  useDrawerMobileFooter?: boolean;
  mobileFooterWidth?: string;
}

export default function SessionForm({
  mode,
  sessionId,
  initialData,
  onSuccess,
  onCancel,
  submitButtonText,
  useDrawerMobileFooter = false,
  mobileFooterWidth = '100%',
}: SessionFormProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const tVenue = useTranslations('venue');
  const tVenueRequests = useTranslations('venueRequests');
  const { user, isAuthenticated } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const isEditMode = mode === 'edit';

  // Computed checks
  const isSessionActive =
    isEditMode && initialData?.status === SessionStatus.IN_PROGRESS;

  const canEditCourts =
    !isEditMode || initialData?.status === SessionStatus.PREPARING;
  const canEditTime = !isEditMode || !isSessionActive;
  const canEditVenue = !isEditMode || !isSessionActive;

  // Default values
  const defaultValues: SessionFormData = useMemo(
    () =>
      buildSessionFormDefaults({
        isEditMode,
        initialData,
        userName: user?.name,
      }),
    [isEditMode, initialData, user]
  );

  const sessionFormSchema = useMemo(
    () => createSessionFormSchema(t, isEditMode),
    [t, isEditMode]
  );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormData>({
    resolver: zodResolver(
      sessionFormSchema
    ) as unknown as import('react-hook-form').Resolver<SessionFormData>,
    defaultValues,
  });

  // useFieldArray for dynamic courts
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'courts',
  });

  // Watch values for computed properties
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // State for modal / navigation
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Venue request modal state
  const {
    isOpen: isVenueRequestOpen,
    onOpen: openVenueRequest,
    onClose: closeVenueRequest,
  } = useDisclosure(false);
  const {
    isOpen: isVenueLoginModalOpen,
    onOpen: openVenueLoginModal,
    onClose: closeVenueLoginModal,
  } = useDisclosure(false);
  const [venueRequestKeyword, setVenueRequestKeyword] = useState('');

  const handleSuggestNewVenue = () => {
    if (!isAuthenticated) {
      openVenueLoginModal();
      return;
    }
    openVenueRequest();
  };

  const {
    venues,
    isClubsLoading,
    selectedVenueObj,
    setSelectedVenueObj,
    isVenueLoading,
    venueOptions,
    clubOptions,
    handleVenueSearch,
  } = useVenueClubData({
    isEditMode,
    initialData,
    canAccessHostFeatures,
    t,
    tVenue,
  });

  // Fee configuration state
  const [feeEnabled, setFeeEnabled] = useState(
    isEditMode && initialData?.feeConfig ? true : false
  );
  const [feeType, setFeeType] = useState<FeeType>(
    initialData?.feeConfig?.feeType || FeeType.FIXED
  );
  const [maleFee, setMaleFee] = useState<number | undefined>(
    initialData?.feeConfig?.maleFee ?? undefined
  );
  const [femaleFee, setFemaleFee] = useState<number | undefined>(
    initialData?.feeConfig?.femaleFee ?? undefined
  );
  const [feeNotes, setFeeNotes] = useState(initialData?.feeConfig?.notes || '');

  // Session images state (multi-image support)
  const {
    sessionImages,
    setSessionImages,
    bannerIndex,
    setBannerIndex,
    isUploadingImages,
  } = useSessionImages(initialData);

  // Single-day time picker state
  const {
    isMultiDay,
    setIsMultiDay,
    sessionDate,
    setSessionDate,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    handleDateChange,
    handleStartHourChange,
    handleEndHourChange,
  } = useSessionTimeFields({ isEditMode, initialData, setValue });

  // Bulk creation state
  const [bulkEnabled, setBulkEnabled] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkCreationMode>('single');
  const [isDeleteCourtModalOpen, setIsDeleteCourtModalOpen] = useState(false);
  const [courtIndexToDelete, setCourtIndexToDelete] = useState<number | null>(
    null
  );
  const [specificDatesConfig, setSpecificDatesConfig] = useState<
    SpecificDatesConfig | undefined
  >(undefined);
  const [recurringWeekdaysConfig, setRecurringWeekdaysConfig] = useState<
    RecurringWeekdaysConfig | undefined
  >(undefined);

  const submitLabel = useMemo(() => {
    if (submitButtonText) return submitButtonText;
    if (isEditMode) return t('saveChanges');
    return t('createSession');
  }, [isEditMode, submitButtonText, t]);

  // Advanced section collapse state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Computed session duration
  const sessionDuration = useMemo(() => {
    try {
      if (!startTime || !endTime) return 0;
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (60 * 1000)
      );
      return durationMinutes > 0 ? durationMinutes : 0;
    } catch {
      return 0;
    }
  }, [startTime, endTime]);

  useEffect(() => {
    const error = searchParams.get('error');
    const details = searchParams.get('details');
    if (error) {
      toaster.error({
        title: decodeURIComponent(
          details || t('validation.sessionCreateFailed')
        ),
      });
    }
  }, [searchParams, t]);

  // Court management handlers
  const shouldFocusNewCourt = useRef(false);

  const handleAddCourt = () => {
    shouldFocusNewCourt.current = true;
    append({
      courtId: undefined,
      courtNumber: 0,
      courtName: '',
      direction: CourtDirection.HORIZONTAL,
    });
  };

  // Focus the courtNumber input of the newly added court row
  useEffect(() => {
    if (shouldFocusNewCourt.current && fields.length > 0) {
      shouldFocusNewCourt.current = false;
      const newIndex = fields.length - 1;
      // Use setTimeout to wait for React to finish rendering the new row
      setTimeout(() => {
        const el = document.getElementById(`court-number-input-${newIndex}`);
        if (el) el.focus();
      }, 0);
    }
  }, [fields.length]);

  const handleRemoveCourt = (index: number) => {
    if (fields.length > 1) {
      setCourtIndexToDelete(index);
      setIsDeleteCourtModalOpen(true);
    }
  };

  const confirmDeleteCourt = () => {
    if (courtIndexToDelete !== null) {
      remove(courtIndexToDelete);
      setIsDeleteCourtModalOpen(false);
      setCourtIndexToDelete(null);
    }
  };

  // AI Success handler using setValue
  const handleAISuccess = useAISuccessHandler({
    setValue,
    venues,
    isMultiDay,
    setSessionDate,
    setStartHour,
    setEndHour,
    setSelectedVenueObj,
    setFeeEnabled,
    setFeeType,
    setMaleFee,
    setFemaleFee,
    setFeeNotes,
  });

  // Check for pending session data from quick create
  const hasCheckedSessionStorage = useRef(false);
  useEffect(() => {
    if (!isEditMode && venues.length > 0 && !hasCheckedSessionStorage.current) {
      const pendingData = sessionStorage.getItem('vmito_pending_session_data');
      if (pendingData) {
        try {
          const parsedData = JSON.parse(pendingData);
          handleAISuccess(parsedData);
          hasCheckedSessionStorage.current = true;
          sessionStorage.removeItem('vmito_pending_session_data');
        } catch (e) {
          console.error('Failed to parse pending session data', e);
          sessionStorage.removeItem('vmito_pending_session_data');
        }
      }
    }
  }, [isEditMode, venues, handleAISuccess]);

  // Form submission handler
  const onSubmit = async (data: SessionFormData) => {
    try {
      const venueData = selectedVenueObj
        ? {
            placeId: selectedVenueObj.placeId,
            name: selectedVenueObj.name,
            address: selectedVenueObj.address,
            lat: selectedVenueObj.lat,
            lng: selectedVenueObj.lng,
            district: selectedVenueObj.district,
            city: selectedVenueObj.city,
          }
        : undefined;

      let session: ISession;
      let bulkCreatedSessions: ISession[] = [];

      // Prepare fee config
      const feeConfigData = feeEnabled
        ? {
            feeType,
            maleFee: feeType === FeeType.FIXED ? maleFee : undefined,
            femaleFee: feeType === FeeType.FIXED ? femaleFee : undefined,
            notes: feeNotes.trim() || undefined,
          }
        : undefined;

      if (isEditMode && sessionId) {
        // Update logic
        session = await SessionService.updateSession(sessionId, {
          name: data.name,
          description: data.description?.trim() || '',
          referenceVideoUrl: data.referenceVideoUrl?.trim() || null,
          hostName: data.hostName.trim(),
          hostPhone: data.hostPhone?.trim() || '',
          clubId: data.clubId || null,
          maxPlayersPerCourt: data.maxPlayersPerCourt,
          requirePlayerInfo: data.requirePlayerInfo,
          allowGuestJoin: data.allowGuestJoin,
          allowNewPlayers: data.allowNewPlayers,
          allowZaloContact: data.allowZaloContact,
          requiredLevels: data.allLevelsSelected
            ? []
            : data.requiredLevels && data.requiredLevels.length > 0
              ? data.requiredLevels
              : [],
          courtColor: data.courtColor,
          defaultMatchType: data.defaultMatchType,
          shuttlecock: data.shuttlecock?.trim() || '',
          coverPhoto: sessionImages[bannerIndex]?.url,
          coverPhotoPublicId: sessionImages[bannerIndex]?.publicId,
          images: sessionImages.map((img) => img.url),
          imagePublicIds: sessionImages.map((img) => img.publicId),
          venue: venueData,
          feeConfig: feeConfigData,

          // Only update courts if allowed
          ...(canEditCourts && {
            numberOfCourts: data.courts.length,
            courts: data.courts.map((court) => ({
              id: court.courtId,
              courtNumber: court.courtNumber,
              courtName: court.courtName || undefined,
              direction: court.direction,
            })),
          }),

          // Only update time if allowed
          ...(canEditTime && {
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            sessionDuration,
          }),
        });
      } else {
        // Create logic - support both single and bulk creation
        const baseSessionData = {
          name: data.name,
          description: data.description?.trim() || '',
          referenceVideoUrl: data.referenceVideoUrl?.trim() || null,
          hostName: data.hostName.trim(),
          hostPhone: data.hostPhone?.trim() || '',
          clubId: data.clubId || null,
          numberOfCourts: data.courts.length,
          sessionDuration,
          maxPlayersPerCourt: data.maxPlayersPerCourt,
          requirePlayerInfo: data.requirePlayerInfo,
          allowGuestJoin: data.allowGuestJoin,
          allowNewPlayers: data.allowNewPlayers,
          allowZaloContact: data.allowZaloContact,
          requiredLevels: data.allLevelsSelected
            ? []
            : data.requiredLevels && data.requiredLevels.length > 0
              ? data.requiredLevels
              : [],
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          courtColor: data.courtColor,
          defaultMatchType: data.defaultMatchType,
          shuttlecock: data.shuttlecock?.trim() || '',
          coverPhoto: sessionImages[bannerIndex]?.url,
          coverPhotoPublicId: sessionImages[bannerIndex]?.publicId,
          images: sessionImages.map((img) => img.url),
          imagePublicIds: sessionImages.map((img) => img.publicId),
          venue: venueData,
          courts: data.courts.map((court) => ({
            courtNumber: court.courtNumber,
            courtName: court.courtName || undefined,
            direction: court.direction,
          })),
          feeConfig: feeConfigData,
        };

        const shouldCreateBulk = bulkEnabled && bulkMode !== 'single';

        if (
          shouldCreateBulk &&
          bulkMode === 'specific-dates' &&
          (!specificDatesConfig?.dates ||
            specificDatesConfig.dates.length === 0)
        ) {
          toaster.error({ title: t('validation.specificDatesRequired') });
          return;
        }

        if (
          shouldCreateBulk &&
          bulkMode === 'recurring-weekdays' &&
          (!recurringWeekdaysConfig?.weekdays ||
            recurringWeekdaysConfig.weekdays.length === 0)
        ) {
          toaster.error({ title: t('validation.recurringWeekdaysRequired') });
          return;
        }

        // Check if bulk creation is enabled
        if (!shouldCreateBulk) {
          // Single session creation
          session = await SessionService.createSession(baseSessionData);
        } else {
          // Bulk session creation
          const bulkResult = await SessionService.createBulkSessions({
            mode: bulkMode,
            baseSession: baseSessionData,
            specificDates: specificDatesConfig,
            recurringWeekdays: recurringWeekdaysConfig,
          });

          if (!bulkResult.success || bulkResult.sessions.length === 0) {
            throw new Error(
              t('validation.bulkCreationFailed') || 'Failed to create sessions'
            );
          }

          // Use the first session as the main session to navigate to
          session = bulkResult.sessions[0];
          bulkCreatedSessions = bulkResult.sessions;

          // Show success message with count
          toaster.success({
            title: t('bulkCreation.success') || 'Sessions created successfully',
            description: `${bulkResult.sessionsCreated} ${t('bulkCreation.sessionsCreated') || 'sessions created'}`,
          });
        }
      }

      // For bulk creation, sync images to all other sessions
      if (bulkCreatedSessions.length > 1 && sessionImages.length > 0) {
        try {
          await Promise.all(
            bulkCreatedSessions.slice(1).map((s) =>
              SessionService.updateSession(s.id, {
                coverPhoto: sessionImages[bannerIndex]?.url,
                coverPhotoPublicId: sessionImages[bannerIndex]?.publicId,
                images: sessionImages.map((img) => img.url),
                imagePublicIds: sessionImages.map((img) => img.publicId),
              })
            )
          );
        } catch (syncError) {
          console.error('Failed to sync images to bulk sessions:', syncError);
        }
      }

      await onSuccess(session!);
      if (!isEditMode) {
        setIsNavigating(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('validation.unknownError');
      toaster.error({ title: errorMessage });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <Box w="full">
      {/* {showTopBar && (
        <TopBar
          title={
            title || (isEditMode ? t('editSession') : t('createNewSession'))
          }
          showBackButton={!!backHref}
          backHref={backHref}
        />
      )} */}

      {!isEditMode && (
        <>
          <AISessionModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            onSuccess={handleAISuccess}
          />
        </>
      )}

      <Box
        maxW="4xl"
        // pt={showTopBar ? '80px' : '0'}
        pb={useDrawerMobileFooter ? { base: 28, md: 20 } : 20}
        px={0}
        mx="auto"
        w="full"
      >
        <form
          onSubmit={handleSubmit(
            onSubmit as Parameters<typeof handleSubmit>[0],
            scrollToFirstSessionError
          )}
          onKeyDown={handleKeyDown}
        >
          <Stack gap={6}>
            {/* Warning messages */}
            {/* {isEditMode && !canEditCourts && (
                            <Alert.Root status="warning">
                                <Alert.Indicator />
                                <Alert.Title>{t('validation.cannotEditCourtsWithPlayers')}</Alert.Title>
                            </Alert.Root>
                        )} */}

            {/* Basic Info Section */}
            <BasicInfoSection
              t={t}
              isEditMode={isEditMode}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              register={register}
              errors={errors}
              control={control}
              canEditVenue={canEditVenue}
              venues={venues}
              setSelectedVenueObj={(venue) => {
                setSelectedVenueObj(venue);
                if (venue) setVenueRequestKeyword('');
              }}
              venueOptions={venueOptions}
              handleVenueSearch={(kw) => {
                setVenueRequestKeyword(kw);
                handleVenueSearch(kw);
              }}
              isVenueLoading={isVenueLoading}
              onSuggestNewVenue={handleSuggestNewVenue}
            />

            {/* Host Info Section */}
            <HostInfoSection
              t={t}
              register={register}
              errors={errors}
              control={control}
            />

            {/* Time Section */}
            <TimeSection
              t={t}
              isMultiDay={isMultiDay}
              setIsMultiDay={setIsMultiDay}
              canEditTime={canEditTime}
              isEditMode={isEditMode}
              sessionDate={sessionDate}
              handleDateChange={handleDateChange}
              startHour={startHour}
              handleStartHourChange={handleStartHourChange}
              endHour={endHour}
              handleEndHourChange={handleEndHourChange}
              register={register}
              errors={errors}
              startTime={startTime}
              endTime={endTime}
              sessionDuration={sessionDuration}
            />

            {/* Courts Configuration Section */}
            <CourtsSection
              t={t}
              canEditCourts={canEditCourts}
              fields={fields}
              control={control}
              register={register}
              errors={errors}
              handleRemoveCourt={handleRemoveCourt}
              handleAddCourt={handleAddCourt}
            />

            {/* Level Requirements Section */}
            <LevelRequirementsCard control={control} setValue={setValue} />

            {/* Session Settings Section - Temporarily hidden */}
            {false && user?.role !== UserRole.PLAYER && (
              <SessionSettingsSection t={t} control={control} />
            )}

            {/* Fee Configuration Section */}
            <SessionFeeConfigForm
              enabled={feeEnabled}
              onEnabledChange={setFeeEnabled}
              feeType={feeType}
              onFeeTypeChange={setFeeType}
              maleFee={maleFee}
              onMaleFeeChange={setMaleFee}
              femaleFee={femaleFee}
              onFemaleFeeChange={setFemaleFee}
              notes={feeNotes}
              onNotesChange={setFeeNotes}
            />

            {/* Bulk Session Creation - Only show in create mode */}
            {!isEditMode && canAccessHostFeatures && (
              <BulkSessionDateSelector
                enabled={bulkEnabled}
                onEnabledChange={setBulkEnabled}
                baseStartTime={startTime ? new Date(startTime) : undefined}
                onModeChange={setBulkMode}
                onSpecificDatesChange={setSpecificDatesConfig}
                onRecurringWeekdaysChange={setRecurringWeekdaysConfig}
              />
            )}

            {/* Advanced Section - Collapsible */}
            <AdvancedSection
              t={t}
              isAdvancedOpen={isAdvancedOpen}
              setIsAdvancedOpen={setIsAdvancedOpen}
              sessionImages={sessionImages}
              setSessionImages={setSessionImages}
              bannerIndex={bannerIndex}
              setBannerIndex={setBannerIndex}
              isUploadingImages={isUploadingImages}
              canAccessHostFeatures={canAccessHostFeatures}
              control={control}
              register={register}
              errors={errors}
              clubOptions={clubOptions}
              isClubsLoading={isClubsLoading}
            />

            {/* Buttons */}
            <FormFooter
              t={t}
              tc={tc}
              onCancel={onCancel}
              isSubmitting={isSubmitting}
              isNavigating={isNavigating}
              isEditMode={isEditMode}
              submitLabel={submitLabel}
              useDrawerMobileFooter={useDrawerMobileFooter}
              mobileFooterWidth={mobileFooterWidth}
            />
          </Stack>
        </form>
      </Box>

      {/* Delete Court Confirmation Modal */}
      <VModal
        isOpen={isDeleteCourtModalOpen}
        onClose={() => {
          setIsDeleteCourtModalOpen(false);
          setCourtIndexToDelete(null);
        }}
        title={t('confirmDeleteCourt')}
        primaryActionText={tc('delete')}
        onPrimaryAction={confirmDeleteCourt}
        primaryColorScheme="red"
        secondaryActionText={tc('cancel')}
      >
        <Text>
          {t('confirmDeleteCourtMessage') ||
            'Bạn có chắc chắn muốn xóa sân này? Hành động này không thể hoàn tác.'}
        </Text>
      </VModal>

      {/* Suggest New Venue Modal */}
      <VenueRequestModal
        isOpen={isVenueRequestOpen}
        onClose={closeVenueRequest}
        type={VenueRequestType.CREATE}
        defaultKeyword={venueRequestKeyword}
      />

      {/* Login prompt when unauthenticated user tries to suggest a venue */}
      {isVenueLoginModalOpen && (
        <LoginPromptModal
          isOpen={isVenueLoginModalOpen}
          onClose={closeVenueLoginModal}
          featureName={tVenueRequests('suggestNewVenue')}
        />
      )}
    </Box>
  );
}
