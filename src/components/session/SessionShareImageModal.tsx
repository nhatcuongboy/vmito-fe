'use client';

import {
  Box,
  Flex,
  Grid,
  Icon,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Check, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import SessionShareCard, {
  getSessionShareCardElementId,
  SESSION_SHARE_TEMPLATES,
  SessionShareTemplateId,
  SessionShareTemplateMeta,
} from './SessionShareCard';

interface SessionShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
}

const ScaledShareCard = ({
  session,
  template,
  targetWidth,
}: {
  session: ISession;
  template: SessionShareTemplateMeta;
  targetWidth: number;
}) => {
  const scale = targetWidth / template.width;

  return (
    <Box
      w={`${targetWidth}px`}
      h={`${template.height * scale}px`}
      overflow="hidden"
      borderRadius="10px"
      bg="gray.100"
      flexShrink={0}
    >
      <Box
        w={`${template.width}px`}
        h={`${template.height}px`}
        transform={`scale(${scale})`}
        transformOrigin="top left"
        pointerEvents="none"
      >
        <SessionShareCard
          session={session}
          templateId={template.id}
          captureId={null}
        />
      </Box>
    </Box>
  );
};

export default function SessionShareImageModal({
  isOpen,
  onClose,
  session,
}: SessionShareImageModalProps) {
  const t = useTranslations('session.shareImageModal');
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<SessionShareTemplateId>('social-poster');
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();
  const thumbnailWidth = useBreakpointValue({ base: 86, md: 110 }) || 86;

  const selectedTemplate = useMemo(
    () =>
      SESSION_SHARE_TEMPLATES.find(
        (template) => template.id === selectedTemplateId
      ) || SESSION_SHARE_TEMPLATES[0],
    [selectedTemplateId]
  );

  const exportElementId = getSessionShareCardElementId(
    session.id,
    selectedTemplateId
  );
  const previewWidth =
    useBreakpointValue({
      base: selectedTemplate.ratioLabel === '9:16' ? 230 : 300,
      sm: selectedTemplate.ratioLabel === '9:16' ? 250 : 340,
      md: Math.min(460, selectedTemplate.width),
      lg: Math.min(520, selectedTemplate.width),
    }) || Math.min(300, selectedTemplate.width);

  const handleDownload = () => {
    downloadSessionImage(session, exportElementId, 'TuyenVangLai', {
      templateId: selectedTemplateId,
      ratio: selectedTemplate.ratioLabel,
    });
  };

  const getTemplateName = (template: SessionShareTemplateMeta) =>
    t(`templates.${template.id}.name`);

  const getTemplateDescription = (template: SessionShareTemplateMeta) =>
    t(`templates.${template.id}.description`);

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      size="full"
      maxBodyHeight={{ base: '78vh', md: '76vh' }}
      footer={
        <Flex justify="space-between" align="center" w="full" gap={3}>
          <Box>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              {getTemplateName(selectedTemplate)}
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="green.600">
              {selectedTemplate.width}×{selectedTemplate.height}
            </Text>
          </Box>
          <Button
            colorPalette="green"
            loading={isDownloading}
            onClick={handleDownload}
            leftIcon={<Icon as={Download} />}
          >
            {t('download')}
          </Button>
        </Flex>
      }
    >
      <Grid templateColumns={{ base: '1fr', lg: '360px 1fr' }} gap={5}>
        <Box order={{ base: 2, lg: 1 }} minW={0}>
          <Text
            fontSize="xs"
            textTransform="uppercase"
            color="fg.muted"
            fontWeight="bold"
            mb={3}
          >
            {t('templatesLabel')}
          </Text>
          <Grid
            gridAutoFlow={{ base: 'column', lg: 'row' }}
            gridAutoColumns={{ base: '142px', sm: '154px', lg: 'auto' }}
            templateColumns={{
              base: 'none',
              lg: '1fr 1fr',
            }}
            gap={3}
            overflowX={{ base: 'auto', lg: 'visible' }}
            pb={{ base: 2, lg: 0 }}
            overscrollBehaviorX="contain"
            css={{
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': {
                height: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-gray-300)',
                borderRadius: '999px',
              },
            }}
          >
            {SESSION_SHARE_TEMPLATES.map((template) => {
              const isSelected = template.id === selectedTemplateId;

              return (
                <Box
                  key={template.id}
                  as="button"
                  {...({ type: 'button' } as Record<string, unknown>)}
                  textAlign="left"
                  borderWidth="2px"
                  borderColor={isSelected ? 'green.500' : 'gray.200'}
                  bg={isSelected ? 'green.50' : 'white'}
                  _dark={{
                    bg: isSelected ? 'green.900' : 'gray.800',
                    borderColor: isSelected ? 'green.400' : 'gray.700',
                  }}
                  borderRadius="lg"
                  p={2}
                  scrollSnapAlign="start"
                  transition="all 0.15s ease"
                  _hover={{
                    borderColor: 'green.400',
                    transform: 'translateY(-1px)',
                  }}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <Box position="relative" mx="auto" w={`${thumbnailWidth}px`}>
                    <ScaledShareCard
                      session={session}
                      template={template}
                      targetWidth={thumbnailWidth}
                    />
                    {isSelected && (
                      <Flex
                        position="absolute"
                        top={2}
                        right={2}
                        bg="green.500"
                        color="white"
                        borderRadius="999px"
                        boxSize="24px"
                        align="center"
                        justify="center"
                      >
                        <Icon as={Check} boxSize={4} />
                      </Flex>
                    )}
                  </Box>
                  <Text mt={2} fontSize="sm" fontWeight="bold" color="fg">
                    {getTemplateName(template)}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    lineClamp={{ base: 1, lg: 2 }}
                  >
                    {template.ratioLabel} - {getTemplateDescription(template)}
                  </Text>
                </Box>
              );
            })}
          </Grid>
        </Box>

        <Box minW={0} order={{ base: 1, lg: 2 }}>
          <Flex
            bg={{ base: 'gray.100', _dark: 'gray.900' }}
            borderRadius="lg"
            minH={{ base: 'auto', md: '620px' }}
            maxH={{ base: '48vh', md: 'none' }}
            overflow="auto"
            align="flex-start"
            justify="center"
            p={{ base: 3, md: 6 }}
          >
            <ScaledShareCard
              session={session}
              template={selectedTemplate}
              targetWidth={previewWidth}
            />
          </Flex>
        </Box>
      </Grid>

      <Box
        position="absolute"
        left="-9999px"
        top="-9999px"
        pointerEvents="none"
      >
        <SessionShareCard
          session={session}
          templateId={selectedTemplateId}
          captureId={exportElementId}
        />
      </Box>
    </VModal>
  );
}
