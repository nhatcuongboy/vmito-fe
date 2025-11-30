import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// POST /api/categories/:id/complete-group-stage - Complete group stage (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can complete group stage', 403);
    }

    const { id: categoryId } = await params;

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

    if (!category.hasGroupStage) {
      return errorResponse('Category does not have group stage enabled', 400);
    }

    // Get all groups
    const groups = await prisma.categoryGroup.findMany({
      where: { categoryId },
      include: {
        matches: {
          include: {
            participants: {
              include: {
                categoryRegistration: true,
              },
            },
          },
        },
      },
    });

    if (groups.length === 0) {
      return errorResponse('No groups found', 400);
    }

    // Validate: All matches must be finished
    const allMatches = groups.flatMap((group) => group.matches);
    const unfinishedMatches = allMatches.filter((match) => match.status !== 'FINISHED');

    if (unfinishedMatches.length > 0) {
      return errorResponse(
        `Cannot complete group stage. ${unfinishedMatches.length} match(es) are not finished yet.`,
        400
      );
    }

    // Calculate standings for each group
    const standingsResults: Array<{
      groupId: string;
      groupNumber: number;
      groupName: string | null;
      standings: Array<{
        registrationId: string;
        wins: number;
        losses: number;
        rank: number;
      }>;
      winners: string[];
    }> = [];

    for (const group of groups) {
      // Get all registrations in this group
      const groupRegistrations = await prisma.categoryGroupRegistration.findMany({
        where: { groupId: group.id },
        include: {
          categoryRegistration: true,
        },
      });

      // Calculate wins and losses for each registration
      const stats = new Map<
        string,
        {
          registrationId: string;
          wins: number;
          losses: number;
        }
      >();

      groupRegistrations.forEach((gr) => {
        stats.set(gr.categoryRegistrationId, {
          registrationId: gr.categoryRegistrationId,
          wins: 0,
          losses: 0,
        });
      });

      // Process matches
      group.matches.forEach((match) => {
        if (match.status === 'FINISHED' && match.winnerId) {
          const participants = match.participants;
          if (participants.length === 2) {
            const participant1 = participants[0];
            const participant2 = participants[1];

            if (match.winnerId === participant1.categoryRegistrationId) {
              const stat1 = stats.get(participant1.categoryRegistrationId);
              const stat2 = stats.get(participant2.categoryRegistrationId);
              if (stat1) stat1.wins++;
              if (stat2) stat2.losses++;
            } else if (match.winnerId === participant2.categoryRegistrationId) {
              const stat1 = stats.get(participant1.categoryRegistrationId);
              const stat2 = stats.get(participant2.categoryRegistrationId);
              if (stat1) stat1.losses++;
              if (stat2) stat2.wins++;
            }
          }
        }
      });

      // Convert to array and sort by wins (desc), then assign ranks
      const standings = Array.from(stats.values())
        .sort((a, b) => {
          // Sort by wins descending
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          // If wins are equal, sort by losses ascending (fewer losses is better)
          return a.losses - b.losses;
        })
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
        }));

      // Determine winners (top winnersPerGroup teams)
      const winnersPerGroup = category.winnersPerGroup || 1;
      const winners = standings
        .slice(0, winnersPerGroup)
        .map((s) => s.registrationId);

      standingsResults.push({
        groupId: group.id,
        groupNumber: group.groupNumber,
        groupName: group.name,
        standings,
        winners,
      });
    }

    // Return summary
    const summary = {
      categoryId,
      totalGroups: groups.length,
      totalMatches: allMatches.length,
      completedMatches: allMatches.length,
      standings: standingsResults,
      message: 'Group stage completed successfully',
    };

    return successResponse(summary, 'Group stage completed successfully');
  } catch (error) {
    console.error('Error completing group stage:', error);
    return errorResponse('Failed to complete group stage', 500);
  }
}





