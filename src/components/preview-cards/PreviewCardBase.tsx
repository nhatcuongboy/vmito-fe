'use client';

import { Link } from '@/i18n/config';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { AppSportBadge } from '@/components/common/AppSportBadge';
import type { SportType } from '@/lib/api/types';

export interface IPreviewCardBaseProps {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  metadata?: React.ReactNode;
  icon: React.ReactNode;
  sportType?: SportType | null;
}

export const PreviewCardBase = ({
  href,
  image,
  title,
  subtitle,
  metadata,
  icon,
  sportType,
}: IPreviewCardBaseProps) => {
  const imageSrc = image ? normalizeImageUrl(image) : null;

  return (
    <Link href={href} className="group block">
      <div
        className="flex items-start gap-3.5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-green-300 group-hover:shadow-md dark:border-white/10 dark:from-gray-700/50 dark:to-gray-800/40 dark:group-hover:border-green-500/40"
        style={{ padding: 12 }}
      >
        {imageSrc ? (
          <img // eslint-disable-line @next/next/no-img-element
            src={imageSrc}
            alt={title}
            className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-[1.03] dark:ring-white/10"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] dark:from-green-500 dark:to-emerald-600">
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div
              className="truncate text-[15px] text-green-700 dark:text-green-300"
              style={{ fontWeight: 600 }}
            >
              {title}
            </div>
            {sportType && <AppSportBadge sportType={sportType} iconOnly />}
          </div>

          {subtitle && (
            <div
              className="truncate text-[13px] text-gray-500 dark:text-gray-400"
              style={{ marginTop: 2 }}
            >
              {subtitle}
            </div>
          )}

          {metadata && <div style={{ marginTop: 4 }}>{metadata}</div>}
        </div>
      </div>
    </Link>
  );
};
