'use client';

import { Users } from 'lucide-react';
import TournamentIconToggle from '@/components/tournament/TournamentIconToggle';

interface PlayerNamesToggleProps {
  active: boolean;
  onToggle: () => void;
  title: string;
  label?: string;
  fullWidthOnMobile?: boolean;
  size?: number;
}

const PlayerNamesToggle = ({
  active,
  onToggle,
  title,
  label,
  fullWidthOnMobile = false,
  size,
}: PlayerNamesToggleProps) => {
  return (
    <TournamentIconToggle
      active={active}
      onToggle={onToggle}
      title={title}
      label={label}
      fullWidthOnMobile={fullWidthOnMobile}
      size={size}
      hideCheckBadge
    >
      <Users size={16} aria-hidden="true" />
    </TournamentIconToggle>
  );
};

export default PlayerNamesToggle;
