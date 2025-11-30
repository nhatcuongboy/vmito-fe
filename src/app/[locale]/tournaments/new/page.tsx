'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Spinner,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  Button,
  IconButton,
} from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryType } from '@/lib/api/types';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import toast from 'react-hot-toast';

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NewTournamentPage() {
  const t = useTranslations('pages.tournaments.create');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(formatDateTimeLocal(new Date()));
  const [endDate, setEndDate] = useState(
    formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [categories, setCategories] = useState<
    Array<{ name: string; type: CategoryType }>
  >([{ name: "Men's Single", type: CategoryType.MENS_SINGLE }]);
  const [umpires, setUmpires] = useState<
    Array<{ name: string; email?: string; phone?: string }>
  >([]);
  const [scoringDevices, setScoringDevices] = useState<
    Array<{ name: string; deviceType?: string }>
  >([]);
  const [courts, setCourts] = useState<
    Array<{ courtNumber: number; courtName?: string }>
  >([{ courtNumber: 1 }]);

  const categoryTypeOptions = [
    {
      value: CategoryType.MENS_SINGLE,
      label: t('categoryTypeOptions.mensSingle'),
    },
    {
      value: CategoryType.WOMENS_SINGLE,
      label: t('categoryTypeOptions.womensSingle'),
    },
    {
      value: CategoryType.MENS_DOUBLE,
      label: t('categoryTypeOptions.mensDouble'),
    },
    {
      value: CategoryType.WOMENS_DOUBLE,
      label: t('categoryTypeOptions.womensDouble'),
    },
    {
      value: CategoryType.MIXED_DOUBLE,
      label: t('categoryTypeOptions.mixedDouble'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (categories.length === 0) {
      toast.error(t('addAtLeastOneCategory'));
      return;
    }

    try {
      setIsLoading(true);
      const tournament = await TournamentService.createTournament({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categories,
        umpires,
        scoringDevices,
        courts,
      });

      router.push(`/${locale}/tournaments/${tournament.id}/manage`);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      toast.error(error.response?.data?.error || 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      { name: '', type: CategoryType.MENS_SINGLE },
    ]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (
    index: number,
    field: 'name' | 'type',
    value: string
  ) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const addUmpire = () => {
    setUmpires([...umpires, { name: '' }]);
  };

  const removeUmpire = (index: number) => {
    setUmpires(umpires.filter((_, i) => i !== index));
  };

  const updateUmpire = (
    index: number,
    field: 'name' | 'email' | 'phone',
    value: string
  ) => {
    const updated = [...umpires];
    updated[index] = { ...updated[index], [field]: value };
    setUmpires(updated);
  };

  const addScoringDevice = () => {
    setScoringDevices([...scoringDevices, { name: '' }]);
  };

  const removeScoringDevice = (index: number) => {
    setScoringDevices(scoringDevices.filter((_, i) => i !== index));
  };

  const updateScoringDevice = (
    index: number,
    field: 'name' | 'deviceType',
    value: string
  ) => {
    const updated = [...scoringDevices];
    updated[index] = { ...updated[index], [field]: value };
    setScoringDevices(updated);
  };

  const addCourt = () => {
    const nextNumber =
      courts.length > 0 ? Math.max(...courts.map((c) => c.courtNumber)) + 1 : 1;
    setCourts([...courts, { courtNumber: nextNumber }]);
  };

  const removeCourt = (index: number) => {
    setCourts(courts.filter((_, i) => i !== index));
  };

  const updateCourt = (
    index: number,
    field: 'courtNumber' | 'courtName',
    value: string | number
  ) => {
    const updated = [...courts];
    updated[index] = { ...updated[index], [field]: value };
    setCourts(updated);
  };

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST]}>
      <Box minH="100vh" pb="80px">
        <TopBar
          showBackButton={true}
          backHref="/tournaments"
          title={t('title')}
        />

        <Container maxW="4xl" p={4} pt={24}>
          <form onSubmit={handleSubmit}>
            <VStack gap={6} alignItems="stretch">
              <Heading size="lg">{t('createNewTournament')}</Heading>

              {/* Basic Information */}
              <Card>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Heading size="md">{t('basicInformation')}</Heading>

                    <Box>
                      <Text mb={2} fontWeight="medium">
                        {t('tournamentName')}{' '}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('enterTournamentName')}
                        required
                      />
                    </Box>

                    <HStack>
                      <Box flex={1}>
                        <Text mb={2} fontWeight="medium">
                          {t('startDate')}{' '}
                          <Box as="span" color="red.500">
                            *
                          </Box>
                        </Text>
                        <Input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </Box>

                      <Box flex={1}>
                        <Text mb={2} fontWeight="medium">
                          {t('endDate')}{' '}
                          <Box as="span" color="red.500">
                            *
                          </Box>
                        </Text>
                        <Input
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                        />
                      </Box>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Categories */}
              <Card>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('categories')}</Heading>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCategory}
                        leftIcon={<Plus size={16} />}
                      >
                        {t('addCategory')}
                      </Button>
                    </Flex>

                    {categories.map((category, index) => (
                      <HStack key={index} gap={2}>
                        <Input
                          placeholder={t('categoryName')}
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(index, 'name', e.target.value)
                          }
                          flex={1}
                        />
                        <select
                          value={category.type}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateCategory(
                              index,
                              'type',
                              e.target.value as CategoryType
                            )
                          }
                          style={{
                            maxWidth: '200px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            borderWidth: '1px',
                            borderColor: '#CBD5E0',
                          }}
                        >
                          {categoryTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <IconButton
                          type="button"
                          aria-label={t('removeCategory')}
                          onClick={() => removeCategory(index)}
                          disabled={categories.length === 1}
                        >
                          <X size={16} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Optional: Umpires */}
              <Card>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('umpiresOptional')}</Heading>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addUmpire}
                        leftIcon={<Plus size={16} />}
                      >
                        {t('addUmpire')}
                      </Button>
                    </Flex>

                    {umpires.map((umpire, index) => (
                      <HStack key={index} gap={2}>
                        <Input
                          placeholder={t('umpireName')}
                          value={umpire.name}
                          onChange={(e) =>
                            updateUmpire(index, 'name', e.target.value)
                          }
                          flex={1}
                        />
                        <Input
                          placeholder={t('emailOptional')}
                          type="email"
                          value={umpire.email || ''}
                          onChange={(e) =>
                            updateUmpire(index, 'email', e.target.value)
                          }
                          flex={1}
                        />
                        <Input
                          placeholder={t('phoneOptional')}
                          value={umpire.phone || ''}
                          onChange={(e) =>
                            updateUmpire(index, 'phone', e.target.value)
                          }
                          maxW="150px"
                        />
                        <IconButton
                          type="button"
                          aria-label={t('removeUmpire')}
                          onClick={() => removeUmpire(index)}
                        >
                          <X size={16} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Optional: Scoring Devices */}
              <Card>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('scoringDevicesOptional')}</Heading>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addScoringDevice}
                        leftIcon={<Plus size={16} />}
                      >
                        {t('addDevice')}
                      </Button>
                    </Flex>

                    {scoringDevices.map((device, index) => (
                      <HStack key={index} gap={2}>
                        <Input
                          placeholder={t('deviceName')}
                          value={device.name}
                          onChange={(e) =>
                            updateScoringDevice(index, 'name', e.target.value)
                          }
                          flex={1}
                        />
                        <Input
                          placeholder={t('deviceTypeOptional')}
                          value={device.deviceType || ''}
                          onChange={(e) =>
                            updateScoringDevice(
                              index,
                              'deviceType',
                              e.target.value
                            )
                          }
                          flex={1}
                        />
                        <IconButton
                          type="button"
                          aria-label={t('removeDevice')}
                          onClick={() => removeScoringDevice(index)}
                        >
                          <X size={16} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Optional: Courts */}
              <Card>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('courtsOptional')}</Heading>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCourt}
                        leftIcon={<Plus size={16} />}
                      >
                        {t('addCourt')}
                      </Button>
                    </Flex>

                    {courts.map((court, index) => (
                      <HStack key={index} gap={2}>
                        <Input
                          type="number"
                          placeholder={t('courtNumber')}
                          value={court.courtNumber}
                          onChange={(e) =>
                            updateCourt(
                              index,
                              'courtNumber',
                              parseInt(e.target.value) || 1
                            )
                          }
                          maxW="120px"
                        />
                        <Input
                          placeholder={t('courtNameOptional')}
                          value={court.courtName || ''}
                          onChange={(e) =>
                            updateCourt(index, 'courtName', e.target.value)
                          }
                          flex={1}
                        />
                        <IconButton
                          type="button"
                          aria-label={t('removeCourt')}
                          onClick={() => removeCourt(index)}
                          disabled={courts.length === 1}
                        >
                          <X size={16} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Submit Button */}
              <Flex justify="flex-end" gap={4}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  loading={isLoading}
                  loadingText={t('creating')}
                >
                  {t('createTournament')}
                </Button>
              </Flex>
            </VStack>
          </form>
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}
