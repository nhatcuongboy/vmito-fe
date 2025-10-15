import { useToast } from '@/components/ui/chakra-compat';
import { Box, Tabs, Text, VStack, Heading } from '@chakra-ui/react';
import React, { useState } from 'react';
import PlayerManagement from './PlayerManagement';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import GeneralSettings from './GeneralSettings';

interface SettingsTabProps {
  session: any;
  refreshSessionData: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  session,
  refreshSessionData,
}) => {
  // Show session summary cards like Management tab
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const availableSlots = maxPlayers - session.players.length;
  const courtsCount = session.numberOfCourts;

  // State for quick actions
  const toast = useToast();

  // Real API handlers

  return (
    <Box maxW="4xl" mx="auto">
      {/* <Heading size="md" mb={4} textAlign="center">
        Settings
      </Heading> */}
      <Tabs.Root defaultValue="general">
        <Tabs.List>
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="player">Players</Tabs.Trigger>
          <Tabs.Trigger value="qr">QR</Tabs.Trigger>
          <Tabs.Trigger value="court">Courts</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="general">
          <GeneralSettings
            session={session}
            onDataRefresh={refreshSessionData}
          />
        </Tabs.Content>
        <Tabs.Content value="qr">
          <VStack gap={6} py={6}>
            <Box textAlign="center">
              <Heading size="md" mb={2}>
                Session QR Code
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Players can scan this QR code to join the session
              </Text>
            </Box>

            <QRCodeGenerator
              joinCode={session.id.slice(-8).toUpperCase()}
              size={250}
            />

            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="center"
              maxW="300px"
            >
              Share this QR code with players to let them join the session
              quickly
            </Text>
          </VStack>
        </Tabs.Content>
        <Tabs.Content value="player">
          <PlayerManagement
            session={session}
            onDataRefresh={refreshSessionData}
          />
        </Tabs.Content>
        <Tabs.Content value="court">
          <Text>Court management settings will be here.</Text>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default SettingsTab;
