'use client';

import { Box, Flex } from '@chakra-ui/react';
import { useFormatWizard } from '../FormatWizardContext';
import { RoundRobinConfig as RoundRobinConfigType } from '../types';
import PreviewTable from '../components/PreviewTable';
import RoundRobinConfigForm from '../components/RoundRobinConfigForm';

export default function RoundRobinConfig() {
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as RoundRobinConfigType;

  if (!config) return null;

  const update = (partial: Partial<RoundRobinConfigType>) => {
    updateConfig({ ...config, ...partial });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
      {/* Left: Configuration form */}
      <Box flex={1} overflowY="auto" minH={0} pr={{ lg: 4 }}>
        <RoundRobinConfigForm config={config} update={update} />
      </Box>

      {/* Right: Preview table */}
      <Box w={{ base: 'full', lg: '45%' }} flexShrink={0} pt={{ lg: 0 }}>
        <PreviewTable columns={config.standingsColumns} />
      </Box>
    </Flex>
  );
}
