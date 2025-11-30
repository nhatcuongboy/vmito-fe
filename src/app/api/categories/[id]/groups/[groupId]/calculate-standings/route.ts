import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CalculateStandingsParams {
  id: string;
  groupId: string;
}

// POST /api/categories/:id/groups/:groupId/calculate-standings - Recalculate standings (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CalculateStandingsParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can recalculate standings', 403);
    }

    const { id: categoryId, groupId } = await params;

    // Check if category exists and user is the host
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    // Import and reuse the standings calculation logic
    // For now, redirect to GET endpoint logic
    const group = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
      include: {
        registrations: {
          include: {
            categoryRegistration: {
              include: {
                player: true,
                pair: {
                  include: {
                    members: {
                      include: {
                        player: true,
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
        },
      },
    });

    if (!group || group.categoryId !== categoryId) {
      return errorResponse('Group not found or does not belong to this category', 404);
    }

    const finishedMatches = await prisma.categoryMatch.findMany({
      where: {
        categoryId,
        groupId,
        status: 'FINISHED',
      },
      include: {
        participants: {
          include: {
            categoryRegistration: true,
          },
        },
      },
    });

    const groupRegistrations = group.registrations.map((gr) => gr.categoryRegistration);
    const standingsMap = new Map<string, any>();

    for (const registration of groupRegistrations) {
      standingsMap.set(registration.id, {
        categoryRegistrationId: registration.id,
        registration: registration as any,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesDrawn: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
        rank: 0,
      });
    }

    for (const match of finishedMatches) {
      const participants = match.participants;
      if (participants.length < 2) continue;

      const reg1 = participants[0].categoryRegistration;
      const reg2 = participants[1].categoryRegistration;
      if (!reg1 || !reg2) continue;

      const standing1 = standingsMap.get(reg1.id);
      const standing2 = standingsMap.get(reg2.id);
      if (!standing1 || !standing2) continue;

      standing1.matchesPlayed++;
      standing2.matchesPlayed++;

      const score1 = match.player1Score || 0;
      const score2 = match.player2Score || 0;

      standing1.pointsFor += score1;
      standing1.pointsAgainst += score2;
      standing2.pointsFor += score2;
      standing2.pointsAgainst += score1;

      if (match.isDraw) {
        standing1.matchesDrawn++;
        standing2.matchesDrawn++;
        standing1.points += 1;
        standing2.points += 1;
      } else if (match.winnerId === reg1.id) {
        standing1.matchesWon++;
        standing2.matchesLost++;
        standing1.points += 2;
      } else if (match.winnerId === reg2.id) {
        standing1.matchesLost++;
        standing2.matchesWon++;
        standing2.points += 2;
      }
    }

    const standings = Array.from(standingsMap.values()).map((standing) => {
      standing.pointDifference = standing.pointsFor - standing.pointsAgainst;
      return standing;
    });

    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      return b.pointsFor - a.pointsFor;
    });

    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    const response = {
      group: {
        id: group.id,
        categoryId: group.categoryId,
        groupNumber: group.groupNumber,
        name: group.name,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
      standings,
    };

    return successResponse(response, 'Standings recalculated successfully');
  } catch (error) {
    console.error('Error recalculating standings:', error);
    return errorResponse('Failed to recalculate standings', 500);
  }
}

