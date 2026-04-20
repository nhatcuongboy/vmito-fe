'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import {
  RoundRobinToSEConfig as RRToSEConfigType,
  RoundRobinConfig as RRConfigType,
} from '../types';
import PreviewTable from '../components/PreviewTable';
import RoundRobinConfigForm from '../components/RoundRobinConfigForm';

export default function RoundRobinToSEConfig() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as RRToSEConfigType;
  const rr = config?.roundRobin;

  if (!config || !rr) return null;

  const updateRR = (partial: Partial<RRConfigType>) => {
    updateConfig({
      ...config,
      roundRobin: { ...rr, ...partial },
    });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
      {/* Left: Configuration form */}
      <Box flex={1} overflowY="auto" minH={0} pr={{ lg: 4 }}>
        {/* Group Stage section header */}
        <Text fontWeight="bold" fontSize="lg" mb={3}>
          {t('config.rrse.groupStage')}
        </Text>

        <RoundRobinConfigForm config={rr} update={updateRR} />
      </Box>

      {/* Right: Preview table */}
      <Box w={{ base: 'full', lg: '45%' }} flexShrink={0}>
        <PreviewTable columns={rr.standingsColumns} />
      </Box>
    </Flex>
  );
}
