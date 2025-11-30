import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface MatchParams {
  id: string;
}

// POST /api/category-matches/:id/end - End a match (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<MatchParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can end matches', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if match exists and user is the host
    const match = await prisma.categoryMatch.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            tournament: {
              select: {
                hostId: true,
              },
            },
          },
        },
        participants: {
          include: {
            categoryRegistration: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!match) {
      return errorResponse('Match not found', 404);
    }

    if (match.category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    // Allow updating finished matches (for score corrections)
    // Only block if match is cancelled
    if (match.status === 'CANCELLED') {
      return errorResponse('Match is cancelled', 400);
    }

    const isUpdatingFinishedMatch = match.status === 'FINISHED';

    const {
      score,
      sets,
      winnerId,
      isDraw = false,
      player1Score,
      player2Score,
      player3Score,
      player4Score,
      notes,
    } = body;

    // Score is required for new matches, but optional for updating finished matches
    if (!isUpdatingFinishedMatch && !score) {
      return errorResponse('Score is required', 400);
    }

    // If updating a finished match and no score provided, use existing score
    const finalScore = isUpdatingFinishedMatch && !score ? match.score : score;

    // Calculate total scores from sets if provided
    let calculatedPlayer1Score = player1Score;
    let calculatedPlayer2Score = player2Score;
    let calculatedPlayer3Score = player3Score;
    let calculatedPlayer4Score = player4Score;

    if (sets && Array.isArray(sets) && sets.length > 0) {
      // Calculate totals from sets
      calculatedPlayer1Score = sets.reduce((sum: number, set: any) => sum + (set.player1Score || 0), 0);
      calculatedPlayer2Score = sets.reduce((sum: number, set: any) => sum + (set.player2Score || 0), 0);
      calculatedPlayer3Score = sets.reduce((sum: number, set: any) => sum + (set.player3Score || 0), 0);
      calculatedPlayer4Score = sets.reduce((sum: number, set: any) => sum + (set.player4Score || 0), 0);
    }

    // Validate winnerId if provided
    if (winnerId && !isDraw) {
      const winnerRegistration = await prisma.categoryRegistration.findUnique({
        where: { id: winnerId },
      });

      if (!winnerRegistration || winnerRegistration.categoryId !== match.categoryId) {
        return errorResponse('Winner registration not found or does not belong to this category', 404);
      }
    }

    // Update match
    // If updating a finished match, keep the existing endTime, otherwise set it to now
    const updateData: any = {
      status: 'FINISHED',
      score: finalScore,
      sets: sets ? sets : undefined,
      winnerId: winnerId || null,
      isDraw,
      player1Score: calculatedPlayer1Score,
      player2Score: calculatedPlayer2Score,
      player3Score: calculatedPlayer3Score,
      player4Score: calculatedPlayer4Score,
      notes,
    };

    // Only update endTime if match wasn't already finished
    if (!isUpdatingFinishedMatch) {
      updateData.endTime = new Date();
    }

    const updatedMatch = await prisma.categoryMatch.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
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
          orderBy: {
            position: 'asc',
          },
        },
        court: true,
        group: {
          select: {
            id: true,
            groupNumber: true,
            name: true,
          },
        },
      },
    });

    return successResponse(
      updatedMatch,
      isUpdatingFinishedMatch ? 'Match scores updated successfully' : 'Match ended successfully'
    );
  } catch (error) {
    console.error('Error ending match:', error);
    return errorResponse('Failed to end match', 500);
  }
}

