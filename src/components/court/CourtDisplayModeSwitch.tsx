'use client';

import { useCourtDisplayModeStore } from '@/stores/useCourtDisplayModeStore';
import { Box, Flex } from '@chakra-ui/react';
import { Hash, Type } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VTooltip } from '@/components/ui/VTooltip';

export default function CourtDisplayModeSwitch() {
  const { courtDisplayMode, toggleCourtDisplayMode } =
    useCourtDisplayModeStore();
  const t = useTranslations('SessionDetail');
  const isNameMode = courtDisplayMode === 'name';

  return (
    <VTooltip content={t('courtsTab.displayModeLabel')} showArrow>
      <Box
        as="button"
        aria-label={t('courtsTab.displayModeLabel')}
        position="relative"
        display="flex"
        alignItems="center"
        w="44px"
        h="20px"
        borderRadius="full"
        bg={
          isNameMode
            ? { base: 'green.500', _dark: 'green.600' }
            : { base: 'gray.300', _dark: 'whiteAlpha.300' }
        }
        cursor="pointer"
        transition="background 0.25s ease"
        onClick={toggleCourtDisplayMode}
        flexShrink={0}
        border="1px solid"
        borderColor={
          isNameMode
            ? { base: 'green.600', _dark: 'green.500' }
            : { base: 'gray.400', _dark: 'whiteAlpha.400' }
        }
        _hover={{
          opacity: 0.85,
        }}
      >
        {/* Track labels */}
        <Flex
          position="absolute"
          left="4px"
          top="3px"
          align="center"
          justify="center"
          w="12px"
          h="12px"
          opacity={isNameMode ? 0.6 : 0}
          transition="opacity 0.2s"
          pointerEvents="none"
        >
          <Box as={Hash} boxSize="10px" color="white" />
        </Flex>
        <Flex
          position="absolute"
          right="4px"
          top="3px"
          align="center"
          justify="center"
          w="12px"
          h="12px"
          opacity={isNameMode ? 0 : 0.6}
          transition="opacity 0.2s"
          pointerEvents="none"
        >
          <Box as={Type} boxSize="10px" color="white" />
        </Flex>

        {/* Thumb */}
        <Box
          position="absolute"
          top="1px"
          w="16px"
          h="16px"
          borderRadius="full"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 1px 3px rgba(0,0,0,0.3)"
          style={{
            left: isNameMode ? '25px' : '1px',
            transition: 'left 0.25s ease',
          }}
        >
          {isNameMode ? (
            <Box as={Type} boxSize="10px" color="green.600" />
          ) : (
            <Box as={Hash} boxSize="10px" color="gray.500" />
          )}
        </Box>
      </Box>
    </VTooltip>
  );
}
