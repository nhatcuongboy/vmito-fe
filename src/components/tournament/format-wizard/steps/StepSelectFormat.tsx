'use client';

import { Box, Flex } from '@chakra-ui/react';
import { SimpleGrid } from '@/components/ui/chakra-compat';
import { useFormatWizard } from '../FormatWizardContext';
import FormatSidebar from '../components/FormatSidebar';
import FormatCard from '../components/FormatCard';
import { FORMAT_TEMPLATES } from '../constants';

export default function StepSelectFormat() {
  const { state, selectFormat } = useFormatWizard();
  const { selectedFormat, filterCategory } = state;

  const filteredTemplates = filterCategory
    ? FORMAT_TEMPLATES.filter((tpl) =>
        tpl.filterCategories.includes(filterCategory)
      )
    : FORMAT_TEMPLATES;

  return (
    <Flex h="full" direction={{ base: 'column', md: 'row' }}>
      <FormatSidebar step={1} />

      <Box flex={1} overflowY="auto" p={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} maxW="800px">
          {filteredTemplates.map((template) => (
            <FormatCard
              key={template.id}
              formatId={template.id}
              isSelected={selectedFormat === template.id}
              onSelect={() => selectFormat(template.id)}
            />
          ))}
        </SimpleGrid>
      </Box>
    </Flex>
  );
}
