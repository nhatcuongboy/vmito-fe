'use client';

import React from 'react';
import { Box, Flex, Heading, Text, Portal } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Button } from './chakra-compat';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface VModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Modal title alignment */
  titleAlign?: 'left' | 'center';
  /** Modal title size */
  titleSize?: 'sm' | 'md' | 'lg';
  /** Modal body content */
  children: React.ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close modal when clicking overlay */
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
  /** Secondary action disabled state */
  isSecondaryDisabled?: boolean;
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
  /** Accessible label for the close button */
  closeButtonAriaLabel?: string;
  /** Close button visual style */
  closeButtonVariant?: 'default' | 'circle';
  /** Custom z-index */
  zIndex?: number;
  /** Custom max height for modal body (supports responsive object e.g. { base: '60vh', md: '75vh' }) */
  maxBodyHeight?: string | Record<string, string>;
  /** Show header divider */
  showHeaderDivider?: boolean;
  /** Show footer divider */
  showFooterDivider?: boolean;
  /** Center modal content */
  isCentered?: boolean;
}

const sizeConfig: Record<ModalSize, string> = {
  sm: '400px',
  md: '500px',
  lg: '600px',
  xl: '800px',
  full: '95vw',
};

interface ScrollLockSnapshot {
  bodyOverflow: string;
  bodyPaddingRight: string;
  documentOverflow: string;
  documentOverscrollBehavior: string;
  pageScrollContainer: HTMLElement | null;
  pageScrollOverflow: string;
  pageScrollOverscrollBehavior: string;
}

let activeScrollLocks = 0;
let scrollLockSnapshot: ScrollLockSnapshot | null = null;

function lockPageScroll() {
  activeScrollLocks += 1;
  if (activeScrollLocks > 1) return;

  const pageScrollContainer = document.querySelector<HTMLElement>(
    '.main-layout-scroll'
  );
  scrollLockSnapshot = {
    bodyOverflow: document.body.style.overflow,
    bodyPaddingRight: document.body.style.paddingRight,
    documentOverflow: document.documentElement.style.overflow,
    documentOverscrollBehavior:
      document.documentElement.style.overscrollBehavior,
    pageScrollContainer,
    pageScrollOverflow: pageScrollContainer?.style.overflowY ?? '',
    pageScrollOverscrollBehavior:
      pageScrollContainer?.style.overscrollBehavior ?? '',
  };

  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';
  if (pageScrollContainer) {
    pageScrollContainer.style.overflowY = 'hidden';
    pageScrollContainer.style.overscrollBehavior = 'none';
  }
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockPageScroll() {
  if (activeScrollLocks === 0) return;

  activeScrollLocks -= 1;
  if (activeScrollLocks > 0 || !scrollLockSnapshot) return;

  const snapshot = scrollLockSnapshot;
  document.body.style.overflow = snapshot.bodyOverflow;
  document.body.style.paddingRight = snapshot.bodyPaddingRight;
  document.documentElement.style.overflow = snapshot.documentOverflow;
  document.documentElement.style.overscrollBehavior =
    snapshot.documentOverscrollBehavior;
  if (snapshot.pageScrollContainer) {
    snapshot.pageScrollContainer.style.overflowY = snapshot.pageScrollOverflow;
    snapshot.pageScrollContainer.style.overscrollBehavior =
      snapshot.pageScrollOverscrollBehavior;
  }
  scrollLockSnapshot = null;
}

/**
 * VModal - A reusable modal component using Chakra UI
 *
 * @example
 * // Basic usage
 * <VModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Modal Title"
 * >
 *   <Text>Modal content goes here</Text>
 * </VModal>
 *
 * @example
 * // With actions
 * <VModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Confirm Action"
 *   primaryActionText="Confirm"
 *   onPrimaryAction={handleConfirm}
 *   isPrimaryLoading={isLoading}
 *   secondaryActionText="Cancel"
 * >
 *   <Text>Are you sure?</Text>
 * </VModal>
 *
 * @example
 * // With custom footer
 * <VModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Custom Footer"
 *   footer={<CustomFooterComponent />}
 * >
 *   <Text>Content</Text>
 * </VModal>
 */
export const VModal: React.FC<VModalProps> = ({
  isOpen,
  onClose,
  title,
  titleAlign = 'left',
  titleSize = 'md',
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  primaryActionText,
  onPrimaryAction,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  isSecondaryDisabled = false,
  primaryColorScheme = 'green',
  secondaryActionText,
  onSecondaryAction,
  hideSecondaryAction = false,
  headerRightContent,
  description,
  closeButtonAriaLabel = 'Close modal',
  closeButtonVariant = 'default',
  zIndex = 1500,
  maxBodyHeight = '60vh',
  showHeaderDivider = true,
  showFooterDivider = true,
  isCentered = true,
}) => {
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle escape key and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleEscape);
    lockPageScroll();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      unlockPageScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
  const isCenteredTitle = titleAlign === 'center';

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={zIndex}
        display="flex"
        alignItems={isCentered ? 'center' : 'flex-start'}
        justifyContent="center"
        p={4}
        pt={isCentered ? 4 : 16}
        // Chakra's Drawer (used to host panels on mobile) sets
        // document.body.style.pointerEvents = 'none' while open and only
        // re-enables it on its own content. Since this overlay is portaled
        // as a sibling outside that content, it would otherwise inherit
        // pointer-events: none and become entirely unclickable when opened
        // on top of a Drawer.
        pointerEvents="auto"
        onClick={handleOverlayClick}
        // Animation
        animation="fadeIn 0.15s ease-out"
        css={{
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          bg={{ base: 'white', _dark: 'gray.800' }}
          borderRadius="lg"
          boxShadow="xl"
          maxW={sizeConfig[size]}
          w="full"
          maxH="calc(100vh - 48px)"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          // Animation
          animation="slideIn 0.15s ease-out"
          css={{
            '@keyframes slideIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* Header */}
          {(hasTitle || showCloseButton || headerRightContent) && (
            <Flex
              justify={isCenteredTitle ? 'center' : 'space-between'}
              align="center"
              p={4}
              borderBottom={showHeaderDivider ? '1px' : 'none'}
              borderColor="border"
              flexShrink={0}
              position="relative"
            >
              <Box
                flex={isCenteredTitle ? undefined : 1}
                w={isCenteredTitle ? 'full' : undefined}
                px={isCenteredTitle ? 12 : 0}
                textAlign={titleAlign}
              >
                {title && (
                  <Heading size={titleSize} color="fg">
                    {title}
                  </Heading>
                )}
                {description && (
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {description}
                  </Text>
                )}
              </Box>
              <Flex
                align="center"
                gap={2}
                position={isCenteredTitle ? 'absolute' : undefined}
                right={isCenteredTitle ? 4 : undefined}
                top={isCenteredTitle ? '50%' : undefined}
                transform={isCenteredTitle ? 'translateY(-50%)' : undefined}
              >
                {headerRightContent}
                {showCloseButton && (
                  <Box
                    as="button"
                    {...({ type: 'button' } as Record<string, unknown>)}
                    onClick={onClose}
                    p={closeButtonVariant === 'circle' ? 0 : 1}
                    w={closeButtonVariant === 'circle' ? 10 : undefined}
                    h={closeButtonVariant === 'circle' ? 10 : undefined}
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius={
                      closeButtonVariant === 'circle' ? 'full' : 'md'
                    }
                    bg={
                      closeButtonVariant === 'circle'
                        ? { base: 'gray.100', _dark: 'gray.700' }
                        : undefined
                    }
                    color="fg.muted"
                    _hover={{
                      bg:
                        closeButtonVariant === 'circle'
                          ? { base: 'gray.200', _dark: 'gray.600' }
                          : 'bg.muted',
                      color: 'fg',
                    }}
                    transition="all 0.2s"
                    aria-label={closeButtonAriaLabel}
                  >
                    <Box
                      as={X}
                      boxSize={closeButtonVariant === 'circle' ? 6 : 5}
                    />
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
            overflowX="hidden"
            minH={0}
            maxH={maxBodyHeight}
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
              borderColor={{ base: 'border', _dark: 'whiteAlpha.200' }}
              flexShrink={0}
              bg={{ base: 'white', _dark: 'gray.800' }}
              zIndex={1}
            >
              {footer !== undefined ? (
                footer
              ) : (
                <>
                  {!hideSecondaryAction && (
                    <Button
                      type="button"
                      variant="outline"
                      colorPalette="gray"
                      onClick={handleSecondaryClick}
                      disabled={isSecondaryDisabled || isPrimaryLoading}
                    >
                      {secondaryActionText || 'Cancel'}
                    </Button>
                  )}
                  {primaryActionText && (
                    <Button
                      type="button"
                      colorPalette={primaryColorScheme}
                      onClick={async () => {
                        try {
                          await onPrimaryAction?.();
                        } catch (error) {
                          console.error('Primary action error:', error);
                        }
                      }}
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
      </Box>
    </Portal>
  );
};

/**
 * Hook for managing modal state
 */
export const useModal = (defaultOpen = false) => {
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

export default VModal;
