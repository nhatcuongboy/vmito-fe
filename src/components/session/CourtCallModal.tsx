import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { MapPin, Navigation } from 'lucide-react';
import { VModal } from '@/components/ui/VModal';
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
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('courtCall.title')}
      size="md"
      isCentered
      showCloseButton={true}
      closeOnOverlayClick={false}
      showHeaderDivider={false}
      showFooterDivider={false}
      maxBodyHeight="none"
      footer={
        <Button colorPalette="green" size="lg" w="full" onClick={onClose}>
          <Navigation size={18} />
          {t('courtCall.understood')}
        </Button>
      }
    >
      <Flex direction="column" align="center" pt={2} pb={1} gap={5}>
        <Box
          display="grid"
          placeItems="center"
          boxSize="88px"
          borderRadius="full"
          bg="green.50"
          color="green.600"
          borderWidth="1px"
          borderColor="green.100"
          _dark={{
            bg: 'green.950',
            color: 'green.300',
            borderColor: 'green.800',
          }}
          css={{
            animation: 'courtCallPulse 1.8s ease-in-out infinite',
            '@keyframes courtCallPulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(22, 163, 74, 0.18)',
              },
              '50%': {
                transform: 'scale(1.04)',
                boxShadow: '0 0 0 12px rgba(22, 163, 74, 0)',
              },
            },
          }}
        >
          <Box as={MapPin} boxSize={11} strokeWidth={2.2} aria-hidden />
        </Box>

        <Flex direction="column" align="center" gap={2} textAlign="center">
          <Text fontSize="sm" fontWeight="semibold" color="green.600">
            {t('courtCall.goToCourt')}
          </Text>
          <Heading
            size="2xl"
            fontWeight="bold"
            color="green.700"
            _dark={{ color: 'brand.400' }}
            lineClamp={2}
            wordBreak="break-word"
          >
            {courtName}
          </Heading>
        </Flex>

        <Text
          maxW="sm"
          color="gray.600"
          _dark={{ color: 'gray.400' }}
          textAlign="center"
          fontSize="md"
          lineHeight="tall"
        >
          {t('courtCall.description')}
        </Text>
      </Flex>
    </VModal>
  );
}
