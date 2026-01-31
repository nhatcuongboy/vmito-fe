'use client';

import { Box, Flex, Text, Avatar, Button, Icon } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/chakra-compat';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';

interface QuickCreateSessionBarProps {
  onInputClick: () => void;
}

export const QuickCreateSessionBar: React.FC<QuickCreateSessionBarProps> = ({
  onInputClick,
}) => {
  const t = useTranslations('session');
  const router = useRouter();
  const { user } = useAuthStore();

  const bgColor = useColorModeValue('white');
  const borderColor = useColorModeValue('gray.200');
  const inputBg = useColorModeValue('gray.50');
  const inputHoverBg = useColorModeValue('gray.100');
  const placeholderColor = useColorModeValue('gray.500');

  if (!user) return null;

  const handleCreateClick = () => {
    if (user.role === UserRole.HOST) {
      router.push('/host/sessions/new');
    } else {
      router.push('/player/sessions/new');
    }
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={3}
      mb={4}
      shadow="sm"
    >
      <Flex gap={4} align="center">
        {/* Avatar */}
        <Avatar.Root size="sm" bg="blue.500">
          <Avatar.Fallback name={user.name || user.email}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </Avatar.Fallback>
          {user.image && <Avatar.Image src={user.image} />}
        </Avatar.Root>

        {/* AI Trigger Area (Looks like an input) */}
        <Flex
          flex={1}
          bg={inputBg}
          borderRadius="full"
          px={4}
          py={1.5}
          cursor="pointer"
          onClick={onInputClick}
          _hover={{ bg: inputHoverBg }}
          transition="background 0.2s"
          align="center"
        >
          <Text color={placeholderColor} fontSize="sm">
            {t('quickCreate.placeholder', { name: user.name || 'bạn' })}
          </Text>
        </Flex>

        {/* Create Button */}
        <Button
          onClick={handleCreateClick}
          colorPalette="blue"
          borderRadius="full"
          size="sm"
          px={4}
          display={{ base: 'none', sm: 'flex' }}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          {t('quickCreate.createButton')}
        </Button>

        {/* Mobile Create Button */}
        <Button
          onClick={handleCreateClick}
          colorPalette="blue"
          borderRadius="full"
          size="sm"
          display={{ base: 'flex', sm: 'none' }}
          aria-label={t('quickCreate.createButton')}
        >
          <Plus size={16} />
        </Button>
      </Flex>
    </Box>
  );
};
