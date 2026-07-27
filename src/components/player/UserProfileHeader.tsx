'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarDays,
  Camera,
  Pencil,
  Phone,
  Share2,
  Star,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminService } from '@/lib/api/admin.service';
import { IPublicProfileMeta } from '@/lib/api/user.service';
import { UserRatingStats } from '@/lib/api/types';
import { StarRatingDisplay } from '@/components/rating/StarRatingDisplay';
import { toaster } from '@/components/ui/toaster';
import { getFullSizeAvatarUrl } from '@/lib/utils/image';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuthStore } from '@/stores/useAuthStore';

const formatDate = (
  input: Date | string | undefined,
  locale: string
): string => {
  if (!input) return '--';
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return '--';
  return new Intl.DateTimeFormat(
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  ).format(parsed);
};

interface UserProfileHeaderProps {
  profile: IPublicProfileMeta;
  ratingStats: UserRatingStats | null;
  allHostedSessionsCount: number;
  isOwner: boolean;
  userId: string;
  onEdit: () => void;
  onProfileImageUpdated: (patch: {
    image?: string;
    coverPhoto?: string;
  }) => void;
}

export default function UserProfileHeader({
  profile,
  ratingStats,
  allHostedSessionsCount,
  isOwner,
  userId,
  onEdit,
  onProfileImageUpdated,
}: UserProfileHeaderProps) {
  const t = useTranslations('userProfilePage');
  const tCommon = useTranslations('common');
  const tModal = useTranslations('common.profileModal');
  const locale = useLocale();
  const { user: currentUser, setUser } = useAuthStore();

  // Fullscreen preview for either the avatar or the cover photo.
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const displayName = profile.name || tCommon('unknown');
  const avatarUrl = profile.image || undefined;
  const coverUrl = profile.coverPhoto || undefined;
  const joinedAt = profile.createdAt;
  const phone = profile.phone;

  const genderLabel = useMemo(() => {
    if (!profile.gender) return '';
    if (profile.gender === 'MALE') return tCommon('male');
    if (profile.gender === 'FEMALE') return tCommon('female');
    if (profile.gender === 'OTHER') return tCommon('other');
    if (profile.gender === 'PREFER_NOT_TO_SAY')
      return tCommon('preferNotToSay');
    return profile.gender;
  }, [profile.gender, tCommon]);

  const cover = useImageUpload({
    uploader: AdminService.uploadCover,
    compression: { maxSizeMB: 2, maxWidthOrHeight: 1600 },
    onSuccess: async (uploaded) => {
      const updated = await AdminService.updateUser(userId, {
        coverPhoto: uploaded.url,
        coverPhotoPublicId: uploaded.publicId,
      });
      const newUrl = updated.coverPhoto ?? uploaded.url;
      onProfileImageUpdated({ coverPhoto: newUrl });
      if (currentUser?.id === userId) {
        setUser({
          ...currentUser,
          coverPhoto: newUrl,
          coverPhotoPublicId: uploaded.publicId,
        });
      }
      toaster.create({
        title: tCommon('success'),
        description: tModal('coverUpdatedSuccessfully'),
        type: 'success',
      });
    },
    onError: () => {
      toaster.create({
        title: tCommon('error'),
        description: tModal('failedToUploadCover'),
        type: 'error',
      });
    },
  });

  const avatar = useImageUpload({
    uploader: AdminService.uploadAvatar,
    compression: { maxSizeMB: 1, maxWidthOrHeight: 1200 },
    onSuccess: async (uploaded) => {
      const updated = await AdminService.updateUser(userId, {
        image: uploaded.url,
        imagePublicId: uploaded.publicId,
      });
      const newUrl = updated.image ?? uploaded.url;
      onProfileImageUpdated({ image: newUrl });
      if (currentUser?.id === userId) {
        setUser({
          ...currentUser,
          image: newUrl,
          imagePublicId: uploaded.publicId,
        });
      }
      toaster.create({
        title: tCommon('success'),
        description: tModal('avatarUpdatedSuccessfully'),
        type: 'success',
      });
    },
    onError: () => {
      toaster.create({
        title: tCommon('error'),
        description: tModal('failedToUploadAvatar'),
        type: 'error',
      });
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/user/${userId}`;
    const shareData = { title: displayName, text: displayName, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toaster.create({ title: t('linkCopied'), type: 'success' });
      }
    } catch {
      // User cancelled the share sheet — no action needed.
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      bg="white"
      overflow="hidden"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      {/* Hidden file inputs for owner uploads */}
      {isOwner && (
        <>
          <input
            ref={cover.inputRef}
            type="file"
            accept="image/*"
            onChange={cover.handleFileChange}
            style={{ display: 'none' }}
          />
          <input
            ref={avatar.inputRef}
            type="file"
            accept="image/*"
            onChange={avatar.handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}

      <Box
        position="relative"
        h={{ base: '180px', md: '220px' }}
        backgroundImage={coverUrl ? `url('${coverUrl}')` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        bg={
          coverUrl
            ? undefined
            : 'linear-gradient(135deg, #FFD75F 0%, #FFC107 100%)'
        }
        cursor={coverUrl ? 'pointer' : 'default'}
        onClick={() => {
          if (coverUrl && !cover.isUploading) setPreviewImage(coverUrl);
        }}
      >
        {/* Cover upload progress overlay */}
        {cover.isUploading && (
          <Flex
            position="absolute"
            inset={0}
            bg="blackAlpha.600"
            align="center"
            justify="center"
            direction="column"
            gap={1}
            zIndex={2}
          >
            <Spinner size="md" color="white" />
            <Text fontSize="sm" color="white" fontWeight="bold">
              {cover.progress}%
            </Text>
          </Flex>
        )}

        {!coverUrl && (
          <Image
            src="/icons/app-logo-black.png"
            alt="Vmito"
            position="absolute"
            right={4}
            bottom={4}
            h="24px"
            opacity={0.25}
          />
        )}

        {/* Share button (everyone), icon-only */}
        <Button
          aria-label={t('share')}
          size="sm"
          variant="plain"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleShare();
          }}
          position="absolute"
          right={3}
          top={3}
          zIndex={2}
          borderRadius="full"
          p={0}
          minW="32px"
          h="32px"
          bg="blackAlpha.400"
          color="white"
          backdropFilter="blur(6px)"
          _hover={{ bg: 'blackAlpha.600' }}
          transition="background 0.2s"
        >
          <Share2 size={15} />
        </Button>

        {/* Change-cover button (owner), icon-only */}
        {isOwner && !cover.isUploading && (
          <Button
            aria-label={t('changeCover')}
            size="sm"
            variant="plain"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              cover.openFilePicker();
            }}
            position="absolute"
            right={3}
            bottom={3}
            zIndex={2}
            borderRadius="full"
            p={0}
            minW="32px"
            h="32px"
            bg="blackAlpha.400"
            color="white"
            backdropFilter="blur(6px)"
            _hover={{ bg: 'blackAlpha.600' }}
            transition="background 0.2s"
          >
            <Camera size={15} />
          </Button>
        )}
      </Box>

      {/* Centered avatar overlapping the cover, Facebook-style */}
      <Flex direction="column" align="center" px={5}>
        <Box position="relative" mt="-48px" zIndex={1}>
          <Avatar.Root
            w="112px"
            h="112px"
            borderRadius="full"
            borderWidth="4px"
            borderColor="white"
            bg="gray.100"
            _dark={{ borderColor: 'gray.800', bg: 'gray.700' }}
            cursor={avatarUrl ? 'pointer' : 'default'}
            onClick={() => {
              if (avatarUrl && !avatar.isUploading)
                setPreviewImage(getFullSizeAvatarUrl(avatarUrl));
            }}
            _hover={avatarUrl ? { opacity: 0.9 } : undefined}
            transition="opacity 0.2s"
          >
            <Avatar.Fallback name={displayName}>
              <User size={40} />
            </Avatar.Fallback>
            {avatarUrl && <Avatar.Image src={avatarUrl} />}
          </Avatar.Root>

          {avatar.isUploading && (
            <Flex
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="blackAlpha.600"
              align="center"
              justify="center"
              direction="column"
              gap={0}
            >
              <Spinner size="sm" color="white" />
              <Text fontSize="2xs" color="white" fontWeight="bold">
                {avatar.progress}%
              </Text>
            </Flex>
          )}

          {isOwner && !avatar.isUploading && (
            <Box
              position="absolute"
              bottom="4px"
              right="4px"
              bg="green.500"
              color="white"
              p={2}
              borderRadius="full"
              cursor="pointer"
              _hover={{ bg: 'brand.600' }}
              boxShadow="md"
              borderWidth="2px"
              borderColor="white"
              onClick={avatar.openFilePicker}
            >
              <Camera size={14} />
            </Box>
          )}
        </Box>

        <Text
          fontSize="xl"
          fontWeight="bold"
          color="gray.800"
          _dark={{ color: 'gray.100' }}
          lineClamp={1}
          mt={2}
          textAlign="center"
        >
          {displayName}
        </Text>

        <StarRatingDisplay
          rating={ratingStats?.averageRating || 0}
          count={ratingStats?.totalRatings || 0}
          variant="compact"
          size="sm"
        />

        {isOwner && (
          <Button
            size="xs"
            variant="outline"
            onClick={onEdit}
            mt={2}
            borderRadius="full"
            px={4}
            fontWeight="semibold"
            color="gray.700"
            borderColor="gray.300"
            _dark={{ color: 'gray.100', borderColor: 'gray.600' }}
            _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
          >
            <Pencil size={12} />
            {tCommon('edit')}
          </Button>
        )}
      </Flex>

      <Box px={5} pb={5} pt={3}>
        <SimpleGrid columns={2} gap={8} width="full">
          {/* Left column: contact info */}
          <VStack align="stretch" gap={2.5}>
            {phone && (
              <HStack gap={2.5}>
                <Box color="gray.400" _dark={{ color: 'gray.500' }}>
                  <Phone size={16} />
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                >
                  {phone}
                </Text>
              </HStack>
            )}

            {genderLabel && (
              <HStack gap={2.5}>
                <Box color="gray.400" _dark={{ color: 'gray.500' }}>
                  <User size={16} />
                </Box>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {tCommon('gender')}:
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                >
                  {genderLabel}
                </Text>
              </HStack>
            )}

            {joinedAt && (
              <HStack gap={2.5}>
                <Box color="gray.400" _dark={{ color: 'gray.500' }}>
                  <CalendarDays size={16} />
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                >
                  {t('joinedDateLabel', { date: formatDate(joinedAt, locale) })}
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Right column: activity stats */}
          <VStack align="stretch" gap={2.5}>
            <HStack gap={2.5}>
              <Box color="gray.400" _dark={{ color: 'gray.500' }}>
                <Trophy size={16} />
              </Box>
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('hostedSessions')}:
              </Text>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
              >
                {allHostedSessionsCount}
              </Text>
            </HStack>

            <HStack gap={2.5}>
              <Box color="gray.400" _dark={{ color: 'gray.500' }}>
                <Star size={16} />
              </Box>
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('reviews')}:
              </Text>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
              >
                {ratingStats?.totalRatings ?? 0}
              </Text>
            </HStack>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Fullscreen image preview (avatar / cover) at original stored quality */}
      {previewImage && (
        <Portal>
          <Flex
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.800"
            zIndex={2000}
            align="center"
            justify="center"
            p={4}
            onClick={() => setPreviewImage(null)}
            animation="fadeIn 0.15s ease-out"
            css={{
              '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
            }}
          >
            <Box
              position="relative"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                as="button"
                {...({ type: 'button' } as Record<string, unknown>)}
                position="absolute"
                top="-12px"
                right="-12px"
                w={12}
                h={12}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="blackAlpha.800"
                color="white"
                borderWidth="2px"
                borderColor="whiteAlpha.800"
                boxShadow="0 8px 24px rgba(0,0,0,.24)"
                _hover={{ bg: 'blackAlpha.900' }}
                _active={{ bg: 'blackAlpha.950' }}
                transition="background 0.2s"
                aria-label="Close image preview"
                zIndex={1}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setPreviewImage(null);
                }}
              >
                <Icon as={X} boxSize={5} />
              </Box>
              <Image
                src={previewImage}
                alt={displayName}
                maxW="92vw"
                maxH="90vh"
                borderRadius="16px"
                objectFit="contain"
                boxShadow="0 4px 16px rgba(0,0,0,.08)"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </Box>
          </Flex>
        </Portal>
      )}
    </Box>
  );
}
