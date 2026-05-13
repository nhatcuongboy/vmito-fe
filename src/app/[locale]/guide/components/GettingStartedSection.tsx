'use client';

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { UserPlus, LogIn, UserCog } from 'lucide-react';
import * as React from 'react';

const GettingStartedSection = () => {
  const t = useTranslations('pages.guide.gettingStarted');

  const steps = [
    {
      icon: UserPlus,
      titleKey: 'register.title',
      descKey: 'register.description',
      badge: '1',
    },
    {
      icon: LogIn,
      titleKey: 'login.title',
      descKey: 'login.description',
      badge: '2',
    },
    {
      icon: UserCog,
      titleKey: 'profile.title',
      descKey: 'profile.description',
      badge: '3',
    },
  ];

  return (
    <Box
      id="getting-started"
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

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} w="full">
            {steps.map((step, index) => (
              <VStack
                key={index}
                bg="bg"
                _dark={{ bg: 'gray.800' }}
                p={6}
                borderRadius="xl"
                boxShadow="sm"
                gap={4}
                align="center"
                textAlign="center"
              >
                <Box position="relative">
                  <Box
                    bg="green.50"
                    _dark={{ bg: 'green.950' }}
                    p={4}
                    borderRadius="full"
                    color="green.500"
                  >
                    <step.icon size={32} />
                  </Box>
                  <Badge
                    position="absolute"
                    top={-1}
                    right={-1}
                    bg="green.500"
                    color="white"
                    borderRadius="full"
                    fontSize="xs"
                    w={6}
                    h={6}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {step.badge}
                  </Badge>
                </Box>
                <Heading size="md">{t(step.titleKey)}</Heading>
                <Text color="fg.muted" fontSize="sm">
                  {t(step.descKey)}
                </Text>
                {/* Screenshot placeholder */}
                <Box
                  w="full"
                  h="120px"
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="xs" color="fg.muted">
                    📷 Screenshot
                  </Text>
                </Box>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default GettingStartedSection;
