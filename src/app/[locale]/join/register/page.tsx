'use client';

import { useState, Suspense } from 'react';
import { useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import { Box, Heading, Input, Text, VStack, Spinner } from '@chakra-ui/react';
import { AuthService } from '@/lib/api/auth.service';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants';
import TopBar from '@/components/ui/TopBar';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';

function RegisterContent() {
  const t = useTranslations('pages.join.register');
  const { getLevelLabel } = useLevelLabel();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [level, setLevel] = useState<number>(VALID_LEVELS[1]); // Default to 2 (Y)
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('code');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toaster.error({ title: t('nameRequired') });
      return;
    }

    if (!sessionCode) {
      toaster.error({ title: t('invalidSessionCode') });
      return;
    }

    setLoading(true);

    try {
      const playerResult = await AuthService.joinByCode(sessionCode, {
        name,
        gender,
        level,
        phone,
      });

      // Successfully registered and joined - redirect to player status page
      if (playerResult.data?.player) {
        const { id, joinCode } = playerResult.data.player;
        router.push(`${ROUTES.PLAYER.PROFILE(id)}?code=${joinCode}`);
      } else {
        toaster.error({ title: t('joinFailed') });
      }
    } catch (error) {
      toaster.error({ title: t('joinFailed') });
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <TopBar title={t('title')} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={8}
        pt="80px"
      >
        <Box
          maxW="md"
          w="full"
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          <VStack gap={6}>
            <Box textAlign="center">
              <Heading size="lg" color="green.600">
                🏸 {t('title')}
              </Heading>
              <Text color="gray.600" mt={2}>
                {t('subtitle')}
              </Text>
            </Box>

            <form onSubmit={handleRegister} style={{ width: '100%' }}>
              <VStack gap={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    {t('name')} *
                  </Text>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    required
                  />
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    {t('gender')}
                  </Text>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      fontSize: '16px',
                    }}
                  >
                    <option value="MALE">{t('male')}</option>
                    <option value="FEMALE">{t('female')}</option>
                    <option value="OTHER">{t('other')}</option>
                    <option value="PREFER_NOT_TO_SAY">
                      {t('preferNotToSay')}
                    </option>
                  </select>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    {t('skillLevel')}
                  </Text>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      fontSize: '16px',
                    }}
                  >
                    {VALID_LEVELS.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {getLevelLabel(lbl)}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    {t('phone')}
                  </Text>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    type="tel"
                  />
                </Box>

                <Button
                  type="submit"
                  colorPalette="green"
                  width="full"
                  size="lg"
                  loading={loading}
                  disabled={!name.trim()}
                >
                  {loading ? t('joining') : t('joinSession')}
                </Button>
              </VStack>
            </form>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('agreementText')}
            </Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterContent />
    </Suspense>
  );
}
