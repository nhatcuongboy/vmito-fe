'use client';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SessionReferenceVideoProps {
  url?: string | null;
}

type ReferenceVideo =
  | { type: 'youtube'; embedUrl: string }
  | { type: 'media'; src: string }
  | { type: 'link'; href: string };

const DIRECT_MEDIA_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg']);

function getYouTubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] || null;
  }

  if (!host.endsWith('youtube.com')) return null;

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] === 'embed' || segments[0] === 'shorts') {
    return segments[1] || null;
  }

  return null;
}

function parseReferenceVideo(rawUrl?: string | null): ReferenceVideo | null {
  const trimmedUrl = rawUrl?.trim();
  if (!trimmedUrl) return null;

  try {
    const url = new URL(trimmedUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`,
      };
    }

    const pathname = url.pathname.toLowerCase();
    const isDirectMedia = Array.from(DIRECT_MEDIA_EXTENSIONS).some((ext) =>
      pathname.endsWith(ext)
    );
    if (isDirectMedia) {
      return { type: 'media', src: trimmedUrl };
    }

    return { type: 'link', href: trimmedUrl };
  } catch {
    return null;
  }
}

export default function SessionReferenceVideo({
  url,
}: SessionReferenceVideoProps) {
  const t = useTranslations('session');
  const video = parseReferenceVideo(url);

  if (!video) return null;

  return (
    <Box>
      <Flex align="center" gap={2} mb={3}>
        <Icon as={PlayCircle} boxSize={5} color="green.500" />
        <Text fontWeight="semibold" fontSize={{ base: 'sm', md: 'md' }}>
          {t('referenceVideoTitle')}
        </Text>
      </Flex>

      <Box
        bg="gray.50"
        _dark={{ bg: 'gray.700' }}
        borderRadius="xl"
        overflow="hidden"
        border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'gray.600' }}
      >
        {video.type === 'youtube' && (
          <Box position="relative" w="full" aspectRatio={16 / 9}>
            <iframe
              src={video.embedUrl}
              title={t('referenceVideoTitle')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              style={{
                border: 0,
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </Box>
        )}

        {video.type === 'media' && (
          <video
            src={video.src}
            controls
            preload="metadata"
            style={{
              width: '100%',
              maxHeight: '420px',
              background: 'black',
              display: 'block',
            }}
          />
        )}

        {video.type === 'link' && (
          <Box p={{ base: 4, md: 5 }}>
            <a
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              <Flex
                align="center"
                justify="center"
                gap={2}
                w="fit-content"
                minH="36px"
                px={3}
                borderRadius="md"
                border="1px solid"
                borderColor="green.300"
                color="green.700"
                _dark={{ color: 'green.200', borderColor: 'green.700' }}
                _hover={{
                  bg: 'green.50',
                  _dark: { bg: 'green.900' },
                }}
                fontSize="sm"
                fontWeight="semibold"
              >
                {t('openReferenceVideo')}
                <ExternalLink size={15} />
              </Flex>
            </a>
          </Box>
        )}
      </Box>
    </Box>
  );
}
