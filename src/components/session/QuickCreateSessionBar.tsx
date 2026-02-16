'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useColorModeValue } from '@/components/ui/chakra-compat';
import { Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { ROUTES } from '@/constants';

interface QuickCreateSessionBarProps {
  onInputClick: () => void;
}

export const QuickCreateSessionBar: React.FC<QuickCreateSessionBarProps> = ({
  onInputClick,
}) => {
  const t = useTranslations('session');
  const router = useRouter();
  const { user } = useAuthStore();

  const bgColor: string = useColorModeValue('white', 'gray.800');
  const borderColor: string = useColorModeValue('gray.200', 'gray.700');
  const inputBg: string = useColorModeValue('gray.50', 'gray.700');
  const inputHoverBg: string = useColorModeValue('gray.100', 'gray.600');
  const placeholderColor: string = useColorModeValue('gray.500', 'gray.400');

  if (!user) return null;

  const handleCreateClick = () => {
    router.push(ROUTES.SESSIONS.NEW);
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={1.5}
      shadow="sm"
      transition="all 0.2s"
      _hover={{
        shadow: 'md',
      }}
    >
      <Flex gap={2} align="center" h="38px">
        {/* AI Trigger Area (Looks like an input) */}
        <Flex
          flex={1}
          bg={inputBg}
          borderRadius="full"
          px={3}
          h="38px"
          cursor="pointer"
          onClick={onInputClick}
          _hover={{ bg: inputHoverBg }}
          transition="background 0.2s"
          align="center"
          gap={1}
        >
          <Sparkles size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
          <Text color={placeholderColor} fontSize="sm" truncate>
            {t('quickCreate.aiPlaceholder')}
          </Text>
        </Flex>

        {/* Manual Create Button */}
        <Button
          onClick={handleCreateClick}
          colorPalette="green"
          borderRadius="full"
          size="sm"
          px={4}
          h="38px"
          display="flex"
          transition="all 0.2s"
          _hover={{
            transform: 'translateY(-1px)',
            shadow: 'md',
          }}
        >
          <Plus size={16} />
          {t('quickCreate.manualButton')}
        </Button>
      </Flex>
    </Box>
  );
};
