import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { CategoryStandingsResponse } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// GET /api/categories/:id/standings - Get standings for all groups in category (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const { id: categoryId } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (!category.hasGroupStage) {
      return errorResponse('Category does not have group stage', 400);
    }

    // Get all groups
    const groups = await prisma.categoryGroup.findMany({
      where: { categoryId },
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
      orderBy: {
        groupNumber: 'asc',
      },
    });

    const response: CategoryStandingsResponse = [];

    // Calculate standings for each group
    for (const group of groups) {
      // Get all finished matches in this group
      const finishedMatches = await prisma.categoryMatch.findMany({
        where: {
          categoryId,
          groupId: group.id,
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
      const standingsMap = new Map<string, any>();

      // Initialize standings
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

      // Calculate point differences and sort
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

      response.push({
        group: {
          id: group.id,
          categoryId: group.categoryId,
          groupNumber: group.groupNumber,
          name: group.name,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        },
        standings,
      });
    }

    return successResponse(response, 'Standings retrieved successfully');
  } catch (error) {
    console.error('Error calculating standings:', error);
    return errorResponse('Failed to calculate standings', 500);
  }
}

