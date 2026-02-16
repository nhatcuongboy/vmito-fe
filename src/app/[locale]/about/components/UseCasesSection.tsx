'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Users,
  Crown,
  Search,
  Scale,
  Activity,
  Calendar,
  QrCode,
  Heart,
} from 'lucide-react';
import * as React from 'react';

export default function UseCasesSection() {
  const t = useTranslations('pages.about.useCases');
  const tPlayers = useTranslations('pages.about.useCases.players');
  const tHosts = useTranslations('pages.about.useCases.hosts');

  return (
    <Box pb={20} pt={10}>
      <Container maxW="container.xl">
        <Heading textAlign="center" mb={10} size="2xl">
          {t('title')}
        </Heading>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={12}>
          {/* Players Column */}
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            p={8}
            borderRadius="2xl"
            boxShadow="xl"
            borderTop="4px solid"
            borderColor="blue.500"
          >
            <Flex align="center" mb={6} gap={4}>
              <Box p={3} bg="blue.100" color="blue.600" borderRadius="full">
                <Users size={32} />
              </Box>
              <Heading size="lg">{tPlayers('title')}</Heading>
            </Flex>
            <Text
              fontSize="lg"
              mb={8}
              color="gray.600"
              _dark={{ color: 'gray.400' }}
            >
              {tPlayers('description')}
            </Text>

            <SimpleGrid columns={1} gap={6}>
              <FeatureItem
                icon={Search}
                title={tPlayers('features.find.title')}
                desc={tPlayers('features.find.description')}
                color="blue"
              />
              <FeatureItem
                icon={Scale}
                title={tPlayers('features.fairPlay.title')}
                desc={tPlayers('features.fairPlay.description')}
                color="blue"
              />
              <FeatureItem
                icon={Activity}
                title={tPlayers('features.track.title')}
                desc={tPlayers('features.track.description')}
                color="blue"
              />
            </SimpleGrid>
          </Box>

          {/* Hosts Column */}
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            p={8}
            borderRadius="2xl"
            boxShadow="xl"
            borderTop="4px solid"
            borderColor="green.600"
          >
            <Flex align="center" mb={6} gap={4}>
              <Box p={3} bg="green.100" color="green.600" borderRadius="full">
                <Crown size={32} />
              </Box>
              <Heading size="lg">{tHosts('title')}</Heading>
            </Flex>
            <Text
              fontSize="lg"
              mb={8}
              color="gray.600"
              _dark={{ color: 'gray.400' }}
            >
              {tHosts('description')}
            </Text>

            <SimpleGrid columns={1} gap={6}>
              <FeatureItem
                icon={Calendar}
                title={tHosts('features.manage.title')}
                desc={tHosts('features.manage.description')}
                color="green"
              />
              <FeatureItem
                icon={QrCode}
                title={tHosts('features.tools.title')}
                desc={tHosts('features.tools.description')}
                color="green"
              />
              <FeatureItem
                icon={Heart}
                title={tHosts('features.community.title')}
                desc={tHosts('features.community.description')}
                color="green"
              />
            </SimpleGrid>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeatureItem({ icon: Icon, title, desc, color }: any) {
  return (
    <Flex gap={4}>
      <Box mt={1} color={`${color}.500`} minW="24px">
        <Icon size={24} />
      </Box>
      <Box>
        <Heading size="md" mb={1}>
          {title}
        </Heading>
        <Text color="gray.500" fontSize="sm">
          {desc}
        </Text>
      </Box>
    </Flex>
  );
}
