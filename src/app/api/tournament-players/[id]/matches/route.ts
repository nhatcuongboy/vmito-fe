import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface PlayerParams {
  id: string;
}

// GET /api/tournament-players/:id/matches - Get all matches for a tournament player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id: playerId } = await params;

    // Check if player exists
    const player = await prisma.tournamentPlayer.findUnique({
      where: { id: playerId },
      select: { id: true },
    });

    if (!player) {
      return errorResponse('Player not found', 404);
    }

    // Get all registrations for this player
    const registrations = await prisma.categoryRegistration.findMany({
      where: { tournamentPlayerId: playerId },
      select: { id: true },
    });

    const registrationIds = registrations.map((r) => r.id);

    // Also check if player is in any pairs
    const pairMembers = await prisma.tournamentPairMember.findMany({
      where: { playerId },
      include: {
        pair: {
          include: {
            registrations: {
              select: { id: true },
            },
          },
        },
      },
    });

    const pairRegistrationIds = pairMembers.flatMap(
      (pm) => pm.pair.registrations.map((r) => r.id)
    );

    const allRegistrationIds = [...registrationIds, ...pairRegistrationIds];

    if (allRegistrationIds.length === 0) {
      return successResponse([], 'No matches found');
    }

    // Get all matches where this player participated
    const matches = await prisma.categoryMatch.findMany({
      where: {
        participants: {
          some: {
            categoryRegistrationId: {
              in: allRegistrationIds,
            },
          },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        participants: {
          include: {
            categoryRegistration: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                pair: {
                  include: {
                    members: {
                      include: {
                        player: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        court: {
          select: {
            id: true,
            courtNumber: true,
            courtName: true,
          },
        },
        group: {
          select: {
            id: true,
            groupNumber: true,
            name: true,
          },
        },
      },
      orderBy: [
        { startTime: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return successResponse(matches, 'Matches retrieved successfully');
  } catch (error) {
    console.error('Error fetching player matches:', error);
    return errorResponse('Failed to fetch matches', 500);
  }
}





