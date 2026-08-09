'use client';

import {
  CheckCircle2,
  History,
  ImagePlus,
  QrCode,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  GuideCard,
  GuideSectionHeader,
  RoleGuideColumn,
} from './GuideSectionPrimitives';

const playerSteps = [
  { icon: QrCode, key: 'player.viewQR' },
  { icon: ImagePlus, key: 'player.submitProof' },
  { icon: History, key: 'player.history' },
] as const;

const hostSteps = [
  { icon: Settings, key: 'host.setup' },
  { icon: CheckCircle2, key: 'host.approve' },
  { icon: History, key: 'host.transactions' },
] as const;

export default function PaymentGuideSection() {
  const t = useTranslations('pages.guide.payments');

  return (
    <section
      id="payments"
      className="scroll-mt-16 py-12 md:scroll-mt-20 md:py-16"
    >
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />

        <div className="mx-auto grid w-full max-w-[600px] grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-xl bg-blue-50 p-5 text-center dark:bg-blue-950">
            <h3 className="mb-1 text-base! font-bold! text-blue-600 dark:text-blue-300">
              {t('models.fixed.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('models.fixed.description')}
            </p>
          </article>
          <article className="rounded-xl bg-purple-50 p-5 text-center dark:bg-purple-950">
            <h3 className="mb-1 text-base! font-bold! text-purple-600 dark:text-purple-300">
              {t('models.split.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('models.split.description')}
            </p>
          </article>
        </div>

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
