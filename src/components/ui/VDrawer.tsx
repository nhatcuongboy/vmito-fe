'use client';

import React from 'react';
import { Box, Flex, Heading, Text, Portal } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Button } from './chakra-compat';

export type DrawerPlacement = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface VDrawerProps {
  /** Controls drawer visibility */
  isOpen: boolean;
  /** Callback when drawer is closed */
  onClose: () => void;
  /** Drawer title */
  title?: React.ReactNode;
  /** Drawer body content */
  children: React.ReactNode;
  /** Drawer size */
  size?: DrawerSize;
  /** Drawer placement */
  placement?: DrawerPlacement;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close drawer when clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Footer content - can be custom ReactNode or use footer action props */
  footer?: React.ReactNode;
  /** Primary action button text */
  primaryActionText?: string;
  /** Primary action callback */
  onPrimaryAction?: () => void | Promise<void>;
  /** Primary action loading state */
  isPrimaryLoading?: boolean;
  /** Primary action disabled state */
  isPrimaryDisabled?: boolean;
  /** Primary action color scheme */
  primaryColorScheme?: string;
  /** Secondary action button text (default: Cancel) */
  secondaryActionText?: string;
  /** Secondary action callback (defaults to onClose) */
  onSecondaryAction?: () => void;
  /** Hide secondary action button */
  hideSecondaryAction?: boolean;
  /** Additional header content (right side) */
  headerRightContent?: React.ReactNode;
  /** Description text below title */
  description?: string;
  /** Custom z-index */
  zIndex?: number;
  /** Show header divider */
  showHeaderDivider?: boolean;
  /** Show footer divider */
  showFooterDivider?: boolean;
}

const sizeConfig: Record<DrawerSize, Record<string, string>> = {
  sm: { base: 'calc(100% - 48px)', sm: '320px' },
  md: { base: 'calc(100% - 48px)', sm: '400px' },
  lg: { base: 'calc(100% - 48px)', sm: '650px' },
  xl: { base: 'calc(100% - 48px)', sm: '600px' },
  full: { base: '100%', sm: '100%' },
};

/**
 * VDrawer - A reusable drawer/side panel component
 *
 * @example
 * // Basic right drawer
 * <VDrawer
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Settings"
 *   placement="right"
 * >
 *   <Text>Drawer content</Text>
 * </VDrawer>
 *
 * @example
 * // With footer actions
 * <VDrawer
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Edit"
 *   primaryActionText="Save"
 *   onPrimaryAction={handleSave}
 * >
 *   <FormContent />
 * </VDrawer>
 */
export const VDrawer: React.FC<VDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  placement = 'right',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  primaryActionText,
  onPrimaryAction,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  primaryColorScheme: _primaryColorScheme = 'green',
  secondaryActionText,
  onSecondaryAction,
  hideSecondaryAction = false,
  headerRightContent,
  description,
  zIndex = 1400,
  showHeaderDivider = true,
  showFooterDivider = true,
}) => {
  // Two-phase mount for smooth transitions
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Trigger enter transition on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Trigger exit transition
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  const hasFooterActions = primaryActionText || !hideSecondaryAction;
  const showFooter = footer !== undefined || hasFooterActions;
  const hasTitle = title !== undefined;

  const isRight = placement === 'right';

  return (
    <Portal>
      {/* Overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={zIndex}
        onClick={handleOverlayClick}
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      />

      {/* Drawer panel */}
      <Box
        position="fixed"
        top={0}
        bottom={0}
        {...(isRight ? { right: 0 } : { left: 0 })}
        w={sizeConfig[size]}
        maxW="100vw"
        bg={{ base: 'white', _dark: 'gray.800' }}
        boxShadow="xl"
        zIndex={zIndex + 1}
        display="flex"
        flexDirection="column"
        transform={
          isVisible
            ? 'translateX(0)'
            : isRight
              ? 'translateX(100%)'
              : 'translateX(-100%)'
        }
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        borderLeftRadius={{ base: 'xl', sm: 'none' }}
      >
        {/* Header */}
        {(hasTitle || showCloseButton || headerRightContent) && (
          <Flex
            justify="space-between"
            align="center"
            p={4}
            borderBottom={showHeaderDivider ? '1px' : 'none'}
            borderColor="border"
            flexShrink={0}
          >
            <Box flex={1}>
              {title && (
                <Heading size="md" color="fg">
                  {title}
                </Heading>
              )}
              {description && (
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  {description}
                </Text>
              )}
            </Box>
            <Flex align="center" gap={2}>
              {headerRightContent}
              {showCloseButton && (
                <Box
                  as="button"
                  {...({ type: 'button' } as Record<string, unknown>)}
                  onClick={onClose}
                  p={1}
                  borderRadius="md"
                  color="fg.muted"
                  _hover={{ bg: 'bg.muted', color: 'fg' }}
                  transition="all 0.2s"
                  aria-label="Close drawer"
                >
                  <Box as={X} boxSize={5} />
                </Box>
              )}
            </Flex>
          </Flex>
        )}

        {/* Body */}
        <Box
          p={4}
          flex={1}
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-border)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'var(--chakra-colors-gray-400)',
            },
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        {showFooter && (
          <Flex
            justify="flex-end"
            gap={3}
            p={4}
            borderTop={showFooterDivider ? '1px' : 'none'}
            borderColor="border"
            flexShrink={0}
          >
            {footer !== undefined ? (
              footer
            ) : (
              <>
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
                    onClick={onPrimaryAction}
                    loading={isPrimaryLoading}
                    disabled={isPrimaryDisabled || isPrimaryLoading}
                  >
                    {primaryActionText}
                  </Button>
                )}
              </>
            )}
          </Flex>
        )}
      </Box>
    </Portal>
  );
};

/**
 * Hook for managing drawer state
 */
export const useDrawer = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const onOpen = React.useCallback(() => setIsOpen(true), []);
  const onClose = React.useCallback(() => setIsOpen(false), []);
  const onToggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
};

export default VDrawer;
