'use client';

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  QrCode,
  ImagePlus,
  CheckCircle2,
  History,
  Settings,
} from 'lucide-react';
import * as React from 'react';

interface IGuideCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const GuideCard = ({ icon: Icon, title, description }: IGuideCardProps) => (
  <HStack
    bg="bg"
    _dark={{ bg: 'gray.800' }}
    p={4}
    borderRadius="lg"
    boxShadow="sm"
    gap={4}
    align="start"
  >
    <Box
      bg="green.50"
      _dark={{ bg: 'green.950' }}
      p={2.5}
      borderRadius="lg"
      color="green.500"
      flexShrink={0}
    >
      <Icon size={22} />
    </Box>
    <VStack align="start" gap={1}>
      <Text fontWeight="semibold" fontSize="sm">
        {title}
      </Text>
      <Text color="fg.muted" fontSize="xs">
        {description}
      </Text>
    </VStack>
  </HStack>
);

const PaymentGuideSection = () => {
  const t = useTranslations('pages.guide.payments');

  const playerSteps = [
    { icon: QrCode, key: 'player.viewQR' },
    { icon: ImagePlus, key: 'player.submitProof' },
    { icon: History, key: 'player.history' },
  ];

  const hostSteps = [
    { icon: Settings, key: 'host.setup' },
    { icon: CheckCircle2, key: 'host.approve' },
    { icon: History, key: 'host.transactions' },
  ];

  return (
    <Box id="payments" py={{ base: 12, md: 16 }}>
      <Container maxW="container.lg">
        <VStack gap={10}>
          <VStack gap={3} textAlign="center">
            <Heading size={{ base: 'xl', md: '2xl' }}>{t('title')}</Heading>
            <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
              {t('subtitle')}
            </Text>
          </VStack>

          {/* Fee models info */}
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            gap={6}
            w="full"
            maxW="600px"
          >
            <Box
              bg="blue.50"
              _dark={{ bg: 'blue.950' }}
              p={5}
              borderRadius="xl"
              textAlign="center"
            >
              <Text
                fontWeight="bold"
                color="blue.600"
                _dark={{ color: 'blue.300' }}
                mb={1}
              >
                {t('models.fixed.title')}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {t('models.fixed.description')}
              </Text>
            </Box>
            <Box
              bg="purple.50"
              _dark={{ bg: 'purple.950' }}
              p={5}
              borderRadius="xl"
              textAlign="center"
            >
              <Text
                fontWeight="bold"
                color="purple.600"
                _dark={{ color: 'purple.300' }}
                mb={1}
              >
                {t('models.split.title')}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {t('models.split.description')}
              </Text>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={10} w="full">
            {/* Player */}
            <VStack align="start" gap={4}>
              <Box
                bg="blue.50"
                _dark={{ bg: 'blue.950' }}
                px={3}
                py={1}
                borderRadius="full"
              >
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color="blue.600"
                  _dark={{ color: 'blue.300' }}
                >
                  {t('player.badge')}
                </Text>
              </Box>
              <VStack gap={3} w="full">
                {playerSteps.map((step) => (
                  <GuideCard
                    key={step.key}
                    icon={step.icon}
                    title={t(`${step.key}.title`)}
                    description={t(`${step.key}.description`)}
                  />
                ))}
              </VStack>
            </VStack>

            {/* Host */}
            <VStack align="start" gap={4}>
              <Box
                bg="orange.50"
                _dark={{ bg: 'orange.950' }}
                px={3}
                py={1}
                borderRadius="full"
              >
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color="orange.600"
                  _dark={{ color: 'orange.300' }}
                >
                  {t('host.badge')}
                </Text>
              </Box>
              <VStack gap={3} w="full">
                {hostSteps.map((step) => (
                  <GuideCard
                    key={step.key}
                    icon={step.icon}
                    title={t(`${step.key}.title`)}
                    description={t(`${step.key}.description`)}
                  />
                ))}
              </VStack>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default PaymentGuideSection;
