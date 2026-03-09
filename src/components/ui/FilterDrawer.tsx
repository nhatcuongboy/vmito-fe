'use client';

import { IconButton } from '@/components/ui/VButton';
import { Button } from '@/components/ui/chakra-compat';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { Box, Flex, Heading, HStack } from '@chakra-ui/react';
import { Check, Filter, X } from 'lucide-react';
import { ReactNode } from 'react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onReset: () => void;
  children: ReactNode;
  title?: string;
  submitLabel?: string;
  resetLabel?: string;
}

export function FilterDrawer({
  isOpen,
  onClose,
  onSubmit,
  onReset,
  children,
  title = 'Bộ lọc',
  submitLabel = 'Tìm kiếm',
  resetLabel = 'Đặt lại',
}: FilterDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: '90%', md: '480px', lg: '520px' }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        shadow="2xl"
        zIndex={2100}
        transform={isOpen ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s ease-in-out"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box
          px={4}
          height={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          pt="env(safe-area-inset-top)"
          display="flex"
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex justify="space-between" align="center" width="full">
            <HStack gap={2}>
              <Filter size={20} />
              <Heading size="md">{title}</Heading>
            </HStack>
            <IconButton
              variant="ghost"
              onClick={onClose}
              aria-label="Đóng"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Body */}
        <Box flex="1" overflowY="auto" p={5}>
          {children}
        </Box>

        {/* Footer */}
        <Box
          p={4}
          pb={{ base: 'calc(16px + env(safe-area-inset-bottom))', md: 4 }}
          borderTopWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
        >
          <Flex gap={3}>
            <Button
              flex="1"
              variant="solid"
              colorPalette="green"
              onClick={onSubmit}
              leftIcon={<Check size={18} />}
            >
              {submitLabel}
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={onReset}
              leftIcon={<X size={18} />}
            >
              {resetLabel}
            </Button>
          </Flex>
        </Box>
      </Box>
    </>
  );
}
