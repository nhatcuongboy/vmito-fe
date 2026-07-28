import type { ExtractedSessionData } from '@/lib/api/ai.service';

/**
 * What the AI extraction says about the session's location, reduced to the two
 * branches the form can act on.
 *
 * The backend is the only place that matches a venue. `kind: 'venue'` means it
 * confirmed one; `kind: 'custom'` means it looked and did not find one, so the
 * form fills in a custom location and asks the user to check it. There is no
 * third branch where the client guesses a venue on its own.
 */
export type AiLocationResolution =
  | { kind: 'venue'; venueId: string }
  | {
      kind: 'custom';
      name: string;
      address?: string;
      district?: string;
      city?: string;
    }
  | { kind: 'none' };

const clean = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function resolveAiLocation(
  data: Pick<ExtractedSessionData, 'venueId' | 'venue' | 'location'>
): AiLocationResolution {
  const venueId = clean(data.venueId);
  if (venueId) {
    return { kind: 'venue', venueId };
  }

  const venue = data.venue;
  const location = clean(data.location);

  // Name falls back through venue name -> display location -> address, so a
  // post that only yielded a free-form string still produces a usable custom
  // location instead of an empty required field.
  const name = clean(venue?.name) || location || clean(venue?.address);
  if (!name) {
    return { kind: 'none' };
  }

  const address = clean(venue?.address);

  return {
    kind: 'custom',
    name,
    // Echoing the name back as the address just reads as duplicated text.
    address: address && address !== name ? address : undefined,
    // The new administrative units supersede the old ones when the AI could
    // identify them.
    district: clean(venue?.newDistrict) || clean(venue?.district),
    city: clean(venue?.newCity) || clean(venue?.city),
  };
}
