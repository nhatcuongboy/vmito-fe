'use client';

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
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
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }} pr="8">
            {toast.type === 'loading' ? (
              <Spinner size="sm" color="green.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && (
                <Toast.Title whiteSpace="pre-wrap">{toast.title}</Toast.Title>
              )}
              {toast.description && (
                <Toast.Description whiteSpace="pre-wrap">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            <Toast.CloseTrigger
              position="absolute"
              top="2"
              right="2"
              p="1"
              borderRadius="md"
              _hover={{ bg: 'blackAlpha.100' }}
              _dark={{ _hover: { bg: 'whiteAlpha.100' } }}
            >
              <X size={16} />
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
