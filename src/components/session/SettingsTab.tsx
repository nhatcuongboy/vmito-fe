import { Box } from '@chakra-ui/react';
import React from 'react';
import SessionEditForm from './SessionEditForm';
import { ISession } from '@/lib/api/types';

interface SettingsTabProps {
  session: ISession;
  refreshSessionData: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  session,
  refreshSessionData,
}) => {
  return (
    <Box maxW="4xl" mx="auto">
      <SessionEditForm
        sessionId={session.id}
        onSuccess={(updatedSession: ISession) => {
          refreshSessionData();
        }}
      />
    </Box>
  );
};

export default SettingsTab;
