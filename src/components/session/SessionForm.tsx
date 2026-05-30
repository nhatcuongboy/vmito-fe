'use client';

import { SessionService } from '@/lib/api/session.service';
import {
  CourtDirection,
  ISession,
  SessionStatus,
  Venue,
  UserRole,
  FeeType,
} from '@/lib/api/types';
import SessionFeeConfigForm from '@/components/fee/SessionFeeConfigForm';
import {
  Box,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
  Collapsible,
} from '@chakra-ui/react';
import { formatVenueName } from '@/utils';
import { Input } from '@/components/ui/Input';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { Check } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CustomCheckbox = ({
  isChecked,
  onChange,
  size = 'md',
}: {
  isChecked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md';
}) => {
  const boxSize = size === 'sm' ? '18px' : '24px';
  const iconSize = size === 'sm' ? 11 : 16;

  return (
    <Box
      as="label"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      onClick={(e) => e.stopPropagation()}
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
        borderColor={isChecked ? 'brand.500' : 'gray.300'}
        bg={isChecked ? 'brand.500' : 'white'}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.2s"
        _hover={{ borderColor: 'brand.600' }}
      >
        {isChecked && <Check size={iconSize} color="white" strokeWidth={3} />}
      </Box>
    </Box>
  );
};

import { useAuthStore } from '@/stores/useAuthStore';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { Button } from '@/components/ui/chakra-compat';
import {
  Plus,
  Trash2,
  CalendarPlus,
  Sparkles,
  User,
  Users,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { COURT_COLORS } from '@/components/session/CourtSettings';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { toaster } from '@/components/ui/toaster';
import { VSwitch } from '@/components/ui/VSwitch';
import { VModal } from '@/components/ui/VModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VenueService } from '@/lib/api/venue.service';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import LevelRequirementsCard from '@/components/session/LevelRequirementsCard';
import { BulkSessionDateSelector } from '@/components/session/BulkSessionDateSelector';
import {
  BulkCreationMode,
  SpecificDatesConfig,
  RecurringWeekdaysConfig,
} from '@/lib/api/types';

function formatDateTimeLocal(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateOnly(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeOnly(date: Date): string {
  if (!date) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIDNIGHT_TIME = '00:00';

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function buildSingleDayDateTime(date: string, time: string): string {
  if (!date || !time) return '';

  if (!TIME_INPUT_PATTERN.test(time)) return '';

  return `${date}T${time}`;
}

function buildSingleDayEndDateTime(date: string, time: string): string {
  if (!date || !time) return '';

  if (time === MIDNIGHT_TIME) {
    return `${formatDateOnly(addDays(new Date(`${date}T00:00`), 1))}T00:00`;
  }

  return buildSingleDayDateTime(date, time);
}

function isEndOfSelectedDay(startDate: Date, endDate: Date): boolean {
  if (
    endDate.getHours() !== 0 ||
    endDate.getMinutes() !== 0 ||
    endDate.getSeconds() !== 0 ||
    endDate.getMilliseconds() !== 0
  ) {
    return false;
  }

  return formatDateOnly(endDate) === formatDateOnly(addDays(startDate, 1));
}

function extractCourtNumber(courtName?: string): number | null {
  if (!courtName) return null;
  const match = courtName.match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeAiCourtNames(courtNames: string[] = []) {
  return courtNames.flatMap((courtName) => {
    const rawCourtName = String(courtName ?? '').trim();
    if (!rawCourtName) return [];

    const numbers = [...rawCourtName.matchAll(/\d+/g)].map((match) => match[0]);

    return numbers.length > 1 ? numbers : [rawCourtName];
  });
}

function buildCourtsFromAiData(
  numberOfCourts: number,
  courtNames: string[] = []
) {
  const usedCourtNumbers = new Set<number>();
  const normalizedCourtNames = normalizeAiCourtNames(courtNames);

  return Array.from({ length: numberOfCourts }, (_, i) => {
    const rawCourtName = String(normalizedCourtNames[i] ?? '').trim();
    const parsedCourtNumber = extractCourtNumber(rawCourtName);
    const fallbackCourtNumber = i + 1;
    const courtNumber =
      parsedCourtNumber && !usedCourtNumbers.has(parsedCourtNumber)
        ? parsedCourtNumber
        : fallbackCourtNumber;

    usedCourtNumbers.add(courtNumber);

    return {
      courtNumber,
      courtName: parsedCourtNumber ? '' : rawCourtName,
      direction: CourtDirection.HORIZONTAL,
    };
  });
}

// Zod schema for court validation
type SessionFormData = z.infer<ReturnType<typeof createSessionFormSchema>>;

function createCourtSchema(
  t: (key: string, values?: Record<string, unknown>) => string
) {
  return z.object({
    courtNumber: z.number().min(1, t('validation.courtNumberMin')),
    courtName: z.string().optional(),
    direction: z.nativeEnum(CourtDirection),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createSessionFormSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: any) => string,
  isEditMode: boolean = false
) {
  const courtSchema = createCourtSchema(t);
  return z
    .object({
      // Required fields
      name: z.string().min(1, t('validation.sessionNameRequired')),
      selectedVenueId: z.string().min(1, t('validation.locationRequired')),
      hostName: z.string().min(1, t('validation.hostNameRequired')),
      hostPhone: z.string().optional(),
      startTime: z.string().min(1, t('validation.startTimeRequired')),
      endTime: z.string().min(1, t('validation.endTimeRequired')),
      courts: z
        .array(courtSchema)
        .min(1, t('validation.atLeastOneCourt'))
        .refine(
          (courts) =>
            new Set(courts.map((c) => c.courtNumber)).size === courts.length,
          { message: t('validation.courtNumberUnique') }
        ),
      courtColor: z.string(),
      maxPlayersPerCourt: z.preprocess(
        (val) => {
          // Convert empty string to undefined for validation
          if (val === '' || val === null || val === undefined) return undefined;
          return val;
        },
        z
          .number()
          .min(2, t('validation.maxPlayersPerCourtMin', { min: 2 }))
          .max(12, t('validation.maxPlayersPerCourtMax', { max: 12 }))
      ),

      // Optional fields
      description: z.string().optional(),
      referenceVideoUrl: z
        .string()
        .trim()
        .refine(
          (value) => {
            if (!value) return true;
            try {
              const url = new URL(value);
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              return false;
            }
          },
          { message: t('validation.referenceVideoUrlInvalid') }
        )
        .optional(),
      requirePlayerInfo: z.boolean(),
      allowGuestJoin: z.boolean(),
      allowNewPlayers: z.boolean(),
      allowZaloContact: z.boolean(),
      allLevelsSelected: z.boolean(),
      requiredLevels: z.array(z.coerce.number()).optional(),
      shuttlecock: z.string().optional(),
      defaultMatchType: z.enum(['SINGLES', 'DOUBLES']),
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
      message: t('validation.endTimeMustBeAfterStartTime'),
      path: ['endTime'],
    })
    .refine(
      (data) => {
        if (isEditMode) return true;
        const now = new Date();
        // Allow up to a 1-minute buffer in the past to account for user input time
        return new Date(data.startTime) >= new Date(now.getTime() - 60000);
      },
      {
        message:
          t('validation.startTimeMustBeInFuture') ||
          'Thời gian bắt đầu không được trong quá khứ',
        path: ['startTime'],
      }
    );
}

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
  const { user } = useAuthStore();
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
  const defaultValues: SessionFormData = useMemo(() => {
    if (isEditMode && initialData) {
      return {
        name: initialData.name,
        description: initialData.description || '',
        referenceVideoUrl: initialData.referenceVideoUrl || '',
        selectedVenueId: initialData.venue?.id || '',
        hostName: initialData.hostName || initialData.host?.name || '',
        hostPhone: initialData.hostPhone || '',
        startTime: initialData.startTime
          ? formatDateTimeLocal(new Date(initialData.startTime))
          : '',
        endTime: initialData.endTime
          ? formatDateTimeLocal(new Date(initialData.endTime))
          : '',
        courts:
          initialData.courts?.map((c) => ({
            courtNumber: c.courtNumber,
            courtName: c.courtName || '',
            direction: c.direction,
          })) || [],
        courtColor: initialData.courtColor || COURT_COLORS[0].value,
        maxPlayersPerCourt: initialData.maxPlayersPerCourt,
        requirePlayerInfo: initialData.requirePlayerInfo,
        allowGuestJoin: initialData.allowGuestJoin ?? true,
        allowNewPlayers: initialData.allowNewPlayers ?? true,
        allowZaloContact: initialData.allowZaloContact ?? false,
        allLevelsSelected:
          !initialData.requiredLevels ||
          initialData.requiredLevels?.length === 0,
        requiredLevels: (initialData.requiredLevels || []).map(Number),
        shuttlecock: initialData.shuttlecock || '',
        defaultMatchType: initialData.defaultMatchType || 'DOUBLES',
      };
    }

    return {
      name: '',
      description: '',
      referenceVideoUrl: '',
      selectedVenueId: '',
      hostName: user?.name || '',
      hostPhone: '',
      startTime: '',
      endTime: '',
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
      allowZaloContact: false,
      allLevelsSelected: true,
      requiredLevels: [],
      shuttlecock: '',
      defaultMatchType: 'DOUBLES' as const,
    };
  }, [isEditMode, initialData, user]);

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

  // State for async data and modal
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueObj, setSelectedVenueObj] = useState<Venue | null>(
    isEditMode && initialData?.venue ? (initialData.venue as Venue) : null
  );
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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
  const [sessionImages, setSessionImages] = useState<ISessionImage[]>(() => {
    const imgs: ISessionImage[] = [];
    // Add banner image first if it exists
    if (initialData?.coverPhoto && initialData?.coverPhotoPublicId) {
      imgs.push({
        url: initialData.coverPhoto,
        publicId: initialData.coverPhotoPublicId,
      });
    }
    // Add other images
    if (initialData?.images && initialData?.imagePublicIds) {
      initialData.images.forEach((url, i) => {
        const publicId = initialData.imagePublicIds?.[i];
        if (publicId && !imgs.some((img) => img.publicId === publicId)) {
          imgs.push({ url, publicId });
        }
      });
    }
    return imgs;
  });
  const [bannerIndex, setBannerIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Single-day time picker state
  const [isMultiDay, setIsMultiDay] = useState(() => {
    if (isEditMode && initialData?.startTime && initialData?.endTime) {
      const startDate = new Date(initialData.startTime);
      const endDate = new Date(initialData.endTime);
      if (isEndOfSelectedDay(startDate, endDate)) return false;

      const startDay = startDate.toDateString();
      const endDay = endDate.toDateString();
      return startDay !== endDay;
    }
    return false;
  });
  const [sessionDate, setSessionDate] = useState(() => {
    if (isEditMode && initialData?.startTime)
      return formatDateOnly(new Date(initialData.startTime));
    return formatDateOnly(new Date());
  });
  const [startHour, setStartHour] = useState(() => {
    if (isEditMode && initialData?.startTime)
      return formatTimeOnly(new Date(initialData.startTime));
    return '';
  });
  const [endHour, setEndHour] = useState(() => {
    if (isEditMode && initialData?.endTime) {
      return formatTimeOnly(new Date(initialData.endTime));
    }
    return '';
  });

  const handleDateChange = (date: string) => {
    setSessionDate(date);
    if (startHour)
      setValue('startTime', buildSingleDayDateTime(date, startHour));
    if (endHour) setValue('endTime', buildSingleDayEndDateTime(date, endHour));
  };
  const handleStartHourChange = (time: string) => {
    setStartHour(time);
    setValue('startTime', buildSingleDayDateTime(sessionDate, time));
  };
  const handleEndHourChange = (time: string) => {
    setEndHour(time);
    setValue('endTime', buildSingleDayEndDateTime(sessionDate, time));
  };

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

  // Venue options: always include the currently selected venue so it shows correctly
  const venueOptions = useMemo(() => {
    const opts = venues.map((v) => ({
      value: v.id,
      label: formatVenueName(v.name, tVenue('nameFormat', { name: '{name}' })),
      sublabel: v.address,
    }));
    if (selectedVenueObj && !venues.find((v) => v.id === selectedVenueObj.id)) {
      opts.unshift({
        value: selectedVenueObj.id,
        label: formatVenueName(
          selectedVenueObj.name,
          tVenue('nameFormat', { name: '{name}' })
        ),
        sublabel: selectedVenueObj.address,
      });
    }
    return opts;
  }, [venues, selectedVenueObj, tVenue]);

  // Debounced venue search handler (server-side)
  const handleVenueSearch = useCallback((keyword: string) => {
    if (venueSearchTimerRef.current) clearTimeout(venueSearchTimerRef.current);
    venueSearchTimerRef.current = setTimeout(async () => {
      setIsVenueLoading(true);
      try {
        const result = await VenueService.searchVenues({
          keyword: keyword.trim() || undefined,
          limit: 100,
          sortBy: keyword.trim() ? 'relevance' : undefined,
        });
        setVenues(result.data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
      } finally {
        setIsVenueLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const result = await VenueService.searchVenues({ limit: 100 });
        setVenues(result.data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
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
  const shouldFocusNewCourt = useRef(false);

  const handleAddCourt = () => {
    shouldFocusNewCourt.current = true;
    append({
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
  const handleAISuccess = useCallback(
    async (
      inputData:
        | ExtractedSessionData
        | { success?: boolean; data?: ExtractedSessionData }
    ) => {
      const data: ExtractedSessionData =
        inputData &&
        'success' in inputData &&
        inputData.success &&
        inputData.data
          ? inputData.data
          : (inputData as ExtractedSessionData);

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
            if (!isMultiDay) {
              setSessionDate(formatDateOnly(startDate));
              setStartHour(formatTimeOnly(startDate));
            }
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
            if (!isMultiDay) {
              setEndHour(formatTimeOnly(endDate));
            }
          }
        } catch (e) {
          console.error('Invalid end time from AI:', e);
        }
      }

      if (data.requiredLevels && data.requiredLevels.length > 0) {
        setValue('allLevelsSelected', false);
        setValue(
          'requiredLevels',
          Array.from(
            new Set((data.requiredLevels as (number | string)[]).map(Number))
          )
        );
      }

      if (data.numberOfCourts && data.numberOfCourts > 0) {
        setValue(
          'courts',
          buildCourtsFromAiData(data.numberOfCourts, data.courtNames)
        );
      }

      if (data.feeConfig) {
        setFeeEnabled(true);
        if (data.feeConfig.feeType)
          setFeeType(data.feeConfig.feeType as FeeType);
        if (data.feeConfig.maleFee !== undefined)
          setMaleFee(data.feeConfig.maleFee ?? undefined);
        if (data.feeConfig.femaleFee !== undefined)
          setFemaleFee(data.feeConfig.femaleFee ?? undefined);
        if (data.feeConfig.notes) setFeeNotes(data.feeConfig.notes);
      }

      // Venue handling - use venueId from backend if available
      if (data.venueId) {
        // Backend already matched the venue, use it directly
        console.log('Using venue ID from backend:', data.venueId);
        setValue('selectedVenueId', data.venueId);

        // Fetch venue details to set selectedVenueObj
        const matchedVenue = venues.find((v) => v.id === data.venueId);
        if (matchedVenue) {
          setSelectedVenueObj(matchedVenue);
        } else {
          // Venue not in current list, fetch it
          try {
            const venueDetails = await VenueService.getVenue(data.venueId);
            setSelectedVenueObj(venueDetails);
          } catch (error) {
            console.error('Failed to fetch venue details:', error);
          }
        }
      } else if (
        data.venue &&
        (data.venue.name || data.venue.address) &&
        venues.length > 0
      ) {
        // Fallback: try client-side matching if backend didn't find a match
        console.log(
          'Backend did not match venue, trying client-side matching for:',
          data.venue
        );

        const venueName = data.venue.name?.toLowerCase() || '';
        const venueAddress = data.venue.address?.toLowerCase() || '';

        // Helper function to normalize text for better matching
        const normalizeText = (text: string) => {
          return text
            .toLowerCase()
            .replace(/sân\s+cầu\s+lông\s+/gi, '') // Remove "sân cầu lông" prefix
            .replace(/sân\s+/gi, '') // Remove "sân" prefix
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        };

        // Helper function to calculate match score
        const calculateMatchScore = (venue: Venue): number => {
          let score = 0;
          const normalizedVenueName = normalizeText(venue.name);
          const normalizedVenueAddress = venue.address.toLowerCase();
          const normalizedSearchName = normalizeText(venueName);
          const normalizedSearchAddress = venueAddress;

          // Exact match gets highest score
          if (normalizedVenueName === normalizedSearchName) {
            score += 100;
          }
          // Contains match
          else if (normalizedVenueName.includes(normalizedSearchName)) {
            score += 50;
          } else if (normalizedSearchName.includes(normalizedVenueName)) {
            score += 50;
          }
          // Word-by-word matching
          else {
            const searchWords = normalizedSearchName
              .split(' ')
              .filter((w: string) => w.length > 2);
            const venueWords = normalizedVenueName
              .split(' ')
              .filter((w: string) => w.length > 2);

            searchWords.forEach((searchWord: string) => {
              venueWords.forEach((venueWord: string) => {
                if (
                  venueWord.includes(searchWord) ||
                  searchWord.includes(venueWord)
                ) {
                  score += 10;
                }
              });
            });
          }

          // Address matching
          if (normalizedSearchAddress && normalizedVenueAddress) {
            if (normalizedVenueAddress.includes(normalizedSearchAddress)) {
              score += 30;
            } else if (
              normalizedSearchAddress.includes(normalizedVenueAddress)
            ) {
              score += 30;
            } else {
              // Word-by-word address matching
              const addressWords = normalizedSearchAddress
                .split(' ')
                .filter((w: string) => w.length > 2);
              addressWords.forEach((word: string) => {
                if (normalizedVenueAddress.includes(word)) {
                  score += 5;
                }
              });
            }
          }

          return score;
        };

        // Find best matching venue
        let bestMatch: Venue | null = null;
        let bestScore = 0;

        venues.forEach((v) => {
          const score = calculateMatchScore(v);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = v;
          }
        });

        // Only use match if score is above threshold
        if (bestMatch && bestScore >= 10) {
          console.log(
            'Client-side matched venue:',
            (bestMatch as Venue).name,
            'with score:',
            bestScore
          );
          setValue('selectedVenueId', (bestMatch as Venue).id);
          setSelectedVenueObj(bestMatch as Venue);
        } else {
          console.log(
            'No matching venue found for:',
            data.venue,
            'Best score was:',
            bestScore
          );
        }
      }
    },
    [
      setValue,
      venues,
      isMultiDay,
      setFeeEnabled,
      setFeeType,
      setMaleFee,
      setFemaleFee,
      setFeeNotes,
    ]
  );

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
          maxPlayersPerCourt: data.maxPlayersPerCourt,
          requirePlayerInfo: data.requirePlayerInfo,
          allowGuestJoin: data.allowGuestJoin,
          allowNewPlayers: data.allowNewPlayers,
          allowZaloContact: data.allowZaloContact,
          requiredLevels: data.allLevelsSelected
            ? undefined
            : data.requiredLevels && data.requiredLevels.length > 0
              ? data.requiredLevels
              : undefined,
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
        // Create logic - support both single and bulk creation
        const baseSessionData = {
          name: data.name,
          description: data.description?.trim() || '',
          referenceVideoUrl: data.referenceVideoUrl?.trim() || null,
          hostName: data.hostName.trim(),
          hostPhone: data.hostPhone?.trim() || '',
          numberOfCourts: data.courts.length,
          sessionDuration,
          maxPlayersPerCourt: data.maxPlayersPerCourt,
          requirePlayerInfo: data.requirePlayerInfo,
          allowGuestJoin: data.allowGuestJoin,
          allowNewPlayers: data.allowNewPlayers,
          allowZaloContact: data.allowZaloContact,
          requiredLevels: data.allLevelsSelected
            ? undefined
            : data.requiredLevels && data.requiredLevels.length > 0
              ? data.requiredLevels
              : undefined,
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
            direction: CourtDirection.HORIZONTAL,
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

  const scrollToFirstError = useCallback(
    (formErrors: Partial<Record<keyof SessionFormData, unknown>>) => {
      console.log('Scrolling to first error:', formErrors);

      const fieldOrder: (keyof SessionFormData)[] = [
        'name',
        'selectedVenueId',
        'hostName',
        'hostPhone',
        'startTime',
        'endTime',
        'courts',
      ];
      const fieldToId: Partial<Record<keyof SessionFormData, string>> = {
        name: 'field-name',
        selectedVenueId: 'field-venue',
        hostName: 'field-hostName',
        hostPhone: 'field-hostPhone',
        startTime: 'field-startTime',
        endTime: 'field-endTime',
        courts: 'field-courts',
      };

      for (const fieldName of fieldOrder) {
        if (!formErrors[fieldName]) continue;
        const id = fieldToId[fieldName];
        if (!id) continue;

        console.log(`Trying to scroll to field: ${fieldName} with ID: ${id}`);
        const el = document.getElementById(id);

        if (el) {
          console.log(`Found element for ${fieldName}, scrolling...`);

          // Scroll with offset to account for fixed headers
          const yOffset = -100; // Adjust this value based on your header height
          const y =
            el.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({ top: y, behavior: 'smooth' });

          // Focus on the input element
          setTimeout(() => {
            // For venue field (SearchableSelect), find the button or input inside
            if (fieldName === 'selectedVenueId') {
              const button = el.querySelector('button');
              const input = el.querySelector('input');
              if (button) {
                button.focus();
              } else if (input) {
                input.focus();
              }
            } else {
              // For other fields, try to find and focus the input
              const input = el.querySelector('input, textarea, select');
              if (input instanceof HTMLElement) {
                input.focus();
              }
            }
          }, 500); // Wait for smooth scroll to complete

          break;
        } else {
          console.warn(
            `Element not found for field: ${fieldName} with ID: ${id}`
          );
        }
      }
    },
    []
  );

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
            scrollToFirstError
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
            <Box
              bg={{ base: 'white', _dark: 'gray.800' }}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            >
              <Flex
                justify="space-between"
                align="center"
                mb={4}
                wrap="wrap"
                gap={2}
              >
                <Heading size="md">{t('basicInfo')}</Heading>
                {!isEditMode && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setIsAIModalOpen(true)}
                    leftIcon={<Sparkles size={14} />}
                    borderRadius="full"
                    bg={{ base: 'purple.50', _dark: 'purple.950' }}
                    borderColor={{ base: 'purple.200', _dark: 'purple.700' }}
                    color={{ base: 'purple.700', _dark: 'purple.200' }}
                    _hover={{
                      bg: { base: 'purple.100', _dark: 'purple.900' },
                      borderColor: { base: 'purple.300', _dark: 'purple.600' },
                    }}
                  >
                    {t('createByAI')}
                  </Button>
                )}
              </Flex>
              <Stack gap={4}>
                {/* Session Name */}
                <Field.Root id="field-name" invalid={!!errors.name}>
                  <Field.Label>
                    {t('name')}{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Field.Label>
                  <Input
                    {...register('name')}
                    placeholder={t('sessionNamePlaceholder')}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.name?.message}
                  </Field.ErrorText>
                </Field.Root>

                {/* Description */}
                <Field.Root invalid={!!errors.description}>
                  <Field.Label>{t('description')}</Field.Label>
                  <Textarea
                    {...register('description')}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                  />
                  <Field.ErrorText>
                    {errors.description?.message}
                  </Field.ErrorText>
                </Field.Root>

                {/* Location */}
                <Field.Root
                  id="field-venue"
                  invalid={!!errors.selectedVenueId}
                  disabled={!canEditVenue}
                >
                  <Field.Label>
                    {t('location')}{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Field.Label>
                  <Controller
                    control={control}
                    name="selectedVenueId"
                    render={({ field }) => (
                      <SearchableSelect
                        isInvalid={!!errors.selectedVenueId}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          const venue = venues.find((v) => v.id === value);
                          setSelectedVenueObj(venue ?? null);
                        }}
                        options={venueOptions}
                        placeholder={t('generalSettings.selectVenue')}
                        searchPlaceholder={t('generalSettings.searchVenue')}
                        onSearchChange={handleVenueSearch}
                        isLoading={isVenueLoading}
                        isDisabled={!canEditVenue}
                      />
                    )}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.selectedVenueId?.message}
                  </Field.ErrorText>
                </Field.Root>
              </Stack>
            </Box>

            {/* Host Info Section */}
            <Box
              bg={{ base: 'white', _dark: 'gray.800' }}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            >
              <Heading size="md" mb={4}>
                {t('hostInfo')}
              </Heading>
              <Flex gap={4}>
                <Box flex={1}>
                  <Field.Root id="field-hostName" invalid={!!errors.hostName}>
                    <Field.Label>
                      {t('hostName')}{' '}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Field.Label>
                    <Input
                      {...register('hostName')}
                      placeholder={t('hostNamePlaceholder')}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.hostName?.message}
                    </Field.ErrorText>
                  </Field.Root>
                </Box>
                <Box flex={1}>
                  <Field.Root id="field-hostPhone" invalid={!!errors.hostPhone}>
                    <Field.Label>{t('hostPhone')}</Field.Label>
                    <Input
                      {...register('hostPhone')}
                      placeholder={t('hostPhonePlaceholder')}
                      type="tel"
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.hostPhone?.message}
                    </Field.ErrorText>
                  </Field.Root>
                  {/* Allow Zalo Contact */}
                  <Controller
                    control={control}
                    name="allowZaloContact"
                    render={({ field }) => (
                      <Box
                        mt={2}
                        cursor="pointer"
                        onClick={() => field.onChange(!field.value)}
                        userSelect="none"
                        position="relative"
                        zIndex={1}
                      >
                        <HStack gap={2}>
                          <CustomCheckbox
                            size="sm"
                            isChecked={field.value}
                            onChange={(e) => {
                              e.stopPropagation();
                              field.onChange(e.target.checked);
                            }}
                          />
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            userSelect="none"
                          >
                            {t('allowZaloContact')}
                          </Text>
                        </HStack>
                      </Box>
                    )}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Time Section */}
            <Box
              bg={{ base: 'white', _dark: 'gray.800' }}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            >
              <Flex align="center" justify="space-between" mb={4}>
                <Heading size="md">{t('time')}</Heading>
                <Flex align="center" gap={2}>
                  <Text fontSize="sm" color="fg.muted">
                    {t('multiDay')}
                  </Text>
                  <VSwitch
                    checked={isMultiDay}
                    onCheckedChange={(e) => setIsMultiDay(e.checked)}
                    disabled={!canEditTime}
                    size="sm"
                    colorPalette="green"
                  />
                </Flex>
              </Flex>

              {!isMultiDay ? (
                <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                  {/* Date picker */}
                  <Box flex={1}>
                    <Field.Root disabled={!canEditTime}>
                      <Field.Label>
                        {t('date')}{' '}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Field.Label>
                      <VDateTimeInput
                        type="date"
                        value={sessionDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        disabled={!canEditTime}
                        min={
                          !isEditMode ? formatDateOnly(new Date()) : undefined
                        }
                        color="fg"
                        bg="bg"
                        _dark={{ color: 'white', bg: 'gray.700' }}
                        placeholder={t('date')}
                      />
                    </Field.Root>
                  </Box>

                  {/* Start / end time pickers */}
                  <Stack direction="row" gap={4} flex={2}>
                    <Box id="field-startTime" flex={1}>
                      <Field.Root
                        invalid={!!errors.startTime}
                        disabled={!canEditTime}
                      >
                        <Field.Label>
                          {t('start')}{' '}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Field.Label>
                        <VDateTimeInput
                          type="time"
                          value={startHour}
                          onChange={(e) =>
                            handleStartHourChange(e.target.value)
                          }
                          disabled={!canEditTime}
                          color="fg"
                          bg="bg"
                          _dark={{ color: 'white', bg: 'gray.700' }}
                          placeholder={t('start')}
                        />
                        <Field.ErrorText color="fg.error">
                          {errors.startTime?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    </Box>
                    <Box id="field-endTime" flex={1}>
                      <Field.Root
                        invalid={!!errors.endTime}
                        disabled={!canEditTime}
                      >
                        <Field.Label>
                          {t('end')}{' '}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Field.Label>
                        <VDateTimeInput
                          type="time"
                          value={endHour}
                          onChange={(e) => handleEndHourChange(e.target.value)}
                          disabled={!canEditTime}
                          color="fg"
                          bg="bg"
                          _dark={{ color: 'white', bg: 'gray.700' }}
                          placeholder={t('end')}
                        />
                        <Field.ErrorText color="fg.error">
                          {errors.endTime?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    </Box>
                  </Stack>
                </Stack>
              ) : (
                /* Multi-day: original datetime-local pickers */
                <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box id="field-startTime" flex={1}>
                    <Field.Root
                      invalid={!!errors.startTime}
                      disabled={!canEditTime}
                    >
                      <Field.Label>
                        {t('start')}{' '}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Field.Label>
                      <VDateTimeInput
                        type="datetime-local"
                        {...register('startTime')}
                        disabled={!canEditTime}
                        color="fg"
                        bg="bg"
                        _dark={{ color: 'white', bg: 'gray.700' }}
                        onInvalid={(e) => e.preventDefault()}
                        placeholder={t('start')}
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.startTime?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Box>
                  <Box id="field-endTime" flex={1}>
                    <Field.Root
                      invalid={!!errors.endTime}
                      disabled={!canEditTime}
                    >
                      <Field.Label>
                        {t('end')}{' '}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Field.Label>
                      <VDateTimeInput
                        type="datetime-local"
                        {...register('endTime')}
                        disabled={!canEditTime}
                        color="fg"
                        bg="bg"
                        _dark={{ color: 'white', bg: 'gray.700' }}
                        onInvalid={(e) => e.preventDefault()}
                        placeholder={t('end')}
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.endTime?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Box>
                </Stack>
              )}

              {startTime && endTime && (
                <Text fontSize="sm" color="fg.muted" mt={2}>
                  {t('duration')}: {Math.floor(sessionDuration / 60)}h{' '}
                  {sessionDuration % 60}m
                </Text>
              )}
            </Box>

            {/* Courts Configuration Section */}
            <Box
              id="field-courts"
              bg={{ base: 'white', _dark: 'gray.800' }}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            >
              <Flex align="center" justify="space-between" mb={4}>
                <Heading size="md">{t('courtsConfiguration')}</Heading>
              </Flex>

              <Stack gap={6}>
                {fields.map((field, index) => (
                  <Box key={field.id}>
                    {index > 0 && (
                      <Box
                        borderTop="1px"
                        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                        mb={6}
                      />
                    )}
                    <Box opacity={!canEditCourts ? 0.7 : 1}>
                      <Flex gap={3} direction="row" align="flex-start">
                        {/* Court Number */}
                        <Box flex={{ base: '0 0 100px', md: '0 0 140px' }}>
                          <Field.Root
                            invalid={!!errors.courts?.[index]?.courtNumber}
                            disabled={!canEditCourts}
                          >
                            <Field.Label fontSize="sm">
                              {t('courtNumber')}{' '}
                              <Text as="span" color="red.500">
                                *
                              </Text>
                            </Field.Label>
                            <Controller
                              control={control}
                              name={`courts.${index}.courtNumber`}
                              render={({ field }) => (
                                <Input
                                  id={`court-number-input-${index}`}
                                  type="number"
                                  value={field.value === 0 ? '' : field.value}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  disabled={!canEditCourts}
                                />
                              )}
                            />
                            <Field.ErrorText color="fg.error">
                              {errors.courts?.[index]?.courtNumber?.message}
                            </Field.ErrorText>
                          </Field.Root>
                        </Box>

                        {/* Court Name */}
                        <Box flex="1">
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

                        {/* Delete Button */}
                        {fields.length > 1 && canEditCourts && (
                          <Box pt={7}>
                            <Button
                              type="button"
                              onClick={() => handleRemoveCourt(index)}
                              size="md"
                              variant="solid"
                              colorPalette="red"
                              minW="auto"
                              px={3}
                              disabled={!canEditCourts}
                              bg="red.50"
                              color="red.600"
                              border="1px solid"
                              borderColor="red.200"
                              _hover={{ bg: 'red.100', borderColor: 'red.300' }}
                              _dark={{
                                bg: 'red.900',
                                color: 'red.200',
                                borderColor: 'red.700',
                                _hover: {
                                  bg: 'red.800',
                                  borderColor: 'red.600',
                                },
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </Box>
                        )}
                      </Flex>
                    </Box>
                  </Box>
                ))}

                {/* Array-level error for unique court numbers */}
                {errors.courts?.root && (
                  <Text color="fg.error" fontSize="sm">
                    {errors.courts.root.message}
                  </Text>
                )}
              </Stack>

              {/* Add Court button - bottom of section */}
              <Button
                type="button"
                onClick={handleAddCourt}
                size="sm"
                variant="solid"
                colorPalette="green"
                disabled={!canEditCourts}
                mt={4}
                w="full"
                bg="green.50"
                color="green.700"
                border="1px solid"
                borderColor="green.200"
                _hover={{ bg: 'green.100', borderColor: 'green.300' }}
                _dark={{
                  bg: 'green.900',
                  color: 'green.200',
                  borderColor: 'green.700',
                  _hover: { bg: 'green.800', borderColor: 'green.600' },
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                {t('addCourt')}
              </Button>
            </Box>

            {/* Level Requirements Section */}
            <LevelRequirementsCard control={control} setValue={setValue}>
              <Field.Root invalid={!!errors.referenceVideoUrl}>
                <Field.Label>{t('referenceVideoUrl')}</Field.Label>
                <Input
                  {...register('referenceVideoUrl')}
                  placeholder={t('referenceVideoUrlPlaceholder')}
                  type="url"
                  inputMode="url"
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {t('referenceVideoUrlHelper')}
                </Text>
                <Field.ErrorText color="fg.error">
                  {errors.referenceVideoUrl?.message}
                </Field.ErrorText>
              </Field.Root>
            </LevelRequirementsCard>

            {/* Session Settings Section - Temporarily hidden */}
            {false && user?.role !== UserRole.PLAYER && (
              <Box bg="bg" p={6} borderRadius="lg" boxShadow="sm">
                <Heading size="md" mb={4}>
                  {t('generalSettings.sessionSettings')}
                </Heading>

                <Stack gap={4}>
                  {/* Require Player Info */}
                  <Controller
                    control={control}
                    name="requirePlayerInfo"
                    render={({ field }) => (
                      <Box p={4} bg="bg.muted" borderRadius="md">
                        <Flex align="center" justify="space-between">
                          <Box>
                            <HStack mb={1}>
                              <User size={18} />
                              <Text fontWeight="medium">
                                {t('generalSettings.requirePlayerInfo')}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">
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
                      <Box p={4} bg="bg.muted" borderRadius="md">
                        <Flex align="center" justify="space-between">
                          <Box>
                            <HStack mb={1}>
                              <Users size={18} />
                              <Text fontWeight="medium">
                                {t('generalSettings.allowGuestJoin')}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">
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
                      <Box p={4} bg="bg.muted" borderRadius="md">
                        <Flex align="center" justify="space-between">
                          <Box>
                            <HStack mb={1}>
                              <UserPlus size={18} />
                              <Text fontWeight="medium">
                                {t('generalSettings.allowNewPlayers')}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">
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
            <Box
              bg={{ base: 'white', _dark: 'gray.800' }}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
              overflow="hidden"
            >
              <Collapsible.Root
                open={isAdvancedOpen}
                onOpenChange={(e) => setIsAdvancedOpen(e.open)}
              >
                <Collapsible.Trigger asChild>
                  <Box
                    as="button"
                    w="full"
                    p={4}
                    cursor="pointer"
                    _hover={{ bg: { base: 'gray.50', _dark: 'gray.750' } }}
                    transition="background 0.2s"
                  >
                    <Flex align="center" justify="space-between">
                      <HStack gap={2}>
                        <Icon asChild boxSize={5} color="brand.500">
                          <Settings />
                        </Icon>
                        <Heading size="md">{t('advancedSettings')}</Heading>
                      </HStack>
                      <Icon asChild boxSize={5} color="fg.muted">
                        {isAdvancedOpen ? <ChevronUp /> : <ChevronDown />}
                      </Icon>
                    </Flex>
                  </Box>
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <Stack gap={6} p={6} pt={0}>
                    {/* Session Images */}
                    <Box>
                      <AppMultiImageUpload
                        images={sessionImages}
                        bannerIndex={bannerIndex}
                        onImagesChange={setSessionImages}
                        onBannerChange={setBannerIndex}
                        isUploading={isUploadingImages}
                        maxImages={5}
                      />
                    </Box>

                    {/* Court Appearance */}
                    {canAccessHostFeatures && (
                      <Box>
                        <Heading size="sm" mb={3}>
                          {t('courtAppearance')}
                        </Heading>
                        <Text fontSize="sm" color="fg.muted" mb={4}>
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
                                        onClick={() =>
                                          field.onChange(color.value)
                                        }
                                        border="3px solid"
                                        borderColor={
                                          isSelected
                                            ? 'brand.500'
                                            : 'transparent'
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
                                        fontWeight={
                                          isSelected ? 'bold' : 'normal'
                                        }
                                      >
                                        {t(color.labelKey)}
                                      </Text>
                                    </VStack>
                                  </WrapItem>
                                );
                              })}
                            </Wrap>
                          )}
                        />
                      </Box>
                    )}

                    {/* Default Match Type */}
                    <Box>
                      <Controller
                        control={control}
                        name="defaultMatchType"
                        render={({ field }) => (
                          <Field.Root>
                            <Field.Label>
                              <Heading size="sm">
                                {t('defaultMatchType')}
                              </Heading>
                            </Field.Label>
                            <HStack gap={3}>
                              <Button
                                type="button"
                                variant={
                                  field.value === 'DOUBLES'
                                    ? 'solid'
                                    : 'outline'
                                }
                                colorPalette={
                                  field.value === 'DOUBLES' ? 'green' : 'gray'
                                }
                                size="sm"
                                onClick={() => field.onChange('DOUBLES')}
                              >
                                <Box as={Users} boxSize={4} mr={1} />
                                {t('doubles')}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  field.value === 'SINGLES'
                                    ? 'solid'
                                    : 'outline'
                                }
                                colorPalette={
                                  field.value === 'SINGLES' ? 'green' : 'gray'
                                }
                                size="sm"
                                onClick={() => field.onChange('SINGLES')}
                              >
                                <Box as={User} boxSize={4} mr={1} />
                                {t('singles')}
                              </Button>
                            </HStack>
                          </Field.Root>
                        )}
                      />
                    </Box>

                    {/* Shuttlecock + Max Players Per Court - same row */}
                    <Grid templateColumns="1fr 1fr" gap={4}>
                      <Box>
                        <Field.Root invalid={!!errors.shuttlecock}>
                          <Field.Label>
                            <Heading size="sm">{t('shuttlecock')}</Heading>
                          </Field.Label>
                          <Input
                            {...register('shuttlecock')}
                            placeholder={t('shuttlecock')}
                          />
                          <Field.ErrorText color="fg.error">
                            {errors.shuttlecock?.message}
                          </Field.ErrorText>
                        </Field.Root>
                      </Box>

                      {/* Max Players Per Court */}
                      <Box>
                        <Field.Root invalid={!!errors.maxPlayersPerCourt}>
                          <Field.Label>
                            <Heading size="sm">
                              {t('maxPlayersPerCourt')}
                            </Heading>
                          </Field.Label>
                          <Controller
                            control={control}
                            name="maxPlayersPerCourt"
                            render={({ field }) => (
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                min={2}
                                max={12}
                                value={field.value || ''}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange('');
                                  } else {
                                    const parsed = parseInt(value);
                                    if (!isNaN(parsed)) {
                                      field.onChange(parsed);
                                    }
                                  }
                                }}
                                rightElement={
                                  <Text
                                    fontSize="sm"
                                    color="fg.muted"
                                    whiteSpace="nowrap"
                                  >
                                    người/sân
                                  </Text>
                                }
                              />
                            )}
                          />
                          <Field.ErrorText color="fg.error">
                            {errors.maxPlayersPerCourt?.message}
                          </Field.ErrorText>
                        </Field.Root>
                      </Box>
                    </Grid>
                  </Stack>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>

            {/* Buttons */}
            <Flex
              gap={3}
              mt={4}
              {...(useDrawerMobileFooter
                ? {
                    position: { base: 'fixed', md: 'static' },
                    right: { base: 0, md: 'auto' },
                    bottom: { base: 0, md: 'auto' },
                    width: { base: mobileFooterWidth, md: 'auto' },
                    p: { base: 4, md: 0 },
                    pb: {
                      base: 'calc(16px + env(safe-area-inset-bottom))',
                      md: 0,
                    },
                    bg: { base: 'white', _dark: 'gray.800' },
                    borderTop: { base: '1px solid', md: 'none' },
                    borderColor: { base: 'border', md: 'transparent' },
                    boxShadow: {
                      base: '0 -8px 24px rgba(0, 0, 0, 0.18)',
                      md: 'none',
                    },
                    zIndex: 1260,
                  }
                : {})}
            >
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  flex={1}
                >
                  {tc('cancel')}
                </Button>
              )}
              <Button
                type="submit"
                colorPalette="green"
                loading={isSubmitting || isNavigating}
                disabled={sessionDuration === 0}
                loadingText={
                  isNavigating
                    ? tc('loading')
                    : isEditMode
                      ? t('saving')
                      : t('creating')
                }
                flex={onCancel ? 1 : undefined}
                w={onCancel ? undefined : 'full'}
              >
                <CalendarPlus size={18} style={{ marginRight: '8px' }} />
                {submitLabel}
              </Button>
            </Flex>
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
    </Box>
  );
}
