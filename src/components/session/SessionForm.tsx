'use client';

import { SessionService } from '@/lib/api/session.service';
import { CourtDirection, ISession, SessionStatus, Venue, UserRole, FeeType } from '@/lib/api/types';
import SessionFeeConfigForm from '@/components/fee/SessionFeeConfigForm';
import {
    Alert,
    Box,
    Container,
    Field,
    Flex,
    Grid,
    Heading,
    HStack,
    Stack,
    Text,
    Textarea,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { Input } from '@/components/ui/chakra-compat';
import { Check } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CustomCheckbox = ({
    isChecked,
    onChange,
}: {
    isChecked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    const boxSize = '24px';
    const iconSize = 16;

    return (
        <Box
            as="label"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
        >
            <input
                type="checkbox"
                checked={isChecked}
                onChange={onChange}
                style={{ display: 'none' }}
            />
            <Box
                w={boxSize}
                h={boxSize}
                border="2px solid"
                borderColor={isChecked ? 'blue.500' : 'gray.300'}
                bg={isChecked ? 'blue.500' : 'white'}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{ borderColor: 'blue.600' }}
            >
                {isChecked && <Check size={iconSize} color="white" strokeWidth={3} />}
            </Box>
        </Box>
    );
};

import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/chakra-compat';
import { Plus, Minus, Sparkles, User, Users, UserPlus } from 'lucide-react';
import { COURT_COLORS } from '@/components/session/CourtSettings';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Select } from '@/components/ui/Select';
import { VenueService } from '@/lib/api/venue.service';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import TopBar from '@/components/ui/TopBar';
import CoverPhotoUpload from '@/components/session/CoverPhotoUpload';
import LevelRequirementsCard from '@/components/session/LevelRequirementsCard';

function formatDateTimeLocal(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Zod schema for court validation
const courtSchema = z.object({
    courtNumber: z.number().min(1, 'Court number must be at least 1'),
    courtName: z.string().optional(),
    direction: z.nativeEnum(CourtDirection),
});

// Main session form schema
const sessionFormSchema = z
    .object({
        // Required fields
        name: z.string().min(1, 'Session name is required'),
        selectedVenueId: z.string().min(1, 'Location is required'),
        hostName: z.string().min(1, 'Host name is required'),
        hostPhone: z.string().min(1, 'Host phone is required'),
        startTime: z.string().min(1, 'Start time is required'),
        endTime: z.string().min(1, 'End time is required'),
        courts: z
            .array(courtSchema)
            .min(1, 'At least one court is required')
            .refine(
                (courts) =>
                    new Set(courts.map((c) => c.courtNumber)).size === courts.length,
                { message: 'Court numbers must be unique' }
            ),
        courtColor: z.string(),
        maxPlayersPerCourt: z.number().min(2).max(12),

        // Optional fields
        description: z.string().optional(),
        requirePlayerInfo: z.boolean(),
        allowGuestJoin: z.boolean(),
        allowNewPlayers: z.boolean(),
        allLevelsSelected: z.boolean(),
        requiredLevels: z.array(z.number()).optional(),
        shuttlecock: z.string().optional(),
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
        message: 'End time must be after start time',
        path: ['endTime'],
    });

type SessionFormData = z.infer<typeof sessionFormSchema>;

interface SessionFormProps {
    mode: 'create' | 'edit';
    sessionId?: string;
    initialData?: ISession;
    backHref?: string;
    onSuccess: (session: ISession) => void;
    onCancel?: () => void;
    showTopBar?: boolean;
    title?: string;
    submitButtonText?: string;
}

export default function SessionForm({
    mode,
    sessionId,
    initialData,
    backHref,
    onSuccess,
    onCancel,
    showTopBar = true,
    title,
    submitButtonText,
}: SessionFormProps) {
    const searchParams = useSearchParams();
    const t = useTranslations('session');
    const tc = useTranslations('common');
    const { user } = useAuthStore();
    const isEditMode = mode === 'edit';

    // Computed checks
    const hasPlayers = isEditMode && initialData && (
        (initialData.players?.length || 0) > 0 ||
        (initialData.pendingPlayers?.length || 0) > 0
    );

    const isSessionActive = isEditMode && initialData?.status === SessionStatus.IN_PROGRESS;

    const canEditCourts = !isEditMode || !hasPlayers;
    const canEditTime = !isEditMode || !isSessionActive;

    // Calculate default times (for create mode)
    const now = useMemo(() => new Date(), []);
    const twoHoursLater = useMemo(
        () => new Date(now.getTime() + 2 * 60 * 60 * 1000),
        [now]
    );

    // Default values
    const defaultValues: SessionFormData = useMemo(() => {
        if (isEditMode && initialData) {
            return {
                name: initialData.name,
                description: initialData.description || '',
                selectedVenueId: initialData.venue?.id || '',
                hostName: initialData.hostName || initialData.host?.name || '',
                hostPhone: initialData.hostPhone || '',
                startTime: initialData.startTime ? formatDateTimeLocal(new Date(initialData.startTime)) : '',
                endTime: initialData.endTime ? formatDateTimeLocal(new Date(initialData.endTime)) : '',
                courts: initialData.courts?.map(c => ({
                    courtNumber: c.courtNumber,
                    courtName: c.courtName || '',
                    direction: c.direction
                })) || [],
                courtColor: initialData.courtColor || COURT_COLORS[0].value,
                maxPlayersPerCourt: initialData.maxPlayersPerCourt,
                requirePlayerInfo: initialData.requirePlayerInfo,
                allowGuestJoin: initialData.allowGuestJoin ?? true,
                allowNewPlayers: initialData.allowNewPlayers ?? true,
                allLevelsSelected: !initialData.requiredLevels || initialData.requiredLevels.length === 0,
                requiredLevels: initialData.requiredLevels || [],
                shuttlecock: initialData.shuttlecock || '',
            };
        }

        return {
            name: '',
            description: '',
            selectedVenueId: '',
            hostName: user?.name || '',
            hostPhone: '',
            startTime: formatDateTimeLocal(now),
            endTime: formatDateTimeLocal(twoHoursLater),
            courts: [
                {
                    courtNumber: 1,
                    courtName: '',
                    direction: CourtDirection.HORIZONTAL,
                },
            ],
            courtColor: COURT_COLORS[0].value,
            maxPlayersPerCourt: 8,
            requirePlayerInfo: false,
            allowGuestJoin: true,
            allowNewPlayers: true,
            allLevelsSelected: true,
            requiredLevels: [],
            shuttlecock: '',
        };
    }, [isEditMode, initialData, user, now, twoHoursLater]);

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<SessionFormData>({
        resolver: zodResolver(sessionFormSchema),
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

    // State for async data and modal
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Fee configuration state
    const [feeEnabled, setFeeEnabled] = useState(
        isEditMode && initialData?.feeConfig ? true : false
    );
    const [feeType, setFeeType] = useState<FeeType>(
        initialData?.feeConfig?.feeType || FeeType.FIXED
    );
    const [maleFee, setMaleFee] = useState<number | undefined>(
        initialData?.feeConfig?.maleFee
    );
    const [femaleFee, setFemaleFee] = useState<number | undefined>(
        initialData?.feeConfig?.femaleFee
    );
    const [feeNotes, setFeeNotes] = useState(
        initialData?.feeConfig?.notes || ''
    );

    // Cover photo state
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | undefined>(
        initialData?.coverPhoto
    );

    // Computed session duration
    const sessionDuration = useMemo(() => {
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const durationMinutes = Math.round(
                (end.getTime() - start.getTime()) / (60 * 1000)
            );
            return durationMinutes > 0 ? durationMinutes : 120;
        } catch {
            return 120;
        }
    }, [startTime, endTime]);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const venueData = await VenueService.getAllVenues();
                setVenues(venueData);
            } catch (error) {
                console.error('Error fetching venues:', error);
            }
        };
        fetchVenues();

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
    const handleAddCourt = () => {
        const currentCourts = watch('courts');
        const newCourtNumber =
            Math.max(...currentCourts.map((c) => c.courtNumber), 0) + 1;
        append({
            courtNumber: newCourtNumber,
            courtName: '',
            direction: CourtDirection.HORIZONTAL,
        });
    };

    const handleRemoveCourt = (index: number) => {
        if (fields.length > 1) {
            remove(index);
            // Re-index court numbers after removal
            setTimeout(() => {
                const currentCourts = watch('courts');
                currentCourts.forEach((_, idx) => {
                    setValue(`courts.${idx}.courtNumber`, idx + 1);
                });
            }, 0);
        }
    };

    // AI Success handler using setValue
    const handleAISuccess = useCallback((inputData: ExtractedSessionData | any) => {
        const data =
            inputData && inputData.success && inputData.data
                ? inputData.data
                : inputData;

        console.log('Processed AI Data:', data);

        if (data.name) setValue('name', data.name);
        if (data.description) setValue('description', data.description);
        if (data.hostName) setValue('hostName', data.hostName);
        if (data.hostPhone) setValue('hostPhone', data.hostPhone);
        if (data.maxPlayersPerCourt)
            setValue('maxPlayersPerCourt', data.maxPlayersPerCourt);
        if (data.shuttlecock) setValue('shuttlecock', data.shuttlecock);

        if (data.startTime) {
            try {
                const startDate = new Date(data.startTime);
                if (!isNaN(startDate.getTime())) {
                    setValue('startTime', formatDateTimeLocal(startDate));
                }
            } catch (e) {
                console.error('Invalid start time from AI:', e);
            }
        }

        if (data.endTime) {
            try {
                const endDate = new Date(data.endTime);
                if (!isNaN(endDate.getTime())) {
                    setValue('endTime', formatDateTimeLocal(endDate));
                }
            } catch (e) {
                console.error('Invalid end time from AI:', e);
            }
        }

        if (data.requiredLevels && data.requiredLevels.length > 0) {
            setValue('allLevelsSelected', false);
            setValue(
                'requiredLevels',
                Array.from(new Set(data.requiredLevels as number[]))
            );
        }

        if (data.numberOfCourts && data.numberOfCourts > 1) {
            const newCourts = Array.from(
                { length: data.numberOfCourts },
                (_, i) => ({
                    courtNumber: i + 1,
                    courtName: '',
                    direction: CourtDirection.HORIZONTAL,
                })
            );
            setValue('courts', newCourts);
        }

        // Venue matching
        if (
            data.venue &&
            (data.venue.name || data.venue.address) &&
            venues.length > 0
        ) {
            const venueName = data.venue.name?.toLowerCase() || '';
            const venueAddress = data.venue.address?.toLowerCase() || '';

            const matchedVenue = venues.find((v) => {
                const vName = v.name.toLowerCase();
                const vAddress = v.address.toLowerCase();
                if (
                    venueName &&
                    (vName.includes(venueName) || venueName.includes(vName))
                )
                    return true;
                if (
                    venueAddress &&
                    (vAddress.includes(venueAddress) || venueAddress.includes(vAddress))
                )
                    return true;
                return false;
            });

            if (matchedVenue) {
                setValue('selectedVenueId', matchedVenue.id);
            } else {
                console.log('No matching venue found for:', data.venue);
            }
        }
    }, [setValue, venues]);

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
            const selectedVenue = venues.find((v) => v.id === data.selectedVenueId);
            const venueData = selectedVenue
                ? {
                    placeId: selectedVenue.placeId,
                    name: selectedVenue.name,
                    address: selectedVenue.address,
                    lat: selectedVenue.lat,
                    lng: selectedVenue.lng,
                    district: selectedVenue.district,
                    city: selectedVenue.city,
                }
                : undefined;

            let session: ISession;

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
                    description: data.description?.trim() || "",
                    hostName: data.hostName.trim(),
                    hostPhone: data.hostPhone.trim(),
                    maxPlayersPerCourt: data.maxPlayersPerCourt,
                    requirePlayerInfo: data.requirePlayerInfo,
                    allowGuestJoin: data.allowGuestJoin,
                    allowNewPlayers: data.allowNewPlayers,
                    requiredLevels: data.allLevelsSelected
                        ? undefined
                        : data.requiredLevels && data.requiredLevels.length > 0
                            ? data.requiredLevels
                            : undefined,
                    courtColor: data.courtColor,
                    shuttlecock: data.shuttlecock?.trim() || "",
                    venue: venueData,
                    feeConfig: feeConfigData,

                    // Only update courts if allowed
                    ...(canEditCourts && {
                        numberOfCourts: data.courts.length,
                        courts: data.courts.map((court) => ({
                            courtNumber: court.courtNumber,
                            courtName: court.courtName || undefined,
                            direction: CourtDirection.HORIZONTAL,
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
                // Create logic
                session = await SessionService.createSession({
                    name: data.name,
                    description: data.description?.trim() || "",
                    hostName: data.hostName.trim(),
                    hostPhone: data.hostPhone.trim(),
                    numberOfCourts: data.courts.length,
                    sessionDuration,
                    maxPlayersPerCourt: data.maxPlayersPerCourt,
                    requirePlayerInfo: data.requirePlayerInfo,
                    allowGuestJoin: data.allowGuestJoin,
                    allowNewPlayers: data.allowNewPlayers,
                    requiredLevels: data.allLevelsSelected
                        ? undefined
                        : data.requiredLevels && data.requiredLevels.length > 0
                            ? data.requiredLevels
                            : undefined,
                    startTime: new Date(data.startTime),
                    endTime: new Date(data.endTime),
                    courtColor: data.courtColor,
                    shuttlecock: data.shuttlecock?.trim() || "",
                    venue: venueData,
                    courts: data.courts.map((court) => ({
                        courtNumber: court.courtNumber,
                        courtName: court.courtName || undefined,
                        direction: CourtDirection.HORIZONTAL,
                    })),
                    feeConfig: feeConfigData,
                });
            }

            // Handle default cover photo upload for new session
            if (coverPhotoFile) {
                try {
                    const updatedSession = await SessionService.uploadCoverPhoto(session!.id, coverPhotoFile);
                    session = updatedSession;
                } catch (photoError) {
                    console.error('Failed to upload cover photo for new session:', photoError);
                    toaster.error({
                        title: t('sessionCreatedButPhotoFailed') || 'Session created but cover photo upload failed'
                    });
                }
            }

            onSuccess(session!);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : t('validation.unknownError');
            toaster.error({ title: errorMessage });
        }
    };

    return (
        <Box minH={isEditMode ? undefined : "100vh"} bg={isEditMode ? "transparent" : "gray.50"}>
            {showTopBar && (
                <TopBar
                    title={title || (isEditMode ? t('editSession') : t('createNewSession'))}
                    showBackButton={!!backHref}
                    backHref={backHref}
                />
            )}

            {!isEditMode && (
                <>
                    <AISessionModal
                        isOpen={isAIModalOpen}
                        onClose={() => setIsAIModalOpen(false)}
                        onSuccess={handleAISuccess}
                    />

                    <Box position="fixed" bottom="24px" right="24px" zIndex={1000}>
                        <Button
                            colorPalette="purple"
                            onClick={() => setIsAIModalOpen(true)}
                            boxShadow="lg"
                            _hover={{
                                transform: 'scale(1.05)',
                                boxShadow: 'xl',
                            }}
                            transition="all 0.2s"
                        >
                            <Sparkles size={20} style={{ marginRight: '8px' }} />
                            {t('createByAI')}
                        </Button>
                    </Box>
                </>
            )}

            <Container maxW="4xl" pt={showTopBar ? "80px" : "0"} pb={8}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack gap={6}>

                        {/* Warning messages */}
                        {/* {isEditMode && !canEditCourts && (
                            <Alert.Root status="warning">
                                <Alert.Indicator />
                                <Alert.Title>{t('validation.cannotEditCourtsWithPlayers')}</Alert.Title>
                            </Alert.Root>
                        )} */}

                        {isEditMode && !canEditTime && (
                            <Alert.Root status="warning">
                                <Alert.Indicator />
                                <Alert.Title>{t('validation.cannotEditTimeWhenActive')}</Alert.Title>
                            </Alert.Root>
                        )}

                        {/* Basic Info Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Heading size="md" mb={4}>
                                {t('basicInfo')}
                            </Heading>
                            <Stack gap={4}>
                                {/* Session Name */}
                                <Field.Root invalid={!!errors.name}>
                                    <Field.Label>
                                        {t('name')} <Text as="span" color="red.500">*</Text>
                                    </Field.Label>
                                    <Input
                                        {...register('name')}
                                        placeholder={t('sessionNamePlaceholder')}
                                    />
                                    <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                                </Field.Root>

                                {/* Description */}
                                <Field.Root invalid={!!errors.description}>
                                    <Field.Label>
                                        {t('description')}
                                    </Field.Label>
                                    <Textarea
                                        {...register('description')}
                                        placeholder={t('descriptionPlaceholder')}
                                        rows={3}
                                    />
                                    <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
                                </Field.Root>



                                {/* Cover Photo */}
                                <Box>
                                    <CoverPhotoUpload
                                        currentPhotoUrl={coverPhotoUrl}
                                        onPhotoSelect={async (file) => {
                                            if (isEditMode && sessionId) {
                                                // Edit mode: Upload immediately
                                                setCoverPhotoFile(file);
                                                setIsUploadingCover(true);
                                                try {
                                                    const updatedSession = await SessionService.uploadCoverPhoto(sessionId, file);
                                                    setCoverPhotoUrl(updatedSession.coverPhoto);
                                                    toaster.success({ title: t('coverPhotoUploaded') || 'Cover photo uploaded successfully' });
                                                } catch (error) {
                                                    toaster.error({ title: t('coverPhotoUploadFailed') || 'Failed to upload cover photo' });
                                                } finally {
                                                    setIsUploadingCover(false);
                                                    setCoverPhotoFile(null);
                                                }
                                            } else {
                                                // Create mode: Store locally
                                                setCoverPhotoFile(file);
                                                // Create a local preview URL
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setCoverPhotoUrl(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        onPhotoRemove={async () => {
                                            if (isEditMode && sessionId) {
                                                // Edit mode: Delete immediately
                                                setIsUploadingCover(true);
                                                try {
                                                    await SessionService.deleteCoverPhoto(sessionId);
                                                    setCoverPhotoUrl(undefined);
                                                    toaster.success({ title: t('coverPhotoRemoved') || 'Cover photo removed successfully' });
                                                } catch (error) {
                                                    toaster.error({ title: t('coverPhotoRemoveFailed') || 'Failed to remove cover photo' });
                                                } finally {
                                                    setIsUploadingCover(false);
                                                }
                                            } else {
                                                // Create mode: Clear local state
                                                setCoverPhotoFile(null);
                                                setCoverPhotoUrl(undefined);
                                            }
                                        }}
                                        isUploading={isUploadingCover}
                                    />
                                </Box>

                                {/* Location */}
                                <Field.Root invalid={!!errors.selectedVenueId}>
                                    <Field.Label>
                                        {t('location')} <Text as="span" color="red.500">*</Text>
                                    </Field.Label>
                                    <Controller
                                        control={control}
                                        name="selectedVenueId"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                    field.onChange(e.target.value)
                                                }
                                            >
                                                <option value="">
                                                    {t('generalSettings.selectVenue')}
                                                </option>
                                                {venues.map((v) => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} - {v.address}
                                                    </option>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                    <Field.ErrorText>
                                        {errors.selectedVenueId?.message}
                                    </Field.ErrorText>
                                </Field.Root>
                            </Stack>
                        </Box>

                        {/* Host Info Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Heading size="md" mb={4}>
                                {t('hostInfo')}
                            </Heading>
                            <Flex gap={4}>
                                <Box flex={1}>
                                    <Field.Root invalid={!!errors.hostName}>
                                        <Field.Label>
                                            {t('hostName')} <Text as="span" color="red.500">*</Text>
                                        </Field.Label>
                                        <Input
                                            {...register('hostName')}
                                            placeholder={t('hostNamePlaceholder')}
                                        />
                                        <Field.ErrorText>{errors.hostName?.message}</Field.ErrorText>
                                    </Field.Root>
                                </Box>
                                <Box flex={1}>
                                    <Field.Root invalid={!!errors.hostPhone}>
                                        <Field.Label>
                                            {t('hostPhone')} <Text as="span" color="red.500">*</Text>
                                        </Field.Label>
                                        <Input
                                            {...register('hostPhone')}
                                            placeholder={t('hostPhonePlaceholder')}
                                            type="tel"
                                        />
                                        <Field.ErrorText>{errors.hostPhone?.message}</Field.ErrorText>
                                    </Field.Root>
                                </Box>
                            </Flex>
                        </Box>

                        {/* Time Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Heading size="md" mb={4}>
                                {t('time')}
                            </Heading>
                            <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                                <Box flex={1}>
                                    <Field.Root invalid={!!errors.startTime} disabled={!canEditTime}>
                                        <Field.Label>
                                            {t('start')} <Text as="span" color="red.500">*</Text>
                                        </Field.Label>
                                        <Input type="datetime-local" {...register('startTime')} disabled={!canEditTime} />
                                        <Field.ErrorText>{errors.startTime?.message}</Field.ErrorText>
                                    </Field.Root>
                                </Box>
                                <Box flex={1}>
                                    <Field.Root invalid={!!errors.endTime} disabled={!canEditTime}>
                                        <Field.Label>
                                            {t('end')} <Text as="span" color="red.500">*</Text>
                                        </Field.Label>
                                        <Input type="datetime-local" {...register('endTime')} disabled={!canEditTime} />
                                        <Field.ErrorText>{errors.endTime?.message}</Field.ErrorText>
                                    </Field.Root>
                                </Box>
                            </Stack>
                            <Text fontSize="sm" color="gray.500" mt={2}>
                                {t('duration')}: {Math.floor(sessionDuration / 60)}h{' '}
                                {sessionDuration % 60}m
                            </Text>
                        </Box>

                        {/* Courts Configuration Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Flex align="center" justify="space-between" mb={4}>
                                <Heading size="md">{t('courtsConfiguration')}</Heading>
                                <Button onClick={handleAddCourt} size="sm" disabled={!canEditCourts}>
                                    <Plus size={16} style={{ marginRight: '8px' }} />
                                    {t('addCourt')}
                                </Button>
                            </Flex>

                            <Stack gap={4}>
                                {fields.map((field, index) => (
                                    <Box
                                        key={field.id}
                                        p={4}
                                        border="1px"
                                        borderColor={
                                            errors.courts?.[index] ? 'red.500' : 'gray.200'
                                        }
                                        borderRadius="md"
                                        opacity={!canEditCourts ? 0.7 : 1}
                                    >
                                        <Flex justify="space-between" align="center" mb={3}>
                                            <Text fontWeight="semibold">
                                                {t('court')} {index + 1}
                                            </Text>
                                            {fields.length > 1 && canEditCourts && (
                                                <Button
                                                    onClick={() => handleRemoveCourt(index)}
                                                    size="sm"
                                                    variant="outline"
                                                    colorPalette="red"
                                                    minW="auto"
                                                    px={2}
                                                    disabled={!canEditCourts}
                                                >
                                                    <Minus size={16} />
                                                </Button>
                                            )}
                                        </Flex>
                                        <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
                                            {/* Court Number */}
                                            <Box flex={{ base: '1', md: '0 0 140px' }}>
                                                <Field.Root
                                                    invalid={!!errors.courts?.[index]?.courtNumber}
                                                    disabled={!canEditCourts}
                                                >
                                                    <Field.Label fontSize="sm">
                                                        {t('courtNumber')}{' '}
                                                        <Text as="span" color="red.500">*</Text>
                                                    </Field.Label>
                                                    <Controller
                                                        control={control}
                                                        name={`courts.${index}.courtNumber`}
                                                        render={({ field }) => (
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={field.value}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    field.onChange(parseInt(e.target.value) || 1)
                                                                }
                                                                disabled={!canEditCourts}
                                                            />
                                                        )}
                                                    />
                                                    <Field.ErrorText>
                                                        {errors.courts?.[index]?.courtNumber?.message}
                                                    </Field.ErrorText>
                                                </Field.Root>
                                            </Box>

                                            {/* Court Name */}
                                            <Box flex={{ base: '1', md: '1' }}>
                                                <Field.Root
                                                    invalid={!!errors.courts?.[index]?.courtName}
                                                    disabled={!canEditCourts}
                                                >
                                                    <Field.Label fontSize="sm">
                                                        {t('courtName')}
                                                    </Field.Label>
                                                    <Input
                                                        {...register(`courts.${index}.courtName`)}
                                                        placeholder={t('courtNamePlaceholder')}
                                                        disabled={!canEditCourts}
                                                    />
                                                </Field.Root>
                                            </Box>

                                            {/* Court Direction - Hidden as per request */}
                                            <Box flex={{ base: '1', md: '0 0 180px' }} display="none">
                                                <Field.Root
                                                    invalid={!!errors.courts?.[index]?.direction}
                                                    disabled={!canEditCourts}
                                                >
                                                    <Field.Label fontSize="sm">
                                                        {t('courtDirection')}{' '}
                                                        <Text as="span" color="red.500">*</Text>
                                                    </Field.Label>
                                                    <Controller
                                                        control={control}
                                                        name={`courts.${index}.direction`}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={field.value}
                                                                onChange={(
                                                                    e: React.ChangeEvent<HTMLSelectElement>
                                                                ) => field.onChange(e.target.value)}
                                                                disabled={!canEditCourts}
                                                            >
                                                                <option value={CourtDirection.HORIZONTAL}>
                                                                    {t('horizontal')}
                                                                </option>
                                                                <option value={CourtDirection.VERTICAL}>
                                                                    {t('vertical')}
                                                                </option>
                                                            </Select>
                                                        )}
                                                    />
                                                </Field.Root>
                                            </Box>
                                        </Flex>
                                    </Box>
                                ))}

                                {/* Array-level error for unique court numbers */}
                                {errors.courts?.root && (
                                    <Text color="red.500" fontSize="sm">
                                        {errors.courts.root.message}
                                    </Text>
                                )}
                            </Stack>
                        </Box>

                        {/* Court Appearance Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Heading size="md" mb={4}>
                                {t('courtAppearance')}
                            </Heading>
                            <Text fontSize="sm" color="gray.600" mb={4}>
                                {t('selectCourtColor')}
                            </Text>

                            <Controller
                                control={control}
                                name="courtColor"
                                render={({ field }) => (
                                    <Wrap gap={4}>
                                        {COURT_COLORS.map((color) => {
                                            const isSelected = field.value === color.value;
                                            return (
                                                <WrapItem key={color.value}>
                                                    <VStack>
                                                        <Box
                                                            w="60px"
                                                            h="60px"
                                                            borderRadius="md"
                                                            bg={color.value}
                                                            cursor="pointer"
                                                            position="relative"
                                                            onClick={() => field.onChange(color.value)}
                                                            border="3px solid"
                                                            borderColor={
                                                                isSelected ? 'blue.500' : 'transparent'
                                                            }
                                                            boxShadow={isSelected ? 'lg' : 'sm'}
                                                            transition="all 0.2s"
                                                            _hover={{
                                                                transform: 'scale(1.05)',
                                                                boxShadow: 'md',
                                                            }}
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            <Box
                                                                w="40px"
                                                                h="30px"
                                                                border="1px solid white"
                                                                position="absolute"
                                                                opacity={0.7}
                                                            />
                                                        </Box>
                                                        <Text
                                                            fontSize="xs"
                                                            fontWeight={isSelected ? 'bold' : 'normal'}
                                                        >
                                                            {color.name}
                                                        </Text>
                                                    </VStack>
                                                </WrapItem>
                                            );
                                        })}
                                    </Wrap>
                                )}
                            />
                        </Box>

                        {/* Max Players & Shuttlecock Section */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                                <Field.Root invalid={!!errors.maxPlayersPerCourt}>
                                    <Field.Label>
                                        <Heading size="md">{t('maxPlayersPerCourt')}</Heading>
                                    </Field.Label>
                                    <Controller
                                        control={control}
                                        name="maxPlayersPerCourt"
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                min={2}
                                                max={12}
                                                value={field.value}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    field.onChange(parseInt(e.target.value) || 8)
                                                }
                                            />
                                        )}
                                    />
                                    <Field.ErrorText>
                                        {errors.maxPlayersPerCourt?.message}
                                    </Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.shuttlecock}>
                                    <Field.Label>
                                        <Heading size="md">{t('shuttlecock')}</Heading>
                                    </Field.Label>
                                    <Input
                                        {...register('shuttlecock')}
                                        placeholder={t('shuttlecock')}
                                    />
                                    <Field.ErrorText>{errors.shuttlecock?.message}</Field.ErrorText>
                                </Field.Root>
                            </Grid>
                        </Box>

                        {/* Level Requirements Section */}
                        {user?.role !== UserRole.PLAYER && (
                            <LevelRequirementsCard
                                control={control}
                                setValue={setValue}
                            />
                        )}

                        {/* Session Settings Section - Temporarily hidden */}
                        {false && user?.role !== UserRole.PLAYER && (
                            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                                <Heading size="md" mb={4}>
                                    {t('generalSettings.sessionSettings')}
                                </Heading>

                                <Stack gap={4}>
                                    {/* Require Player Info */}
                                    <Controller
                                        control={control}
                                        name="requirePlayerInfo"
                                        render={({ field }) => (
                                            <Box p={4} bg="gray.50" borderRadius="md">
                                                <Flex align="center" justify="space-between">
                                                    <Box>
                                                        <HStack mb={1}>
                                                            <User size={18} />
                                                            <Text fontWeight="medium">
                                                                {t('generalSettings.requirePlayerInfo')}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {t('generalSettings.requirePlayerInfoDesc')}
                                                        </Text>
                                                    </Box>
                                                    <CustomCheckbox
                                                        isChecked={field.value}
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                    />
                                                </Flex>
                                            </Box>
                                        )}
                                    />

                                    {/* Allow Guest Join */}
                                    <Controller
                                        control={control}
                                        name="allowGuestJoin"
                                        render={({ field }) => (
                                            <Box p={4} bg="gray.50" borderRadius="md">
                                                <Flex align="center" justify="space-between">
                                                    <Box>
                                                        <HStack mb={1}>
                                                            <Users size={18} />
                                                            <Text fontWeight="medium">
                                                                {t('generalSettings.allowGuestJoin')}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {t('generalSettings.allowGuestJoinDesc')}
                                                        </Text>
                                                    </Box>
                                                    <CustomCheckbox
                                                        isChecked={field.value}
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                    />
                                                </Flex>
                                            </Box>
                                        )}
                                    />

                                    {/* Allow New Players */}
                                    <Controller
                                        control={control}
                                        name="allowNewPlayers"
                                        render={({ field }) => (
                                            <Box p={4} bg="gray.50" borderRadius="md">
                                                <Flex align="center" justify="space-between">
                                                    <Box>
                                                        <HStack mb={1}>
                                                            <UserPlus size={18} />
                                                            <Text fontWeight="medium">
                                                                {t('generalSettings.allowNewPlayers')}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {t('generalSettings.allowNewPlayersDesc')}
                                                        </Text>
                                                    </Box>
                                                    <CustomCheckbox
                                                        isChecked={field.value}
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                    />
                                                </Flex>
                                            </Box>
                                        )}
                                    />
                                </Stack>
                            </Box>
                        )}

                        {/* Fee Configuration Section */}
                        {user?.role !== UserRole.PLAYER && (
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
                        )}

                        {/* Buttons */}
                        <Flex gap={3} mt={4}>
                            {onCancel && (
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    flex={1}
                                >
                                    {tc('cancel')}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                colorPalette="blue"
                                loading={isSubmitting}
                                loadingText={isEditMode ? t('saving') : t('creating')}
                                flex={onCancel ? 1 : undefined}
                                w={onCancel ? undefined : "full"}
                            >
                                {submitButtonText || (isEditMode ? t('saveChanges') : t('createSession'))}
                            </Button>
                        </Flex>
                    </Stack>
                </form>
            </Container>
        </Box>
    );
}
