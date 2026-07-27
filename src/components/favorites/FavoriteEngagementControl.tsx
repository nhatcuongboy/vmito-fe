'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Flex,
  HStack,
  Skeleton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { useAuthHydration, useAuthStore } from '@/stores/useAuthStore';
import {
  FavoriteService,
  FavoriteSummary,
  FavoriteUser,
  type FavoriteType,
} from '@/lib/api/favorite.service';
import { FavoriteButton } from './FavoriteButton';
import { SessionEventType, useSocket } from '@/contexts/SocketContext';

type EngagementType = Exclude<FavoriteType, 'VENUE'>;
type EngagementVariant = 'surface' | 'overlay-dark' | 'minimal';

interface FavoriteEngagementControlProps {
  type: EngagementType;
  targetId: string;
  initialIsFavorite?: boolean;
  returnUrl?: string;
  variant?: EngagementVariant;
}

const USERS_PER_PAGE = 20;

interface FavoriteUpdatedPayload {
  type: EngagementType;
  targetId: string;
  favoriteCount: number;
  actorId: string;
  isFavorite: boolean;
}

export function FavoriteEngagementControl({
  type,
  targetId,
  initialIsFavorite = false,
  returnUrl,
  variant = 'surface',
}: FavoriteEngagementControlProps) {
  const t = useTranslations('common.favorites');
  const locale = useLocale();
  const isHydrated = useAuthHydration();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const hasUserSession = isAuthenticated && Boolean(accessToken);
  const [summary, setSummary] = useState<FavoriteSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [users, setUsers] = useState<FavoriteUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [hasUsersError, setHasUsersError] = useState(false);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale]
  );

  useEffect(() => {
    if (!isHydrated || !hasUserSession) {
      setSummary(null);
      return;
    }

    let isActive = true;
    setIsSummaryLoading(true);
    FavoriteService.getSummary(type, targetId)
      .then((data) => {
        if (isActive) setSummary(data);
      })
      .catch((error) => {
        console.error('Failed to load favorite summary:', error);
        if (isActive) {
          setSummary({
            isFavorite: initialIsFavorite,
            favoriteCount: 0,
            canViewUsers: false,
          });
        }
      })
      .finally(() => {
        if (isActive) setIsSummaryLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [hasUserSession, initialIsFavorite, isHydrated, targetId, type]);

  useEffect(() => {
    if (!socket || !isConnected || !isHydrated || !hasUserSession) return;

    const roomPayload = { type, targetId };
    const handleFavoriteUpdated = (data: FavoriteUpdatedPayload) => {
      if (
        data.type !== type ||
        data.targetId !== targetId ||
        !Number.isFinite(data.favoriteCount)
      ) {
        return;
      }

      setSummary((current) =>
        current
          ? {
              ...current,
              favoriteCount: Math.max(0, data.favoriteCount),
              isFavorite:
                data.actorId === user?.id
                  ? data.isFavorite
                  : current.isFavorite,
            }
          : current
      );
    };

    socket.on(SessionEventType.FAVORITE_UPDATED, handleFavoriteUpdated);
    socket.emit('joinFavoriteTarget', roomPayload);

    return () => {
      socket.off(SessionEventType.FAVORITE_UPDATED, handleFavoriteUpdated);
      socket.emit('leaveFavoriteTarget', roomPayload);
    };
  }, [
    hasUserSession,
    isConnected,
    isHydrated,
    socket,
    targetId,
    type,
    user?.id,
  ]);

  const loadUsers = useCallback(
    async (nextPage: number) => {
      setIsUsersLoading(true);
      setHasUsersError(false);
      try {
        const response = await FavoriteService.getFavoriteUsers(
          type,
          targetId,
          { page: nextPage, limit: USERS_PER_PAGE }
        );
        setUsers(response.data);
        setPage(response.pagination.page);
        setTotalPages(Math.max(1, response.pagination.totalPages));
      } catch (error) {
        console.error('Failed to load favorite users:', error);
        setHasUsersError(true);
      } finally {
        setIsUsersLoading(false);
      }
    },
    [targetId, type]
  );

  const handleOpenUsers = () => {
    if (!summary?.canViewUsers || summary.favoriteCount === 0) return;
    setIsUsersOpen(true);
    void loadUsers(1);
  };

  const handleFavoriteChange = (isFavorite: boolean) => {
    setSummary((current) =>
      current
        ? {
            ...current,
            isFavorite,
            favoriteCount: Math.max(
              0,
              current.favoriteCount +
                (current.isFavorite === isFavorite ? 0 : isFavorite ? 1 : -1)
            ),
          }
        : current
    );
  };

  if (!isHydrated || !hasUserSession) return null;

  const isDark = variant === 'overlay-dark';
  const isMinimal = variant === 'minimal';
  if (isSummaryLoading || !summary) {
    return (
      <Skeleton
        w={isMinimal ? '56px' : '76px'}
        h="32px"
        borderRadius="full"
        opacity={isDark ? 0.65 : 1}
      />
    );
  }

  return (
    <>
      <HStack
        gap={0}
        flexShrink={0}
        borderRadius={isMinimal ? 'md' : 'full'}
        bg={isMinimal ? 'transparent' : isDark ? 'blackAlpha.600' : 'gray.50'}
        borderWidth={isMinimal || isDark ? 0 : '1px'}
        borderColor="gray.200"
        boxShadow={
          isMinimal ? 'none' : isDark ? '0 2px 8px rgba(0,0,0,0.45)' : 'sm'
        }
        backdropFilter={isDark ? 'blur(6px)' : undefined}
        overflow={isMinimal ? 'visible' : 'hidden'}
      >
        <FavoriteButton
          type={type}
          targetId={targetId}
          isFavorite={summary.isFavorite}
          variant={isDark ? 'overlay-dark' : 'ghost'}
          returnUrl={returnUrl}
          onChange={handleFavoriteChange}
        />
        {isMinimal && (!summary.canViewUsers || summary.favoriteCount === 0) ? (
          <Text
            minW="20px"
            textAlign="center"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            fontSize="sm"
            fontWeight="medium"
            fontVariantNumeric="tabular-nums"
            ms={-1}
            aria-label={t('likeCount', { count: summary.favoriteCount })}
          >
            {summary.favoriteCount}
          </Text>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            px={isMinimal ? 1.5 : isDark ? 2.5 : 3}
            minW={isMinimal ? '24px' : isDark ? '32px' : '38px'}
            h="32px"
            color={isDark ? 'white' : isMinimal ? 'gray.500' : 'gray.700'}
            fontSize="sm"
            fontWeight={isMinimal ? 'medium' : 'semibold'}
            fontVariantNumeric="tabular-nums"
            ms={isMinimal ? -1 : undefined}
            borderRadius={isMinimal ? 'md' : 0}
            borderLeftWidth={isDark ? '1px' : 0}
            borderColor={isDark ? 'whiteAlpha.200' : 'transparent'}
            disabled={!summary.canViewUsers || summary.favoriteCount === 0}
            cursor={
              summary.canViewUsers && summary.favoriteCount > 0
                ? 'pointer'
                : 'default'
            }
            aria-label={t('likeCount', { count: summary.favoriteCount })}
            onClick={handleOpenUsers}
            _hover={
              summary.canViewUsers && summary.favoriteCount > 0
                ? {
                    bg: isDark
                      ? 'blackAlpha.300'
                      : isMinimal
                        ? 'gray.50'
                        : 'gray.100',
                    color: isMinimal ? 'gray.700' : undefined,
                  }
                : undefined
            }
            _dark={
              isMinimal
                ? {
                    color: 'gray.400',
                    _hover: { bg: 'whiteAlpha.100', color: 'gray.200' },
                  }
                : undefined
            }
            _disabled={{ opacity: 1, cursor: 'default' }}
          >
            {summary.favoriteCount}
          </Button>
        )}
      </HStack>

      <VModal
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
        title={t('peopleWhoLiked')}
        size="sm"
        hideSecondaryAction
        maxBodyHeight="65vh"
      >
        {isUsersLoading ? (
          <Flex minH="180px" align="center" justify="center">
            <Spinner color="green.500" />
          </Flex>
        ) : hasUsersError ? (
          <VStack py={8} gap={3}>
            <Text color="gray.500">{t('loadUsersFailed')}</Text>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadUsers(page)}
            >
              {t('retry')}
            </Button>
          </VStack>
        ) : users.length === 0 ? (
          <Text py={8} color="gray.500" textAlign="center">
            {t('noLikesYet')}
          </Text>
        ) : (
          <VStack align="stretch" gap={0}>
            {users.map((user) => (
              <Link
                key={user.id}
                href={ROUTES.USER.PROFILE(user.id)}
                aria-label={t('viewUserProfile', { name: user.name })}
                style={{ textDecoration: 'none' }}
              >
                <HStack
                  gap={3}
                  px={2}
                  py={3}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  borderRadius="lg"
                  transition="background-color 0.15s ease"
                  _hover={{ bg: 'gray.50' }}
                  _dark={{
                    borderColor: 'gray.700',
                    _hover: { bg: 'whiteAlpha.100' },
                  }}
                >
                  <Avatar.Root size="sm" bg="green.500">
                    <Avatar.Fallback name={user.name} color="white" />
                    {user.image && <Avatar.Image src={user.image} />}
                  </Avatar.Root>
                  <Box minW={0} flex={1}>
                    <Text fontWeight="semibold" truncate>
                      {user.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {dateFormatter.format(new Date(user.favoritedAt))}
                    </Text>
                  </Box>
                  <ChevronRight
                    size={16}
                    color="var(--chakra-colors-gray-400)"
                  />
                </HStack>
              </Link>
            ))}

            {totalPages > 1 && (
              <Flex justify="space-between" align="center" pt={4}>
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={page <= 1 || isUsersLoading}
                  onClick={() => void loadUsers(page - 1)}
                >
                  <ChevronLeft size={15} />
                  {t('previousPage')}
                </Button>
                <Text fontSize="xs" color="gray.500">
                  {t('pageStatus', { page, totalPages })}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={page >= totalPages || isUsersLoading}
                  onClick={() => void loadUsers(page + 1)}
                >
                  {t('nextPage')}
                  <ChevronRight size={15} />
                </Button>
              </Flex>
            )}
          </VStack>
        )}
      </VModal>
    </>
  );
}
