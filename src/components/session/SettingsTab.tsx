import { Box, Flex } from '@chakra-ui/react';
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
    <Flex justify="center" w="full">
      <Box maxW="4xl" w="full">
        <SessionEditForm
          sessionId={session.id}
          onSuccess={(updatedSession: ISession) => {
            refreshSessionData();
          }}
        />
      </Box>
    </Flex>
  );
};

export default SettingsTab;
