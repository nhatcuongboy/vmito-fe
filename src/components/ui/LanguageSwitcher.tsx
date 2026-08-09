'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { Locale } from '@/i18n/locales';
import { ChevronDown, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

const locales = [
  { code: Locale.EN, label: 'English', countryCode: 'us' },
  { code: Locale.VI, label: 'Tiếng Việt', countryCode: 'vn' },
  { code: Locale.CN, label: '中文', countryCode: 'cn' },
];

type LanguageSwitcherProps = {
  keepDrawerOpen?: boolean;
  isCollapsed?: boolean;
};

function Flag({ countryCode }: { countryCode: string }) {
  return (
    <span
      className="sidebar-language-flag"
      style={{
        backgroundImage: `url(https://flagcdn.com/${countryCode}.svg)`,
      }}
      aria-hidden="true"
    />
  );
}

export default function LanguageSwitcher({
  keepDrawerOpen = false,
  isCollapsed = false,
}: LanguageSwitcherProps) {
  const common = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const currentLocale =
    locales.find((item) => item.code === locale) ?? locales[0];

  const selectLocale = (newLocale: string) => {
    startTransition(() => {
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      const queryString = searchParams.toString();
      router.replace(
        queryString ? `${newPathname}?${queryString}` : newPathname
      );
    });
    setIsOpen(false);

    if (keepDrawerOpen) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('reopenDrawer'));
      }, 500);
    }
  };

  const selectNextLocale = () => {
    const currentIndex = locales.findIndex((item) => item.code === locale);
    selectLocale(locales[(currentIndex + 1) % locales.length].code);
  };

  if (isCollapsed) {
    return (
      <div className="sidebar-switcher">
        <button
          type="button"
          className="sidebar-switcher-trigger"
          data-collapsed="true"
          disabled={isPending}
          aria-label={`${common('language')}: ${currentLocale.label}`}
          onClick={selectNextLocale}
        >
          <span className="sidebar-switcher-value">
            <Flag countryCode={currentLocale.countryCode} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="sidebar-switcher-trigger"
          disabled={isPending}
          aria-label={`${common('language')}: ${currentLocale.label}`}
        >
          <span className="sidebar-switcher-value">
            <Languages size={16} aria-hidden="true" />
            <Flag countryCode={currentLocale.countryCode} />
            <span className="sidebar-switcher-label">
              {currentLocale.label}
            </span>
          </span>
          <ChevronDown
            className="sidebar-switcher-chevron"
            data-open={isOpen ? 'true' : undefined}
            size={16}
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="sidebar-switcher-menu"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuRadioGroup value={locale} onValueChange={selectLocale}>
          {locales.map((item) => (
            <DropdownMenuRadioItem
              key={item.code}
              value={item.code}
              className="sidebar-switcher-option"
            >
              <span className="sidebar-switcher-value">
                <Flag countryCode={item.countryCode} />
                <span className="sidebar-switcher-label">{item.label}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
