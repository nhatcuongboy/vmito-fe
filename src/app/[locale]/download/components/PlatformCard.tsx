'use client';

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Clock, Download, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import {
  APP_INSTALL_CONFIG,
  type InstallTarget,
} from '@/constants/android-app';
import { Link } from '@/i18n/config';
import type { DownloadOs } from '../download-os';

interface PlatformCardProps {
  os: DownloadOs;
  icon: LucideIcon;
  title: string;
  description: string;
  target: InstallTarget | null;
  qrHint: string;
}

export default function PlatformCard({
  os,
  icon: Icon,
  title,
  description,
  target,
  qrHint,
}: PlatformCardProps) {
  const t = useTranslations('pages.download');
  const appInstallT = useTranslations('appInstall');
  const androidInstallT = useTranslations('androidInstall');

  const ctaLabel = target
    ? target.channel === 'app-store'
      ? appInstallT('appStoreCta')
      : target.channel === 'play-store'
        ? appInstallT('playStoreCta')
        : appInstallT('apkCta')
    : null;

  return (
    <VStack
      gap={4}
      p={6}
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg"
      boxShadow="sm"
    >
      <VStack gap={1}>
        <Box
          p={3}
          borderRadius="full"
          bg="green.100"
          color="green.600"
          _dark={{ bg: 'green.900/40', color: 'green.300' }}
        >
          <Icon size={28} />
        </Box>
        <Heading size="md" color="fg">
          <Link href={`/download/${os}`} style={{ textDecoration: 'none' }}>
            {title}
          </Link>
        </Heading>
        <Text fontSize="sm" color="fg.muted" textAlign="center">
          {description}
        </Text>
      </VStack>

      {target ? (
        <QRCodeGenerator
          joinCode={target.targetKey}
          url={target.url}
          size={160}
          label={qrHint}
          hideCode
          hideCopyButton
        />
      ) : (
        <VStack
          justify="center"
          w="160px"
          h="160px"
          borderRadius="lg"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border"
          color="fg.muted"
        >
          <Clock size={28} />
        </VStack>
      )}

      {target ? (
        <Box
          as="a"
          {...({
            href: target.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            ...(target.channel === 'apk'
              ? {
                  download: `vmito-v${APP_INSTALL_CONFIG.android.version || 'latest'}.apk`,
                }
              : {}),
          } as Record<string, unknown>)}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          w="full"
          minH="44px"
          px={4}
          borderRadius="md"
          bg="green.500"
          color="white"
          fontSize="sm"
          fontWeight="semibold"
          _hover={{ bg: 'green.600' }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'green.300',
            outlineOffset: '2px',
          }}
        >
          <Download size={16} />
          {ctaLabel}
        </Box>
      ) : (
        <HStack
          w="full"
          minH="44px"
          px={4}
          justify="center"
          borderRadius="md"
          borderWidth="1px"
          borderColor="border"
          color="fg.muted"
          fontSize="sm"
          fontWeight="semibold"
        >
          <Clock size={16} />
          <Text>{t('comingSoon')}</Text>
        </HStack>
      )}

      {target?.channel === 'apk' ? (
        <VStack gap={1}>
          {/* {APP_INSTALL_CONFIG.android.version ? (
            <HStack gap={1} fontSize="xs" color="fg.muted">
              <Text>{androidInstallT('version')}:</Text>
              <Text>{APP_INSTALL_CONFIG.android.version}</Text>
              {APP_INSTALL_CONFIG.android.fileSize ? (
                <>
                  <Text>·</Text>
                  <Text>{androidInstallT('fileSize')}:</Text>
                  <Text>{APP_INSTALL_CONFIG.android.fileSize}</Text>
                </>
              ) : null}
            </HStack>
          ) : null} */}
          <Text
            fontSize="xs"
            color="orange.600"
            _dark={{ color: 'orange.300' }}
            textAlign="center"
          >
            {appInstallT('apkNotice')}
          </Text>
        </VStack>
      ) : null}
    </VStack>
  );
}
