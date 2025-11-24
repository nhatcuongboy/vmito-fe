'use client';

import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { CourtDirection, Level } from '@/lib/api/types';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import {
  Badge,
  Box,
  // Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Plus, Minus, Save, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

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
  const locale = params.locale as string;
  const t = useTranslations('session');

  const [isLoading, setIsLoading] = useState(false);
  const [courts, setCourts] = useState([
    {
      courtNumber: 1,
      courtName: '',
      direction: CourtDirection.HORIZONTAL,
    },
  ]);
  const [requiredLevels, setRequiredLevels] = useState<Level[]>([]);

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
    } catch (e) {
      return 120;
    }
  }, [startTime, endTime]);

  const isEndTimeValid = useMemo(() => {
    try {
      return new Date(endTime) > new Date(startTime);
    } catch (e) {
      return true;
    }
  }, [startTime, endTime]);

  useEffect(() => {
    const error = searchParams.get('error');
    const details = searchParams.get('details');
    if (error) {
      toast.error(
        decodeURIComponent(details || t('validation.sessionCreateFailed'))
      );
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
      if (!isEndTimeValid) {
        toast.error(t('endTimeMustBeAfterStartTime'));
        return;
      }

      const courtValidationError = validateCourts();
      if (courtValidationError) {
        toast.error(courtValidationError);
        return;
      }

      const name = formData.get('name') as string;
      const maxPlayersPerCourt = parseInt(
        formData.get('maxPlayersPerCourt') as string
      );

      const session = await SessionService.createSession({
        name,
        numberOfCourts: courts.length,
        sessionDuration,
        maxPlayersPerCourt,
        requirePlayerInfo: false,
        requiredLevels: requiredLevels.length > 0 ? requiredLevels : undefined,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        courts: courts.map((court) => ({
          courtNumber: court.courtNumber,
          courtName: court.courtName || undefined,
          direction: court.direction,
        })),
      });

      toast.success(t('validation.sessionCreatedSuccessfully'));
      router.push(`/${locale}/host/sessions/${session.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('validation.unknownError');
      toast.error(errorMessage);
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
    newCourts[index] = { ...newCourts[index], [field]: value };
    setCourts(newCourts);
  };

  const handleLevelToggle = (level: Level) => {
    setRequiredLevels((prev) => {
      const isSelected = prev.includes(level);
      return isSelected
        ? prev.filter((l) => l !== level)
        : [...prev, level];
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
                {t('sessionName')}
              </Heading>
              <Input
                name="name"
                placeholder={t('sessionNamePlaceholder')}
                required
                size="lg"
              />
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={4}>
                {t('startTime')} & {t('endTime')}
              </Heading>
              <Flex gap={4}>
                <Box flex={1}>
                  <Text mb={2}>{t('startTime')}</Text>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="lg"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={2}>{t('endTime')}</Text>
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
                {t('sessionDuration')}: {Math.floor(sessionDuration / 60)}h{' '}
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
                    <Text>Required Player Levels</Text>
                  </HStack>
                </Heading>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Select required levels for this session. Leave empty to allow
                    all levels.
                  </Text>

                  <Wrap gap={2}>
                    {Object.values(Level).map((level) => {
                      const isSelected = requiredLevels.includes(level);
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
                            _hover={{
                              transform: 'translateY(-1px)',
                              boxShadow: 'sm',
                            }}
                            transition="all 0.2s"
                          >
                            {level.replace('_', ' ')}
                          </Badge>
                        </WrapItem>
                      );
                    })}
                  </Wrap>

                  {requiredLevels.length > 0 && (
                    <Text fontSize="xs" color="blue.600" mt={2}>
                      ✓ {requiredLevels.length} level(s) selected
                    </Text>
                  )}
                </Box>
              </VStack>
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
                      Court {index + 1}
                    </Text>
                    <Flex gap={3} align="start">
                      <Box flex={1}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          Court Number *
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
                          Court Name (Optional)
                        </Text>
                        <Input
                          placeholder="Enter court name"
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
                          Custom name to help identify this court
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          Court Direction *
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
                            Horizontal
                          </option>
                          <option value={CourtDirection.VERTICAL}>
                            Vertical
                          </option>
                        </select>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Court orientation for better gameplay
                        </Text>
                      </Box>
                      {courts.length > 1 && (
                        <Box mt="30px">
                          <Button
                            onClick={() => handleRemoveCourt(court.courtNumber)}
                            size="sm"
                            variant="outline"
                            colorScheme="red"
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
              colorScheme="blue"
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
                  Pro Tips for Your Session
                </Heading>
              </Flex>
              <Stack gap={2} fontSize="sm" color="blue.600">
                <Text>
                  • Set up court rotation every 15-20 minutes for optimal game
                  flow
                </Text>
                <Text>
                  • 2-3 hours is ideal for most recreational badminton sessions
                </Text>
                <Text>
                  • Player information helps with skill-based matching and
                  communication
                </Text>
                <Text>
                  • Court direction helps optimize player placement and lighting
                  conditions
                </Text>
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
    <ProtectedRouteGuard requiredRole={['HOST']}>
      <Suspense fallback={<div>Loading...</div>}>
        <NewSessionPageContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
