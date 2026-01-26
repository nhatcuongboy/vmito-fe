'use client';

import { SessionService } from '@/lib/api/session.service';
import { CourtDirection, ISession, Venue } from '@/lib/api/types';
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
import { Check } from 'lucide-react';

const CustomCheckbox = ({ isChecked, onChange, size = 'md' }: { isChecked: boolean; onChange: (e: any) => void; size?: string }) => {
  const boxSize = size === 'lg' ? '24px' : '20px';
  const iconSize = size === 'lg' ? 16 : 12;

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
import { Plus, Minus, Shield, Sparkles, User, Users, UserPlus } from 'lucide-react';
import { COURT_COLORS } from '@/components/session/CourtSettings';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { useEffect, useMemo, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Select } from '@/components/ui/Select';
import { VenueService } from '@/lib/api/venue.service';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import TopBar from '@/components/ui/TopBar';

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface NewSessionFormProps {
  backHref: string;
  onSuccess: (session: ISession) => void;
}

export default function NewSessionForm({ backHref, onSuccess }: NewSessionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState(user?.name || '');
  const [hostPhone, setHostPhone] = useState('');
  const [allLevelsSelected, setAllLevelsSelected] = useState(true);
  const [requirePlayerInfo, setRequirePlayerInfo] = useState(false);
  const [allowGuestJoin, setAllowGuestJoin] = useState(true);
  const [allowNewPlayers, setAllowNewPlayers] = useState(true);
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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [maxPlayersPerCourt, setMaxPlayersPerCourt] = useState(8);

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
        requirePlayerInfo,
        allowGuestJoin,
        allowNewPlayers,
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

      onSuccess(session);
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

  const handleAISuccess = (inputData: ExtractedSessionData | any) => {
    // Robust unwrapping: check if we received the wrapper { success: true, data: ... }
    const data = (inputData && inputData.success && inputData.data) ? inputData.data : inputData;

    console.log('Processed AI Data:', data);

    // Apply AI-generated values to form fields
    if (data.name) setSessionName(data.name);
    if (data.description) setDescription(data.description);
    if (data.hostName) setHostName(data.hostName);
    if (data.hostPhone) setHostPhone(data.hostPhone);
    if (data.maxPlayersPerCourt) setMaxPlayersPerCourt(data.maxPlayersPerCourt);

    if (data.startTime) {
      try {
        const startDate = new Date(data.startTime);
        if (!isNaN(startDate.getTime())) {
          setStartTime(formatDateTimeLocal(startDate));
          // If duration is implied by end time, we don't need to explicity set it
        }
      } catch (e) {
        console.error('Invalid start time from AI:', e);
      }
    }

    if (data.endTime) {
      try {
        const endDate = new Date(data.endTime);
        if (!isNaN(endDate.getTime())) {
          setEndTime(formatDateTimeLocal(endDate));
        }
      } catch (e) {
        console.error('Invalid end time from AI:', e);
      }
    }

    if (data.requiredLevels && data.requiredLevels.length > 0) {
      setAllLevelsSelected(false);
      setRequiredLevels(Array.from(new Set(data.requiredLevels as number[])));
    }

    if (data.numberOfCourts && data.numberOfCourts > 1) {
      const newCourts = Array.from({ length: data.numberOfCourts }, (_, i) => ({
        courtNumber: i + 1,
        courtName: '',
        direction: CourtDirection.HORIZONTAL,
      }));
      setCourts(newCourts);
    }

    // Attempt to match venue
    if (data.venue && (data.venue.name || data.venue.address) && venues.length > 0) {
      const venueName = data.venue.name?.toLowerCase() || '';
      const venueAddress = data.venue.address?.toLowerCase() || '';

      // Try to find a venue that matches name or address
      const matchedVenue = venues.find(v => {
        const vName = v.name.toLowerCase();
        const vAddress = v.address.toLowerCase();

        // Exact name match or contained in address
        if (venueName && (vName.includes(venueName) || venueName.includes(vName))) return true;
        if (venueAddress && (vAddress.includes(venueAddress) || venueAddress.includes(vAddress))) return true;

        return false;
      });

      if (matchedVenue) {
        setSelectedVenueId(matchedVenue.id);
        // toaster.success({ title: t('aiModal.venueMatched', { venueName: matchedVenue.name }) });
      } else {
        // If no exact match, we could notify user or just leave it empty
        // For now, let's just log it
        console.log('No matching venue found for:', data.venue);
      }
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <TopBar
        title={t('createNewSession')}
        showBackButton
        backHref={backHref}
      />

      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />

      {/* Floating AI Button */}
      <Box position="fixed" bottom="24px" right="24px" zIndex={1000}>
        <Button
          size="lg"
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
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
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
              <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
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
              </Stack>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {t('duration')}: {Math.floor(sessionDuration / 60)}h{' '}
                {sessionDuration % 60}m
              </Text>
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
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="semibold">
                        {t('court')} {index + 1}
                      </Text>
                      {courts.length > 1 && (
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
                      )}
                    </Flex>
                    <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
                      <Box flex={{ base: '1', md: '0 0 140px' }}>
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
                      <Box flex={{ base: '1', md: '1' }}>
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
                      </Box>
                      <Box flex={{ base: '1', md: '0 0 180px' }}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          {t('courtDirection')} *
                        </Text>
                        <Select
                          value={court.direction}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCourtChange(
                              index,
                              'direction',
                              e.target.value as CourtDirection
                            )
                          }
                        >
                          <option value={CourtDirection.HORIZONTAL}>
                            {t('horizontal')}
                          </option>
                          <option value={CourtDirection.VERTICAL}>
                            {t('vertical')}
                          </option>
                        </Select>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Stack>
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
              <Heading size="md" mb={4}>
                {t('maxPlayersPerCourt')}
              </Heading>
              <Input
                name="maxPlayersPerCourt"
                type="number"
                value={maxPlayersPerCourt}
                onChange={(e) => setMaxPlayersPerCourt(parseInt(e.target.value) || 8)}
                min={2}
                max={12}
                size="lg"
              />
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('generalSettings.sessionSettings')}
              </Heading>

              <Stack gap={4}>
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
                      isChecked={requirePlayerInfo}
                      onChange={(e) => setRequirePlayerInfo(e.target.checked)}
                      size="lg"
                    />
                  </Flex>
                </Box>

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
                      isChecked={allowGuestJoin}
                      onChange={(e) => setAllowGuestJoin(e.target.checked)}
                      size="lg"
                    />
                  </Flex>
                </Box>

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
                      isChecked={allowNewPlayers}
                      onChange={(e) => setAllowNewPlayers(e.target.checked)}
                      size="lg"
                    />
                  </Flex>
                </Box>
              </Stack>
            </Box>

            <Button
              type="submit"
              colorPalette="blue"
              size="lg"
              loading={isLoading}
              loadingText={t('creating')}
              w="full"
              mt={4}
            >
              {t('createSession')}
            </Button>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}
