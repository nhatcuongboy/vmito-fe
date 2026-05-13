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
  Search,
  CalendarPlus,
  UserCheck,
  LayoutGrid,
  Settings,
  CheckCircle,
  ListFilter,
  XCircle,
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

const SessionGuideSection = () => {
  const t = useTranslations('pages.guide.sessions');

  const playerSteps = [
    { icon: Search, key: 'player.search' },
    { icon: ListFilter, key: 'player.filter' },
    { icon: UserCheck, key: 'player.join' },
    { icon: XCircle, key: 'player.cancel' },
  ];

  const hostSteps = [
    { icon: CalendarPlus, key: 'host.create' },
    { icon: UserCheck, key: 'host.managePlayers' },
    { icon: LayoutGrid, key: 'host.courts' },
    { icon: Settings, key: 'host.autoAssign' },
    { icon: CheckCircle, key: 'host.finish' },
  ];

  return (
    <Box id="sessions" py={{ base: 12, md: 16 }}>
      <Container maxW="container.lg">
        <VStack gap={10}>
          <VStack gap={3} textAlign="center">
            <Heading size={{ base: 'xl', md: '2xl' }}>{t('title')}</Heading>
            <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
              {t('subtitle')}
            </Text>
          </VStack>

          {/* Screenshot placeholder */}
          <Box
            w="full"
            maxW="500px"
            h="200px"
            bg="gray.100"
            _dark={{ bg: 'gray.800' }}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="md"
          >
            <Text fontSize="sm" color="fg.muted">
              📷 Session overview screenshot
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={10} w="full">
            {/* Player */}
            <VStack align="start" gap={4}>
              <HStack gap={2}>
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
              </HStack>
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
              <HStack gap={2}>
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
              </HStack>
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

export default SessionGuideSection;
