'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Box, Flex, Text, Textarea } from '@chakra-ui/react';
import { IconButton, Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import {
  Play,
  RefreshCw,
  Square,
  MoreVertical,
  ArrowLeft,
  XCircle,
  QrCode,
  StickyNote,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { useState, useRef, useEffect } from 'react';

interface SessionStatusHeaderProps {
  session: {
    name: string;
    status: string;
    notes?: string;
    startTime?: string | Date | null;
    endTime?: string | Date | null;
    sessionDuration?: number;
    scheduledEndTime?: Date | string;
    gracePeriodEnd?: Date | string;
  };
  /** Read-only mode for player view - hides action menu */
  readOnly?: boolean;
  isRefreshing?: boolean;
  isToggleStatusLoading?: boolean;
  onToggleSessionStatus?: () => void;
  onCancelSession?: () => void;
  onRefreshData?: () => void;
  onShowQrView?: () => void;
  onShowQrJoin?: () => void;
  onSaveNotes?: (notes: string) => Promise<void>;
  /** Top offset for sticky positioning */
  stickyTop?: any;
  mt?: any;
  showBackButton?: boolean;
  backHref?: string;
}

const SessionStatusHeader: React.FC<SessionStatusHeaderProps> = ({
  session,
  readOnly = false,
  isRefreshing = false,
  isToggleStatusLoading = false,
  onToggleSessionStatus,
  onCancelSession,
  onRefreshData,
  onShowQrView,
  onShowQrJoin,
  onSaveNotes,
  stickyTop = 0,
  mt,
  showBackButton = false,
  backHref = '/',
}) => {
  const t = useTranslations('SessionDetail');
  const common = useTranslations('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(session.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canShowActionButtons = !readOnly && session.status !== 'CANCELLED';
  const actionAreaWidth = canShowActionButtons
    ? onSaveNotes
      ? '80px'
      : '40px'
    : '40px';

  // Compute overtime state
  const isOvertime =
    session.status === 'IN_PROGRESS' &&
    !!session.scheduledEndTime &&
    new Date() > new Date(session.scheduledEndTime);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Get status color for icons
  const getStatusBg = (status: string) => {
    if (isOvertime) return 'orange.500';
    switch (status) {
      case 'PREPARING':
        return 'green.500';
      case 'IN_PROGRESS':
        return 'red.500';
      case 'FINISHED':
        return 'gray.400';
      case 'CANCELLED':
        return 'gray.500';
      default:
        return 'brand.500';
    }
  };

  // Get header background color
  const getHeaderBg = () => {
    if (isOvertime) return 'orange.500';
    if (session.status === 'CANCELLED') return 'gray.500';
    return 'brand.500';
  };

  const handleToggleStatus = () => {
    onToggleSessionStatus?.();
    setIsMenuOpen(false);
  };

  const handleCancel = () => {
    onCancelSession?.();
    setIsMenuOpen(false);
  };

  const handleRefresh = () => {
    onRefreshData?.();
    setIsMenuOpen(false);
  };

  const handleOpenNotes = () => {
    setNotesDraft(session.notes || '');
    setIsMenuOpen(false);
    setIsNotesModalOpen(true);
  };

  const handleCloseNotes = () => {
    if (isSavingNotes) return;
    setNotesDraft(session.notes || '');
    setIsNotesModalOpen(false);
  };

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return;

    setIsSavingNotes(true);
    try {
      await onSaveNotes(notesDraft.trim());
      toaster.success({ title: t('sessionNotesSaved') });
      setIsNotesModalOpen(false);
    } catch (error) {
      console.error('Failed to save session notes:', error);
      toaster.error({ title: t('sessionNotesSaveFailed') });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Get status label
  const getStatusLabel = () => {
    if (isOvertime) return t('overtime');
    return '';
  };

  return (
    <Box
      position="sticky"
      top={stickyTop}
      zIndex={50}
      bg={getHeaderBg()}
      _dark={{
        bg: isOvertime
          ? 'orange.600'
          : session.status === 'CANCELLED'
            ? 'gray.600'
            : 'brand.600',
      }}
      mt={mt}
      borderBottomWidth="1px"
      borderColor={
        isOvertime
          ? 'orange.600'
          : session.status === 'CANCELLED'
            ? 'gray.600'
            : 'brand.600'
      }
      shadow="md"
      py={1}
      px={4}
      minH={{ base: '40px', md: '48px' }}
      display="flex"
      alignItems="center"
    >
      <Flex align="center" justify="space-between" position="relative" w="100%">
        {/* Left Back Button or spacer */}
        {showBackButton ? (
          <Box width={actionAreaWidth}>
            <Link href={backHref} prefetch={false}>
              <IconButton
                aria-label={common('back')}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                <ArrowLeft size={18} />
              </IconButton>
            </Link>
          </Box>
        ) : (
          <Box width={actionAreaWidth} />
        )}

        {/* Session Name & Status - Centered */}
        <Flex
          align="center"
          justify="center"
          gap={2}
          flex={1}
          overflow="hidden"
          px={2}
        >
          <Box
            w="16px"
            h="16px"
            borderRadius="full"
            bg={getStatusBg(session.status)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={`0 0 12px var(--chakra-colors-${getStatusBg(session.status).split('.')[0]}-400)`}
            border="1.5px solid"
            borderColor="whiteAlpha.400"
            flexShrink={0}
            {...(isOvertime && {
              animation: 'pulse 2s infinite',
            })}
          >
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg="white"
              boxShadow="0 0 4px white"
            />
          </Box>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="white"
            textShadow="0 1px 2px rgba(0,0,0,0.2)"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {session.name}
            {isOvertime && (
              <Text as="span" fontSize="xs" ml={2} opacity={0.9}>
                ({getStatusLabel()})
              </Text>
            )}
            {session.status === 'CANCELLED' && (
              <Text as="span" fontSize="xs" ml={2} opacity={0.9}>
                ({t('cancelled')})
              </Text>
            )}
          </Text>
        </Flex>

        {/* Action Button & Dropdown - Hidden in readOnly mode */}
        {canShowActionButtons ? (
          <Box
            width={actionAreaWidth}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            gap={1}
            position="relative"
            ref={menuRef}
          >
            {onSaveNotes && (
              <IconButton
                aria-label={t('openSessionNotes')}
                icon={<StickyNote size={18} />}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={handleOpenNotes}
              />
            )}
            <IconButton
              aria-label={t('headerActions')}
              icon={<MoreVertical size={20} />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {/* Custom Dropdown Menu */}
            {isMenuOpen && (
              <Box
                position="absolute"
                top="40px"
                right="0"
                bg="white"
                boxShadow="xl"
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
                _dark={{ bg: 'gray.800' }}
                py={2}
                minWidth="180px"
                zIndex={100}
              >
                {/* Play/Stop Action */}
                <Button
                  variant="ghost"
                  width="100%"
                  px={4}
                  py={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-start"
                  gap={3}
                  _hover={{ bg: 'bg.muted' }}
                  disabled={(() => {
                    if (session.status === 'FINISHED' || isToggleStatusLoading)
                      return true;
                    if (session.status === 'PREPARING') {
                      if (session.endTime)
                        return new Date(session.endTime) < new Date();
                      if (session.startTime) {
                        const computed = new Date(session.startTime);
                        computed.setMinutes(
                          computed.getMinutes() +
                            (session.sessionDuration || 120)
                        );
                        return computed < new Date();
                      }
                    }
                    return false;
                  })()}
                  onClick={handleToggleStatus}
                  opacity={(() => {
                    if (session.status === 'FINISHED' || isToggleStatusLoading)
                      return 0.5;
                    if (session.status === 'PREPARING') {
                      let isExpired = false;
                      if (session.endTime)
                        isExpired = new Date(session.endTime) < new Date();
                      else if (session.startTime) {
                        const computed = new Date(session.startTime);
                        computed.setMinutes(
                          computed.getMinutes() +
                            (session.sessionDuration || 120)
                        );
                        isExpired = computed < new Date();
                      }
                      if (isExpired) return 0.5;
                    }
                    return 1;
                  })()}
                  cursor={(() => {
                    if (session.status === 'FINISHED' || isToggleStatusLoading)
                      return 'not-allowed';
                    if (session.status === 'PREPARING') {
                      let isExpired = false;
                      if (session.endTime)
                        isExpired = new Date(session.endTime) < new Date();
                      else if (session.startTime) {
                        const computed = new Date(session.startTime);
                        computed.setMinutes(
                          computed.getMinutes() +
                            (session.sessionDuration || 120)
                        );
                        isExpired = computed < new Date();
                      }
                      if (isExpired) return 'not-allowed';
                    }
                    return 'pointer';
                  })()}
                  fontWeight="normal"
                  borderRadius="0"
                >
                  <Box
                    as={session.status === 'IN_PROGRESS' ? Square : Play}
                    boxSize={4}
                    color={getStatusBg(session.status)}
                  />
                  <Text fontSize="sm" fontWeight="medium">
                    {session.status === 'IN_PROGRESS'
                      ? isOvertime
                        ? t('endAndFinalize')
                        : t('end')
                      : t('start')}
                  </Text>
                </Button>

                {/* Cancel Action - Only for PREPARING */}
                {session.status === 'PREPARING' && onCancelSession && (
                  <Button
                    variant="ghost"
                    width="100%"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap={3}
                    _hover={{ bg: 'bg.muted' }}
                    onClick={handleCancel}
                    fontWeight="normal"
                    borderRadius="0"
                  >
                    <Box as={XCircle} boxSize={4} color="red.500" />
                    <Text fontSize="sm" fontWeight="medium" color="red.500">
                      {t('cancelSession')}
                    </Text>
                  </Button>
                )}

                {/* Refresh Action */}
                {session.status === 'IN_PROGRESS' && (
                  <Button
                    variant="ghost"
                    width="100%"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap={3}
                    _hover={{ bg: 'bg.muted' }}
                    disabled={isRefreshing}
                    onClick={handleRefresh}
                    opacity={isRefreshing ? 0.5 : 1}
                    cursor={isRefreshing ? 'not-allowed' : 'pointer'}
                    fontWeight="normal"
                    borderRadius="0"
                  >
                    <Box as={RefreshCw} boxSize={4} color="green.500" />
                    <Text fontSize="sm" fontWeight="medium">
                      {t('refresh')}
                    </Text>
                  </Button>
                )}

                {/* QR Code - Show Session */}
                {onShowQrView && (
                  <Button
                    variant="ghost"
                    width="100%"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap={3}
                    _hover={{ bg: 'bg.muted' }}
                    onClick={() => {
                      onShowQrView();
                      setIsMenuOpen(false);
                    }}
                    fontWeight="normal"
                    borderRadius="0"
                  >
                    <Box as={QrCode} boxSize={4} color="blue.500" />
                    <Text fontSize="sm" fontWeight="medium">
                      {t('qrScanToView')}
                    </Text>
                  </Button>
                )}

                {/* QR Code - Join Session */}
                {onShowQrJoin && (
                  <Button
                    variant="ghost"
                    width="100%"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap={3}
                    _hover={{ bg: 'bg.muted' }}
                    onClick={() => {
                      onShowQrJoin();
                      setIsMenuOpen(false);
                    }}
                    fontWeight="normal"
                    borderRadius="0"
                  >
                    <Box as={QrCode} boxSize={4} color="purple.500" />
                    <Text fontSize="sm" fontWeight="medium">
                      {t('qrScanToJoin')}
                    </Text>
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* Right spacer for centering title in readOnly/cancelled mode */
          <Box width={actionAreaWidth} />
        )}
      </Flex>
      <VModal
        isOpen={isNotesModalOpen}
        onClose={handleCloseNotes}
        title={t('sessionNotesTitle')}
        primaryActionText={common('save')}
        onPrimaryAction={handleSaveNotes}
        isPrimaryLoading={isSavingNotes}
        isPrimaryDisabled={isSavingNotes}
        secondaryActionText={common('cancel')}
        onSecondaryAction={handleCloseNotes}
      >
        <Textarea
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          placeholder={t('sessionNotesPlaceholder')}
          rows={8}
          resize="vertical"
          maxLength={2000}
        />
      </VModal>
    </Box>
  );
};

export default SessionStatusHeader;
