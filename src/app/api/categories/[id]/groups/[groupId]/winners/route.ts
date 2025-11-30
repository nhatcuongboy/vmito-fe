import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface GroupWinnersParams {
  id: string;
  groupId: string;
}

// GET /api/categories/:id/groups/:groupId/winners - Get group winners (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<GroupWinnersParams> }
) {
  try {
    const { id: categoryId, groupId } = await params;

    // Check if category and group exist
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (!category.winnersPerGroup || category.winnersPerGroup <= 0) {
      return errorResponse('Category does not have winnersPerGroup configured', 400);
    }

    // Get group with registrations
    const groupWithRegistrations = await prisma.categoryGroup.findUnique({
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

    if (!groupWithRegistrations || groupWithRegistrations.categoryId !== categoryId) {
      return errorResponse('Group not found or does not belong to this category', 404);
    }

    // Get all finished matches in this group
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

    // Calculate standings (same logic as standings endpoint)
    const groupRegistrations = groupWithRegistrations.registrations.map((gr) => gr.categoryRegistration);
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

    // Get top N winners
    const winners = standings
      .slice(0, category.winnersPerGroup)
      .map((standing: any) => ({
        categoryRegistrationId: standing.categoryRegistrationId,
        registration: standing.registration,
        rank: standing.rank,
        standings: {
          matchesPlayed: standing.matchesPlayed,
          matchesWon: standing.matchesWon,
          points: standing.points,
          pointDifference: standing.pointDifference,
        },
      }));

    return successResponse(winners, 'Winners retrieved successfully');
  } catch (error) {
    console.error('Error fetching winners:', error);
    return errorResponse('Failed to fetch winners', 500);
  }
}

