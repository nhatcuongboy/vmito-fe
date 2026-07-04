'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  MoreHorizontal,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import type { Post } from '@/types/post';
import { CommentSection } from './CommentSection';
import { PostAvatar } from './PostAvatar';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import VModal from '@/components/ui/VModal';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { Box, Flex } from '@chakra-ui/react';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { getGoogleMapsUrl } from '@/utils/venue-helpers';
import AppLightbox from '@/components/ui/AppLightbox';

const localeMap: Record<string, Locale> = { vi, en: enUS, cn: zhCN };

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  currentUserId?: string;
  defaultShowComments?: boolean;
}

interface PostMediaImageProps {
  src: string;
  alt: string;
  className: string;
  onClick?: () => void;
}

function PostMediaImage({ src, alt, className, onClick }: PostMediaImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = normalizeImageUrl(src);

  if (!imageSrc || hasError) {
    return (
      <div
        className={`${className} flex cursor-default items-center justify-center bg-gray-100 text-sm font-medium text-gray-400 dark:bg-gray-900 dark:text-gray-500`}
        aria-label={alt}
      />
    );
  }

  return (
    <img // eslint-disable-line @next/next/no-img-element
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      onClick={onClick}
      className={`${className} cursor-pointer transition duration-200 hover:opacity-95`}
    />
  );
}

export function PostCard({
  post,
  onPostUpdate,
  currentUserId,
  defaultShowComments = false,
}: PostCardProps) {
  const t = useTranslations('posts');
  const locale = useLocale();
  const dateLocale = localeMap[locale] || enUS;
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [localPost, setLocalPost] = useState(post);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === localPost.authorId;
  const postImages = localPost.images ?? [];
  const postCounts = localPost._count ?? { likes: 0, comments: 0, shares: 0 };
  const hasEngagement =
    postCounts.likes > 0 || postCounts.comments > 0 || postCounts.shares > 0;

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCommentCountChange = useCallback((nextCount: number) => {
    setLocalPost((prev) => {
      const prevCounts = prev._count ?? { likes: 0, comments: 0, shares: 0 };

      return {
        ...prev,
        _count: { ...prevCounts, comments: nextCount },
      };
    });
  }, []);

  const handleLike = async () => {
    try {
      const result = await postsService.toggleLike(localPost.id);
      setLocalPost((prev) => {
        const prevCounts = prev._count ?? { likes: 0, comments: 0, shares: 0 };

        return {
          ...prev,
          isLiked: result.liked,
          _count: { ...prevCounts, likes: result.likeCount },
        };
      });
    } catch {
      toaster.create({
        title: t('error'),
        description: t('likeError'),
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      await postsService.sharePost(localPost.id);
      toaster.create({
        title: t('success'),
        description: t('shareSuccess'),
        type: 'success',
      });
      onPostUpdate?.();
    } catch (error: unknown) {
      toaster.create({
        title: t('error'),
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || t('shareError'),
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postsService.deletePost(localPost.id);
      toaster.create({
        title: t('success'),
        description: t('deleteSuccess'),
        type: 'success',
      });
      setShowDeleteConfirm(false);
      onPostUpdate?.();
    } catch {
      toaster.create({
        title: t('error'),
        description: t('deleteError'),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const extractHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('#') ? (
        <span
          key={i}
          className="cursor-pointer font-medium text-green-600 hover:underline"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getImageClassName = (index: number) => {
    if (postImages.length === 1) {
      return 'max-h-[520px] w-full object-cover';
    }

    if (postImages.length === 3 && index === 0) {
      return 'h-full min-h-[260px] w-full object-cover sm:row-span-2';
    }

    return 'aspect-square w-full object-cover';
  };

  const actionButtonBase =
    'flex flex-1 items-center justify-center gap-2.5 rounded-lg py-2.5 text-[15px] font-medium transition-colors active:scale-[0.98]';

  return (
    <Box
      as="article"
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.200' }}
      overflow="hidden"
      boxShadow="sm"
    >
      {/* Shared post indicator */}
      {localPost.originalPost && (
        <Flex
          align="center"
          gap={1.5}
          px={4}
          pt={3}
          fontSize="13px"
          fontWeight="medium"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          <Share2 size={14} className="shrink-0 text-green-600" />
          <Box as="span" truncate>
            {t('sharedFrom', { name: localPost.originalPost.author.name })}
          </Box>
        </Flex>
      )}

      {/* Header */}
      <Flex as="header" align="flex-start" gap={3} px={4} pt={4}>
        <Link
          href={ROUTES.USER.PROFILE(localPost.authorId)}
          className="shrink-0 transition hover:opacity-90"
          aria-label={localPost.author.name}
        >
          <PostAvatar
            name={localPost.author.name}
            image={localPost.author.image}
            size={40}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-5 text-gray-900 dark:text-gray-50">
            <Link
              href={ROUTES.USER.PROFILE(localPost.authorId)}
              className="hover:underline"
            >
              {localPost.author.name}
            </Link>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[13px] leading-4 text-gray-500 dark:text-gray-400">
            <time
              dateTime={localPost.createdAt}
              title={format(new Date(localPost.createdAt), 'PPP', {
                locale: dateLocale,
              })}
            >
              {formatDistanceToNow(new Date(localPost.createdAt), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </time>
            <span aria-hidden="true">·</span>
            <Globe size={12} className="shrink-0" aria-hidden="true" />
          </div>
        </div>
        {isOwner && (
          <div className="relative -mr-1 shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              aria-label={t('postMenu')}
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 z-10 mt-1 min-w-[180px] origin-top-right overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={16} />
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </Flex>

      {/* Content */}
      {localPost.content && (
        <Box
          px={4}
          pt={2.5}
          whiteSpace="pre-wrap"
          fontSize="15px"
          lineHeight="relaxed"
          color="gray.800"
          _dark={{ color: 'gray.100' }}
        >
          {extractHashtags(localPost.content)}
        </Box>
      )}

      {/* Location */}
      {localPost.location && (
        <Box px={4} pt={2.5}>
          <a
            href={getGoogleMapsUrl({
              name: localPost.location.name,
              address: localPost.location.address,
              lat: localPost.location.lat,
              lng: localPost.location.lng,
            })}
            target="_blank"
            rel="noopener noreferrer"
            title={t('viewOnMap')}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[13px] font-medium text-red-700 transition hover:bg-red-100 hover:underline dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
          >
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{localPost.location.name}</span>
            <ExternalLink size={11} className="shrink-0 opacity-70" />
          </a>
        </Box>
      )}

      {/* Images — full width */}
      {postImages.length > 0 && (
        <Box mt={3.5}>
          <div
            className={`grid overflow-hidden bg-gray-100 dark:bg-gray-900 ${
              postImages.length === 1
                ? 'grid-cols-1'
                : 'grid-cols-2 gap-0.5 sm:auto-rows-fr'
            }`}
          >
            {postImages.map((img, index) => (
              <PostMediaImage
                key={img.id}
                src={img.url}
                alt={t('postImage', { index: index + 1 })}
                className={getImageClassName(index)}
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
        </Box>
      )}

      {/* Original post (for shares) */}
      {localPost.originalPost && (
        <Box mx={4} mt={3}>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-700/50">
            <div className="mb-2 flex items-center gap-2">
              <Link
                href={ROUTES.USER.PROFILE(localPost.originalPost.authorId)}
                className="shrink-0 transition hover:opacity-90"
                aria-label={localPost.originalPost.author.name}
              >
                <PostAvatar
                  name={localPost.originalPost.author.name}
                  image={localPost.originalPost.author.image}
                  size={32}
                />
              </Link>
              <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                <Link
                  href={ROUTES.USER.PROFILE(localPost.originalPost.authorId)}
                  className="hover:underline"
                >
                  {localPost.originalPost.author.name}
                </Link>
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
              {localPost.originalPost.content}
            </div>
          </div>
        </Box>
      )}

      {/* Engagement counts */}
      {hasEngagement && (
        <Flex
          align="center"
          justify="space-between"
          gap={2}
          px={4}
          pb={2.5}
          pt={3.5}
          fontSize="sm"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {postCounts.likes > 0 && (
              <>
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-500 text-white">
                  <Heart size={10} fill="currentColor" />
                </span>
                <span>{postCounts.likes}</span>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {postCounts.comments > 0 && (
              <button
                type="button"
                onClick={() => setShowComments(true)}
                className="transition hover:underline"
              >
                {postCounts.comments} {t('comment')}
              </button>
            )}
            {postCounts.comments > 0 && postCounts.shares > 0 && (
              <span aria-hidden="true">·</span>
            )}
            {postCounts.shares > 0 && (
              <span>
                {postCounts.shares} {t('share')}
              </span>
            )}
          </div>
        </Flex>
      )}

      {/* Action bar */}
      <Box
        mx={4}
        borderTopWidth="1px"
        borderColor="gray.100"
        _dark={{ borderColor: 'whiteAlpha.100' }}
      />
      <Flex align="center" gap={1} px={2} py={1.5} pb={2}>
        <button
          onClick={handleLike}
          aria-label={localPost.isLiked ? t('unlikePost') : t('likePost')}
          className={`${actionButtonBase} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 ${
            localPost.isLiked
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          <Heart size={18} fill={localPost.isLiked ? 'currentColor' : 'none'} />
          {t('like')}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          aria-label={t('toggleComments')}
          className={`${actionButtonBase} hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400 ${
            showComments
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          <MessageCircle size={18} />
          {t('comment')}
        </button>
        <button
          onClick={handleShare}
          aria-label={t('sharePost')}
          className={`${actionButtonBase} text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400`}
        >
          <Share2 size={18} />
          {t('share')}
        </button>
      </Flex>

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          postId={localPost.id}
          currentUserId={currentUserId}
          initialCommentCount={postCounts.comments}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {lightboxIndex !== null && postImages.length > 0 && (
        <AppLightbox
          images={postImages.map((img) => normalizeImageUrl(img.url) || '')}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          alt={t('postImage', { index: lightboxIndex + 1 })}
        />
      )}

      <VModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('deleteConfirmTitle')}
        size="sm"
        primaryActionText={t('delete')}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isDeleting}
        isSecondaryDisabled={isDeleting}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('deleteConfirmDescription')}
        </p>
      </VModal>
    </Box>
  );
}
