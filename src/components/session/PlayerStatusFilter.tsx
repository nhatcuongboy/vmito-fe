import React, { useState, useRef, useEffect } from 'react';
import { Box, Badge, Text } from '@chakra-ui/react';
import { Button, HStack, VStack, Divider } from '@/components/ui/chakra-compat';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type PlayerStatus = 'PLAYING' | 'WAITING' | 'READY' | 'INACTIVE';

interface PlayerStatusFilterProps {
  selected: PlayerStatus[];
  onChange: (selected: PlayerStatus[]) => void;
  counts: Record<PlayerStatus, number>;
  totalCount: number;
}

const PlayerStatusFilter: React.FC<PlayerStatusFilterProps> = ({
  selected,
  onChange,
  counts,
  totalCount,
}) => {
  const t = useTranslations('SessionDetail.playersTab');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allStatuses: PlayerStatus[] = [
    'PLAYING',
    'WAITING',
    'READY',
    'INACTIVE',
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (status: PlayerStatus) => {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const selectedCount = selected.length;
  const isAllSelected = selectedCount === 0;

  const getLabel = (status: PlayerStatus) => {
    switch (status) {
      case 'PLAYING':
        return t('playing');
      case 'WAITING':
        return t('waiting');
      case 'READY':
        return t('ready');
      case 'INACTIVE':
        return t('inactive');
      default:
        return status;
    }
  };

  const getColorScheme = (status: PlayerStatus) => {
    switch (status) {
      case 'PLAYING':
        return 'blue';
      case 'WAITING':
        return 'orange';
      case 'READY':
        return 'green';
      case 'INACTIVE':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Custom Checkbox Component
  const CustomCheckbox = ({
    checked,
    colorPalette,
  }: {
    checked: boolean;
    colorPalette: string;
  }) => (
    <Box
      w="16px"
      h="16px"
      border="1px solid"
      borderColor={checked ? `${colorPalette}.500` : 'gray.300'}
      bg={checked ? `${colorPalette}.500` : 'white'}
      borderRadius="sm"
      display="flex"
      alignItems="center"
      justifyContent="center"
      transition="all 0.2s"
    >
      {checked && <Check size={12} color="white" strokeWidth={3} />}
    </Box>
  );

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        colorPalette={!isAllSelected ? 'blue' : 'gray'}
        bg={!isAllSelected ? 'blue.50' : 'transparent'}
        borderColor={!isAllSelected ? 'blue.200' : 'gray.200'}
      >
        <HStack gap={2}>
          <Filter size={16} />
          <Text>{t('filter')}</Text>
          {!isAllSelected && (
            <Badge
              colorPalette="blue"
              bg="blue.500"
              color="white"
              borderRadius="full"
              variant="solid"
              fontSize="xs"
              px={2}
            >
              {selectedCount}
            </Badge>
          )}
          <ChevronDown size={16} />
        </HStack>
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0} // Aligned to left like popover bottom-start
          mt={2}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          boxShadow="lg"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          zIndex={10}
          width="240px"
          overflow="hidden"
        >
          <VStack align="stretch" spacing={0}>
            <Box
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={handleSelectAll}
            >
              <HStack justify="space-between">
                <Text
                  fontWeight={isAllSelected ? 'bold' : 'normal'}
                  fontSize="sm"
                >
                  {t('all')}
                </Text>
                <Badge
                  variant="subtle"
                  colorPalette="gray"
                  bg="gray.100"
                  color="gray.600"
                >
                  {totalCount}
                </Badge>
              </HStack>
            </Box>
            <Divider />
            {allStatuses.map((status) => {
              const checked = selected.includes(status);
              const colorPalette = getColorScheme(status);
              return (
                <Box
                  key={status}
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(status);
                  }}
                >
                  <HStack justify="space-between" width="100%">
                    <HStack gap={2}>
                      <CustomCheckbox
                        checked={checked}
                        colorPalette={colorPalette}
                      />
                      <Text fontSize="sm">{getLabel(status)}</Text>
                    </HStack>
                    <Badge
                      variant="subtle"
                      colorPalette={colorPalette}
                      bg={`${colorPalette}.100`}
                      color={`${colorPalette}.700`}
                    >
                      {counts[status]}
                    </Badge>
                  </HStack>
                </Box>
              );
            })}
            {!isAllSelected && (
              <>
                <Divider />
                <Box p={2}>
                  <Button
                    size="xs"
                    width="full"
                    variant="ghost"
                    colorPalette="red"
                    onClick={handleSelectAll}
                  >
                    <HStack gap={1} justify="center">
                      <X size={12} />
                      <Text>{t('clearFilter')}</Text>
                    </HStack>
                  </Button>
                </Box>
              </>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default PlayerStatusFilter;
