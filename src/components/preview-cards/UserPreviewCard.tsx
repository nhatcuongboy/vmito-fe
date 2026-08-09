'use client';

import { useTranslations } from 'next-intl';
import { User, Users } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import type { IPublicProfileMeta } from '@/lib/api/user.service';

interface IUserPreviewCardProps {
  user: IPublicProfileMeta;
}

const GENDER_KEY: Record<string, string> = {
  MALE: 'genderMale',
  FEMALE: 'genderFemale',
  OTHER: 'genderOther',
  PREFER_NOT_TO_SAY: 'genderPreferNot',
};

export const UserPreviewCard = ({ user }: IUserPreviewCardProps) => {
  const t = useTranslations('previewCards');
  const { getLevelLabel } = useLevelLabel();

  const subtitle = user.level
    ? user.levelDescription || getLevelLabel(user.level)
    : null;

  const genderKey = user.gender ? GENDER_KEY[user.gender] : null;

  return (
    <PreviewCardBase
      href={ROUTES.USER.PROFILE(user.id)}
      image={user.image}
      title={user.name || t('unknownUser')}
      subtitle={subtitle}
      icon={<User size={24} />}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {genderKey && (
            <span className="text-gray-500 dark:text-gray-400">
              {t(genderKey)}
            </span>
          )}
          {user.joinedSessionsCount !== undefined &&
            user.joinedSessionsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Users size={12} />
                {t('joinedSessions', { count: user.joinedSessionsCount })}
              </span>
            )}
        </div>
      }
    />
  );
};
