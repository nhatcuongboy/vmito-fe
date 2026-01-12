import { Box, Tabs, Text } from '@chakra-ui/react';
import React from 'react';
import GeneralSettings from './GeneralSettings';
import PlayerManagement from './PlayerManagement';
import CourtSettings from './CourtSettings';
import { SessionService } from '@/lib/api/session.service';
import { toaster } from '@/components/ui/toaster';

interface SettingsTabProps {
  session: any;
  refreshSessionData: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  session,
  refreshSessionData,
}) => {
  // Show session summary cards like Management tab
  // const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  // const availableSlots = maxPlayers - session.players.length;
  // const courtsCount = session.numberOfCourts;

  const handleUpdateSettings = async (key: string, value: any) => {
    try {
      await SessionService.updateSession(session.id, {
        [key]: value,
      });
      refreshSessionData();
      toaster.success({ title: 'Settings updated successfully' });
    } catch (error) {
      toaster.error({ title: 'Failed to update settings' });
      console.error('Update settings error:', error);
    }
  };

  return (
    <Box maxW="4xl" mx="auto">
      {/* <Heading size="md" mb={4} textAlign="center">
        Settings
      </Heading> */}
      <Tabs.Root defaultValue="general">
        <Tabs.List>
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="player">Players</Tabs.Trigger>
          <Tabs.Trigger value="court">Courts</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="general">
          <GeneralSettings
            session={session}
            onDataRefresh={refreshSessionData}
          />
        </Tabs.Content>
        <Tabs.Content value="player">
          <PlayerManagement
            session={session}
            onDataRefresh={refreshSessionData}
          />
        </Tabs.Content>
        <Tabs.Content value="court">
          <CourtSettings
            session={session}
            onUpdateSettings={handleUpdateSettings}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default SettingsTab;
