import { CategoryMatch, TournamentPlayer } from '@/lib/api/types';

const MATCH_CODE_PREFIX = 'M';
const PLAYER_CODE_PREFIX = 'VDV';
const LEGACY_PLAYER_CODE_LENGTH = 8;

const getNumericSuffix = (value: string, prefix: string): number | null => {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(new RegExp(`^${prefix}(\\d+)$`));
  if (!match) return null;
  return Number(match[1]);
};

const formatSequentialCode = (
  prefix: string,
  value: number,
  minDigits: number
) => `${prefix}${String(value).padStart(minDigits, '0')}`;

export const getMatchDisplayCode = (match: CategoryMatch): string =>
  match.matchCode?.trim() ||
  formatSequentialCode(MATCH_CODE_PREFIX, match.matchNumber || 1, 2);

export const generateNextMatchCode = (
  matches: CategoryMatch[],
  fallbackNumber = matches.length + 1
): string => {
  const maxCodeNumber = matches.reduce((max, match) => {
    const codeNumber = match.matchCode
      ? getNumericSuffix(match.matchCode, MATCH_CODE_PREFIX)
      : null;
    return codeNumber && codeNumber > max ? codeNumber : max;
  }, 0);

  const nextNumber = Math.max(maxCodeNumber + 1, fallbackNumber);
  return formatSequentialCode(MATCH_CODE_PREFIX, nextNumber, 2);
};

export const getLegacyTournamentPlayerCode = (playerId: string): string =>
  playerId.slice(0, LEGACY_PLAYER_CODE_LENGTH).toLowerCase();

export const getUniqueLegacyTournamentPlayerCode = (
  playerId: string,
  tournamentPlayerIds: string[]
) => {
  const normalizedPlayerIds = tournamentPlayerIds.map((id) => id.toLowerCase());
  const normalizedPlayerId = playerId.toLowerCase();
  let codeLength = Math.min(LEGACY_PLAYER_CODE_LENGTH, playerId.length);

  while (codeLength < playerId.length) {
    const candidate = normalizedPlayerId.slice(0, codeLength);
    const matches = normalizedPlayerIds.filter((id) =>
      id.startsWith(candidate)
    );

    if (matches.length <= 1) return candidate;
    codeLength += 1;
  }

  return normalizedPlayerId;
};

export const getTournamentPlayerDisplayCode = (
  player: TournamentPlayer,
  allPlayerIds?: string[]
): string =>
  player.code?.trim() ||
  (allPlayerIds
    ? getUniqueLegacyTournamentPlayerCode(player.id, allPlayerIds)
    : getLegacyTournamentPlayerCode(player.id));

export const generateNextTournamentPlayerCode = (
  players: TournamentPlayer[],
  fallbackNumber = players.length + 1
): string => {
  const maxCodeNumber = players.reduce((max, player) => {
    const codeNumber = player.code
      ? getNumericSuffix(player.code, PLAYER_CODE_PREFIX)
      : null;
    return codeNumber && codeNumber > max ? codeNumber : max;
  }, 0);

  const nextNumber = Math.max(maxCodeNumber + 1, fallbackNumber);
  return formatSequentialCode(PLAYER_CODE_PREFIX, nextNumber, 3);
};

export const matchesTournamentPlayerCode = (
  player: TournamentPlayer,
  requestedCode: string
): boolean => {
  const normalizedCode = requestedCode.trim().toLowerCase();
  return (
    player.code?.trim().toLowerCase() === normalizedCode ||
    player.id.toLowerCase().startsWith(normalizedCode)
  );
};
