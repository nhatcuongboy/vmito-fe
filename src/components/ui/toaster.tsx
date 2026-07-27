'use client';

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
  Box,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { Check, X } from 'lucide-react';

export const FAVORITE_TOAST_ID = 'favorite-toast';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  duration: 3000,
  // Clears the floating back/share/favorite icons on hero-image detail
  // pages (~48-56px tall) and the standard top bar on most other pages.
  // Pages with extra sticky chrome below the top bar (e.g. the Tìm kèo
  // search bar + tabs) may still see brief overlap — acceptable since
  // toasts auto-dismiss in 3s and that screen's main error path already
  // renders inline (see AppErrorState) instead of using this toast.
  offsets: {
    top: 'calc(64px + env(safe-area-inset-top))',
    right: '16px',
    bottom: '16px',
    left: '16px',
  },
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => {
          const isFavoriteToast = toast.id === FAVORITE_TOAST_ID;

          let indicatorColor = 'white';
          switch (toast.type) {
            case 'success':
              indicatorColor = 'green.400'; // Màu xanh lá sáng, rực rỡ
              break;
            case 'error':
              indicatorColor = 'red.400';
              break;
            case 'info':
              indicatorColor = 'blue.400';
              break;
            case 'warning':
              indicatorColor = 'orange.400';
              break;
            case 'loading':
              indicatorColor = 'purple.400';
              break;
          }

          if (isFavoriteToast) {
            return (
              <Toast.Root
                width={{ base: 'calc(100vw - 40px)', md: 'min(420px, 88vw)' }}
                maxWidth={{ base: 'calc(100vw - 40px)', md: '420px' }}
                minH={{ base: '40px', md: '32px' }}
                px={{ base: 3, md: 3 }}
                py={{ base: 2.5, md: 2 }}
                bg="#151515"
                color="white"
                borderRadius={{ base: '12px', md: '14px' }}
                border="1px solid"
                borderColor="whiteAlpha.100"
                boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                _dark={{
                  bg: '#151515',
                  borderColor: 'whiteAlpha.100',
                }}
              >
                <HStack
                  gap={{ base: 2, md: 2.5 }}
                  align="center"
                  width="full"
                  pr={{ base: 5, md: 6 }}
                >
                  <Box
                    flexShrink={0}
                    w={{ base: '20px', md: '20px' }}
                    h={{ base: '20px', md: '20px' }}
                    minW={{ base: '20px', md: '20px' }}
                    minH={{ base: '20px', md: '20px' }}
                    borderRadius="full"
                    bg="#2FC56D"
                    color="#111"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={Check}
                      w={{ base: '13px', md: '13px' }}
                      h={{ base: '13px', md: '13px' }}
                      strokeWidth={3}
                    />
                  </Box>
                  <Text
                    flex="1"
                    minW={0}
                    fontSize="sm"
                    lineHeight="1.25"
                    fontWeight="semibold"
                    whiteSpace="normal"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    lineClamp={2}
                  >
                    {toast.title}
                  </Text>
                  {toast.action && (
                    <Toast.ActionTrigger
                      flexShrink={0}
                      alignSelf="center"
                      color="#F5C542"
                      fontSize="sm"
                      lineHeight="1.2"
                      fontWeight="semibold"
                      textDecoration="underline"
                      textUnderlineOffset="3px"
                      whiteSpace="nowrap"
                      _hover={{ color: '#FFD769' }}
                      _focusVisible={{
                        outline: '2px solid #F5C542',
                        outlineOffset: '3px',
                        borderRadius: 'md',
                      }}
                    >
                      {toast.action.label}
                    </Toast.ActionTrigger>
                  )}
                </HStack>
                <Toast.CloseTrigger
                  position="absolute"
                  top="50%"
                  right={{ base: 1.5, md: 2.5 }}
                  transform="translateY(-50%)"
                  p="0.5"
                  borderRadius="full"
                  color="gray.500"
                  _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                  _dark={{ _hover: { bg: 'whiteAlpha.100', color: 'white' } }}
                >
                  <X size={14} />
                </Toast.CloseTrigger>
              </Toast.Root>
            );
          }

          return (
            <Toast.Root
              width={{ md: 'sm' }}
              pr="8"
              bg="#1a1a1a" // Nền đen/xám rất đậm
              color="white"
              boxShadow="0 10px 30px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.2)" // Đổ bóng mạnh
              border="1px solid"
              borderColor="whiteAlpha.200" // Border tương phản nhẹ
              borderRadius="xl"
              _dark={{
                bg: '#111',
                borderColor: 'whiteAlpha.100',
              }}
            >
              {toast.type === 'loading' ? (
                <Spinner size="sm" color={indicatorColor} />
              ) : (
                <Box color={indicatorColor} fontSize="xl">
                  <Toast.Indicator />
                </Box>
              )}
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && (
                  <Toast.Title
                    whiteSpace="pre-wrap"
                    fontWeight="semibold"
                    fontSize="sm"
                  >
                    {toast.title}
                  </Toast.Title>
                )}
                {toast.description && (
                  <Toast.Description
                    whiteSpace="pre-wrap"
                    color="gray.300"
                    fontSize="sm"
                  >
                    {toast.description}
                  </Toast.Description>
                )}
              </Stack>
              {toast.action && (
                <Toast.ActionTrigger
                  bg="whiteAlpha.100"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  color="white"
                  borderRadius="md"
                  px="3"
                  py="1"
                  fontSize="sm"
                  fontWeight="medium"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  {toast.action.label}
                </Toast.ActionTrigger>
              )}
              <Toast.CloseTrigger
                position="absolute"
                top="2"
                right="2"
                p="1"
                borderRadius="md"
                color="gray.400"
                _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                _dark={{ _hover: { bg: 'whiteAlpha.200', color: 'white' } }}
              >
                <X size={16} />
              </Toast.CloseTrigger>
            </Toast.Root>
          );
        }}
      </ChakraToaster>
    </Portal>
  );
};
