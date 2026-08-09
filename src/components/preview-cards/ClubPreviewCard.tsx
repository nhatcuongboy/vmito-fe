'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import type { IClub, IClubListItem } from '@/types/club';

interface IClubPreviewCardProps {
  club: IClubListItem | IClub;
}

const JOIN_POLICY_KEY: Record<string, string> = {
  OPEN: 'joinPolicyOpen',
  APPROVAL_REQUIRED: 'joinPolicyApproval',
  INVITATION_ONLY: 'joinPolicyInvite',
};

export const ClubPreviewCard = ({ club }: IClubPreviewCardProps) => {
  const t = useTranslations('previewCards');

  const locationName =
    club.defaultVenue?.name || ('location' in club ? club.location : undefined);

  const policyKey = JOIN_POLICY_KEY[club.joinPolicy] ?? 'joinPolicyOpen';

  return (
    <PreviewCardBase
      href={ROUTES.CLUBS.DETAIL(club.slug ?? club.id)}
      image={club.logo || club.image}
      title={club.name}
      subtitle={locationName}
      icon={<Users size={24} />}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Users size={12} />
            {t('membersCount', { count: club.memberCount })}
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {t(policyKey)}
          </span>
        </div>
      }
    />
  );
};
