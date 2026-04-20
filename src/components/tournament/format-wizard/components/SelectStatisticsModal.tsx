'use client';

import React, { useState } from 'react';
import { Box, Flex, Portal, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { StatisticItem } from '../types';
import { AVAILABLE_STATISTICS } from '../constants';

interface SelectStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (statistics: StatisticItem[]) => void;
  selectedStatistics: StatisticItem[];
}

export default function SelectStatisticsModal({
  isOpen,
  onClose,
  onConfirm,
  selectedStatistics,
}: SelectStatisticsModalProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard.config.rr');

  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedStatistics.map((s) => s.id))
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedStatistics.map((s) => s.id)));
    }
  }, [isOpen, selectedStatistics]);

  if (!isOpen) return null;

  const toggle = (item: StatisticItem) => {
    // Required items cannot be deselected
    if (item.required) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const newStats = AVAILABLE_STATISTICS.filter((s) => selected.has(s.id));
    onConfirm(newStats);
    onClose();
  };

  const handleBackdropClick = () => onClose();
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={2000}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        onClick={handleBackdropClick}
      >
        <Box
          bg="white"
          borderRadius="lg"
          boxShadow="xl"
          w="full"
          maxW="480px"
          maxH="85vh"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          onClick={handleContentClick}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={6}
            py={4}
            borderBottomWidth="1px"
            borderColor="gray.100"
            flexShrink={0}
          >
            <Text fontSize="lg" fontWeight="bold">
              {t('selectStatisticsTitle')}
            </Text>
            <Box
              as="button"
              onClick={onClose}
              color="gray.500"
              _hover={{ color: 'gray.700' }}
              cursor="pointer"
            >
              <X size={20} />
            </Box>
          </Flex>

          {/* Content — scrollable */}
          <Box flex={1} overflowY="auto" px={6} py={4}>
            <Flex direction="column" gap={2}>
              {AVAILABLE_STATISTICS.map((stat) => {
                const isSelected = selected.has(stat.id);
                const isRequired = !!stat.required;
                return (
                  <Box
                    key={stat.id}
                    borderWidth="1px"
                    borderColor={isSelected ? 'black' : 'gray.200'}
                    borderRadius="md"
                    px={4}
                    py={3}
                    cursor={isRequired ? 'default' : 'pointer'}
                    bg={isSelected ? 'gray.50' : 'white'}
                    onClick={() => toggle(stat)}
                    _hover={isRequired ? {} : { borderColor: 'gray.400' }}
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={3}>
                        <Flex
                          w="28px"
                          h="28px"
                          bg="gray.100"
                          borderRadius="md"
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="gray.600"
                          >
                            {stat.abbreviation}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" fontWeight="medium">
                          {t(`statisticItems.${stat.label}`)}
                        </Text>
                      </Flex>
                      {isRequired && (
                        <Box px={2} py={0.5} bg="gray.100" borderRadius="md">
                          <Text fontSize="xs" color="gray.500">
                            {t('required')}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>

          {/* Footer */}
          <Box
            px={6}
            py={4}
            borderTopWidth="1px"
            borderColor="gray.100"
            flexShrink={0}
          >
            <Text fontSize="xs" color="gray.400" mb={3} textAlign="center">
              {t('notSeeingStatisticHint')}{' '}
              <Box as="span" color="blue.500">
                {t('notSeeingStatisticContact')} support@tourny.ca
              </Box>
            </Text>
            <Flex justify="space-between" align="center">
              <Button variant="ghost" colorPalette="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorPalette="gray"
                onClick={handleConfirm}
                bg="gray.900"
                color="white"
              >
                Confirm
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
}
