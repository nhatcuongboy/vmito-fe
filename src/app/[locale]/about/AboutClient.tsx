'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Flex,
  Icon,
  Tabs,
  Badge,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import React, { Suspense } from 'react';
import TopBar from '@/components/ui/TopBar';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import {
  Search,
  Users,
  Calendar,
  Zap,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  QrCode,
  UserPlus,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface AboutClientProps {
  locale: string;
}

function AboutContent({ locale }: AboutClientProps) {
  const t = useTranslations('pages.about');
  const common = useTranslations('common');

  const bgGradient = 'linear(to-br, blue.500, purple.600)';

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar showBackButton />

      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        color="white"
        pt={{ base: '120px', md: '160px' }}
        pb={{ base: '60px', md: '100px' }}
        px={4}
        textAlign="center"
        borderBottomRadius={{ base: '0', md: '3xl' }}
      >
        <Container maxW="container.xl">
          <Badge
            colorPalette="teal"
            variant="solid"
            mb={6}
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
            bg="whiteAlpha.300"
            color="white"
          >
            {t('subtitle')}
          </Badge>
          <Heading
            as="h1"
            size="4xl"
            mb={6}
            letterSpacing="tight"
            fontWeight="extrabold"
          >
            {t('hero.title')}
          </Heading>
          <Text
            fontSize={{ base: 'lg', md: '2xl' }}
            maxW="2xl"
            mx="auto"
            mb={10}
            color="whiteAlpha.900"
            lineHeight="tall"
          >
            {t('hero.subtitle')}
          </Text>
          <Flex gap={4} justify="center" direction={{ base: 'column', sm: 'row' }}>
            <NextLinkButton
              href="/auth/register"
              size="lg"
              bg="white"
              color="blue.600"
              _hover={{ bg: 'gray.100' }}
              fontWeight="bold"
              px={8}
            >
              {t('hero.cta')}
            </NextLinkButton>
            <NextLinkButton
              href="/browse/sessions"
              size="lg"
              variant="outline"
              borderColor="whiteAlpha.500"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              px={8}
            >
              {common('browse')}
            </NextLinkButton>
          </Flex>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxW="container.md" mt="-40px" position="relative" zIndex={1}>
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          p={8}
          borderRadius="2xl"
          boxShadow="xl"
          textAlign="center"
        >
          <Heading as="h2" size="lg" mb={4} color="gray.800" _dark={{ color: 'white' }}>
            {t('mission.title')}
          </Heading>
          <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.300' }}>
            {t('mission.description')}
          </Text>
        </Box>
      </Container>

      {/* Features Tabs */}
      <Container maxW="container.xl" py={20}>
        <Tabs.Root defaultValue="players" variant="line" size="lg">
          <Tabs.List justifyContent="center" mb={12}>
            <Tabs.Trigger value="players" px={8}>
              <Flex align="center">
                <Icon as={Users} mr={2} />
                {t('tabs.players')}
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="hosts" px={8}>
              <Flex align="center">
                <Icon as={Zap} mr={2} />
                {t('tabs.hosts')}
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="players">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={12} alignItems="center">
              <Box>
                <Badge colorPalette="blue" mb={4}>{t('tabs.players')}</Badge>
                <Heading as="h2" size="2xl" mb={6}>
                  {t('players.title')}
                </Heading>
                <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.400' }} mb={8}>
                  {t('players.description')}
                </Text>

                <Stack gap={6}>
                  <FeatureRow
                    icon={Search}
                    title={t('players.features.find.title')}
                    description={t('players.features.find.description')}
                    color="blue.500"
                  />
                  <FeatureRow
                    icon={ShieldCheck}
                    title={t('players.features.fairPlay.title')}
                    description={t('players.features.fairPlay.description')}
                    color="green.500"
                  />
                  <FeatureRow
                    icon={TrendingUp}
                    title={t('players.features.track.title')}
                    description={t('players.features.track.description')}
                    color="purple.500"
                  />
                </Stack>
              </Box>
              <Box
                bg="blue.50"
                _dark={{ bg: 'blue.900' }}
                p={8}
                borderRadius="3xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="400px"
              >
                {/* Decorative Image Placeholder */}
                <Users size={120} color="var(--chakra-colors-blue-300)" />
              </Box>
            </SimpleGrid>
          </Tabs.Content>

          <Tabs.Content value="hosts">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={12} alignItems="center">
              <Box
                order={{ base: 2, md: 1 }}
                bg="purple.50"
                _dark={{ bg: 'purple.900' }}
                p={8}
                borderRadius="3xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="400px"
              >
                {/* Decorative Image Placeholder */}
                <Zap size={120} color="var(--chakra-colors-purple-300)" />
              </Box>
              <Box order={{ base: 1, md: 2 }}>
                <Badge colorPalette="purple" mb={4}>{t('tabs.hosts')}</Badge>
                <Heading as="h2" size="2xl" mb={6}>
                  {t('hosts.title')}
                </Heading>
                <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.400' }} mb={8}>
                  {t('hosts.description')}
                </Text>

                <Stack gap={6}>
                  <FeatureRow
                    icon={Calendar}
                    title={t('hosts.features.manage.title')}
                    description={t('hosts.features.manage.description')}
                    color="purple.500"
                  />
                  <FeatureRow
                    icon={QrCode}
                    title={t('hosts.features.tools.title')}
                    description={t('hosts.features.tools.description')}
                    color="orange.500"
                  />
                  <FeatureRow
                    icon={UserPlus}
                    title={t('hosts.features.community.title')}
                    description={t('hosts.features.community.description')}
                    color="teal.500"
                  />
                </Stack>
              </Box>
            </SimpleGrid>
          </Tabs.Content>
        </Tabs.Root>
      </Container>


      {/* How it Works Section */}
      <Box bg="white" _dark={{ bg: 'gray.800' }} py={20}>
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={16} size="2xl">
            {t('howItWorks.title')}
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
            <StepCard
              number="1"
              title={t('howItWorks.steps.step1.title')}
              description={t('howItWorks.steps.step1.description')}
            />
            <StepCard
              number="2"
              title={t('howItWorks.steps.step2.title')}
              description={t('howItWorks.steps.step2.description')}
            />
            <StepCard
              number="3"
              title={t('howItWorks.steps.step3.title')}
              description={t('howItWorks.steps.step3.description')}
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxW="container.lg" py={20}>
        <Heading textAlign="center" mb={12} size="xl">
          {t('faq.title')}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
          <FaqCard
            question={t('faq.q1.question')}
            answer={t('faq.q1.answer')}
          />
          <FaqCard
            question={t('faq.q2.question')}
            answer={t('faq.q2.answer')}
          />
          <FaqCard
            question={t('faq.q3.question')}
            answer={t('faq.q3.answer')}
          />
        </SimpleGrid>
      </Container>

      {/* Footer CTA */}
      <Box bg="gray.900" color="white" py={16} textAlign="center">
        <Container maxW="container.md">
          <Heading size="2xl" mb={6}>{t('hero.title')}</Heading>
          <Text fontSize="xl" color="gray.400" mb={10}>
            {t('hero.subtitle')}
          </Text>
          <NextLinkButton
            href="/auth/register"
            size="xl"
            colorPalette="blue"
            px={10}
            py={7}
            fontSize="lg"
            fontWeight="bold"
          >
            {t('hero.cta')} <ArrowRight className="ml-2" />
          </NextLinkButton>
        </Container>
      </Box>

    </Box>
  );
}

// Helper Components
const FeatureRow = ({ icon: Icon, title, description, color }: any) => (
  <Flex gap={4}>
    <Box
      p={3}
      borderRadius="xl"
      bg={`${color.split('.')[0]}.100`}
      color={color}
      _dark={{ bg: `${color.split('.')[0]}.900` }}
      h="fit-content"
    >
      <Icon size={24} />
    </Box>
    <Box>
      <Heading size="md" mb={1}>{title}</Heading>
      <Text color="gray.600" _dark={{ color: 'gray.400' }}>{description}</Text>
    </Box>
  </Flex>
);

const StepCard = ({ number, title, description }: any) => (
  <Box textAlign="center" p={6} borderRadius="2xl" _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }} transition="all 0.2s">
    <Flex
      w={12}
      h={12}
      borderRadius="full"
      bg="blue.600"
      color="white"
      align="center"
      justify="center"
      fontSize="xl"
      fontWeight="bold"
      mx="auto"
      mb={6}
    >
      {number}
    </Flex>
    <Heading size="lg" mb={3}>{title}</Heading>
    <Text color="gray.600" _dark={{ color: 'gray.400' }}>{description}</Text>
  </Box>
);

const FaqCard = ({ question, answer }: any) => (
  <Box p={6} borderRadius="xl" borderWidth="1px" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }}>
    <Flex gap={3} mb={2}>
      <Icon as={HelpCircle} color="blue.500" mt={1} />
      <Heading size="md">{question}</Heading>
    </Flex>
    <Text color="gray.600" _dark={{ color: 'gray.400' }} ml={9}>
      {answer}
    </Text>
  </Box>
);


export default function AboutClient(props: AboutClientProps) {
  return (
    <Suspense>
      <AboutContent {...props} />
    </Suspense>
  );
}
