'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { ClipboardCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RegistrationPanel() {
  const t = useTranslations('pages.tournaments.detail.manage');

  return (
    <VStack gap={4} align="stretch">
      <Heading size="md">{t('panels.registration.title')}</Heading>
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
        <Box color="gray.400" _dark={{ color: 'gray.500' }}>
          <ClipboardCheck size={32} />
        </Box>
        <Text
          fontSize="sm"
          color="gray.500"
          textAlign="center"
          px={4}
          _dark={{ color: 'gray.400' }}
        >
          {t('panels.registration.description')}
        </Text>
      </Flex>
    </VStack>
  );
}
