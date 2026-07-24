'use client';

import { VModal } from '@/components/ui/VModal';
import { Badge, Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { Clock, Trash2 } from 'lucide-react';
import { IClubJoinRequest } from '@/types/club';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';

interface PendingJoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelRequest: () => void;
  isCancelling: boolean;
  request: IClubJoinRequest | null;
  clubName: string;
}

export function PendingJoinRequestModal({
  isOpen,
  onClose,
  onCancelRequest,
  isCancelling,
  request,
  clubName,
}: PendingJoinRequestModalProps) {
  const tCommon = useTranslations('common');
  const tClubs = useTranslations('clubs');

  if (!request) return null;

  const formattedDate = dayjs(request.createdAt).format(
    'DD/MM/YYYY [lúc] HH:mm'
  );

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu tham gia nhóm"
      size="md"
      secondaryActionText={tCommon('close')}
      onSecondaryAction={onClose}
    >
      <VStack align="stretch" gap={4}>
        {/* Header status banner */}
        <Box
          p={4}
          borderRadius="xl"
          bg="yellow.50"
          _dark={{ bg: 'yellow.900/20', borderColor: 'yellow.800' }}
          borderWidth="1px"
          borderColor="yellow.100"
        >
          <HStack justify="space-between" align="center" mb={1}>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color="yellow.800"
              _dark={{ color: 'yellow.200' }}
            >
              Trạng thái yêu cầu
            </Text>
            <Badge
              colorPalette="yellow"
              size="sm"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              <Clock size={12} className="mr-1 inline" />
              Đang chờ duyệt
            </Badge>
          </HStack>
          <Text
            fontSize="xs"
            color="yellow.700"
            _dark={{ color: 'yellow.300' }}
          >
            Yêu cầu gia nhập <strong>{clubName}</strong> đang được ban quản trị
            phê duyệt.
          </Text>
        </Box>

        {/* Details list */}
        <VStack align="stretch" gap={2.5} fontSize="sm">
          <HStack justify="space-between">
            <Text color="gray.500" _dark={{ color: 'gray.400' }}>
              Ngày gửi yêu cầu:
            </Text>
            <Text
              fontWeight="medium"
              color="gray.800"
              _dark={{ color: 'gray.200' }}
            >
              {formattedDate}
            </Text>
          </HStack>

          {request.message && (
            <Box>
              <Text color="gray.500" _dark={{ color: 'gray.400' }} mb={1}>
                Lời nhắn gửi kèm:
              </Text>
              <Box
                p={3}
                borderRadius="lg"
                bg="gray.50"
                _dark={{ bg: 'gray.700/50', color: 'gray.300' }}
                fontSize="xs"
                color="gray.700"
              >
                "{request.message}"
              </Box>
            </Box>
          )}
        </VStack>

        {/* Action section */}
        <Box
          pt={2}
          borderTopWidth="1px"
          borderColor="gray.100"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Button
            w="full"
            colorPalette="red"
            variant="subtle"
            loading={isCancelling}
            onClick={onCancelRequest}
            size="md"
            _dark={{
              bg: 'red.900/40',
              color: 'red.300',
              _hover: { bg: 'red.900/60' },
            }}
          >
            <Trash2 size={16} />
            Thu hồi yêu cầu
          </Button>
        </Box>
      </VStack>
    </VModal>
  );
}

export default PendingJoinRequestModal;
