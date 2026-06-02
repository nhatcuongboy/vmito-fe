'use client';

import { SimpleGrid } from '@/components/ui/chakra-compat';
import { ScoreboardMatch } from '@/lib/api/types';
import LiveMatchCard from './LiveMatchCard';

interface Props {
  matches: ScoreboardMatch[];
  gridSize: 1 | 2 | 4 | 6;
}

// Responsive column counts per grid size.
const COLUMNS: Record<
  number,
  { base: number; sm?: number; md?: number; lg?: number }
> = {
  1: { base: 1 },
  2: { base: 1, md: 2 },
  4: { base: 1, sm: 2, lg: 2 },
  6: { base: 1, sm: 2, lg: 3 },
};

export default function ScoreboardGrid({ matches, gridSize }: Props) {
  const visible = matches.slice(0, gridSize);
  const density = gridSize <= 2 ? 'comfortable' : 'compact';

  return (
    <SimpleGrid columns={COLUMNS[gridSize]} gap={3} p={3}>
      {visible.map((m) => (
        <LiveMatchCard key={m.matchId} match={m} density={density} />
      ))}
    </SimpleGrid>
  );
}
