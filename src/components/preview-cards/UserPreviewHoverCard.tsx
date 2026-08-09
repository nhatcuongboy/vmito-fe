'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/primitives/hover-card';
import { UserService, type IPublicProfileMeta } from '@/lib/api/user.service';
import { UserPreviewCard } from './UserPreviewCard';

const PROFILE_CACHE_LIMIT = 100;
const profileCache = new Map<string, IPublicProfileMeta>();
const profileRequests = new Map<string, Promise<IPublicProfileMeta>>();

function cacheProfile(profile: IPublicProfileMeta) {
  profileCache.set(profile.id, profile);
  if (profileCache.size <= PROFILE_CACHE_LIMIT) return;

  const oldestId = profileCache.keys().next().value;
  if (oldestId) profileCache.delete(oldestId);
}

function loadProfile(userId: string) {
  const cachedProfile = profileCache.get(userId);
  if (cachedProfile) return Promise.resolve(cachedProfile);

  const pendingRequest = profileRequests.get(userId);
  if (pendingRequest) return pendingRequest;

  const request = UserService.getPublicProfile(userId).then((profile) => {
    cacheProfile(profile);
    return profile;
  });
  profileRequests.set(userId, request);
  void request.finally(() => profileRequests.delete(userId));
  return request;
}

interface UserPreviewHoverCardProps {
  userId?: string | null;
  children: React.ReactElement;
}

/** Loads public profile metadata only when the avatar is hovered or focused. */
export function UserPreviewHoverCard({
  userId,
  children,
}: UserPreviewHoverCardProps) {
  const tCommon = useTranslations('common');
  const [profile, setProfile] = useState(() =>
    userId ? (profileCache.get(userId) ?? null) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open || !userId || profile || isLoading) return;

      setIsLoading(true);
      setHasError(false);
      void loadProfile(userId)
        .then(setProfile)
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    },
    [isLoading, profile, userId]
  );

  if (!userId) return children;

  return (
    <HoverCard onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right">
        {profile ? (
          <UserPreviewCard user={profile} />
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[96px] items-center justify-center rounded-2xl border border-gray-200 bg-white text-sm text-gray-500 shadow-md dark:border-white/10 dark:bg-gray-800 dark:text-gray-400"
          >
            <span className="sr-only">
              {hasError ? tCommon('error') : tCommon('loading')}
            </span>
            <span
              aria-hidden="true"
              className={
                hasError
                  ? 'text-red-500 dark:text-red-300'
                  : 'h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-600'
              }
            >
              {hasError ? '!' : null}
            </span>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
