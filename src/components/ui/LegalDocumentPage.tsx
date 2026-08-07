import PageWrapper from '@/components/layout/PageWrapper';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import TopBar from './TopBar';
import type { CSSProperties } from 'react';

export interface LegalSection {
  heading: string;
  body: string;
}

interface LegalDocumentPageProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  appName: string;
  copyright: string;
  showBackButton?: boolean;
}

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

export default function LegalDocumentPage({
  title,
  lastUpdated,
  intro,
  sections,
  appName,
  copyright,
  showBackButton = false,
}: LegalDocumentPageProps) {
  return (
    <PageWrapper>
      <TopBar showBackButton={showBackButton} title={title} />
      <main className="top-bar-content-offset" style={topBarOffset}>
        <article className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
          <header className="mb-8 space-y-2">
            <h1 className="text-2xl! font-bold! md:text-3xl!">{title}</h1>
            <p
              className="text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              {lastUpdated}
            </p>
          </header>

          <p className="mb-8 leading-relaxed text-muted-foreground">{intro}</p>

          <div className="space-y-8">
            {sections.map((section, index) => {
              const headingId = `legal-section-${index + 1}`;
              return (
                <section key={section.heading} aria-labelledby={headingId}>
                  <h2 id={headingId} className="mb-3 text-xl! font-semibold!">
                    {section.heading}
                  </h2>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              );
            })}
          </div>

          <footer className="mt-12 flex justify-center border-t pt-6 pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
            <p
              className="text-center text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              © {new Date().getFullYear()} {appName}. {copyright}
            </p>
          </footer>
        </article>
      </main>
    </PageWrapper>
  );
}
