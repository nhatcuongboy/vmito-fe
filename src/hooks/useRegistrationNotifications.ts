import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';

interface RegistrationRequestData {
  sessionId: string;
  playerId: string;
  playerName: string;
  userId: string;
  sessionName: string;
}

interface RegistrationStatusData {
  sessionId: string;
  playerId: string;
  status: 'APPROVED' | 'REJECTED';
  sessionName: string;
}

export const useRegistrationNotifications = () => {
  const { socket } = useSocket();
  const t = useTranslations('session');

  useEffect(() => {
    if (!socket) return;

    // Listen for new registration requests (for hosts)
    const handleRegistrationRequest = (data: RegistrationRequestData) => {
      toaster.info({
        title: t('newRegistrationRequest'),
        description: `${data.playerName} - ${data.sessionName}`,
      });
    };

    // Listen for registration status updates (for players)
    const handleStatusUpdate = (data: RegistrationStatusData) => {
      if (data.status === 'APPROVED') {
        toaster.success({
          title: t('requestApproved'),
          description: data.sessionName,
        });
      } else if (data.status === 'REJECTED') {
        toaster.error({
          title: t('requestRejected'),
          description: data.sessionName,
        });
      }
    };

    socket.on('registration_request', handleRegistrationRequest);
    socket.on('registration_status_updated', handleStatusUpdate);

    return () => {
      socket.off('registration_request', handleRegistrationRequest);
      socket.off('registration_status_updated', handleStatusUpdate);
    };
  }, [socket, t]);
};
