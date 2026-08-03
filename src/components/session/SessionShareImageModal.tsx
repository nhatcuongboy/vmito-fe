'use client';

import {
  Box,
  Flex,
  Grid,
  Icon,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Check, Download, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import SessionShareCard, {
  getSessionShareCardElementId,
  SESSION_SHARE_THEMES,
  SESSION_SHARE_TEMPLATES,
  SessionShareThemeId,
  SessionShareTemplateId,
  SessionShareTemplateMeta,
} from './SessionShareCard';

const SESSION_SHARE_THEME_STORAGE_KEY = 'vmito.sessionShareImage.themeId';

interface SessionShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
}

const ScaledShareCard = ({
  session,
  template,
  themeId,
  targetWidth,
  targetHeight,
}: {
  session: ISession;
  template: SessionShareTemplateMeta;
  themeId: SessionShareThemeId;
  targetWidth: number;
  targetHeight?: number;
}) => {
  const scale = targetHeight
    ? Math.min(targetWidth / template.width, targetHeight / template.height)
    : targetWidth / template.width;
  const scaledWidth = template.width * scale;
  const scaledHeight = template.height * scale;

  return (
    <Box
      w={`${scaledWidth}px`}
      h={`${scaledHeight}px`}
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
          themeId={themeId}
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
    useState<SessionShareTemplateId>(SESSION_SHARE_TEMPLATES[0].id);
  const [selectedThemeId, setSelectedThemeId] =
    useState<SessionShareThemeId>('default');
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();
  const thumbnailWidth = useBreakpointValue({ base: 86, md: 110 }) || 86;

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId(SESSION_SHARE_TEMPLATES[0].id);
      const storedThemeId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(SESSION_SHARE_THEME_STORAGE_KEY)
          : null;
      const resolvedTheme = SESSION_SHARE_THEMES.find(
        (theme) => theme.id === storedThemeId
      );
      setSelectedThemeId(resolvedTheme?.id || 'default');
      setIsFullPreviewOpen(false);
    }
  }, [isOpen]);

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
      lg: Math.min(620, selectedTemplate.width),
    }) || Math.min(300, selectedTemplate.width);
  const previewFrameHeight =
    useBreakpointValue({
      base: 300,
      sm: 340,
      md: 520,
      lg: 560,
    }) || 300;
  const previewInnerHeight =
    useBreakpointValue({
      base: 276,
      sm: 316,
      md: 472,
      lg: 512,
    }) || 276;
  const fullPreviewWidth =
    useBreakpointValue({
      base: 340,
      sm: 480,
      md: 760,
      lg: 940,
    }) || 340;
  const fullPreviewHeight =
    useBreakpointValue({
      base: 620,
      sm: 720,
      md: 760,
      lg: 820,
    }) || 620;

  const handleDownload = () => {
    // These templates are a full-bleed cover photo — JPEG keeps the file a
    // fraction of lossless PNG's size with no visible quality loss for a
    // photo, unlike the flat-color/text stats table export
    downloadSessionImage(session, exportElementId, 'TuyenVangLai', {
      templateId: selectedTemplateId,
      themeId: selectedThemeId,
      ratio: selectedTemplate.ratioLabel,
      imageType: 'jpeg',
    });
  };

  const handleSelectTheme = (themeId: SessionShareThemeId) => {
    setSelectedThemeId(themeId);
    window.localStorage.setItem(SESSION_SHARE_THEME_STORAGE_KEY, themeId);
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
      <Grid
        templateColumns={{ base: '1fr', lg: '520px minmax(0, 1fr)' }}
        gap={5}
        h={{ base: 'auto', lg: '560px' }}
        alignItems="stretch"
        overflow={{ base: 'visible', lg: 'hidden' }}
      >
        <Box
          order={{ base: 2, lg: 1 }}
          minW={0}
          h={{ base: 'auto', lg: '100%' }}
          overflowY={{ base: 'visible', lg: 'auto' }}
          overflowX={{ base: 'visible', lg: 'hidden' }}
          pr={{ base: 0, lg: 2 }}
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
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
          <Flex
            align="center"
            gap={3}
            mb={4}
            pt="8px"
            overflowX="auto"
            overscrollBehaviorX="contain"
            css={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <Text
              fontSize="xs"
              textTransform="uppercase"
              color="fg.muted"
              fontWeight="bold"
              flexShrink={0}
            >
              {t('themesLabel')}
            </Text>
            {SESSION_SHARE_THEMES.map((theme) => {
              const isSelected = theme.id === selectedThemeId;

              return (
                <Flex
                  key={theme.id}
                  as="button"
                  {...({ type: 'button' } as Record<string, unknown>)}
                  aria-label={t(`themes.${theme.id}.name`)}
                  title={t(`themes.${theme.id}.name`)}
                  align="center"
                  justify="center"
                  gap={1}
                  borderWidth="2px"
                  borderColor={isSelected ? 'green.500' : 'gray.200'}
                  bg="white"
                  _dark={{
                    bg: 'gray.800',
                    borderColor: isSelected ? 'green.400' : 'gray.700',
                  }}
                  borderRadius="full"
                  h="34px"
                  minW="58px"
                  px={2}
                  flexShrink={0}
                  position="relative"
                  transition="all 0.15s ease"
                  _hover={{ borderColor: 'green.400' }}
                  onClick={() => handleSelectTheme(theme.id)}
                >
                  {[theme.primary, theme.accent, theme.background].map(
                    (color) => (
                      <Box
                        key={color}
                        boxSize="12px"
                        borderRadius="999px"
                        bg={color}
                        border="1px solid"
                        borderColor="blackAlpha.200"
                      />
                    )
                  )}
                  {isSelected && (
                    <Flex
                      position="absolute"
                      right="-5px"
                      top="-5px"
                      bg="green.500"
                      color="white"
                      borderRadius="999px"
                      boxSize="16px"
                      align="center"
                      justify="center"
                    >
                      <Icon as={Check} boxSize={2.5} />
                    </Flex>
                  )}
                </Flex>
              );
            })}
          </Flex>

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
                  px={1.5}
                  py={1}
                  minH={{ base: '210px', lg: '260px' }}
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
                      themeId={selectedThemeId}
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
                  <Text mt={1} fontSize="sm" fontWeight="bold" color="fg">
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

        <Box
          minW={0}
          order={{ base: 1, lg: 2 }}
          h={{ base: 'auto', lg: '100%' }}
        >
          <Flex
            as="button"
            {...({ type: 'button' } as Record<string, unknown>)}
            bg={{ base: 'gray.100', _dark: 'gray.900' }}
            borderRadius="lg"
            h={{ base: `${previewFrameHeight}px`, lg: '100%' }}
            overflow="hidden"
            align="center"
            justify="center"
            p={{ base: 3, md: 6 }}
            w="full"
            cursor="zoom-in"
            _hover={{
              bg: { base: 'gray.200', _dark: 'gray.800' },
            }}
            onClick={() => setIsFullPreviewOpen(true)}
            aria-label={getTemplateName(selectedTemplate)}
          >
            <ScaledShareCard
              session={session}
              template={selectedTemplate}
              themeId={selectedThemeId}
              targetWidth={previewWidth}
              targetHeight={previewInnerHeight}
            />
          </Flex>
        </Box>
      </Grid>

      {isFullPreviewOpen && (
        <Flex
          position="fixed"
          inset={0}
          zIndex={2000}
          bg="blackAlpha.800"
          align="center"
          justify="center"
          p={{ base: 3, md: 8 }}
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <Button
            position="fixed"
            top={{ base: 4, md: 6 }}
            right={{ base: 4, md: 6 }}
            aria-label="Close preview"
            colorPalette="gray"
            variant="solid"
            onClick={(event) => {
              event.stopPropagation();
              setIsFullPreviewOpen(false);
            }}
          >
            <Icon as={X} />
          </Button>
          <Box
            onClick={(event) => event.stopPropagation()}
            maxW="full"
            maxH="full"
          >
            <ScaledShareCard
              session={session}
              template={selectedTemplate}
              themeId={selectedThemeId}
              targetWidth={fullPreviewWidth}
              targetHeight={fullPreviewHeight}
            />
          </Box>
        </Flex>
      )}

      <Box
        position="fixed"
        left={0}
        top={0}
        zIndex={-1}
        pointerEvents="none"
        aria-hidden="true"
        css={{
          contain: 'layout style paint',
        }}
      >
        <SessionShareCard
          session={session}
          templateId={selectedTemplateId}
          themeId={selectedThemeId}
          captureId={exportElementId}
        />
      </Box>
    </VModal>
  );
}
