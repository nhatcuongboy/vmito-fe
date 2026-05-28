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
import { PlusCircle, UserPlus, Users, Settings } from 'lucide-react';
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

const ClubGuideSection = () => {
  const t = useTranslations('pages.guide.clubs');

  const steps = [
    { icon: PlusCircle, key: 'create' },
    { icon: UserPlus, key: 'join' },
    { icon: Users, key: 'members' },
    { icon: Settings, key: 'fees' },
  ];

  return (
    <Box
      id="clubs"
      py={{ base: 12, md: 16 }}
      bg="bg.muted"
      _dark={{ bg: 'gray.900' }}
    >
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
              📷 Club overview screenshot
            </Text>
          </Box>

          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            gap={4}
            w="full"
            maxW="700px"
          >
            {steps.map((step) => (
              <GuideCard
                key={step.key}
                icon={step.icon}
                title={t(`${step.key}.title`)}
                description={t(`${step.key}.description`)}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default ClubGuideSection;
