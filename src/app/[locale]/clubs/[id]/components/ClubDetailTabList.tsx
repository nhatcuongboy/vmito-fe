import {
  Calendar,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSubMenu } from '@/components/common/DetailSubMenu';

interface IClubDetailTabListProps {
  announcementCount: number;
  hasImages: boolean;
}

export const ClubDetailTabList = ({
  announcementCount,
  hasImages,
}: IClubDetailTabListProps) => {
  const t = useTranslations();

  const items = [
    { id: 'about', label: t('clubs.aboutTab'), icon: Info },
    { id: 'members', label: t('clubs.membersTab'), icon: Users },
    { id: 'schedule', label: t('clubs.schedule'), icon: Calendar },
    {
      id: 'announcements',
      label: t('clubs.announcementsTab'),
      icon: MessageSquare,
      ...(announcementCount > 0 ? { badge: announcementCount } : {}),
    },
    ...(hasImages
      ? [{ id: 'photos', label: t('clubs.clubImage'), icon: ImageIcon }]
      : []),
  ];

  return (
    <DetailSubMenu
      items={items}
      ariaLabel={t('common.navigation')}
      mb={{ base: 4, md: 6 }}
    />
  );
};
