'use client';

import { ISession } from '@/lib/api/types';
import { Badge, Box, Flex, Icon, Image, Text, Wrap } from '@chakra-ui/react';
import { Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import type React from 'react';
import { SESSION_SHARE_THEMES } from './config';
import { SessionShareTemplateMeta, SessionShareThemeMeta } from './types';

export const DetailItem = ({
  icon,
  label,
  color,
  labelColor,
  lineClamp = 2,
  size = 'md',
  theme = SESSION_SHARE_THEMES[0],
}: {
  icon: React.ElementType;
  label?: string;
  color?: string;
  labelColor?: string;
  lineClamp?: number;
  size?: 'sm' | 'md' | 'venue' | 'lg';
  theme?: SessionShareThemeMeta;
}) => {
  if (!label) return null;

  const iconSize =
    size === 'lg' ? 52 : size === 'venue' ? 44 : size === 'md' ? 38 : 28;
  const fontSize =
    size === 'lg'
      ? '34px'
      : size === 'venue'
        ? '30px'
        : size === 'md'
          ? '25px'
          : '18px';

  return (
    <Flex align="center" gap={size === 'lg' ? 5 : 3} minW={0}>
      <Icon
        as={icon}
        boxSize={`${iconSize}px`}
        color={color || theme.primary}
        flexShrink={0}
      />
      <Text
        fontSize={fontSize}
        fontWeight="800"
        color={labelColor || theme.text}
        lineHeight="1.12"
        lineClamp={lineClamp}
        overflowWrap="break-word"
        minW={0}
      >
        {label}
      </Text>
    </Flex>
  );
};

export const LevelBadges = ({
  levels,
  size = 'md',
}: {
  levels?: ISession['requiredLevels'];
  size?: 'sm' | 'md' | 'lg';
}) => {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  const uniqueLevels = Array.from(new Set(levels || []));
  const fontSize = size === 'lg' ? '24px' : size === 'md' ? '18px' : '13px';
  const px = size === 'lg' ? 6 : size === 'md' ? 4 : 3;
  const getBadgeBg = (palette: string) => {
    if (palette === 'green') return '#e7f8ec';
    if (palette === 'yellow') return '#fff3bf';
    if (palette === 'red') return '#ffe4e6';
    return '#eef2f7';
  };

  if (uniqueLevels.length === 0) {
    return (
      <Box alignSelf="flex-start" maxW="100%" minW={0}>
        <Badge
          bg="#eef2f7"
          color="#27313f"
          borderRadius="999px"
          px={px}
          py={size === 'sm' ? 1 : 2}
          fontSize={fontSize}
          fontWeight="900"
          w="fit-content"
          maxW="100%"
          whiteSpace="normal"
          textAlign="left"
          lineHeight="1.1"
        >
          {t('allLevels')}
        </Badge>
      </Box>
    );
  }

  return (
    <Wrap gap={size === 'lg' ? 3 : 2} alignSelf="flex-start" maxW="100%">
      {uniqueLevels
        .sort((a, b) =>
          typeof a === 'number' && typeof b === 'number' ? a - b : 0
        )
        .map((level) => {
          const levelColor = getSkillLevelColor([level]);
          return (
            <Badge
              key={level}
              bg={getBadgeBg(levelColor.colorPalette)}
              color={levelColor.color}
              borderColor={levelColor.borderColor}
              borderWidth="2px"
              borderRadius="999px"
              px={px}
              py={size === 'sm' ? 1 : 2}
              fontSize={fontSize}
              fontWeight="900"
            >
              {getLevelShortLabel(level)}
            </Badge>
          );
        })}
    </Wrap>
  );
};

export const QrBlock = ({
  qrDataUrl,
  size,
  dark = false,
  showTitle = true,
  titleFontSize,
  captionFontSize,
  caption = 'Quét QR để xem kèo',
  theme = SESSION_SHARE_THEMES[0],
}: {
  qrDataUrl: string;
  size: number;
  dark?: boolean;
  showTitle?: boolean;
  titleFontSize?: string;
  captionFontSize?: string;
  caption?: string;
  theme?: SessionShareThemeMeta;
}) => (
  <Flex align="center" gap={4}>
    <Box bg="white" p="8px" borderRadius="18px" flexShrink={0}>
      <Image src={qrDataUrl} alt="VMITO QR Code" boxSize={`${size}px`} />
    </Box>
    <Box>
      {showTitle && (
        <Text
          fontSize={titleFontSize || (size >= 130 ? '27px' : '17px')}
          fontWeight="950"
          color={dark ? 'white' : theme.primaryDark}
          lineHeight="1.05"
        >
          VMITO.COM
        </Text>
      )}
      <Text
        fontSize={captionFontSize || (size >= 130 ? '20px' : '13px')}
        fontWeight="800"
        color={dark ? 'whiteAlpha.800' : theme.primary}
        lineHeight="1.15"
        whiteSpace="nowrap"
      >
        {caption}
      </Text>
    </Box>
  </Flex>
);

export const CoverImage = ({
  session,
  height,
  rounded = '0',
  imageFilter,
  overlay,
}: {
  session: ISession;
  height: string;
  rounded?: string;
  imageFilter?: string;
  overlay?: string;
}) => (
  <Box
    position="relative"
    h={height}
    overflow="hidden"
    borderRadius={rounded}
    bg="#182233"
  >
    <Image
      src={session.coverPhoto || DEFAULT_COVER_PHOTO}
      alt={session.name}
      w="100%"
      h="100%"
      objectFit="cover"
      crossOrigin="anonymous"
      filter={imageFilter}
    />
    {overlay !== 'none' && (
      <Box
        position="absolute"
        inset={0}
        bg={
          overlay ||
          'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.42) 100%)'
        }
      />
    )}
  </Box>
);

export const PricePill = ({
  fee,
  size = 'md',
  theme = SESSION_SHARE_THEMES[0],
}: {
  fee?: string;
  size?: 'md' | 'lg';
  theme?: SessionShareThemeMeta;
}) => {
  if (!fee) return null;

  return (
    <Flex
      align="center"
      gap={3}
      bg={theme.price}
      color="white"
      borderRadius="999px"
      px={size === 'lg' ? 8 : 5}
      py={size === 'lg' ? 4 : 2.5}
      w="fit-content"
      boxShadow="0 16px 40px rgba(233, 41, 47, 0.25)"
    >
      <Icon as={Banknote} boxSize={size === 'lg' ? '42px' : '28px'} />
      <Text
        fontSize={size === 'lg' ? '38px' : '24px'}
        fontWeight="950"
        lineHeight="1"
        letterSpacing="0"
      >
        {fee}
      </Text>
    </Flex>
  );
};

export const CardShell = ({
  id,
  meta,
  children,
  bg = 'white',
}: {
  id?: string;
  meta: SessionShareTemplateMeta;
  children: React.ReactNode;
  bg?: string;
}) => (
  <Box
    id={id}
    w={`${meta.width}px`}
    h={`${meta.height}px`}
    bg={bg}
    color="#222631"
    overflow="hidden"
    position="relative"
    fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    letterSpacing="0"
    textAlign="left"
    boxShadow="none"
  >
    {children}
  </Box>
);
