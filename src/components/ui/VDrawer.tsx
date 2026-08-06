'use client';

import React from 'react';
import { Box, Drawer, Flex, Portal } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Button } from './chakra-compat';

export type DrawerPlacement = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface VDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: DrawerSize;
  mobileWidth?: string;
  placement?: DrawerPlacement;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void | Promise<void>;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  primaryColorScheme?: string;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  hideSecondaryAction?: boolean;
  headerRightContent?: React.ReactNode;
  description?: string;
  zIndex?: number;
  showHeaderDivider?: boolean;
  showFooterDivider?: boolean;
  closeButtonAriaLabel?: string;
}

const sizeConfig: Record<DrawerSize, Record<string, string>> = {
  sm: { base: '100%', sm: '320px' },
  md: { base: '100%', sm: '400px' },
  lg: { base: '100%', sm: '650px' },
  xl: { base: '100%', sm: '760px' },
  full: { base: '100%', sm: '100%' },
};

export const VDrawer: React.FC<VDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  mobileWidth,
  placement = 'right',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  primaryActionText,
  onPrimaryAction,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  primaryColorScheme = 'green',
  secondaryActionText,
  onSecondaryAction,
  hideSecondaryAction = false,
  headerRightContent,
  description,
  zIndex = 1400,
  showHeaderDivider = true,
  showFooterDivider = true,
  closeButtonAriaLabel = 'Close drawer',
}) => {
  const handleSecondaryClick = () => {
    if (onSecondaryAction) onSecondaryAction();
    else onClose();
  };
  const hasFooterActions = Boolean(primaryActionText) || !hideSecondaryAction;
  const showFooter = footer !== undefined || hasFooterActions;

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement={placement === 'right' ? 'end' : 'start'}
      closeOnInteractOutside={closeOnOverlayClick}
      persistentElements={[
        () =>
          typeof document === 'undefined'
            ? null
            : document.querySelector('[data-vmito-persistent-overlay="true"]'),
        () =>
          typeof document === 'undefined'
            ? null
            : document.querySelector('[data-vmito-drawer-footer="true"]'),
      ]}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Drawer.Backdrop zIndex={zIndex} />
        <Drawer.Positioner zIndex={zIndex + 1}>
          <Drawer.Content
            w={
              mobileWidth
                ? { base: mobileWidth, sm: sizeConfig[size].sm }
                : sizeConfig[size]
            }
            maxW="100vw"
            maxH="100dvh"
            borderRadius={0}
            css={{
              '@media (prefers-reduced-motion: reduce)': {
                animationDuration: '0.01ms !important',
                transitionDuration: '0.01ms !important',
              },
            }}
          >
            {(title ||
              description ||
              showCloseButton ||
              headerRightContent) && (
              <Drawer.Header
                borderBottomWidth={showHeaderDivider ? '1px' : '0'}
                borderColor="border"
                pt="calc(16px + env(safe-area-inset-top))"
              >
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <Box flex={1} minW={0}>
                    {title && <Drawer.Title>{title}</Drawer.Title>}
                    {description && (
                      <Drawer.Description mt={1}>
                        {description}
                      </Drawer.Description>
                    )}
                  </Box>
                  <Flex align="center" gap={2} flexShrink={0}>
                    {headerRightContent}
                    {showCloseButton && (
                      <Drawer.CloseTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={closeButtonAriaLabel}
                          p={2}
                          minW="40px"
                          minH="40px"
                          _focusVisible={{
                            outline: '2px solid',
                            outlineColor: 'green.500',
                            outlineOffset: '2px',
                          }}
                        >
                          <X size={18} aria-hidden="true" />
                        </Button>
                      </Drawer.CloseTrigger>
                    )}
                  </Flex>
                </Flex>
              </Drawer.Header>
            )}

            <Drawer.Body overscrollBehavior="contain" px={{ base: 4, md: 6 }}>
              {children}
            </Drawer.Body>

            {showFooter && (
              <Drawer.Footer
                borderTopWidth={showFooterDivider ? '1px' : '0'}
                borderColor="border"
                pb="calc(16px + env(safe-area-inset-bottom))"
              >
                {footer !== undefined ? (
                  footer
                ) : (
                  <Flex justify="flex-end" gap={3} w="full">
                    {!hideSecondaryAction && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSecondaryClick}
                        disabled={isPrimaryLoading}
                      >
                        {secondaryActionText || 'Cancel'}
                      </Button>
                    )}
                    {primaryActionText && (
                      <Button
                        type="button"
                        colorPalette={primaryColorScheme}
                        onClick={onPrimaryAction}
                        loading={isPrimaryLoading}
                        disabled={isPrimaryDisabled || isPrimaryLoading}
                      >
                        {primaryActionText}
                      </Button>
                    )}
                  </Flex>
                )}
              </Drawer.Footer>
            )}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export const useDrawer = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const onOpen = React.useCallback(() => setIsOpen(true), []);
  const onClose = React.useCallback(() => setIsOpen(false), []);
  const onToggle = React.useCallback(
    () => setIsOpen((current) => !current),
    []
  );
  return { isOpen, onOpen, onClose, onToggle };
};

export default VDrawer;
