'use client';

import {
  CalendarPlus,
  CheckCircle,
  LayoutGrid,
  ListFilter,
  Search,
  Settings,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  GuideCard,
  GuideSectionHeader,
  RoleGuideColumn,
  ScreenshotPlaceholder,
} from './GuideSectionPrimitives';

const playerSteps = [
  { icon: Search, key: 'player.search' },
  { icon: ListFilter, key: 'player.filter' },
  { icon: UserCheck, key: 'player.join' },
  { icon: XCircle, key: 'player.cancel' },
] as const;

const hostSteps = [
  { icon: CalendarPlus, key: 'host.create' },
  { icon: UserCheck, key: 'host.managePlayers' },
  { icon: LayoutGrid, key: 'host.courts' },
  { icon: Settings, key: 'host.autoAssign' },
  { icon: CheckCircle, key: 'host.finish' },
] as const;

export default function SessionGuideSection() {
  const t = useTranslations('pages.guide.sessions');
  const placeholders = useTranslations('pages.guide.placeholders');

  return (
    <section
      id="sessions"
      className="scroll-mt-16 py-12 md:scroll-mt-20 md:py-16"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <ScreenshotPlaceholder label={placeholders('sessionOverview')} />
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
          <RoleGuideColumn badge={t('player.badge')} tone="player">
            {playerSteps.map((step) => (
              <GuideCard
                key={step.key}
                icon={step.icon}
                title={t(`${step.key}.title`)}
                description={t(`${step.key}.description`)}
              />
            ))}
          </RoleGuideColumn>
          <RoleGuideColumn badge={t('host.badge')} tone="host">
            {hostSteps.map((step) => (
              <GuideCard
                key={step.key}
                icon={step.icon}
                title={t(`${step.key}.title`)}
                description={t(`${step.key}.description`)}
              />
            ))}
          </RoleGuideColumn>
        </div>
      </div>
    </section>
  );
}
