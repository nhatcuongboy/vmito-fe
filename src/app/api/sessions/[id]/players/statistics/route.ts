import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// Valid sort fields for player statistics
const VALID_SORT_FIELDS = [
  'playerNumber',
  'name',
  'gender',
  'level',
  'totalMatches',
  'regularMatches',
  'extraMatches',
  'wins',
  'losses',
  'winRate',
  'averageScore',
] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];
type SortOrder = 'asc' | 'desc';

// GET /api/sessions/[id]/players/statistics - Get comprehensive statistics for all players in a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Parse query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get('sortBy') || 'playerNumber') as SortField;
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as SortOrder;
    const gender = searchParams.get('gender'); // Filter by gender
    const level = searchParams.get('level'); // Filter by level
    const status = searchParams.get('status'); // Filter by status

    // Validate sort field
    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      return errorResponse(
        `Invalid sort field. Valid options: ${VALID_SORT_FIELDS.join(', ')}`,
        400
      );
    }

    // Validate sort order
    if (!['asc', 'desc'].includes(sortOrder)) {
      return errorResponse('Invalid sort order. Valid options: asc, desc', 400);
    }

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Get all players in the session with optional filtering
    const playerFilters: any = { sessionId };
    if (gender) playerFilters.gender = gender;
    if (level) playerFilters.level = level;
    if (status) playerFilters.status = status;

    const players = await prisma.player.findMany({
      where: playerFilters,
    });

    // Get all matches in the session
    const matches = await prisma.match.findMany({
      where: { sessionId },
      include: {
        players: true,
      },
    });

    // Build statistics for each player
    const playerStats = players.map((player) => {
      // Matches played by this player
      const playedMatches = matches.filter((match) =>
        match.players.some((mp) => mp.playerId === player.id)
      );
      const totalMatches = playedMatches.length;

      // Count regular and extra matches
      const regularMatches = playedMatches.filter(
        (match) => !match.isExtra
      ).length;
      const extraMatches = playedMatches.filter(
        (match) => match.isExtra
      ).length;
      // Wins: player is in winning pair
      const wins = playedMatches.filter((match) => {
        if (!match.winnerIds) return false;
        try {
          const winnerIds =
            typeof match.winnerIds === 'string'
              ? JSON.parse(match.winnerIds)
              : match.winnerIds;
          return Array.isArray(winnerIds) && winnerIds.includes(player.id);
        } catch {
          return false;
        }
      }).length;
      const losses = totalMatches - wins;
      const winRate =
        totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      // Average score (if available)
      let totalScore = 0;
      let scoreCount = 0;
      playedMatches.forEach((match) => {
        if (match.score) {
          try {
            const scores =
              typeof match.score === 'string'
                ? JSON.parse(match.score)
                : match.score;
            if (scores && typeof scores === 'object') {
              // If player is in pair1, use pair1Score, else pair2Score
              const mp = match.players.find((mp) => mp.playerId === player.id);
              if (
                mp &&
                mp.position !== undefined &&
                scores.pair1Score !== undefined &&
                scores.pair2Score !== undefined
              ) {
                // Position 0,2 = pair1 (left column), Position 1,3 = pair2 (right column)
                const isPair1 = mp.position === 0 || mp.position === 2;
                totalScore += isPair1 ? scores.pair1Score : scores.pair2Score;
                scoreCount++;
              }
            }
          } catch {}
        }
      });
      const averageScore =
        scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      // Calculate total play time (sum of all match durations)
      const totalPlayTime = playedMatches.reduce((total, match) => {
        if (match.startTime && match.endTime) {
          const duration = Math.round(
            (match.endTime.getTime() - match.startTime.getTime()) / (1000 * 60)
          ); // in minutes
          return total + duration;
        }
        return total;
      }, 0);

      return {
        playerId: player.id,
        playerNumber: player.playerNumber,
        name: player.name,
        gender: player.gender,
        level: player.level,
        totalMatches,
        regularMatches, // Number of regular matches (within session time)
        extraMatches, // Number of extra matches (overtime)
        wins,
        losses,
        winRate,
        averageScore,
        totalPlayTime, // Total play time in minutes
        totalWaitTime: player.totalWaitTime, // Total wait time in minutes
        status: player.status,
      };
    });

    // Sort the player statistics
    const sortedPlayerStats = playerStats.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle string comparisons (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values (put them at the end)
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
      if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return successResponse({
      sessionId,
      playerStats: sortedPlayerStats,
      filters: {
        gender,
        level,
        status,
        sortBy,
        sortOrder,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting player statistics:', error);
    return errorResponse('Failed to get player statistics', 500);
  }
}
