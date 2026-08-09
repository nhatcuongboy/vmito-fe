'use client';

import {
  Activity,
  Calendar,
  Crown,
  Heart,
  QrCode,
  Scale,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const featureColors = {
  blue: 'text-blue-500',
  green: 'text-green-500',
} as const;

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: keyof typeof featureColors;
}

function FeatureItem({ icon: Icon, title, desc, color }: FeatureItemProps) {
  return (
    <div className="flex gap-4">
      <Icon
        aria-hidden
        className={`mt-1 size-6 shrink-0 ${featureColors[color]}`}
      />
      <div>
        <h3 className="mb-1 text-lg! font-semibold!">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function UseCasesSection() {
  const t = useTranslations('pages.about.useCases');
  const tPlayers = useTranslations('pages.about.useCases.players');
  const tHosts = useTranslations('pages.about.useCases.hosts');

  return (
    <section className="pt-10 pb-20">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <h2 className="mb-10 text-center text-3xl! font-bold!">{t('title')}</h2>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <article className="rounded-2xl border-t-4 border-blue-500 bg-background p-8 shadow-xl dark:bg-gray-800">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-950">
                <Users aria-hidden className="size-8" />
              </div>
              <h2 className="text-2xl! font-bold!">{tPlayers('title')}</h2>
            </div>
            <p className="mb-8 text-lg text-muted-foreground dark:text-gray-400">
              {tPlayers('description')}
            </p>
            <div className="grid gap-6">
              <FeatureItem
                icon={Search}
                title={tPlayers('features.find.title')}
                desc={tPlayers('features.find.description')}
                color="blue"
              />
              <FeatureItem
                icon={Scale}
                title={tPlayers('features.fairPlay.title')}
                desc={tPlayers('features.fairPlay.description')}
                color="blue"
              />
              <FeatureItem
                icon={Activity}
                title={tPlayers('features.track.title')}
                desc={tPlayers('features.track.description')}
                color="blue"
              />
            </div>
          </article>

          <article className="rounded-2xl border-t-4 border-green-600 bg-background p-8 shadow-xl dark:bg-gray-800">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-950">
                <Crown aria-hidden className="size-8" />
              </div>
              <h2 className="text-2xl! font-bold!">{tHosts('title')}</h2>
            </div>
            <p className="mb-8 text-lg text-muted-foreground dark:text-gray-400">
              {tHosts('description')}
            </p>
            <div className="grid gap-6">
              <FeatureItem
                icon={Calendar}
                title={tHosts('features.manage.title')}
                desc={tHosts('features.manage.description')}
                color="green"
              />
              <FeatureItem
                icon={QrCode}
                title={tHosts('features.tools.title')}
                desc={tHosts('features.tools.description')}
                color="green"
              />
              <FeatureItem
                icon={Heart}
                title={tHosts('features.community.title')}
                desc={tHosts('features.community.description')}
                color="green"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
