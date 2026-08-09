import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface GuideSectionHeaderProps {
  title: string;
  subtitle: string;
}

export function GuideSectionHeader({
  title,
  subtitle,
}: GuideSectionHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <h2 className="text-2xl! font-bold! md:text-3xl!">{title}</h2>
      <p className="text-base text-muted-foreground md:text-lg">{subtitle}</p>
    </header>
  );
}

interface GuideCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function GuideCard({ icon: Icon, title, description }: GuideCardProps) {
  return (
    <article className="flex items-start gap-4 rounded-lg bg-background p-4 shadow-sm dark:bg-gray-800">
      <span className="shrink-0 rounded-lg bg-green-50 p-2.5 text-green-500 dark:bg-green-950">
        <Icon aria-hidden className="size-[22px]" />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm! font-semibold!">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

interface ScreenshotPlaceholderProps {
  label: string;
  compact?: boolean;
}

export function ScreenshotPlaceholder({
  label,
  compact = false,
}: ScreenshotPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={
        compact
          ? 'flex h-[120px] w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-muted-foreground dark:bg-gray-700'
          : 'flex h-[200px] w-full max-w-[500px] items-center justify-center rounded-xl bg-gray-100 text-sm text-muted-foreground shadow-md dark:bg-gray-800'
      }
    >
      <span aria-hidden>📷 </span>
      {label}
    </div>
  );
}

interface RoleGuideColumnProps {
  badge: string;
  tone: 'player' | 'host';
  children: ReactNode;
}

export function RoleGuideColumn({
  badge,
  tone,
  children,
}: RoleGuideColumnProps) {
  const badgeClass =
    tone === 'player'
      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
      : 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300';

  return (
    <section className="space-y-4" aria-label={badge}>
      <h3
        className={`inline-flex rounded-full px-3 py-1 text-sm! font-bold! ${badgeClass}`}
      >
        {badge}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
