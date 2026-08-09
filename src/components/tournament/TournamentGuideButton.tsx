'use client';

import { Button } from '@/components/primitives/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/primitives/tooltip';
import { notifyTournamentGuideToggle } from '@/lib/tournamentGuideEvents';
import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TournamentGuideButtonProps {
  isCollapsed?: boolean;
}

export function TournamentGuideButton({
  isCollapsed = false,
}: TournamentGuideButtonProps) {
  const navigation = useTranslations('navigation');
  const label = navigation('tournamentGuide');

  const buttonContent = (
    <Button
      type="button"
      variant="unstyled"
      size="auto"
      className="navigation-guide-button"
      data-collapsed={isCollapsed ? 'true' : undefined}
      onClick={notifyTournamentGuideToggle}
      aria-label={label}
    >
      <span className="navigation-guide-icon" aria-hidden="true">
        <ListChecks size={17} strokeWidth={2.2} />
      </span>
      {!isCollapsed ? (
        <span className="navigation-guide-label">{label}</span>
      ) : null}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}
