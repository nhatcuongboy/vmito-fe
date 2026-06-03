'use client';

import { Box, Flex } from '@chakra-ui/react';
import { useFormatWizard } from '../FormatWizardContext';
import FormatSidebar from '../components/FormatSidebar';
import RoundRobinConfig from '../config/RoundRobinConfig';
import SingleEliminationConfig from '../config/SingleEliminationConfig';
import RoundRobinToSEConfig from '../config/RoundRobinToSEConfig';
import { TournamentFormatType } from '../types';

export default function StepConfigureFormat() {
  const { state } = useFormatWizard();
  const { selectedFormat } = state;

  return (
    <Flex h="full" minH={0} direction={{ base: 'column', md: 'row' }}>
      <FormatSidebar step={2} />

      <Box flex={1} minH={0} minW={0} h="full" p={6} overflowY="auto">
        {selectedFormat === TournamentFormatType.ROUND_ROBIN && (
          <RoundRobinConfig />
        )}
        {selectedFormat === TournamentFormatType.SINGLE_ELIMINATION && (
          <SingleEliminationConfig />
        )}
        {selectedFormat === TournamentFormatType.ROUND_ROBIN_TO_SE && (
          <RoundRobinToSEConfig />
        )}
      </Box>
    </Flex>
  );
}
