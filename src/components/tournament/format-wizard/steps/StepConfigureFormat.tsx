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
    <Flex h="full" direction={{ base: 'column', md: 'row' }}>
      <FormatSidebar step={2} />

      <Box flex={1} overflowY="auto" p={6}>
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
