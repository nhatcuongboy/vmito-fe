'use client';

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Flex,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { UserPlus, Search, Trophy } from 'lucide-react';
import * as React from 'react';

export default function HowItWorksSection() {
  const t = useTranslations('pages.about.howItWorks');

  const steps = [
    {
      icon: UserPlus,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
    },
    {
      icon: Search,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
    },
    {
      icon: Trophy,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
    },
  ];

  return (
    <Box id="how-it-works" py={20} bg="bg.muted" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl">
        <Heading textAlign="center" mb={16} size="2xl">
          {t('title')}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
          {steps.map((step, index) => (
            <Flex
              key={index}
              direction="column"
              align="center"
              textAlign="center"
            >
              <Box
                bg="bg"
                _dark={{ bg: 'gray.800' }}
                p={6}
                borderRadius="full"
                boxShadow="lg"
                mb={6}
                color="green.500"
              >
                <step.icon size={40} />
              </Box>
              <Heading size="lg" mb={4}>
                {step.title}
              </Heading>
              <Text
                fontSize="lg"
                color="fg.muted"
                _dark={{ color: 'gray.400' }}
              >
                {step.description}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
