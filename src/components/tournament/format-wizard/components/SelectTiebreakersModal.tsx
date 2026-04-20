'use client';

import React, { useState } from 'react';
import { Box, Flex, Grid, Portal, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { TiebreakerItem } from '../types';
import { AVAILABLE_TIEBREAKERS } from '../constants';

interface SelectTiebreakersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (overall: TiebreakerItem[], headToHead: TiebreakerItem[]) => void;
  selectedOverall: TiebreakerItem[];
  selectedHeadToHead: TiebreakerItem[];
}

export default function SelectTiebreakersModal({
  isOpen,
  onClose,
  onConfirm,
  selectedOverall,
  selectedHeadToHead,
}: SelectTiebreakersModalProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard.config.rr');

  const [overallSelected, setOverallSelected] = useState<Set<string>>(
    new Set(selectedOverall.map((tb) => tb.id))
  );
  const [headToHeadSelected, setHeadToHeadSelected] = useState<Set<string>>(
    new Set(selectedHeadToHead.map((tb) => tb.id))
  );

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setOverallSelected(new Set(selectedOverall.map((tb) => tb.id)));
      setHeadToHeadSelected(new Set(selectedHeadToHead.map((tb) => tb.id)));
    }
  }, [isOpen, selectedOverall, selectedHeadToHead]);

  if (!isOpen) return null;

  const toggleOverall = (id: string) => {
    setOverallSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleHeadToHead = (id: string) => {
    setHeadToHeadSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const newOverall = AVAILABLE_TIEBREAKERS.filter((tb) =>
      overallSelected.has(tb.id)
    );
    const newHeadToHead = AVAILABLE_TIEBREAKERS.filter((tb) =>
      headToHeadSelected.has(tb.id)
    );
    onConfirm(newOverall, newHeadToHead);
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
          maxW="680px"
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
              {t('selectTiebreakersTitle')}
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
            <Grid templateColumns="1fr 1fr" gap={6}>
              {/* Overall column */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={0.5}>
                  {t('overallColumn')}
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  {t('overallColumnDesc')}
                </Text>
                <Flex direction="column" gap={2}>
                  {AVAILABLE_TIEBREAKERS.map((tb) => {
                    const isSelected = overallSelected.has(tb.id);
                    return (
                      <Box
                        key={tb.id}
                        borderWidth="1px"
                        borderColor={isSelected ? 'black' : 'gray.200'}
                        borderRadius="md"
                        px={3}
                        py={2.5}
                        cursor="pointer"
                        bg={isSelected ? 'gray.50' : 'white'}
                        onClick={() => toggleOverall(tb.id)}
                        position="relative"
                        _hover={{ borderColor: 'gray.400' }}
                      >
                        <Flex align="center" justify="space-between">
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {t(`tiebreakerItems.${tb.label}`)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {t(`tiebreakerItems.${tb.description}`)}
                            </Text>
                          </Box>
                          {isSelected && (
                            <Flex
                              w="20px"
                              h="20px"
                              borderRadius="full"
                              bg="black"
                              align="center"
                              justify="center"
                              flexShrink={0}
                              ml={2}
                            >
                              <Box
                                as="span"
                                display="block"
                                w="6px"
                                h="10px"
                                borderRight="2px solid white"
                                borderBottom="2px solid white"
                                style={{
                                  transform: 'rotate(45deg) translateY(-2px)',
                                }}
                              />
                            </Flex>
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </Flex>
              </Box>

              {/* Head to Head column */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={0.5}>
                  {t('headToHeadColumn')}
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  {t('headToHeadColumnDesc')}
                </Text>
                <Flex direction="column" gap={2}>
                  {AVAILABLE_TIEBREAKERS.map((tb) => {
                    const isSelected = headToHeadSelected.has(tb.id);
                    return (
                      <Box
                        key={tb.id}
                        borderWidth="1px"
                        borderColor={isSelected ? 'black' : 'gray.200'}
                        borderRadius="md"
                        px={3}
                        py={2.5}
                        cursor="pointer"
                        bg={isSelected ? 'gray.50' : 'white'}
                        onClick={() => toggleHeadToHead(tb.id)}
                        _hover={{ borderColor: 'gray.400' }}
                      >
                        <Flex align="center" justify="space-between">
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {t(`tiebreakerItems.${tb.label}`)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {t(`tiebreakerItems.${tb.description}`)}
                            </Text>
                          </Box>
                          {isSelected && (
                            <Flex
                              w="20px"
                              h="20px"
                              borderRadius="full"
                              bg="black"
                              align="center"
                              justify="center"
                              flexShrink={0}
                              ml={2}
                            >
                              <Box
                                as="span"
                                display="block"
                                w="6px"
                                h="10px"
                                borderRight="2px solid white"
                                borderBottom="2px solid white"
                                style={{
                                  transform: 'rotate(45deg) translateY(-2px)',
                                }}
                              />
                            </Flex>
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </Flex>
              </Box>
            </Grid>
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
              {t('notSeeingTiebreakerHint')}{' '}
              <Box as="span" color="blue.500">
                {t('notSeeingTiebreakerContact')} support@tourny.ca
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
