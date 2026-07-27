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

  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

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
        minH="140px"
        backgroundImage={coverUrl ? `url('${coverUrl}')` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        bg={
          coverUrl
            ? undefined
            : 'linear-gradient(135deg, #FFD75F 0%, #FFC107 100%)'
        }
      >
        {/* Scrim for text readability over a photo cover */}
        {coverUrl && (
          <Box
            position="absolute"
            inset={0}
            bg="linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 55%)"
            pointerEvents="none"
          />
        )}

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

        {/* Top-right controls: Share (everyone) + Edit (owner) */}
        <HStack position="absolute" right={4} top={4} zIndex={2} gap={2}>
          <Button
            size="xs"
            variant="outline"
            onClick={handleShare}
            borderRadius="full"
            px={3}
            fontWeight="bold"
            bg="white"
            color="gray.800"
            borderColor="gray.300"
            _dark={{
              bg: 'gray.700',
              color: 'gray.100',
              borderColor: 'gray.500',
            }}
            shadow="sm"
            _hover={{
              shadow: 'md',
              bg: 'gray.50',
              transform: 'translateY(-1px)',
            }}
            transition="all 0.2s"
          >
            <Share2 size={12} />
            {t('share')}
          </Button>

          {isOwner && (
            <Button
              size="xs"
              variant="outline"
              onClick={onEdit}
              borderRadius="full"
              px={3}
              fontWeight="bold"
              bg="white"
              color="gray.800"
              borderColor="gray.300"
              _dark={{
                bg: 'gray.700',
                color: 'gray.100',
                borderColor: 'gray.500',
              }}
              shadow="sm"
              _hover={{
                shadow: 'md',
                bg: 'gray.50',
                transform: 'translateY(-1px)',
              }}
              transition="all 0.2s"
            >
              <Pencil size={12} />
              {tCommon('edit')}
            </Button>
          )}
        </HStack>

        {/* Change-cover button (owner) */}
        {isOwner && !cover.isUploading && (
          <Button
            size="xs"
            variant="outline"
            onClick={cover.openFilePicker}
            position="absolute"
            right={4}
            bottom={4}
            zIndex={2}
            borderRadius="full"
            px={3}
            fontWeight="medium"
            bg="whiteAlpha.900"
            color="gray.800"
            borderColor="gray.300"
            _dark={{
              bg: 'blackAlpha.700',
              color: 'gray.100',
              borderColor: 'gray.600',
            }}
            shadow="sm"
            _hover={{ shadow: 'md', bg: 'white' }}
            transition="all 0.2s"
          >
            <Camera size={12} />
            {t('changeCover')}
          </Button>
        )}

        <HStack
          align="end"
          gap={3}
          px={5}
          pt={12}
          pb={3}
          position="relative"
          zIndex={1}
        >
          <Box position="relative" mb="-32px">
            <Avatar.Root
              size="2xl"
              borderRadius="full"
              borderWidth="4px"
              borderColor="white"
              cursor={avatarUrl ? 'pointer' : 'default'}
              onClick={() => {
                if (avatarUrl && !avatar.isUploading)
                  setIsAvatarPreviewOpen(true);
              }}
              _hover={avatarUrl ? { opacity: 0.9 } : undefined}
              transition="opacity 0.2s"
            >
              <Avatar.Fallback name={displayName}>
                <User size={24} />
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
                bottom={0}
                right={0}
                bg="green.500"
                color="white"
                p={1.5}
                borderRadius="full"
                cursor="pointer"
                _hover={{ bg: 'brand.600' }}
                boxShadow="md"
                borderWidth="2px"
                borderColor="white"
                onClick={avatar.openFilePicker}
              >
                <Camera size={12} />
              </Box>
            )}
          </Box>

          <VStack align="start" gap={0} flex={1} pb={0}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color={coverUrl ? 'white' : 'gray.800'}
              textShadow={coverUrl ? '0 1px 3px rgba(0,0,0,0.5)' : undefined}
              _dark={{ color: coverUrl ? 'white' : 'gray.100' }}
              lineClamp={1}
            >
              {displayName}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Box px={5} pb={5} pt={2}>
        <VStack align="start" gap={2} pl="88px">
          <HStack gap={2}>
            <StarRatingDisplay
              rating={ratingStats?.averageRating || 0}
              count={ratingStats?.totalRatings || 0}
              variant="compact"
              size="sm"
            />
          </HStack>

          <SimpleGrid columns={2} gap={3} width="full" pt={1}>
            <Box
              borderRadius="lg"
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              px={3}
              py={2}
            >
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('hostedSessions')}
              </Text>
              <Text
                fontSize="md"
                fontWeight="semibold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
              >
                {allHostedSessionsCount}
              </Text>
            </Box>

            <Box
              borderRadius="lg"
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              px={3}
              py={2}
            >
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('reviews')}
              </Text>
              <Text
                fontSize="md"
                fontWeight="semibold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
              >
                {ratingStats?.totalRatings ?? 0}
              </Text>
            </Box>
          </SimpleGrid>

          {phone && (
            <HStack
              gap={2}
              color="gray.600"
              _dark={{ color: 'gray.300' }}
              pt={1}
            >
              <Phone size={16} />
              <Text fontSize="sm">{phone}</Text>
            </HStack>
          )}

          {genderLabel && (
            <HStack gap={2} color="gray.600" _dark={{ color: 'gray.300' }}>
              <User size={16} />
              <Text fontSize="sm">
                {tCommon('gender')}: {genderLabel}
              </Text>
            </HStack>
          )}

          {joinedAt && (
            <HStack gap={2} color="gray.600" _dark={{ color: 'gray.300' }}>
              <CalendarDays size={16} />
              <Text fontSize="sm">
                {t('joinedDateLabel', { date: formatDate(joinedAt, locale) })}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Avatar full-size preview */}
      {isAvatarPreviewOpen && avatarUrl && (
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
            onClick={() => setIsAvatarPreviewOpen(false)}
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
                  setIsAvatarPreviewOpen(false);
                }}
              >
                <Icon as={X} boxSize={5} />
              </Box>
              <Image
                src={getFullSizeAvatarUrl(avatarUrl)}
                alt={displayName}
                w={{ base: '92vw', md: '560px' }}
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
