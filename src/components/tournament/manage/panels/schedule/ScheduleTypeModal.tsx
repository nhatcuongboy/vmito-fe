'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { ScheduleType } from '@/lib/api/types';
import { MapPin, Clock, Calendar, ArrowRight } from 'lucide-react';

interface ScheduleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType?: ScheduleType;
  onConfirm: (type: ScheduleType) => void;
  isLoading?: boolean;
}

export default function ScheduleTypeModal({
  isOpen,
  onClose,
  currentType,
  onConfirm,
  isLoading,
}: ScheduleTypeModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.scheduleType'
  );
  const [selected, setSelected] = useState<ScheduleType>(
    currentType || ScheduleType.NEXT_AVAILABLE
  );

  const handleConfirm = () => {
    onConfirm(selected);
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      primaryActionText="Confirm"
      onPrimaryAction={handleConfirm}
      isPrimaryLoading={isLoading}
      secondaryActionText="Cancel"
      size="lg"
    >
      <VStack gap={3} align="stretch">
        {/* Next available court option */}
        <Box
          borderWidth="2px"
          borderColor={
            selected === ScheduleType.NEXT_AVAILABLE ? 'gray.800' : 'gray.200'
          }
          borderRadius="xl"
          p={4}
          cursor="pointer"
          onClick={() => setSelected(ScheduleType.NEXT_AVAILABLE)}
          position="relative"
          transition="border-color 0.2s"
        >
          {/* Recommended badge */}
          <Flex
            justify="center"
            position="absolute"
            top="-12px"
            left={0}
            right={0}
          >
            <Box
              bg="gray.100"
              px={3}
              py={0.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
            >
              {t('recommended')}
            </Box>
          </Flex>

          <Flex align="flex-start" gap={3}>
            <Box mt={1}>
              <Box
                w="20px"
                h="20px"
                borderRadius="full"
                borderWidth="2px"
                borderColor={
                  selected === ScheduleType.NEXT_AVAILABLE
                    ? 'gray.800'
                    : 'gray.300'
                }
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {selected === ScheduleType.NEXT_AVAILABLE && (
                  <Box w="10px" h="10px" borderRadius="full" bg="gray.800" />
                )}
              </Box>
            </Box>
            <Box flex={1}>
              <Heading size="sm" mb={1}>
                {t('nextAvailable.title')}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {t('nextAvailable.description')}
              </Text>
            </Box>
            <Flex gap={1} align="center" bg="gray.50" p={2} borderRadius="lg">
              <Calendar size={18} />
              <ArrowRight size={14} />
              <MapPin size={18} />
            </Flex>
          </Flex>
        </Box>

        {/* Assigned courts & times option */}
        <Box
          borderWidth="2px"
          borderColor={
            selected === ScheduleType.ASSIGNED ? 'gray.800' : 'gray.200'
          }
          borderRadius="xl"
          p={4}
          cursor="pointer"
          onClick={() => setSelected(ScheduleType.ASSIGNED)}
          transition="border-color 0.2s"
        >
          <Flex align="flex-start" gap={3}>
            <Box mt={1}>
              <Box
                w="20px"
                h="20px"
                borderRadius="full"
                borderWidth="2px"
                borderColor={
                  selected === ScheduleType.ASSIGNED ? 'gray.800' : 'gray.300'
                }
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {selected === ScheduleType.ASSIGNED && (
                  <Box w="10px" h="10px" borderRadius="full" bg="gray.800" />
                )}
              </Box>
            </Box>
            <Box flex={1}>
              <Heading size="sm" mb={1}>
                {t('assigned.title')}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {t('assigned.description')}
              </Text>
            </Box>
            <Flex gap={1} align="center" bg="gray.50" p={2} borderRadius="lg">
              <MapPin size={16} />
              <Clock size={16} />
              <ArrowRight size={14} />
              <Calendar size={18} />
            </Flex>
          </Flex>
        </Box>
      </VStack>
    </VModal>
  );
}
