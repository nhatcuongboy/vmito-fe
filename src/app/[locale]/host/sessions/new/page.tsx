'use client';

import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { CourtDirection, UserRole } from '@/lib/api/types';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/chakra-compat';
import { Plus, Minus, Save, Shield } from 'lucide-react';
import { COURT_COLORS } from '@/components/session/CourtSettings';
import { useTranslations } from 'next-intl';
import { useSearchParams, useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Select } from '@/components/ui/chakra-compat';
import { Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function NewSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const _locale = params.locale as string;
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState(user?.name || '');
  const [hostPhone, setHostPhone] = useState('');
  const [allLevelsSelected, setAllLevelsSelected] = useState(true);
  const [courts, setCourts] = useState([
    {
      courtNumber: 1,
      courtName: '',
      direction: CourtDirection.HORIZONTAL,
    },
  ]);
  const [requiredLevels, setRequiredLevels] = useState<number[]>([]);
  const [courtColor, setCourtColor] = useState(COURT_COLORS[0].value);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const [startTime, setStartTime] = useState(formatDateTimeLocal(now));
  const [endTime, setEndTime] = useState(formatDateTimeLocal(twoHoursLater));

  const sessionDuration = useMemo(() => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (60 * 1000)
      );
      return durationMinutes > 0 ? durationMinutes : 120;
    } catch (_e) {
      return 120;
    }
  }, [startTime, endTime]);

  const isEndTimeValid = useMemo(() => {
    try {
      return new Date(endTime) > new Date(startTime);
    } catch (_e) {
      return true;
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

  const validateCourts = () => {
    const courtNumbers = courts.map((c) => c.courtNumber);
    const uniqueNumbers = new Set(courtNumbers);

    if (uniqueNumbers.size !== courtNumbers.length) {
      return t('validation.courtNumberUnique');
    }

    for (const court of courts) {
      if (!court.courtNumber || court.courtNumber < 1) {
        return t('validation.allCourtsMustHaveValidNumber');
      }
    }
    return null;
  };

  const createSession = async (formData: FormData) => {
    setIsLoading(true);

    try {
      // Validate required fields
      if (!selectedVenueId) {
        toaster.error({ title: t('validation.locationRequired') });
        return;
      }

      if (!startTime) {
        toaster.error({ title: t('validation.startTimeRequired') });
        return;
      }

      if (!endTime) {
        toaster.error({ title: t('validation.endTimeRequired') });
        return;
      }

      if (!hostName.trim()) {
        toaster.error({ title: t('validation.hostNameRequired') });
        return;
      }

      if (!hostPhone.trim()) {
        toaster.error({ title: t('validation.hostPhoneRequired') });
        return;
      }

      if (!isEndTimeValid) {
        toaster.error({ title: t('endTimeMustBeAfterStartTime') });
        return;
      }

      const courtValidationError = validateCourts();
      if (courtValidationError) {
        toaster.error({ title: courtValidationError });
        return;
      }

      const name = formData.get('name') as string;
      const maxPlayersPerCourt = parseInt(
        formData.get('maxPlayersPerCourt') as string
      );

      // Find selected venue and prepare inline venue object
      const selectedVenue = venues.find((v) => v.id === selectedVenueId);
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

      const session = await SessionService.createSession({
        name,
        description: description.trim() || undefined,
        hostName: hostName.trim(),
        hostPhone: hostPhone.trim(),
        numberOfCourts: courts.length,
        sessionDuration,
        maxPlayersPerCourt,
        requirePlayerInfo: false,
        requiredLevels: allLevelsSelected
          ? undefined
          : requiredLevels.length > 0
            ? requiredLevels
            : undefined,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        courtColor,
        venue: venueData,
        courts: courts.map((court) => ({
          courtNumber: court.courtNumber,
          courtName: court.courtName || undefined,
          direction: court.direction,
        })),
      });

      router.push(`/host/sessions/${session.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('validation.unknownError');
      toaster.error({ title: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourt = () => {
    const newCourtNumber = Math.max(...courts.map((c) => c.courtNumber), 0) + 1;
    setCourts([
      ...courts,
      {
        courtNumber: newCourtNumber,
        courtName: '',
        direction: CourtDirection.HORIZONTAL,
      },
    ]);
  };

  const handleRemoveCourt = (courtNumber: number) => {
    if (courts.length > 1) {
      const filteredCourts = courts.filter(
        (c) => c.courtNumber !== courtNumber
      );
      const reindexedCourts = filteredCourts.map((court, index) => ({
        ...court,
        courtNumber: index + 1,
      }));
      setCourts(reindexedCourts);
    }
  };

  const handleCourtChange = (
    index: number,
    field: 'courtNumber' | 'courtName' | 'direction',
    value: string | number | CourtDirection
  ) => {
    const newCourts = [...courts];
    let newValue = value;
    if (field === 'courtNumber') {
      // Always store as number
      newValue = typeof value === 'string' ? parseInt(value) || 1 : value;
    }
    newCourts[index] = { ...newCourts[index], [field]: newValue };
    setCourts(newCourts);
  };

  const handleAllLevelsToggle = () => {
    if (allLevelsSelected) {
      setAllLevelsSelected(false);
      setRequiredLevels([]);
    } else {
      setAllLevelsSelected(true);
      setRequiredLevels([]);
    }
  };

  const handleLevelToggle = (level: number) => {
    if (allLevelsSelected) {
      setAllLevelsSelected(false);
    }
    setRequiredLevels((prev) => {
      const isSelected = prev.includes(level);
      return isSelected ? prev.filter((l) => l !== level) : [...prev, level];
    });
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <TopBar
        title={t('createNewSession')}
        showBackButton
        backHref="/host/sessions"
      />

      <Container maxW="4xl" pt="80px" pb={8}>
        <form action={createSession}>
          <Stack gap={6}>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('basicInfo')}
              </Heading>
              <Stack gap={4}>
                <Box>
                  <Text mb={2} fontWeight="medium">
                    {t('name')} *
                  </Text>
                  <Input
                    name="name"
                    placeholder={t('sessionNamePlaceholder')}
                    required
                    size="lg"
                  />
                </Box>
                <Box>
                  <Text mb={2} fontWeight="medium">
                    {t('description')} ({tc('optional')})
                  </Text>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                  />
                </Box>
                <Box>
                  <Text mb={2} fontWeight="medium">
                    {t('location')} *
                  </Text>
                  <Select
                    value={selectedVenueId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedVenueId(e.target.value)
                    }
                  >
                    <option value="">{t('generalSettings.selectVenue')}</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} - {v.address}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Stack>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('hostInfo')}
              </Heading>
              <Flex gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">
                    {t('hostName')} *
                  </Text>
                  <Input
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder={t('hostNamePlaceholder')}
                    size="lg"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">
                    {t('hostPhone')} *
                  </Text>
                  <Input
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    placeholder={t('hostPhonePlaceholder')}
                    size="lg"
                    type="tel"
                  />
                </Box>
              </Flex>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('time')}
              </Heading>
              <Flex gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">
                    {t('start')} *
                  </Text>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="lg"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">
                    {t('end')} *
                  </Text>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    size="lg"
                    borderColor={!isEndTimeValid ? 'red.500' : undefined}
                  />
                </Box>
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {t('duration')}: {Math.floor(sessionDuration / 60)}h{' '}
                {sessionDuration % 60}m
              </Text>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('maxPlayersPerCourt')}
              </Heading>
              <Input
                name="maxPlayersPerCourt"
                type="number"
                defaultValue={8}
                min={2}
                max={12}
                size="lg"
              />
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <VStack gap={4} align="stretch">
                <Heading size="md">
                  <HStack>
                    <Shield size={16} />
                    <Text>{t('levelsLabel')}</Text>
                  </HStack>
                </Heading>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {t('generalSettings.selectRequiredLevels')}
                  </Text>

                  <Wrap gap={2}>
                    <WrapItem>
                      <Badge
                        px={3}
                        py={2}
                        borderRadius="md"
                        cursor="pointer"
                        bg={allLevelsSelected ? 'green.500' : 'gray.200'}
                        color={allLevelsSelected ? 'white' : 'gray.700'}
                        fontSize="sm"
                        fontWeight="semibold"
                        onClick={handleAllLevelsToggle}
                        _hover={{
                          transform: 'translateY(-1px)',
                          boxShadow: 'sm',
                        }}
                        transition="all 0.2s"
                      >
                        {t('allLevels')}
                      </Badge>
                    </WrapItem>

                    <WrapItem alignItems="center">
                      <Text color="gray.400" fontSize="sm">
                        |
                      </Text>
                    </WrapItem>

                    {VALID_LEVELS.map((level) => {
                      const isSelected =
                        !allLevelsSelected && requiredLevels.includes(level);
                      return (
                        <WrapItem key={level}>
                          <Badge
                            px={3}
                            py={2}
                            borderRadius="md"
                            cursor="pointer"
                            bg={isSelected ? 'blue.500' : 'gray.200'}
                            color={isSelected ? 'white' : 'gray.700'}
                            fontSize="sm"
                            fontWeight="semibold"
                            onClick={() => handleLevelToggle(level)}
                            opacity={allLevelsSelected ? 0.5 : 1}
                            _hover={{
                              transform: allLevelsSelected
                                ? 'none'
                                : 'translateY(-1px)',
                              boxShadow: allLevelsSelected ? 'none' : 'sm',
                            }}
                            transition="all 0.2s"
                          >
                            {getLevelLabel(level)}
                          </Badge>
                        </WrapItem>
                      );
                    })}
                  </Wrap>

                  {!allLevelsSelected && requiredLevels.length > 0 && (
                    <Text fontSize="xs" color="blue.600" mt={2}>
                      ✓ {requiredLevels.length} level(s) selected
                    </Text>
                  )}

                  {allLevelsSelected && (
                    <Text fontSize="xs" color="green.600" mt={2}>
                      {t('allLevelsAllowedMessage')}
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('courtAppearance')}
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>
                {t('selectCourtColor')}
              </Text>

              <Wrap gap={4}>
                {COURT_COLORS.map((color) => {
                  const isSelected = courtColor === color.value;
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
                          onClick={() => setCourtColor(color.value)}
                          border="3px solid"
                          borderColor={isSelected ? 'blue.500' : 'transparent'}
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
                          {/* White lines representation - smaller version */}
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
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Flex align="center" justify="space-between" mb={4}>
                <Heading size="md">{t('courtsConfiguration')}</Heading>
                <Button onClick={handleAddCourt} size="sm">
                  <Plus size={16} style={{ marginRight: '8px' }} />
                  {t('addCourt')}
                </Button>
              </Flex>

              <Stack gap={4}>
                {courts.map((court, index) => (
                  <Box
                    key={index}
                    p={4}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                  >
                    <Text fontWeight="semibold" mb={3}>
                      {t('court')} {index + 1}
                    </Text>
                    <Flex gap={3} align="start">
                      <Box flex={1}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          {t('courtNumber')} *
                        </Text>
                        <Input
                          type="number"
                          value={court.courtNumber}
                          onChange={(e) =>
                            handleCourtChange(
                              index,
                              'courtNumber',
                              parseInt(e.target.value) || 1
                            )
                          }
                          min={1}
                        />
                      </Box>
                      <Box flex={2}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          {t('courtName')} ({tc('optional')})
                        </Text>
                        <Input
                          placeholder={t('courtNamePlaceholder')}
                          value={court.courtName}
                          onChange={(e) =>
                            handleCourtChange(
                              index,
                              'courtName',
                              e.target.value
                            )
                          }
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t('courtNameDescription')}
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          {t('courtDirection')} *
                        </Text>
                        <select
                          value={court.direction}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCourtChange(
                              index,
                              'direction',
                              e.target.value as CourtDirection
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            height: '40px',
                          }}
                        >
                          <option value={CourtDirection.HORIZONTAL}>
                            {t('horizontal')}
                          </option>
                          <option value={CourtDirection.VERTICAL}>
                            {t('vertical')}
                          </option>
                        </select>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t('courtDirectionDescription')}
                        </Text>
                      </Box>
                      {courts.length > 1 && (
                        <Box mt="30px">
                          <Button
                            onClick={() => handleRemoveCourt(court.courtNumber)}
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                            minW="auto"
                            px={2}
                          >
                            <Minus size={16} />
                          </Button>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Button
              type="submit"
              colorPalette="blue"
              size="lg"
              disabled={isLoading}
              loading={isLoading}
            >
              <Save size={16} style={{ marginRight: '8px' }} />
              {t('createSession')}
            </Button>

            <Box
              bg="blue.50"
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor="blue.200"
            >
              <Flex align="center" gap={2} mb={4}>
                <Text fontSize="lg">💡</Text>
                <Heading size="md" color="blue.700">
                  {t('proTipsForYourSession')}
                </Heading>
              </Flex>
              <Stack gap={2} fontSize="sm" color="blue.600">
                <Text>• {t('optimalCourtRotation')}</Text>
                <Text>• {t('sessionDurationTip')}</Text>
                <Text>• {t('playerInfoHelps')}</Text>
                <Text>• {t('courtDirectionTip')}</Text>
              </Stack>
            </Box>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}

export default function NewSessionPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense fallback={<div>Loading...</div>}>
        <NewSessionPageContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
