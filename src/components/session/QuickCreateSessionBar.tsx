'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useColorModeValue } from '@/components/ui/chakra-compat';
import { Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
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

  const aiBg: string = useColorModeValue(
    'linear-gradient(135deg, rgba(139, 92, 246, 0.07) 0%, rgba(20, 184, 166, 0.07) 100%)',
    'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)'
  );
  const inputBg: string = useColorModeValue(
    'rgba(255,255,255,0.7)',
    'rgba(26,32,44,0.6)'
  );
  const inputHoverBg: string = useColorModeValue(
    'rgba(255,255,255,0.95)',
    'rgba(26,32,44,0.8)'
  );
  const placeholderColor: string = useColorModeValue(
    'purple.500',
    'purple.300'
  );

  if (!user) return null;

  const handleCreateClick = () => {
    router.push(ROUTES.SESSIONS.NEW);
  };

  return (
    <Box
      style={{ background: aiBg }}
      borderRadius="xl"
      p={1.5}
      shadow="sm"
      transition="all 0.2s"
      _hover={{
        shadow: 'md',
      }}
    >
      <Flex gap={2} align="center" h="44px">
        {/* AI Trigger Area (Looks like an input) */}
        <Flex
          flex={1}
          bg={inputBg}
          borderRadius="full"
          px={3}
          h="44px"
          cursor="pointer"
          onClick={onInputClick}
          _hover={{ bg: inputHoverBg }}
          transition="background 0.2s"
          align="center"
          gap={2}
        >
          <Box color="purple.400" flexShrink={0}>
            <Sparkles size={15} />
          </Box>
          <Text
            color={placeholderColor}
            fontSize="sm"
            // fontStyle="italic"
            truncate
          >
            {t('quickCreate.aiPlaceholder')}
          </Text>
        </Flex>

        {/* Manual Create Button */}
        <Button
          onClick={handleCreateClick}
          colorPalette="green"
          borderRadius="lg"
          size="sm"
          px={5}
          h="44px"
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
