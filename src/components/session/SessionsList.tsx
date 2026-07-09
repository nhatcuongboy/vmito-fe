'use client';

import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { Box, Grid, Icon, Text } from '@chakra-ui/react';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import SessionCard from './SessionCard';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { VModal } from '@/components/ui/VModal';
import AppHostDetail from './AppHostDetail';
import { useViewMode } from '@/hooks/useViewMode';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { Search } from 'lucide-react';

interface SessionsListProps {
  status?: string;
  mode?: 'view' | 'manage';
  sessions?: ISession[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onRefresh?: () => void;
  onHostClick?: (session: ISession) => void;
  hasMoreSessions?: boolean;
  /** Accurate total count of expired sessions from API, overrides client-side count */
  expiredCount?: number;
  /** Optional viewMode override - if not provided, will use internal useViewMode */
  viewMode?: 'grid' | 'list' | 'map';
  /** Show Download and Share buttons on session cards */
  showDownloadShareButtons?: boolean;
  /** Force showing View Session button instead of Manage */
  forceViewSessionButton?: boolean;
  /** Custom empty state title - if not provided, will use default translation */
  emptyStateTitle?: string;
  /** Custom empty state description - if not provided, will use default translation */
  emptyStateDescription?: string;
  /** Show an "Add guest" button on cards where the user already has a registration */
  onAddGuest?: (session: ISession) => void;
}

export default function SessionsList({
  status = 'ALL',
  mode = 'view',
  sessions: externalSessions,
  isLoading: externalLoading,
  isLoadingMore: externalLoadingMore,
  onRefresh,
  viewMode: externalViewMode,
  showDownloadShareButtons = false,
  forceViewSessionButton = false,
  emptyStateTitle,
  emptyStateDescription,
  onAddGuest,
}: SessionsListProps) {
  const [internalViewMode] = useViewMode('sessions');
  const viewMode = externalViewMode ?? internalViewMode;
  const [internalSessions, setInternalSessions] = useState<ISession[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('session');
  const locale = useLocale();
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const isExternalControl = externalSessions !== undefined;
  const loading = isExternalControl
    ? externalLoading || false
    : internalLoading;
  const loadingMore = externalLoadingMore || false;

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
    const sessions = isExternalControl
      ? externalSessions || []
      : internalSessions;
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
  }, [externalSessions, internalSessions, isExternalControl, status]);

  // Extract unique host IDs for batch rating stats loading
  const hostIds = useMemo(() => {
    const ids = filteredSessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [filteredSessions]);

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

  if (!loading && !loadingMore && filteredSessions.length === 0) {
    return (
      <AppEmptyState
        minH={{ base: '280px', md: '320px' }}
        icon={<Icon as={Search} boxSize={10} color="gray.400" />}
        title={emptyStateTitle || t('noActiveSessions')}
        description={emptyStateDescription || t('noActiveSessionsDescription')}
      />
    );
  }

  return (
    <RatingStatsProvider userIds={hostIds}>
      <>
        {/* Sessions Grid */}
        {filteredSessions.length > 0 && (
          <Grid
            templateColumns={
              viewMode === 'list'
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
            gap={viewMode === 'list' ? 4 : 6}
          >
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={mode === 'manage' ? handleDelete : undefined}
                onRefresh={onRefresh}
                mode={mode}
                variant={viewMode !== 'map' ? viewMode : 'grid'}
                onHostClick={() => {
                  setSelectedSessionForDetail(session);
                  setIsDetailModalOpen(true);
                }}
                showDownloadShareButtons={showDownloadShareButtons}
                forceViewSessionButton={forceViewSessionButton}
                onAddGuest={onAddGuest}
              />
            ))}
          </Grid>
        )}
      </>

      {/* Session Host Detail Modal */}
      <VModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
        maxBodyHeight={{
          base: 'calc(100vh - 120px)',
          md: 'calc(100vh - 112px)',
        }}
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
