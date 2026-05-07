import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import SessionEditForm from './SessionEditForm';
import { ISession } from '@/lib/api/types';

interface SessionSettingsTabProps {
  session: ISession;
  refreshSessionData: () => void;
}

const SessionSettingsTab: React.FC<SessionSettingsTabProps> = ({
  session,
  refreshSessionData,
}) => {
  return (
    <Flex justify="center" w="full">
      <Box maxW="4xl" w="full">
        <SessionEditForm
          sessionId={session.id}
          onSuccess={() => {
            refreshSessionData();
          }}
        />
      </Box>
    </Flex>
  );
};

export default SessionSettingsTab;
