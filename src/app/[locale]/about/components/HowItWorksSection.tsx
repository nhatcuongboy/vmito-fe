'use client';

import { Search, Trophy, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HowItWorksSection() {
  const t = useTranslations('pages.about.howItWorks');
  const steps = [
    {
      id: 'account',
      icon: UserPlus,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
    },
    {
      id: 'search',
      icon: Search,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
    },
    {
      id: 'play',
      icon: Trophy,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-muted py-20 dark:bg-gray-900"
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <h2 className="mb-16 text-center text-3xl! font-bold!">{t('title')}</h2>
        <ol className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 rounded-full bg-background p-6 text-green-500 shadow-lg dark:bg-gray-800">
                <step.icon aria-hidden className="size-10" />
              </div>
              <h3 className="mb-4 text-2xl! font-bold!">{step.title}</h3>
              <p className="text-lg text-muted-foreground dark:text-gray-400">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
