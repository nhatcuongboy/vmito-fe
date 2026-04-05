'use client';

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
  Box,
} from '@chakra-ui/react';
import { X } from 'lucide-react';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  duration: 3000,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => {
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
                  <Toast.Title whiteSpace="pre-wrap" fontWeight="semibold">
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
