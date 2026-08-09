'use client';

import {
  BarChart3,
  Calendar,
  ClipboardList,
  Edit,
  GitBranch,
  PlusCircle,
  Trophy,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  GuideCard,
  GuideSectionHeader,
  RoleGuideColumn,
  ScreenshotPlaceholder,
} from './GuideSectionPrimitives';

const playerSteps = [
  { icon: Trophy, key: 'player.browse' },
  { icon: ClipboardList, key: 'player.register' },
  { icon: Calendar, key: 'player.schedule' },
  { icon: BarChart3, key: 'player.standings' },
] as const;

const hostSteps = [
  { icon: PlusCircle, key: 'host.create' },
  { icon: Users, key: 'host.managePlayers' },
  { icon: GitBranch, key: 'host.schedule' },
  { icon: Edit, key: 'host.updateResults' },
] as const;

export default function TournamentGuideSection() {
  const t = useTranslations('pages.guide.tournaments');
  const placeholders = useTranslations('pages.guide.placeholders');

  return (
    <section
      id="tournaments"
      className="scroll-mt-16 bg-muted py-12 md:scroll-mt-20 md:py-16 dark:bg-gray-900"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <ScreenshotPlaceholder label={placeholders('tournamentOverview')} />
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
