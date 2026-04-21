'use client';

import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { Box, Grid, Heading, Text, Flex } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import SessionCard from './SessionCard';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { VModal } from '@/components/ui/VModal';
import AppHostDetail from './AppHostDetail';
import { ChevronDown } from 'lucide-react';

import { useSessionFilterStore } from '@/stores/useSessionFilterStore';

interface SessionsListProps {
  status?: string;
  mode?: 'view' | 'manage';
  sessions?: ISession[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onHostClick?: (session: ISession) => void;
}

export default function SessionsList({
  status = 'ALL',
  mode = 'view',
  sessions: externalSessions,
  isLoading: externalLoading,
  onRefresh,
  onHostClick,
}: SessionsListProps) {
  const { viewMode } = useSessionFilterStore();
  const [internalSessions, setInternalSessions] = useState<ISession[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('session');
  const locale = useLocale();
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExpiredSectionsExpanded, setIsExpiredSectionsExpanded] =
    useState(true);

  const isExternalControl = externalSessions !== undefined;
  const sessions = isExternalControl
    ? externalSessions || []
    : internalSessions;
  const loading = isExternalControl
    ? externalLoading || false
    : internalLoading;

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      if (!isExternalControl) {
        setInternalLoading(true);
      }
      await SessionService.deleteSession(id);

      if (isExternalControl) {
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setInternalSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      setError('Failed to delete session');
    } finally {
      if (!isExternalControl) {
        setInternalLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only fetch if not controlled externally
    if (isExternalControl) return;

    async function fetchSessions() {
      try {
        setInternalLoading(true);
        const response = await SessionService.getAllSessions();
        setInternalSessions(response.data);
      } catch (_err) {
        setError(t('loadingError'));
        console.error(_err);
      } finally {
        setInternalLoading(false);
      }
    }

    fetchSessions();
  }, [locale, t, isExternalControl]);

  // Filter sessions by status
  const filteredSessions = useMemo(() => {
    const result =
      status === 'ALL'
        ? sessions
        : status === 'UPCOMING_AND_INPROGRESS'
          ? sessions.filter(
              (s) => s.status === 'PREPARING' || s.status === 'IN_PROGRESS'
            )
          : sessions.filter((s) => s.status === status);

    // Return the result as is to respect the order from API/caller
    return result;
  }, [sessions, status]);

  // Separate expired sessions from normal sessions
  const { normalSessions, expiredSessions } = useMemo(() => {
    const expired: ISession[] = [];
    const normal: ISession[] = [];

    filteredSessions.forEach((session) => {
      if (
        session.status === 'PREPARING' &&
        session.endTime &&
        new Date(session.endTime) < new Date()
      ) {
        expired.push(session);
      } else {
        normal.push(session);
      }
    });

    return { normalSessions: normal, expiredSessions: expired };
  }, [filteredSessions]);

  // Extract unique host IDs for batch rating stats loading
  const hostIds = useMemo(() => {
    const ids = filteredSessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [filteredSessions]);

  // Combine for empty check
  const allDisplaySessions = [...normalSessions, ...expiredSessions];

  if (loading) {
    return (
      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        gap={6}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <SessionCardSkeleton key={index} />
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box
        p={4}
        bg="red.50"
        color="red.600"
        borderRadius="md"
        mb={6}
        borderWidth="1px"
        borderColor="red.200"
      >
        <Text fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  if (filteredSessions.length === 0) {
    return (
      <Box
        textAlign="center"
        py={10}
        px={6}
        borderWidth="1px"
        borderRadius="lg"
        bg="white"
        _dark={{ bg: 'gray.800' }}
      >
        <Heading size="md" mb={2}>
          {t('noActiveSessions')}
        </Heading>
        <Text color="gray.500">{t('noActiveSessionsDescription')}</Text>
      </Box>
    );
  }

  return (
    <RatingStatsProvider userIds={hostIds}>
      <>
        {/* Expired Sessions Alert Section */}
        {mode === 'manage' && expiredSessions.length > 0 && (
          <Box
            mb={8}
            p={4}
            bg="orange.50"
            borderWidth="1px"
            borderColor="orange.200"
            borderRadius="lg"
            _dark={{ bg: 'orange.900', borderColor: 'orange.700' }}
          >
            <Flex alignItems="center" justifyContent="space-between" mb={3}>
              <Flex alignItems="center" gap={3} flex={1}>
                <Heading
                  size="sm"
                  color="orange.700"
                  _dark={{ color: 'orange.200' }}
                  mb={0}
                >
                  ⚠️ {t('expiredSessionsNeedAction') || 'Kèo cần xử lý'}
                </Heading>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  bg="orange.100"
                  _dark={{ bg: 'orange.800' }}
                  color="orange.700"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {expiredSessions.length}
                </Text>
              </Flex>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  setIsExpiredSectionsExpanded(!isExpiredSectionsExpanded)
                }
                aria-label={
                  isExpiredSectionsExpanded
                    ? t('collapse') || 'Collapse'
                    : t('expand') || 'Expand'
                }
                color="orange.700"
                _dark={{ color: 'orange.200' }}
                _hover={{
                  bg: 'orange.100',
                  _dark: { bg: 'orange.800' },
                }}
              >
                <ChevronDown
                  size={20}
                  style={{
                    transform: isExpiredSectionsExpanded
                      ? 'rotate(0deg)'
                      : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </IconButton>
            </Flex>

            {/* <Text
              fontSize="sm"
              color="orange.600"
              mb={4}
              _dark={{ color: 'orange.300' }}
            >
              {t('expiredSessionsDescription') ||
                'Những kèo dưới đây đã quá giờ kết thúc nhưng chưa được bắt đầu hoặc kết thúc. Vui lòng cập nhật thời gian hoặc hủy kèo.'}
            </Text> */}

            {isExpiredSectionsExpanded && (
              <Grid
                templateColumns={
                  viewMode === 'compact'
                    ? {
                        base: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                      }
                    : {
                        base: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      }
                }
                gap={viewMode === 'compact' ? 4 : 6}
              >
                {expiredSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onDelete={mode === 'manage' ? handleDelete : undefined}
                    onRefresh={onRefresh}
                    mode={mode}
                    variant={viewMode}
                    onHostClick={() => {
                      setSelectedSessionForDetail(session);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Normal Sessions Section */}
        {normalSessions.length > 0 && (
          <Grid
            templateColumns={
              viewMode === 'compact'
                ? {
                    base: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }
                : {
                    base: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  }
            }
            gap={viewMode === 'compact' ? 4 : 6}
          >
            {normalSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={mode === 'manage' ? handleDelete : undefined}
                onRefresh={onRefresh}
                mode={mode}
                variant={viewMode}
                onHostClick={() => {
                  setSelectedSessionForDetail(session);
                  setIsDetailModalOpen(true);
                }}
              />
            ))}
          </Grid>
        )}

        {/* Empty State for Normal Sessions */}
        {normalSessions.length === 0 && expiredSessions.length > 0 && (
          <Box
            textAlign="center"
            py={10}
            px={6}
            borderWidth="1px"
            borderRadius="lg"
            bg="white"
            _dark={{ bg: 'gray.800' }}
          >
            <Heading size="md" mb={2}>
              {t('noActiveSessions')}
            </Heading>
            <Text color="gray.500">{t('noActiveSessionsDescription')}</Text>
          </Box>
        )}
      </>

      {/* Session Host Detail Modal */}
      <VModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
      >
        {selectedSessionForDetail && (
          <AppHostDetail
            userId={selectedSessionForDetail.hostId}
            name={
              selectedSessionForDetail.hostName ||
              selectedSessionForDetail.host?.name
            }
            image={selectedSessionForDetail.host?.image || undefined}
            phone={selectedSessionForDetail.hostPhone}
            email={selectedSessionForDetail.host?.email}
            hideHeader={true}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )}
      </VModal>
    </RatingStatsProvider>
  );
}
