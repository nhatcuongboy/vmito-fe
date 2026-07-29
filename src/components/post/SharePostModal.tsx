'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Copy,
  Facebook,
  MessageCircle,
  Repeat2,
  Share2,
  Twitter,
} from 'lucide-react';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import type { Post } from '@/types/post';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onRepost: () => void;
  isReposting?: boolean;
}

interface ShareOption {
  key: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

export function SharePostModal({
  isOpen,
  onClose,
  post,
  onRepost,
  isReposting = false,
}: SharePostModalProps) {
  const t = useTranslations('posts');
  const locale = useLocale();

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}${ROUTES.NEWSFEED_POST(post.id)}`
      : '';
  const shareText = post.content?.trim().slice(0, 120) || t('shareDefaultText');

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toaster.create({ title: t('linkCopied'), type: 'success' });
      onClose();
    } catch {
      toaster.create({
        title: t('error'),
        description: t('copyLinkError'),
        type: 'error',
      });
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: shareText, url: shareUrl });
      onClose();
    } catch {
      // User dismissed the native sheet or it is unsupported; no action needed.
    }
  };

  const hasNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const options: ShareOption[] = [
    {
      key: 'feed',
      label: t('shareToFeed'),
      description: t('shareToFeedDesc'),
      icon: <Repeat2 size={20} />,
      iconBg: 'green.100',
      iconColor: 'green.600',
      onClick: () => {
        onClose();
        onRepost();
      },
    },
    {
      key: 'copy',
      label: t('copyLink'),
      description: t('copyLinkDesc'),
      icon: <Copy size={20} />,
      iconBg: 'gray.100',
      iconColor: 'gray.600',
      onClick: handleCopyLink,
    },
    {
      key: 'facebook',
      label: t('shareFacebook'),
      icon: <Facebook size={20} />,
      iconBg: 'blue.100',
      iconColor: 'blue.600',
      onClick: () =>
        openExternal(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        ),
    },
    {
      key: 'zalo',
      label: t('shareZalo'),
      icon: <MessageCircle size={20} />,
      iconBg: 'blue.50',
      iconColor: 'blue.500',
      onClick: () =>
        openExternal(
          `https://sp.zalo.me/plugins/share?url=${encodeURIComponent(shareUrl)}`
        ),
    },
    {
      key: 'x',
      label: t('shareX'),
      icon: <Twitter size={20} />,
      iconBg: 'gray.200',
      iconColor: 'gray.800',
      onClick: () =>
        openExternal(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        ),
    },
    ...(hasNativeShare
      ? [
          {
            key: 'native',
            label: t('shareNative'),
            icon: <Share2 size={20} />,
            iconBg: 'purple.100',
            iconColor: 'purple.600',
            onClick: handleNativeShare,
          },
        ]
      : []),
  ];

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('shareModalTitle')}
      size="sm"
      hideSecondaryAction
    >
      <Flex direction="column" gap={1} opacity={isReposting ? 0.6 : 1}>
        {options.map((option) => (
          <Flex
            key={option.key}
            as="button"
            // @ts-expect-error Chakra Flex forwards the native button type
            type="button"
            onClick={option.onClick}
            disabled={isReposting}
            align="center"
            gap={3}
            w="full"
            p={3}
            borderRadius="lg"
            textAlign="left"
            cursor="pointer"
            transition="background 0.15s"
            _hover={{ bg: { base: 'gray.100', _dark: 'whiteAlpha.100' } }}
            _disabled={{ cursor: 'not-allowed' }}
          >
            <Flex
              align="center"
              justify="center"
              w={10}
              h={10}
              flexShrink={0}
              borderRadius="full"
              bg={option.iconBg}
              color={option.iconColor}
            >
              {option.icon}
            </Flex>
            <Box minW={0}>
              <Text
                fontSize="15px"
                fontWeight="600"
                color={{ base: 'gray.900', _dark: 'gray.50' }}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  fontSize="13px"
                  color={{ base: 'gray.500', _dark: 'gray.400' }}
                >
                  {option.description}
                </Text>
              )}
            </Box>
          </Flex>
        ))}
      </Flex>
    </VModal>
  );
}
