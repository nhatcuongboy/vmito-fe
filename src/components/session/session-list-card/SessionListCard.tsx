'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Icon,
  Image,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { ISession } from '@/lib/api/types';
import { Link } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { FeeService } from '@/lib/api/fee.service';
import { useTranslations } from 'next-intl';
import { useSessionListCardViewModel } from './useSessionListCardViewModel';

interface SessionListCardProps {
  session: ISession;
  href: string;
  overlayBadge?: React.ReactNode;
  bottomOverlayBadge?: React.ReactNode;
  identityRow?: React.ReactNode;
  cornerAction?: React.ReactNode;
  actionFooter?: React.ReactNode;
  bottomBar?: React.ReactNode;
  distance?: number;
  imagePriority?: boolean;
}

export const SessionListCard = ({
  session,
  href,
  overlayBadge,
  bottomOverlayBadge,
  identityRow,
  cornerAction,
  actionFooter,
  bottomBar,
  distance,
  imagePriority = false,
}: SessionListCardProps) => {
  const t = useTranslations('session');
  const viewModel = useSessionListCardViewModel(session, distance);
  const [isLoading, setIsLoading] = useState(false);
  const isSplitFeeFallback = viewModel.feeDisplayText === 'Chia đều';
  const feeDisplayText = isSplitFeeFallback
    ? t('splitFeeLabel')
    : viewModel.feeDisplayText;
  const showFeePerSlot = FeeService.shouldShowPerSlot(session.feeConfig);

  const handleCardLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 5000);
  };

  return (
    <Box
      h="100%"
      w="100%"
      transition="transform 0.15s ease, opacity 0.15s ease"
      _active={{ transform: 'scale(0.98)', opacity: 0.95 }}
      css={{
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      <Box
        position="relative"
        display="flex"
        flexDirection={{ base: 'row', md: 'column' }}
        height="100%"
        overflow="hidden"
        bg={viewModel.isCrawled ? 'gray.50' : 'white'}
        borderWidth={viewModel.isCrawled ? '1px' : '1px'}
        borderColor={viewModel.isCrawled ? 'gray.200' : 'brand.200'}
        _dark={{
          bg: viewModel.isCrawled ? 'gray.900' : 'gray.800',
          borderColor: viewModel.isCrawled ? 'gray.700' : 'brand.600',
        }}
        borderRadius="xl"
        boxShadow={
          viewModel.isCrawled
            ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)'
            : '0 4px 12px rgba(16, 185, 129, 0.12)'
        }
        transition="box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease"
        _hover={{
          boxShadow:
            '0 8px 16px rgba(23, 154, 59, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: 'green.200',
        }}
        _focusWithin={{
          borderColor: 'green.500',
          boxShadow: '0 0 0 3px rgba(23, 154, 59, 0.2)',
        }}
      >
        <Link
          href={href}
          aria-label={session.name}
          prefetch={false}
          onClick={handleCardLinkClick}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            zIndex: 1,
          }}
        />

        <Box
          position="relative"
          overflow="hidden"
          flexShrink={0}
          w={{ base: '120px', md: 'auto' }}
          aspectRatio={{ base: 'auto', md: 3 / 2 }}
        >
          <Image
            src={viewModel.coverPhoto}
            alt={session.name}
            position="absolute"
            inset={0}
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center 40%"
            loading={imagePriority ? 'eager' : 'lazy'}
            fetchPriority={imagePriority ? 'high' : 'low'}
            decoding="async"
            onError={(event) => {
              const image = event.currentTarget as HTMLImageElement;
              if (image.src !== DEFAULT_COVER_PHOTO) {
                image.src = DEFAULT_COVER_PHOTO;
              }
            }}
          />
          {overlayBadge && (
            <Box position="absolute" top={1.5} left={1.5} pointerEvents="none">
              {overlayBadge}
            </Box>
          )}
          {bottomOverlayBadge && (
            <Box
              position="absolute"
              bottom={1.5}
              left={1.5}
              pointerEvents="none"
            >
              {bottomOverlayBadge}
            </Box>
          )}
        </Box>

        {cornerAction && (
          <Box position="absolute" top={2} right={2} zIndex={3}>
            {cornerAction}
          </Box>
        )}

        <Stack
          p={{ base: 2.5, md: 3 }}
          gap={{ base: 1, md: 1.5 }}
          flex="1"
          minW={0}
        >
          <Text
            fontWeight="semibold"
            fontSize="md"
            lineHeight={1.35}
            lineClamp={2}
            minW={0}
            pr={cornerAction ? { base: 10, md: 0 } : 0}
          >
            {session.name}
          </Text>

          {identityRow}

          <Flex align="center" gap={1} color="fg.muted" minW={0}>
            <Icon as={Clock} boxSize={{ base: 3, md: 3.5 }} flexShrink={0} />
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="semibold"
              color="gray.700"
              _dark={{ color: 'gray.200' }}
              lineClamp={1}
            >
              {viewModel.isRelativeDay ? (
                <>
                  <Text
                    as="span"
                    color="orange.500"
                    _dark={{ color: 'orange.300' }}
                  >
                    {viewModel.dateLabel}
                  </Text>
                  {viewModel.timeLabel ? `, ${viewModel.timeLabel}` : ''}
                </>
              ) : (
                viewModel.dateTimeLine
              )}
            </Text>
          </Flex>

          {(viewModel.venueName || viewModel.venueSuffix) && (
            <Flex align="center" gap={1} color="fg.muted" minW={0}>
              <Icon as={MapPin} boxSize={{ base: 3, md: 3.5 }} flexShrink={0} />
              {viewModel.venueName && (
                <Text fontSize={{ base: 'xs', md: 'sm' }} truncate minW={0}>
                  {viewModel.venueName}
                </Text>
              )}
              {viewModel.venueSuffix && (
                <Text
                  fontSize={{ base: 'xs', md: 'sm' }}
                  truncate
                  flexShrink={0}
                  maxW="75%"
                >
                  {viewModel.venueName
                    ? `• ${viewModel.venueSuffix}`
                    : viewModel.venueSuffix}
                </Text>
              )}
            </Flex>
          )}

          <Flex
            align="center"
            wrap="wrap"
            columnGap={1}
            rowGap={0.5}
            mt="auto"
            pt={1}
          >
            <Flex align="center" gap={1} flexShrink={0}>
              {viewModel.isAllLevels ? (
                <Badge
                  colorPalette="purple"
                  variant="subtle"
                  fontSize="xs"
                  px={1.5}
                >
                  {t('allLevelsShort')}
                </Badge>
              ) : viewModel.shownDiscreteLevels.length > 0 ? (
                <>
                  {viewModel.shownDiscreteLevels.map((level) => (
                    <Badge
                      key={level}
                      colorPalette={getSkillLevelColor([level]).colorPalette}
                      variant="solid"
                      fontSize="xs"
                      px={1.5}
                    >
                      {viewModel.getLevelShortLabel(level)}
                    </Badge>
                  ))}
                  {viewModel.extraDiscreteLevelCount > 0 && (
                    <Badge
                      colorPalette="gray"
                      variant="subtle"
                      fontSize="xs"
                      px={1.5}
                      title={viewModel.hiddenDiscreteLevelLabels}
                      aria-label={viewModel.hiddenDiscreteLevelLabels}
                    >
                      +{viewModel.extraDiscreteLevelCount}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Badge
                    colorPalette={
                      getSkillLevelColor([viewModel.minLevel]).colorPalette
                    }
                    variant="solid"
                    fontSize="xs"
                    px={1.5}
                  >
                    {viewModel.getLevelShortLabel(viewModel.minLevel)}
                  </Badge>
                  {viewModel.isLevelRange && (
                    <>
                      <Icon
                        as={ArrowRight}
                        boxSize={3}
                        color="gray.400"
                        flexShrink={0}
                      />
                      <Badge
                        colorPalette={
                          getSkillLevelColor([viewModel.maxLevel]).colorPalette
                        }
                        variant="solid"
                        fontSize="xs"
                        px={1.5}
                      >
                        {viewModel.getLevelShortLabel(viewModel.maxLevel)}
                      </Badge>
                    </>
                  )}
                </>
              )}
            </Flex>

            {viewModel.feeDisplayText && (
              <Flex align="baseline" gap={1} flexShrink={0} ml="auto">
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="bold"
                  color="green.600"
                  _dark={{ color: 'green.300' }}
                  whiteSpace="nowrap"
                >
                  {feeDisplayText}
                </Text>
                {showFeePerSlot && (
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'fg.subtle' }}
                    whiteSpace="nowrap"
                  >
                    /slot
                  </Text>
                )}
              </Flex>
            )}
          </Flex>

          {bottomBar}

          {actionFooter && (
            <Flex
              position="relative"
              zIndex={3}
              justify="flex-end"
              align="center"
              gap={{ base: 2, md: 1.5 }}
              pt={{ base: 2, md: 1.5 }}
              mt={{ base: 1, md: 0.5 }}
              borderTopWidth="1px"
              borderTopColor="border.subtle"
            >
              {actionFooter}
            </Flex>
          )}
        </Stack>

        {isLoading && (
          <Flex
            position="absolute"
            inset={0}
            bg="whiteAlpha.700"
            _dark={{ bg: 'blackAlpha.700' }}
            align="center"
            justify="center"
            zIndex={10}
          >
            <Spinner size="lg" color="green.500" />
          </Flex>
        )}
      </Box>
    </Box>
  );
};
