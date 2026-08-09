'use client';

import {
  CreditCard,
  Gamepad2,
  Lightbulb,
  Rocket,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const SECTIONS = [
  { id: 'getting-started', icon: Rocket, key: 'gettingStarted' },
  { id: 'sessions', icon: Gamepad2, key: 'sessions' },
  { id: 'tournaments', icon: Trophy, key: 'tournaments' },
  { id: 'payments', icon: CreditCard, key: 'payments' },
  { id: 'clubs', icon: Users, key: 'clubs' },
  { id: 'ratings', icon: Star, key: 'ratings' },
  { id: 'tips', icon: Lightbulb, key: 'tips' },
] as const;

export default function GuideTableOfContents() {
  const t = useTranslations('pages.guide.toc');

  return (
    <nav aria-labelledby="guide-toc-title" className="py-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <h2 id="guide-toc-title" className="mb-5 text-lg! font-bold!">
          {t('title')}
        </h2>
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-green-950"
              >
                <section.icon aria-hidden className="size-5 text-green-500" />
                {t(section.key)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
