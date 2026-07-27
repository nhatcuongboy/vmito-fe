'use client';

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { ExternalLink, Globe, Link as LinkIcon } from 'lucide-react';
import { FaFacebook, FaYoutube, FaTiktok } from 'react-icons/fa6';
import { ISocialLinks } from '@/types/club';
import { useTranslations } from 'next-intl';

interface ClubSocialLinksProps {
  socialLinks?: ISocialLinks;
  variant?: 'card' | 'inline' | 'compact';
}

const ZaloIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#0068FF" />
    <path
      d="M13 14H35V19.5L20.5 30.5H35V34H13V28.5L27.5 17.5H13V14Z"
      fill="white"
    />
  </svg>
);

const sanitizeUrl = (rawUrl?: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const ClubSocialLinks: React.FC<ClubSocialLinksProps> = ({
  socialLinks,
  variant = 'card',
}) => {
  const t = useTranslations('clubs.socialLinks');

  if (!socialLinks) return null;

  const items: Array<{
    key: keyof ISocialLinks;
    label: string;
    url: string | null;
    icon: React.ReactNode;
    color: string;
    bg: string;
    borderColor: string;
  }> = [
    {
      key: 'facebook' as const,
      label: t('facebook'),
      url: sanitizeUrl(socialLinks.facebook),
      icon: <FaFacebook size={18} color="#1877F2" />,
      color: '#1877F2',
      bg: 'blue.50',
      borderColor: 'blue.200',
    },
    {
      key: 'zalo' as const,
      label: t('zalo'),
      url: sanitizeUrl(socialLinks.zalo),
      icon: <ZaloIcon size={18} />,
      color: '#0068FF',
      bg: 'blue.50',
      borderColor: 'blue.200',
    },
    {
      key: 'tiktok' as const,
      label: t('tiktok'),
      url: sanitizeUrl(socialLinks.tiktok),
      icon: <FaTiktok size={16} color="#000000" />,
      color: '#000000',
      bg: 'gray.100',
      borderColor: 'gray.300',
    },
    {
      key: 'youtube' as const,
      label: t('youtube'),
      url: sanitizeUrl(socialLinks.youtube),
      icon: <FaYoutube size={18} color="#FF0000" />,
      color: '#FF0000',
      bg: 'red.50',
      borderColor: 'red.200',
    },
    {
      key: 'website' as const,
      label: t('website'),
      url: sanitizeUrl(socialLinks.website),
      icon: <Globe size={18} color="#0EA5E9" />,
      color: '#0EA5E9',
      bg: 'cyan.50',
      borderColor: 'cyan.200',
    },
    {
      key: 'other' as const,
      label: t('other'),
      url: sanitizeUrl(socialLinks.other),
      icon: <LinkIcon size={16} color="#6B7280" />,
      color: '#6B7280',
      bg: 'gray.50',
      borderColor: 'gray.200',
    },
  ].filter((item) => item.url !== null);

  if (items.length === 0) return null;

  if (variant === 'inline' || variant === 'compact') {
    return (
      <Flex gap={2} wrap="wrap" align="center">
        {items.map((item) => (
          <ChakraLink
            key={item.key}
            href={item.url!}
            target="_blank"
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            px={2.5}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="medium"
            bg={{ base: 'gray.100', _dark: 'gray.700' }}
            color={{ base: 'gray.800', _dark: 'gray.100' }}
            _hover={{
              bg: 'green.500',
              color: 'white',
              textDecoration: 'none',
              transform: 'translateY(-1px)',
            }}
            transition="all 0.2s ease"
          >
            <Box display="inline-flex" alignItems="center">
              {item.icon}
            </Box>
            <Text as="span">{item.label}</Text>
            <ExternalLink size={12} opacity={0.7} />
          </ChakraLink>
        ))}
      </Flex>
    );
  }

  return (
    <VStack gap={2.5} align="stretch" w="full">
      {items.map((item) => (
        <ChakraLink
          key={item.key}
          href={item.url!}
          target="_blank"
          rel="noopener noreferrer"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={3}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          bg={{ base: 'white', _dark: 'gray.800' }}
          textDecoration="none"
          _hover={{
            borderColor: 'green.500',
            bg: { base: 'green.50/50', _dark: 'gray.750' },
            shadow: 'sm',
            transform: 'translateY(-1px)',
          }}
          transition="all 0.2s ease"
        >
          <HStack gap={3} flex="1" minW={0}>
            <Flex
              w="32px"
              h="32px"
              borderRadius="lg"
              align="center"
              justify="center"
              bg={{ base: item.bg, _dark: 'whiteAlpha.100' }}
              flexShrink={0}
            >
              {item.icon}
            </Flex>
            <Box flex="1" minW={0}>
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color={{ base: 'gray.900', _dark: 'gray.100' }}
                lineClamp={1}
              >
                {item.label}
              </Text>
              <Text
                fontSize="xs"
                color="fg.muted"
                lineClamp={1}
                wordBreak="break-all"
              >
                {item.url}
              </Text>
            </Box>
          </HStack>
          <ExternalLink
            size={16}
            color="gray"
            style={{ flexShrink: 0, marginLeft: '8px' }}
          />
        </ChakraLink>
      ))}
    </VStack>
  );
};

export default ClubSocialLinks;
