import { Venue } from '@/lib/api/types';

// Normalize text for better venue matching (strips common Vietnamese prefixes).
function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/sân\s+cầu\s+lông\s+/gi, '') // Remove "sân cầu lông" prefix
    .replace(/sân\s+/gi, '') // Remove "sân" prefix
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function calculateMatchScore(
  venue: Venue,
  searchName: string,
  searchAddress: string
): number {
  let score = 0;
  const normalizedVenueName = normalizeText(venue.name);
  const normalizedVenueAddress = venue.address.toLowerCase();
  const normalizedSearchName = normalizeText(searchName);
  const normalizedSearchAddress = searchAddress;

  // Exact match gets highest score
  if (normalizedVenueName === normalizedSearchName) {
    score += 100;
  }
  // Contains match
  else if (normalizedVenueName.includes(normalizedSearchName)) {
    score += 50;
  } else if (normalizedSearchName.includes(normalizedVenueName)) {
    score += 50;
  }
  // Word-by-word matching
  else {
    const searchWords = normalizedSearchName
      .split(' ')
      .filter((w: string) => w.length > 2);
    const venueWords = normalizedVenueName
      .split(' ')
      .filter((w: string) => w.length > 2);

    searchWords.forEach((searchWord: string) => {
      venueWords.forEach((venueWord: string) => {
        if (venueWord.includes(searchWord) || searchWord.includes(venueWord)) {
          score += 10;
        }
      });
    });
  }

  // Address matching
  if (normalizedSearchAddress && normalizedVenueAddress) {
    if (normalizedVenueAddress.includes(normalizedSearchAddress)) {
      score += 30;
    } else if (normalizedSearchAddress.includes(normalizedVenueAddress)) {
      score += 30;
    } else {
      // Word-by-word address matching
      const addressWords = normalizedSearchAddress
        .split(' ')
        .filter((w: string) => w.length > 2);
      addressWords.forEach((word: string) => {
        if (normalizedVenueAddress.includes(word)) {
          score += 5;
        }
      });
    }
  }

  return score;
}

// Fuzzy-match an AI-extracted venue against the known venues.
// Returns the best matching venue only when the score is above threshold.
export function findBestVenueMatch(
  venues: Venue[],
  aiVenue: { name?: string | null; address?: string | null }
): Venue | null {
  const searchName = aiVenue.name?.toLowerCase() || '';
  const searchAddress = aiVenue.address?.toLowerCase() || '';

  let bestMatch: Venue | null = null;
  let bestScore = 0;

  venues.forEach((v) => {
    const score = calculateMatchScore(v, searchName, searchAddress);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = v;
    }
  });

  // Only use match if score is above threshold
  if (bestMatch && bestScore >= 10) {
    return bestMatch;
  }
  return null;
}
