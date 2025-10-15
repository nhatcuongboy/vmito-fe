import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionMatchParams {
  id: string;
}

// POST /api/sessions/[id]/matches - Start a new match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionMatchParams> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { courtId, playerIds } = body;

    // Check if session exists and is in progress
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot create a match for a session that is not in progress',
        400
      );
    }

    // Check if we have exactly 4 players
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length !== 4) {
      return errorResponse(
        'Exactly 4 players are required to start a match',
        400
      );
    }

    // Check if court exists and is available
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: { currentMatch: true },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    if (court.status === 'IN_USE' || court.currentMatchId) {
      return errorResponse('Court is already in use', 400);
    }

    // Check if players are valid and available
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        sessionId,
        status: 'WAITING',
      },
    });

    if (players.length !== 4) {
      return errorResponse(
        'One or more selected players are not available',
        400
      );
    }

    // Start transaction to create match and update related entities
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create a new match
        const newMatch = await tx.match.create({
          data: {
            sessionId,
            courtId,
            status: 'IN_PROGRESS',
            startTime: new Date(),
          },
        });

        // 2. Create match players (positions 0-3) in parallel
        const matchPlayerPromises = playerIds.map((playerId, index) => {
          return tx.matchPlayer.create({
            data: {
              matchId: newMatch.id,
              playerId: playerId,
              position: index, // Position 0-3 (matching frontend position system)
            },
          });
        });

        await Promise.all(matchPlayerPromises);

        // 3. Update court status
        await tx.court.update({
          where: { id: courtId },
          data: {
            status: 'IN_USE',
            currentMatchId: newMatch.id,
          },
        });

        // 4. Update player statuses (using updateMany for efficiency)
        await tx.player.updateMany({
          where: {
            id: { in: playerIds },
          },
          data: {
            status: 'PLAYING',
            currentCourtId: courtId,
            currentWaitTime: 0, // Reset wait time when starting a match
          },
        });

        return newMatch;
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    // Get the full match data to return
    const matchData = await prisma.match.findUnique({
      where: { id: result.id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        court: true,
      },
    });

    return successResponse(matchData, 'Match started successfully');
  } catch (error) {
    console.error('Error starting match:', error);
    return errorResponse('Failed to start match');
  }
}

// GET /api/sessions/[id]/matches - Get all matches for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionMatchParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const courtId = searchParams.get('courtId');

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Build where condition based on filters
    const whereCondition: any = { sessionId };

    // Filter by court if courtId is provided
    if (courtId) {
      whereCondition.courtId = courtId;
    }

    // Filter by player if playerId is provided
    if (playerId) {
      whereCondition.players = {
        some: {
          playerId: playerId,
        },
      };
    }

    // Get matches for the session with filters
    const matches = await prisma.match.findMany({
      where: whereCondition,
      include: {
        players: {
          include: {
            player: true,
          },
        },
        court: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Transform matches to format score as [21,19]
    const formattedMatches = matches.map((match) => {
      // Create a copy of the match object
      const formattedMatch = { ...match };

      // If there's a score, parse it and format it as [score1, score2]
      if (match.score) {
        try {
          // Parse the score if it's a JSON string
          const scoreData =
            typeof match.score === 'string'
              ? JSON.parse(match.score)
              : match.score;

          formattedMatch.score = scoreData;
        } catch (e) {
          console.warn('Failed to parse match score:', e);
          // Keep the original score if parsing fails
        }
      }

      if (match.winnerIds) {
        try {
          // Parse the winnerIds if it's a JSON string
          const winnerIdsData =
            typeof match.winnerIds === 'string'
              ? JSON.parse(match.winnerIds)
              : match.winnerIds;

          formattedMatch.winnerIds = winnerIdsData;
        } catch (e) {
          console.warn('Failed to parse match winnerIds:', e);
        }
      }

      return formattedMatch;
    });

    // Prepare response with filter information
    const responseData = {
      matches: formattedMatches,
      totalMatches: formattedMatches.length,
      filters: {
        playerId: playerId || null,
        courtId: courtId || null,
      },
    };

    let message = 'Matches retrieved successfully';
    if (playerId || courtId) {
      const filterDescriptions = [];
      if (playerId) filterDescriptions.push(`player ID: ${playerId}`);
      if (courtId) filterDescriptions.push(`court ID: ${courtId}`);
      message += ` (filtered by ${filterDescriptions.join(', ')})`;
    }

    return successResponse(responseData, message);
  } catch (error) {
    console.error('Error retrieving matches:', error);
    return errorResponse('Failed to retrieve matches');
  }
}
