'use client';

import { Button } from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { useRouter } from '@/i18n/config';
import { PlayerService } from '@/lib/api/player.service';
import { type Player, UserRole, GenderType } from '@/lib/api/types';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Box,
  Container,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Check, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const t = useTranslations('pages.join');
  const tCommon = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: '' as '' | GenderType,
    level: '' as '' | number,
    levelDescription: '',
    phone: '',
    desire: '',
  });

  useEffect(() => {
    async function loadPlayer() {
      try {
        if (!playerId) {
          toaster.error({ title: t('confirm.errors.missingInfo') });
          router.push('/join');
          return;
        }

        setIsLoading(true);
        const playerData = await PlayerService.getPlayer(playerId);
        setPlayer(playerData);

        // Pre-populate form with existing data
        setFormData({
          name: playerData.name || '',
          gender: (playerData.gender as GenderType | '') || '', // Cast to expected type
          level: playerData.level || '',
          levelDescription: playerData.levelDescription || '',
          phone: playerData.phone || '',
          desire: playerData.desire || '',
        });
      } catch (error) {
        console.error('Error loading player:', error);
        toaster.error({ title: t('confirm.errors.loadFailed') });
      } finally {
        setIsLoading(false);
      }
    }

    loadPlayer();
  }, [playerId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!player) {
      toaster.error({ title: t('confirm.errors.playerNotFound') });
      return;
    }

    // Validate form data
    if (!formData.name || !formData.gender || !formData.level) {
      toaster.error({ title: t('confirm.errors.requiredFields') });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare data with proper types
      const playerData: Partial<Player> = {
        name: formData.name,
        gender: formData.gender as GenderType,
        level: Number(formData.level),
        levelDescription: formData.levelDescription || undefined,
        desire: formData.desire || undefined,
        phone: formData.phone || undefined,
        confirmedByPlayer: true,
      };

      // Call the API to confirm the player
      await PlayerService.confirmPlayer(player.id, playerData);

      // Redirect to status page with player ID
      router.push(`/my-session`);
    } catch (error) {
      console.error('Error confirming player:', error);
      toaster.error({ title: t('confirm.errors.confirmFailed') });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh">
        <TopBar title={t('confirm.title')} />
        <Container maxW="md" py={12} pt={24}>
          <Flex
            justify="center"
            align="center"
            height="50vh"
            direction="column"
          >
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>{tCommon('loading')}</Text>
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      {/* Top Bar */}
      <TopBar title={t('confirm.title')} />

      <Container maxW="md" py={12} pt={24}>
        <Box
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          borderWidth="1px"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          {/* Card Header */}
          <Box
            bg="blue.50"
            _dark={{ bg: 'blue.900' }}
            borderBottomWidth="1px"
            px={6}
            py={5}
          >
            <Flex align="center" mb={2}>
              <Box as={User} boxSize={5} color="blue.500" mr={2} />
              <Heading size="md">{t('confirm.subtitle')}</Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm">
              {t('confirm.description', { sessionName: '' })}
            </Text>
          </Box>

          {/* Card Content */}
          <Box p={6}>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    {t('confirm.playerNumber', {
                      number: player?.playerNumber || 0,
                    })}
                  </Text>

                  <Box mb={4}>
                    <Text fontWeight="medium" mb={1} fontSize="sm">
                      {t('confirm.form.fullName')}{' '}
                      <Box as="span" color="red.500">
                        *
                      </Box>
                    </Text>
                    <Input
                      value={formData.name}
                      onChange={handleInputChange}
                      name="name"
                      placeholder={t('confirm.form.namePlaceholder')}
                      size="lg"
                      required
                    />
                  </Box>

                  <Flex gap={4} mb={4}>
                    <Box flex={1}>
                      <Text fontWeight="medium" mb={1} fontSize="sm">
                        {t('confirm.form.gender')}{' '}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                      <select
                        value={formData.gender}
                        onChange={handleInputChange}
                        name="gender"
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          borderWidth: '1px',
                          borderColor: '#CBD5E0',
                          height: '48px',
                        }}
                      >
                        <option value="">
                          {t('confirm.form.selectGender')}
                        </option>
                        <option value="MALE">{t('confirm.form.male')}</option>
                        <option value="FEMALE">
                          {t('confirm.form.female')}
                        </option>
                        <option value="OTHER">{tCommon('other')}</option>
                        <option value="PREFER_NOT_TO_SAY">
                          {tCommon('preferNotToSay')}
                        </option>
                      </select>
                    </Box>

                    <Box flex={1}>
                      <Text fontWeight="medium" mb={1} fontSize="sm">
                        {t('confirm.form.skillLevel')}{' '}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                      <select
                        value={formData.level}
                        onChange={handleInputChange}
                        name="level"
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          borderWidth: '1px',
                          borderColor: '#CBD5E0',
                          height: '48px',
                        }}
                      >
                        <option value="">
                          {t('confirm.form.selectLevel')}
                        </option>
                        {VALID_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {getLevelLabel(level)}
                          </option>
                        ))}
                      </select>
                    </Box>
                  </Flex>

                  <Box mb={4}>
                    <Text fontWeight="medium" mb={1} fontSize="sm">
                      {t('confirm.form.levelDescription')}
                    </Text>
                    <Input
                      value={formData.levelDescription}
                      onChange={handleInputChange}
                      name="levelDescription"
                      placeholder={t(
                        'confirm.form.levelDescriptionPlaceholder'
                      )}
                      size="lg"
                    />
                  </Box>

                  <Box mb={4}>
                    <Text fontWeight="medium" mb={1} fontSize="sm">
                      {t('confirm.form.desire')}
                    </Text>
                    <Input
                      value={formData.desire || ''}
                      onChange={handleInputChange}
                      name="desire"
                      placeholder={t('confirm.form.desirePlaceholder')}
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="medium" mb={1} fontSize="sm">
                      {t('confirm.form.phoneNumber')}
                    </Text>
                    <Input
                      value={formData.phone}
                      onChange={handleInputChange}
                      name="phone"
                      placeholder={t('confirm.form.phonePlaceholder')}
                      size="lg"
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  mt={4}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <Flex align="center" justify="center" width="100%">
                    {isSubmitting
                      ? t('confirm.form.processing')
                      : t('confirm.form.confirmButton')}
                    {!isSubmitting && <Box as={Check} ml={2} boxSize={5} />}
                  </Flex>
                </Button>
              </Stack>
            </form>
          </Box>

          {/* Card Footer */}
          <Box
            bg="gray.50"
            _dark={{ bg: 'gray.700' }}
            borderTopWidth="1px"
            p={4}
            textAlign="center"
          >
            <Text fontSize="sm" color="gray.500">
              {t('confirm.footer')}
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function ConfirmPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER]}>
      <Suspense fallback={<Spinner />}>
        <ConfirmPageContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
