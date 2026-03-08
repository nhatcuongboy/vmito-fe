'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import OverviewStats from './OverviewStats';

export default function HostDashboard() {
  const [sessions, setSessions] = useState<ISession[]>([]);

  const fetchSessions = async () => {
    try {
      const response = await SessionService.getAllSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      {/* Overview Stats */}
      <Box mb={8}>
        <OverviewStats sessions={sessions} />
      </Box>
    </ProtectedRouteGuard>
  );
}
