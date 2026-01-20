import { Box } from '@chakra-ui/react';
import React from 'react';
import GeneralSettings from './GeneralSettings';
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
      <GeneralSettings session={session} onDataRefresh={refreshSessionData} />
    </Box>
  );
};

export default SettingsTab;
