import { Badge, Box, Tabs, Text } from '@chakra-ui/react';
import {
  Calendar,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IClubDetailTabListProps {
  announcementCount: number;
  hasImages: boolean;
}

const TAB_TRIGGER_PROPS = {
  gap: 2,
  borderRadius: 'xl',
  px: 5,
  py: 2,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  _selected: { bg: 'green.100', color: 'green.700', shadow: 'sm' },
  _dark: { _selected: { bg: 'green.900/40', color: 'green.300' } },
} as const;

export const ClubDetailTabList = ({
  announcementCount,
  hasImages,
}: IClubDetailTabListProps) => {
  const t = useTranslations();

  return (
    <Box position="relative" mb={6}>
      <Tabs.List
        position="sticky"
        top="0"
        zIndex="10"
        bg="white"
        _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
        shadow="sm"
        borderRadius="2xl"
        p={1.5}
        gap={1}
        borderWidth="1px"
        borderColor="gray.100"
        overflowX="auto"
        scrollbarWidth="none"
        css={{ '&::-webkit-scrollbar': { display: 'none' } }}
        display="flex"
        flexWrap="nowrap"
      >
        <Tabs.Trigger value="about" {...TAB_TRIGGER_PROPS}>
          <Info size={16} />
          <Text fontSize="sm" fontWeight="semibold">
            {t('clubs.aboutTab')}
          </Text>
        </Tabs.Trigger>
        <Tabs.Trigger value="members" {...TAB_TRIGGER_PROPS}>
          <Users size={16} />
          <Text fontSize="sm" fontWeight="semibold">
            {t('clubs.membersTab')}
          </Text>
        </Tabs.Trigger>
        <Tabs.Trigger value="schedule" {...TAB_TRIGGER_PROPS}>
          <Calendar size={16} />
          <Text fontSize="sm" fontWeight="semibold">
            {t('clubs.schedule')}
          </Text>
        </Tabs.Trigger>
        <Tabs.Trigger value="announcements" {...TAB_TRIGGER_PROPS}>
          <MessageSquare size={16} />
          <Text fontSize="sm" fontWeight="semibold">
            {t('clubs.announcementsTab')}
          </Text>
          {announcementCount > 0 ? (
            <Badge
              colorPalette="blue"
              size="xs"
              ml={1}
              variant="solid"
              borderRadius="full"
            >
              {announcementCount}
            </Badge>
          ) : null}
        </Tabs.Trigger>
        {hasImages && (
          <Tabs.Trigger value="photos" {...TAB_TRIGGER_PROPS}>
            <ImageIcon size={16} />
            <Text fontSize="sm" fontWeight="semibold">
              {t('clubs.clubImage')}
            </Text>
          </Tabs.Trigger>
        )}
      </Tabs.List>
      {/* Right-edge fade — signals the tab row scrolls further on mobile,
          where 5 tabs don't fit in one viewport width. Desktop's wider
          container fits them all, so no affordance is needed there. */}
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        w="28px"
        borderRadius="0 2xl 2xl 0"
        bgGradient="to-l"
        gradientFrom="white"
        gradientTo="transparent"
        _dark={{ gradientFrom: 'gray.900' }}
        pointerEvents="none"
        display={{ base: 'block', md: 'none' }}
      />
    </Box>
  );
};
