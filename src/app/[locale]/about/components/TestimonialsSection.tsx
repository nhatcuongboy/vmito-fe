'use client';

import { Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TestimonialsSection() {
  const t = useTranslations('pages.about.testimonials');
  const testimonials = [
    { id: 'review-1', text: t('review1.text'), author: t('review1.author') },
    { id: 'review-2', text: t('review2.text'), author: t('review2.author') },
  ];

  return (
    <section className="bg-muted py-20 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <h2 className="mb-16 text-center text-3xl! font-bold!">{t('title')}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {testimonials.map((review) => (
            <figure
              key={review.id}
              className="relative rounded-xl bg-background p-8 shadow-lg dark:bg-gray-800"
            >
              <Quote
                aria-hidden
                className="absolute top-6 right-8 size-12 text-gray-200 dark:text-gray-700"
              />
              <blockquote className="relative z-10 mb-6 text-xl italic">
                “{review.text}”
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-full bg-green-500 font-bold text-white"
                >
                  {review.author.charAt(0)}
                </span>
                <span className="text-lg font-bold">{review.author}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
