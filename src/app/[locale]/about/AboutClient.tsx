'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  buttonLink: string;
  accentColor?: string;
};

type StartGuideProps = {
  title: string;
  steps: string[];
  buttonText: string;
  buttonLink: string;
  primary: boolean;
};

interface AboutClientProps {
  locale: string;
}

function AboutContent({ locale }: AboutClientProps) {
  const t = useTranslations('pages.home');
  const nav = useTranslations('navigation');
  const common = useTranslations('common');

  const bgGradient = 'linear(to-r, teal.100, green.100)';
  const accentColor = 'blue.500';

  return (
    <Box minH="100vh" pb="80px">
      {/* Top Bar */}
      <TopBar showBackButton={true} />

      {/* Hero Section with Gradient */}
      <Box
        bgGradient={bgGradient}
        py={20}
        px={4}
        textAlign="center"
        pt="calc(80px + env(safe-area-inset-top))"
      >
        <Container maxW="container.xl">
          <Heading
            as="h1"
            size="4xl"
            mb={6}
            fontWeight="extrabold"
            lineHeight="shorter"
            textAlign="center"
            bgGradient="linear(to-r, blue.500, purple.500, cyan.500)"
            bgClip="text"
            color="transparent"
            css={{
              // Fallback for older browsers
              background:
                'linear-gradient(to right, #3182ce, #9f7aea, #00b3d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              // Ensure text is visible if gradient fails
              '@supports not (-webkit-background-clip: text)': {
                color: 'blue.500',
              },
            }}
          >
            {common('appName')}
          </Heading>
          <Text
            fontSize="xl"
            maxW="2xl"
            mx="auto"
            mb={10}
            color="gray.600"
            _dark={{ color: 'gray.300' }}
          >
            {t('description')}
          </Text>
          <Flex gap={6} justify="center" flexWrap="wrap">
            <NextLinkButton
              href="/auth/signin"
              size="lg"
              colorPalette="blue"
              px={8}
              py={7}
              fontSize="lg"
              fontWeight="bold"
              _hover={{ transform: 'translateY(-3px)' }}
              transition="all 0.2s"
            >
              {t('loginButton')}
              <ArrowRight className="ml-2" size={18} />
            </NextLinkButton>
            <NextLinkButton
              href="/join-by-code"
              size="lg"
              variant="outline"
              px={8}
              py={7}
              fontSize="lg"
              _hover={{ transform: 'translateY(-3px)' }}
              transition="all 0.2s"
            >
              {t('joinButton')}
              <Users className="ml-2" size={18} />
            </NextLinkButton>
            <NextLinkButton
              href="/browse/sessions"
              size="lg"
              variant="outline"
              colorPalette="green"
              px={8}
              py={7}
              fontSize="lg"
              _hover={{ transform: 'translateY(-3px)' }}
              transition="all 0.2s"
            >
              {t('browseButton')}
              <Search className="ml-2" size={18} />
            </NextLinkButton>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={16}>
        {/* Features with animated cards */}
        <Stack gap={16}>
          {/* Description section */}
          <Grid
            templateColumns={{ base: '1fr', md: '1fr 1fr' }}
            gap={12}
            w="full"
            alignItems="center"
          >
            <Box>
              <Heading as="h2" size="xl" mb={6}>
                {t('sectionTitle')}{' '}
                <Text as="span" color="blue.500">
                  {t('sectionTitleHighlight')}
                </Text>
              </Heading>
              <Text
                fontSize="lg"
                mb={6}
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                lineHeight="taller"
              >
                {t('sectionDescription')}
              </Text>
              <Flex gap={4} flexDir={{ base: 'column', sm: 'row' }}>
                <NextLinkButton
                  href="/auth/signin"
                  colorPalette="blue"
                  size="lg"
                  fontWeight="bold"
                >
                  {t('getStarted')}
                  <ArrowRight className="ml-2" size={18} />
                </NextLinkButton>
                <NextLinkButton href="#features" variant="ghost" size="lg">
                  {t('exploreFeatures')}
                  <ArrowUpRight className="ml-2" size={18} />
                </NextLinkButton>
              </Flex>
            </Box>
            <Flex justify="center" align="center">
              <Box
                bg="gray.100"
                _dark={{ bg: 'gray.700' }}
                borderRadius="xl"
                p={8}
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="300px"
                w="full"
              >
                <Calendar size={64} color="var(--chakra-colors-gray-400)" />
              </Box>
            </Flex>
          </Grid>

          {/* Features Section */}
          <Box id="features" width="full" pt={8}>
            <Box textAlign="center" mb={12} position="relative">
              <Heading as="h2" size="xl">
                {t('keyFeatures')}
              </Heading>
              <Box
                w="80px"
                h="4px"
                bg="blue.500"
                position="absolute"
                bottom="-12px"
                left="50%"
                transform="translateX(-50%)"
              />
            </Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
              <FeatureCard
                title={t('features.sessionManagement.title')}
                description={t('features.sessionManagement.description')}
                icon={Calendar}
                buttonText={t('features.sessionManagement.buttonText')}
                buttonLink="/host"
                accentColor={accentColor}
              />
              <FeatureCard
                title={t('features.playerTracking.title')}
                description={t('features.playerTracking.description')}
                icon={Users}
                buttonText={t('features.playerTracking.buttonText')}
                buttonLink="/host"
                accentColor={accentColor}
              />
              <FeatureCard
                title={t('features.sessionHistory.title')}
                description={t('features.sessionHistory.description')}
                icon={Calendar}
                buttonText={t('features.sessionHistory.buttonText')}
                buttonLink="/host/history"
                accentColor={accentColor}
              />
            </SimpleGrid>
          </Box>

          {/* Getting Started Section */}
          <Box
            width="full"
            bg="gray.50"
            _dark={{ bg: 'gray.800' }}
            p={{ base: 6, md: 12 }}
            borderRadius="xl"
            boxShadow="lg"
          >
            <Heading as="h2" size="xl" mb={8} textAlign="center">
              {t('gettingStarted')}
            </Heading>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={12}>
              <StartGuide
                title={t('guides.hosts.title')}
                steps={[
                  t('guides.hosts.step1'),
                  t('guides.hosts.step2'),
                  t('guides.hosts.step3'),
                  t('guides.hosts.step4'),
                  t('guides.hosts.step5'),
                ]}
                buttonText={t('guides.hosts.buttonText')}
                buttonLink="/host"
                primary={true}
              />
              <StartGuide
                title={t('guides.players.title')}
                steps={[
                  t('guides.players.step1'),
                  t('guides.players.step2'),
                  t('guides.players.step3'),
                  t('guides.players.step4'),
                  t('guides.players.step5'),
                ]}
                buttonText={t('guides.players.buttonText')}
                buttonLink="/join"
                primary={false}
              />
            </Grid>
          </Box>
        </Stack>
      </Container>

      {/* Footer */}
      <Box bg="gray.50" _dark={{ bg: 'gray.900' }} py={10}>
        <Container maxW="container.xl">
          <Flex direction="column" align="center">
            <Text color="gray.500" fontSize="sm" suppressHydrationWarning>
              © {new Date().getFullYear()} {common('appName')}. {t('copyright')}
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

export default function AboutClient(props: AboutClientProps) {
  return (
    <Suspense>
      <AboutContent {...props} />
    </Suspense>
  );
}

// Feature Card Component
function FeatureCard({
  title,
  description,
  icon,
  buttonText,
  buttonLink,
  accentColor,
}: FeatureCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      p={5}
      h="full"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      boxShadow="md"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'xl',
        borderColor: 'blue.500',
      }}
    >
      <Box pb={2}>
        <Flex align="center" mb={3}>
          <Box color="blue.500" mr={2}>
            {React.createElement(icon, { size: 24 })}
          </Box>
          <Heading size="md">{title}</Heading>
        </Flex>
      </Box>
      <Box pt={0} pb={4}>
        <Text color="gray.500" _dark={{ color: 'gray.400' }}>
          {description}
        </Text>
      </Box>
      <Box pt={0}>
        <NextLinkButton
          href={buttonLink}
          variant="outline"
          colorPalette="blue"
          width="full"
        >
          {buttonText}
          <Plus className="ml-2" size={16} />
        </NextLinkButton>
      </Box>
    </Box>
  );
}

// Start Guide Component
function StartGuide({
  title,
  steps,
  buttonText,
  buttonLink,
  primary,
}: StartGuideProps) {
  return (
    <Stack gap={6} alignItems="flex-start">
      <Heading size="lg" fontWeight="bold">
        {title}
      </Heading>
      <Stack gap={3}>
        {steps.map((step, index) => (
          <Flex key={index} alignItems="flex-start">
            <Box color={primary ? 'blue.500' : 'green.500'} mr={2} mt={1}>
              <Check size={16} />
            </Box>
            <Text>{step}</Text>
          </Flex>
        ))}
      </Stack>
      <NextLinkButton
        href={buttonLink}
        colorPalette={primary ? 'blue' : 'gray'}
        mt={4}
        alignSelf="flex-start"
      >
        {buttonText}
        <ArrowRight className="ml-2" size={16} />
      </NextLinkButton>
    </Stack>
  );
}
