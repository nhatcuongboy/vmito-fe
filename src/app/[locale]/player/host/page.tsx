'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Flex, Heading, Spinner } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';
import SessionsList from '@/components/session/SessionsList';
import PageLayout from '@/components/layout/PageLayout';
import { Plus } from 'lucide-react';
import { useRouter } from '@/i18n/config';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import { Button } from '@/components/ui/chakra-compat';

function PlayerHostContent() {
  const t = useTranslations('pages.dashboard');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ISessionFilterState>({});

  const fetchPlayerSessions = async () => {
    try {
      setLoading(true);
      // Use getAvailableSessions to get full session data with fee, venue, and host info
      const sessionData = await SessionService.getAvailableSessions();
      // Filter for sessions hosted by current user
      const hostedSessions = sessionData.data.filter(
        (s) => s.hostId === user?.id
      );
      setSessions(hostedSessions);
      setFilteredSessions(hostedSessions);
    } catch (err) {
      console.error('Error fetching player sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlayerSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Apply filters whenever filters or sessions change
  useEffect(() => {
    let result = [...sessions];

    // Status filter
    if (filters.status) {
      result = result.filter((session) => session.status === filters.status);
    }

    // Date filter
    if (filters.date) {
      const filterDate = new Date(filters.date);
      result = result.filter((session) => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime);
        return (
          sessionDate.getFullYear() === filterDate.getFullYear() &&
          sessionDate.getMonth() === filterDate.getMonth() &&
          sessionDate.getDate() === filterDate.getDate()
        );
      });
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (session) =>
          session.name?.toLowerCase().includes(query) ||
          session.location?.toLowerCase().includes(query) ||
          session.venue?.name?.toLowerCase().includes(query) ||
          session.venue?.address?.toLowerCase().includes(query)
      );
    }

    // Default sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredSessions(result);
  }, [filters, sessions]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  return (
    <PageLayout
      showBackButton={false}
      title={tNav('host')}
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
      hideTopBarBorder={true}
    >
      <Flex mb={6} justify="space-between" align="center">
        <Heading as="h2" size="lg">
          {t('hostedSessions')}
        </Heading>
        <Button
          colorPalette="green"
          size="sm"
          onClick={() => router.push('/sessions/new')}
          loading={loading}
        >
          <Plus size={16} style={{ marginRight: 4 }} />
          {t('createSession')}
        </Button>
      </Flex>

      <SessionFilters
        onFilterChange={handleFilterChange}
        showStatusFilter={true}
        showDateFilter={true}
        showSearchFilter={true}
        showLevelFilter={false}
      />

      <SessionsList
        sessions={filteredSessions}
        isLoading={loading}
        mode="manage"
        onRefresh={fetchPlayerSessions}
      />
    </PageLayout>
  );
}

export default function PlayerHostPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER]}>
      <Suspense
        fallback={
          <Flex justify="center" align="center" minH="100vh">
            <Spinner size="xl" />
          </Flex>
        }
      >
        <PlayerHostContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
