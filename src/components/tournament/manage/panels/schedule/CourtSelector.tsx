'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { TournamentCourt } from '@/lib/api/types';

interface CourtSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  courts: TournamentCourt[];
  selectedCourtIds: string[];
  onConfirm: (courtIds: string[]) => void;
  venueName?: string;
}

export default function CourtSelector({
  isOpen,
  onClose,
  courts,
  selectedCourtIds,
  onConfirm,
  venueName,
}: CourtSelectorProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.courtSelector'
  );
  const [selected, setSelected] = useState<string[]>(selectedCourtIds);

  const isAllSelected = selected.length === courts.length;

  const handleToggle = (courtId: string) => {
    setSelected((prev) =>
      prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId]
    );
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(courts.map((c) => c.id));
    }
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      primaryActionText={t('confirm')}
      onPrimaryAction={handleConfirm}
      secondaryActionText={t('close')}
      size="sm"
      zIndex={1500}
      headerRightContent={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleAll}
          fontWeight="medium"
        >
          {isAllSelected ? t('deselectAll') : t('selectAll')}
        </Button>
      }
    >
      <VStack gap={3} align="stretch">
        {courts.map((court) => {
          const isSelected = selected.includes(court.id);
          return (
            <Box
              key={court.id}
              borderWidth="2px"
              borderColor={isSelected ? 'gray.800' : 'gray.200'}
              borderRadius="xl"
              p={4}
              cursor="pointer"
              onClick={() => handleToggle(court.id)}
              transition="border-color 0.2s"
            >
              <Flex align="center" gap={3}>
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  borderWidth="2px"
                  borderColor={isSelected ? 'gray.800' : 'gray.300'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {isSelected && (
                    <Box w="10px" h="10px" borderRadius="full" bg="gray.800" />
                  )}
                </Box>
                <Box>
                  <Text fontWeight="semibold">
                    {court.courtName || `Court ${court.courtNumber}`}
                  </Text>
                  {venueName && (
                    <Text fontSize="sm" color="gray.500">
                      {venueName}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </VModal>
  );
}
