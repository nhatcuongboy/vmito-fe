import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { MapPin } from 'lucide-react';
import { CommonModal } from '@/components/ui/CommonModal';
import { useTranslations } from 'next-intl';

interface CourtCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtName: string;
}

export default function CourtCallModal({
  isOpen,
  onClose,
  courtName,
}: CourtCallModalProps) {
  const t = useTranslations('pages.join.status');

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('courtCall.title')}
      size="md"
      isCentered
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <Flex direction="column" align="center" py={6} gap={4}>
        {/* Animated icon */}
        <Box
          bg="green.100"
          _dark={{ bg: 'green.900' }}
          borderRadius="full"
          p={4}
          animation="pulse 1.5s infinite"
        >
          <Box as={MapPin} boxSize={12} color="green.500" />
        </Box>

        {/* Message */}
        <Box textAlign="center">
          <Heading
            size="lg"
            color="green.600"
            _dark={{ color: 'green.400' }}
            mb={2}
          >
            {t('courtCall.goToCourt')}
          </Heading>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="green.600"
            _dark={{ color: 'blue.400' }}
          >
            {courtName}
          </Text>
        </Box>

        <Text color="gray.600" _dark={{ color: 'gray.400' }} textAlign="center">
          {t('courtCall.description')}
        </Text>

        {/* Action button */}
        <Button
          colorPalette="green"
          size="lg"
          w="full"
          onClick={onClose}
          mt={2}
        >
          {t('courtCall.understood')}
        </Button>
      </Flex>
      {/* CSS animation for pulse effect */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </CommonModal>
  );
}
