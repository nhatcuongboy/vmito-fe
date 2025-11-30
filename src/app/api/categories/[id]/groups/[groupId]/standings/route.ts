import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { GroupStanding, GroupStandingsResponse } from '@/lib/api/types';

interface GroupStandingsParams {
  id: string;
  groupId: string;
}

// GET /api/categories/:id/groups/:groupId/standings - Get group standings (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<GroupStandingsParams> }
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

    // Get all registrations in this group
    const groupRegistrations = group.registrations.map((gr) => gr.categoryRegistration);

    // Calculate standings for each registration
    const standingsMap = new Map<string, GroupStanding>();

    // Initialize standings for each registration
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

    // Process each finished match
    for (const match of finishedMatches) {
      const participants = match.participants;
      
      if (participants.length < 2) continue;

      const reg1 = participants[0].categoryRegistration;
      const reg2 = participants[1].categoryRegistration;

      if (!reg1 || !reg2) continue;

      const standing1 = standingsMap.get(reg1.id);
      const standing2 = standingsMap.get(reg2.id);

      if (!standing1 || !standing2) continue;

      // Update matches played
      standing1.matchesPlayed++;
      standing2.matchesPlayed++;

      // Get scores
      const score1 = match.player1Score || 0;
      const score2 = match.player2Score || 0;

      // Update points for and against
      standing1.pointsFor += score1;
      standing1.pointsAgainst += score2;
      standing2.pointsFor += score2;
      standing2.pointsAgainst += score1;

      // Determine winner
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

    // Calculate point differences and sort
    const standings = Array.from(standingsMap.values()).map((standing) => {
      standing.pointDifference = standing.pointsFor - standing.pointsAgainst;
      return standing;
    });

    // Sort by: points (desc), pointDifference (desc), pointsFor (desc)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      return b.pointsFor - a.pointsFor;
    });

    // Assign ranks
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    const response: GroupStandingsResponse = {
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

    return successResponse(response, 'Standings retrieved successfully');
  } catch (error) {
    console.error('Error calculating standings:', error);
    return errorResponse('Failed to calculate standings', 500);
  }
}

