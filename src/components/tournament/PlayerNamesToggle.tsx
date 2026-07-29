'use client';

import { Users } from 'lucide-react';
import TournamentIconToggle from '@/components/tournament/TournamentIconToggle';

interface PlayerNamesToggleProps {
  active: boolean;
  onToggle: () => void;
  title: string;
  label?: string;
  fullWidthOnMobile?: boolean;
}

const PlayerNamesToggle = ({
  active,
  onToggle,
  title,
  label,
  fullWidthOnMobile = false,
}: PlayerNamesToggleProps) => {
  return (
    <TournamentIconToggle
      active={active}
      onToggle={onToggle}
      title={title}
      label={label}
      fullWidthOnMobile={fullWidthOnMobile}
    >
      <Users size={16} aria-hidden="true" />
    </TournamentIconToggle>
  );
};

export default PlayerNamesToggle;
