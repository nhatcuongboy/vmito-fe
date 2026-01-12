'use client';

import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Button } from './chakra-compat';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface CommonModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
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
  /** Custom z-index */
  zIndex?: number;
  /** Custom max height for modal body */
  maxBodyHeight?: string;
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

/**
 * CommonModal - A reusable modal component using Chakra UI
 *
 * @example
 * // Basic usage
 * <CommonModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Modal Title"
 * >
 *   <Text>Modal content goes here</Text>
 * </CommonModal>
 *
 * @example
 * // With actions
 * <CommonModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Confirm Action"
 *   primaryActionText="Confirm"
 *   onPrimaryAction={handleConfirm}
 *   isPrimaryLoading={isLoading}
 *   secondaryActionText="Cancel"
 * >
 *   <Text>Are you sure?</Text>
 * </CommonModal>
 *
 * @example
 * // With custom footer
 * <CommonModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Custom Footer"
 *   footer={<CustomFooterComponent />}
 * >
 *   <Text>Content</Text>
 * </CommonModal>
 */
export const CommonModal: React.FC<CommonModalProps> = ({
  isOpen,
  onClose,
  title,
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
  primaryColorScheme = 'blue',
  secondaryActionText,
  onSecondaryAction,
  hideSecondaryAction = false,
  headerRightContent,
  description,
  zIndex = 1000,
  maxBodyHeight = '60vh',
  showHeaderDivider = true,
  showFooterDivider = true,
  isCentered = true,
}) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

  return (
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
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        maxW={sizeConfig[size]}
        w="full"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        onClick={(e) => e.stopPropagation()}
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
            justify="space-between"
            align="center"
            p={4}
            borderBottom={showHeaderDivider ? '1px' : 'none'}
            borderColor="gray.200"
            flexShrink={0}
          >
            <Box flex={1}>
              {title && (
                <Heading size="md" color="gray.800">
                  {title}
                </Heading>
              )}
              {description && (
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {description}
                </Text>
              )}
            </Box>
            <Flex align="center" gap={2}>
              {headerRightContent}
              {showCloseButton && (
                <Box
                  as="button"
                  onClick={onClose}
                  p={1}
                  borderRadius="md"
                  color="gray.500"
                  _hover={{ bg: 'gray.100', color: 'gray.700' }}
                  transition="all 0.2s"
                  aria-label="Close modal"
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
          maxH={maxBodyHeight}
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CBD5E0',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#A0AEC0',
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
            borderColor="gray.200"
            flexShrink={0}
          >
            {footer !== undefined ? (
              footer
            ) : (
              <>
                {!hideSecondaryAction && (
                  <Button
                    variant="outline"
                    onClick={handleSecondaryClick}
                    disabled={isSecondaryDisabled || isPrimaryLoading}
                  >
                    {secondaryActionText || 'Cancel'}
                  </Button>
                )}
                {primaryActionText && (
                  <Button
                    colorScheme={primaryColorScheme}
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
    </Box>
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

export default CommonModal;
