'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { X, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TourResumeChipProps {
  onResume: () => void;
  onDismiss: () => void;
}

/**
 * Small floating pill shown while the product tour is paused or the user
 * navigated away from the page of the current step. Resumes the tour on
 * click; the X permanently skips it.
 */
const TourResumeChip = ({ onResume, onDismiss }: TourResumeChipProps) => {
  const t = useTranslations('productTour');

  return (
    <Flex
      position="fixed"
      bottom={{ base: '88px', md: '24px' }}
      right="16px"
      zIndex={1400}
      align="center"
      gap={1}
      bg="green.600"
      color="white"
      borderRadius="full"
      boxShadow="lg"
      pl={3}
      pr={1}
      py={1.5}
    >
      <Flex
        as="button"
        align="center"
        gap={1.5}
        onClick={onResume}
        cursor="pointer"
      >
        <PlayCircle size={16} />
        <Text fontSize="sm" fontWeight="semibold">
          {t('resume')}
        </Text>
      </Flex>
      <Box
        as="button"
        onClick={onDismiss}
        aria-label={t('skip')}
        cursor="pointer"
        borderRadius="full"
        p={1}
        _hover={{ bg: 'green.700' }}
      >
        <X size={14} />
      </Box>
    </Flex>
  );
};

export default TourResumeChip;
