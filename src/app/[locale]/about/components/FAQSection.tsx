'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/primitives/accordion';
import { useTranslations } from 'next-intl';

export default function FAQSection() {
  const t = useTranslations('pages.about.faq');
  const faqs = [
    { value: 'q1', question: t('q1.question'), answer: t('q1.answer') },
    { value: 'q2', question: t('q2.question'), answer: t('q2.answer') },
    { value: 'q3', question: t('q3.question'), answer: t('q3.answer') },
  ];

  return (
    <section className="pt-20 pb-10">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h2 className="mb-12 text-center text-3xl! font-bold!">{t('title')}</h2>
        <Accordion
          type="single"
          collapsible
          className="overflow-hidden rounded-lg border"
        >
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger className="cursor-pointer px-6 py-4 text-lg font-semibold! hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-base leading-relaxed text-muted-foreground dark:text-gray-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
