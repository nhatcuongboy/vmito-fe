import { Box } from '@chakra-ui/react';
import React from 'react';
import GeneralSettings from './GeneralSettings';

interface SettingsTabProps {
  session: any;
  refreshSessionData: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  session,
  refreshSessionData,
}) => {
  return (
    <Box maxW="4xl" mx="auto">
      <GeneralSettings
        session={session}
        onDataRefresh={refreshSessionData}
      />
    </Box>
  );
};

export default SettingsTab;
