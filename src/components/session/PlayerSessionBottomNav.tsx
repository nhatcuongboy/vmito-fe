import { Box } from '@chakra-ui/react';
import { Activity, User, Users, Trophy, Info, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PlayerSessionBottomNavProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export default function PlayerSessionBottomNav({
  activeTab,
  setActiveTab,
}: PlayerSessionBottomNavProps) {
  const t = useTranslations('SessionDetail');
  const navT = useTranslations('navigation');

  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={100}
      bg="white"
      borderTopWidth="1px"
      boxShadow="md"
      display="flex"
      justifyContent="space-around"
      alignItems="center"
      height="calc(64px + env(safe-area-inset-bottom) + 12px)"
      paddingBottom="calc(env(safe-area-inset-bottom) + 12px)"
    >
      <Box
        as="button"
        flex={1}
        py={{ base: 1, md: 2 }}
        onClick={() => setActiveTab(0)}
        display="flex"
        flexDirection="column"
        alignItems="center"
        color={activeTab === 0 ? 'blue.500' : 'gray.500'}
        fontWeight={activeTab === 0 ? 'bold' : 'normal'}
        fontSize={{ base: '10px', md: 'sm' }}
      >
        <Box
          as={Info}
          boxSize={{ base: 5, md: 6 }}
          mb={{ base: 0.5, md: 1 }}
        />
        {t('tabOverview')}
      </Box>
      <Box
        as="button"
        flex={1}
        py={{ base: 1, md: 2 }}
        onClick={() => setActiveTab(1)}
        display="flex"
        flexDirection="column"
        alignItems="center"
        color={activeTab === 1 ? 'blue.500' : 'gray.500'}
        fontWeight={activeTab === 1 ? 'bold' : 'normal'}
        fontSize={{ base: '10px', md: 'sm' }}
      >
        <Box
          as={User}
          boxSize={{ base: 5, md: 6 }}
          mb={{ base: 0.5, md: 1 }}
        />
        {t('tabStatus')}
      </Box>
      <Box
        as="button"
        flex={1}
        py={{ base: 1, md: 2 }}
        onClick={() => setActiveTab(2)}
        display="flex"
        flexDirection="column"
        alignItems="center"
        color={activeTab === 2 ? 'blue.500' : 'gray.500'}
        fontWeight={activeTab === 2 ? 'bold' : 'normal'}
        fontSize={{ base: '10px', md: 'sm' }}
      >
        <Box
          as={Square}
          boxSize={{ base: 5, md: 6 }}
          mb={{ base: 0.5, md: 1 }}
        />
        {t('tabCourts')}
      </Box>
      <Box
        as="button"
        flex={1}
        py={{ base: 1, md: 2 }}
        onClick={() => setActiveTab(3)}
        display="flex"
        flexDirection="column"
        alignItems="center"
        color={activeTab === 3 ? 'blue.500' : 'gray.500'}
        fontWeight={activeTab === 3 ? 'bold' : 'normal'}
        fontSize={{ base: '10px', md: 'sm' }}
      >
        <Box
          as={Trophy}
          boxSize={{ base: 5, md: 6 }}
          mb={{ base: 0.5, md: 1 }}
        />
        {t('tabResults')}
      </Box>
    </Box>
  );
}
