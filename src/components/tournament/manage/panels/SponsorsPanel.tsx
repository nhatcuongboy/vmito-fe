'use client';

import { Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Heart, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SponsorsPanel() {
  const t = useTranslations('pages.tournaments.detail.manage');

  return (
    <VStack gap={4} align="stretch">
      <Heading size="md">{t('panels.sponsors.title')}</Heading>
      <Flex
        direction="column"
        align="center"
        py={8}
        gap={3}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="gray.50"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        <Flex
          w="48px"
          h="48px"
          bg="pink.50"
          _dark={{ bg: 'pink.900' }}
          borderRadius="full"
          align="center"
          justify="center"
        >
          <Heart size={24} color="#D53F8C" />
        </Flex>
        <Text
          fontSize="sm"
          color="gray.500"
          textAlign="center"
          px={4}
          _dark={{ color: 'gray.400' }}
        >
          {t('panels.sponsors.description')}
        </Text>
        <Button
          size="sm"
          variant="outline"
          rightIcon={<ArrowRight size={14} />}
        >
          {t('panels.sponsors.addSponsors')}
        </Button>
      </Flex>
    </VStack>
  );
}
