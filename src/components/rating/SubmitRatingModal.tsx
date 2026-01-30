'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Avatar,
} from '@chakra-ui/react';
import { CommonModal } from '@/components/ui/CommonModal';
import { StarRatingInput } from './StarRatingInput';
import { useTranslations } from 'next-intl';
import { RatingService } from '@/lib/api/rating.service';
import { RatingType, CreateRatingRequest } from '@/lib/api/types';
import { User } from 'lucide-react';

interface SubmitRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  ratedUserId: string;
  ratedUserName: string;
  ratedUserImage?: string;
  type: RatingType;
  onSuccess?: () => void;
}

const MAX_COMMENT_LENGTH = 500;

export const SubmitRatingModal = ({
  isOpen,
  onClose,
  sessionId,
  ratedUserId,
  ratedUserName,
  ratedUserImage,
  type,
  onSuccess,
}: SubmitRatingModalProps) => {
  const t = useTranslations('rating');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const request: CreateRatingRequest = {
        sessionId,
        ratedUserId,
        type,
        rating,
        comment: comment.trim() || undefined,
      };
      await RatingService.createRating(request);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const title = type === RatingType.PLAYER_TO_HOST ? t('rateHost') : t('ratePlayer');
  const remainingChars = MAX_COMMENT_LENGTH - comment.length;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      showCloseButton={true}
      footer={
        <HStack width="full" justify="flex-end" gap={3}>
          <Button variant="outline" onClick={handleClose} size="sm">
            {t('cancel')}
          </Button>
          <Button
            colorPalette="orange"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={rating === 0}
            size="sm"
          >
            {t('submitRating')}
          </Button>
        </HStack>
      }
    >
      <VStack gap={6} align="stretch" py={2}>
        {/* Rated User Info */}
        <VStack gap={3} align="center">
          <Avatar.Root size="xl" borderRadius="full">
            <Avatar.Fallback name={ratedUserName}>
              <User size={32} />
            </Avatar.Fallback>
            {ratedUserImage && <Avatar.Image src={ratedUserImage} />}
          </Avatar.Root>
          <Text fontSize="lg" fontWeight="semibold" textAlign="center">
            {ratedUserName}
          </Text>
        </VStack>

        {/* Star Rating Input */}
        <VStack gap={2} align="center">
          <Text fontSize="sm" color="gray.600">
            {t('selectRating')}
          </Text>
          <StarRatingInput value={rating} onChange={setRating} size="lg" />
          {rating === 0 && (
            <Text fontSize="xs" color="red.500">
              {t('ratingRequired')}
            </Text>
          )}
        </VStack>

        {/* Comment Textarea */}
        <Box>
          <Text fontSize="sm" color="gray.600" mb={2}>
            {t('addComment')}
          </Text>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            placeholder={t('commentPlaceholder')}
            rows={3}
            resize="none"
          />
          <Text
            fontSize="xs"
            color={remainingChars < 50 ? 'orange.500' : 'gray.400'}
            textAlign="right"
            mt={1}
          >
            {remainingChars} {t('charactersRemaining')}
          </Text>
        </Box>
      </VStack>
    </CommonModal>
  );
};
