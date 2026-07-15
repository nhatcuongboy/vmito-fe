import { TournamentCourt } from '@/lib/api/types';

export function formatCourtLabel(
  court: { courtNumber: number; courtName?: string | null },
  courtPrefix: string
) {
  // If courtName is a pure number string (e.g. "6"), treat it as the court
  // number and prefix it — so it displays as "Sân 6" instead of a bare "6".
  const name = court.courtName?.trim();
  if (!name || /^\d+$/.test(name)) {
    const num = name ? Number(name) : court.courtNumber;
    return `${courtPrefix} ${num}`;
  }
  return name;
}

// Court label prefixed with the venue acronym when available (e.g. "R · Court 1").
export function formatCourtWithVenue(
  court: TournamentCourt,
  courtPrefix: string,
  abbreviation?: string
) {
  const base = formatCourtLabel(court, courtPrefix);
  return abbreviation ? `${abbreviation} · ${base}` : base;
}
