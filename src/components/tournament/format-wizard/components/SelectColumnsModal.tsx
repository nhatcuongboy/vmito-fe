'use client';

import React, { useState } from 'react';
import { Box, Flex, Portal, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { StandingsColumn } from '../types';
import { AVAILABLE_STANDINGS_COLUMNS } from '../constants';

interface SelectColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (columns: StandingsColumn[]) => void;
  selectedColumns: StandingsColumn[];
}

export default function SelectColumnsModal({
  isOpen,
  onClose,
  onConfirm,
  selectedColumns,
}: SelectColumnsModalProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard.config.rr');

  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedColumns.map((c) => c.id))
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedColumns.map((c) => c.id)));
    }
  }, [isOpen, selectedColumns]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
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
    const newCols = AVAILABLE_STANDINGS_COLUMNS.filter((c) =>
      selected.has(c.id)
    );
    onConfirm(newCols);
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
              {t('selectColumnsTitle')}
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
              {AVAILABLE_STANDINGS_COLUMNS.map((col) => {
                const isSelected = selected.has(col.id);
                return (
                  <Box
                    key={col.id}
                    borderWidth="1px"
                    borderColor={isSelected ? 'black' : 'gray.200'}
                    borderRadius="md"
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={isSelected ? 'gray.50' : 'white'}
                    onClick={() => toggle(col.id)}
                    _hover={{ borderColor: 'gray.400' }}
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={3}>
                        <Box
                          px={2}
                          py={0.5}
                          bg="gray.100"
                          borderRadius="md"
                          minW="40px"
                          textAlign="center"
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="gray.600"
                          >
                            {col.abbreviation}
                          </Text>
                        </Box>
                        <Text fontSize="sm" fontWeight="medium">
                          {t(`standingsItems.${col.label}`)}
                        </Text>
                      </Flex>
                      {isSelected && (
                        <Flex
                          w="20px"
                          h="20px"
                          borderRadius="full"
                          bg="black"
                          align="center"
                          justify="center"
                          flexShrink={0}
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

          {/* Footer */}
          <Flex
            px={6}
            py={4}
            borderTopWidth="1px"
            borderColor="gray.100"
            justify="space-between"
            align="center"
            flexShrink={0}
          >
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
    </Portal>
  );
}
