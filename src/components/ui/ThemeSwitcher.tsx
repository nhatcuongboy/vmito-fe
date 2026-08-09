'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useColorMode } from './color-mode-provider';

interface ThemeSwitcherProps {
  isCollapsed?: boolean;
}

const themeIds = ['light', 'dark', 'system'] as const;
type ThemeId = (typeof themeIds)[number];

export default function ThemeSwitcher({
  isCollapsed = false,
}: ThemeSwitcherProps) {
  const common = useTranslations('common');
  const { theme, setColorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);
  const themes = [
    { id: 'light' as const, label: common('lightMode'), icon: Sun },
    { id: 'dark' as const, label: common('darkMode'), icon: Moon },
    { id: 'system' as const, label: common('systemMode'), icon: Monitor },
  ];
  const currentTheme = themes.find((item) => item.id === theme) ?? themes[2];
  const CurrentIcon = currentTheme.icon;

  const selectTheme = (nextTheme: ThemeId) => {
    setColorMode(nextTheme);
    setIsOpen(false);
  };

  const selectNextTheme = () => {
    const currentIndex = themeIds.indexOf(theme as ThemeId);
    const safeIndex = currentIndex < 0 ? 2 : currentIndex;
    selectTheme(themeIds[(safeIndex + 1) % themeIds.length]);
  };

  if (isCollapsed) {
    return (
      <div className="sidebar-switcher">
        <button
          type="button"
          className="sidebar-switcher-trigger"
          data-collapsed="true"
          aria-label={`${common('theme')}: ${currentTheme.label}`}
          onClick={selectNextTheme}
        >
          <span className="sidebar-switcher-value">
            <CurrentIcon size={16} aria-hidden="true" />
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
          aria-label={`${common('theme')}: ${currentTheme.label}`}
        >
          <span className="sidebar-switcher-value">
            <CurrentIcon size={16} aria-hidden="true" />
            <span className="sidebar-switcher-label">{currentTheme.label}</span>
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
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => selectTheme(value as ThemeId)}
        >
          {themes.map(({ id, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={id}
              value={id}
              className="sidebar-switcher-option"
            >
              <span className="sidebar-switcher-value">
                <Icon size={16} aria-hidden="true" />
                <span className="sidebar-switcher-label">{label}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
