import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, MatchFormat } from '@/lib/api/types';

interface GroupParams {
  id: string;
  groupId: string;
}

// POST /api/categories/:id/groups/:groupId/generate-matches - Generate round-robin matches for group (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<GroupParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can generate matches', 403);
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

    // Get matchFormat from request body (optional)
    let matchFormat = category.matchFormat; // Default to category matchFormat
    try {
      const contentType = request.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await request.json();
        if (body.matchFormat) {
          // Validate matchFormat
          const validFormats = Object.values(MatchFormat);
          if (validFormats.includes(body.matchFormat)) {
            matchFormat = body.matchFormat;
          } else {
            console.warn(`Invalid matchFormat: ${body.matchFormat}, using category default`);
          }
        }
      }
    } catch (e) {
      // Body is optional, use category default
      console.log('No request body or invalid JSON, using category default matchFormat');
    }

    // Ensure matchFormat is valid
    if (!matchFormat) {
      matchFormat = MatchFormat.BEST_OF_3; // Final fallback
    }

    // Check if group exists and belongs to category
    const group = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
      include: {
        registrations: {
          include: {
            categoryRegistration: true,
          },
        },
        matches: true,
      },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (group.categoryId !== categoryId) {
      return errorResponse('Group does not belong to this category', 400);
    }

    // Check if matches already exist
    if (group.matches.length > 0) {
      return errorResponse('Matches already exist for this group', 400);
    }

    // Get registrations in this group
    const registrations = group.registrations.map((gr) => gr.categoryRegistration);

    if (registrations.length < 2) {
      return errorResponse('Group must have at least 2 registrations to generate matches', 400);
    }

    // Generate round-robin matches: n teams = n*(n-1)/2 matches
    const matches: Array<{
      round: string;
      matchNumber: number;
      groupId: string;
      participant1Id: string;
      participant2Id: string;
    }> = [];

    let matchNumber = 1;
    for (let i = 0; i < registrations.length; i++) {
      for (let j = i + 1; j < registrations.length; j++) {
        matches.push({
          round: 'Group Stage',
          matchNumber: matchNumber++,
          groupId,
          participant1Id: registrations[i].id,
          participant2Id: registrations[j].id,
        });
      }
    }

    // Get the next match number for the category (to ensure uniqueness across groups)
    const existingMatches = await prisma.categoryMatch.findMany({
      where: { categoryId },
      orderBy: { matchNumber: 'desc' },
      take: 1,
    });

    const baseMatchNumber = existingMatches.length > 0 ? existingMatches[0].matchNumber + 1 : 1;

    // Create all matches in a transaction
    const createdMatches = await prisma.$transaction(
      matches.map((match, index) =>
        prisma.categoryMatch.create({
          data: {
            categoryId,
            groupId: match.groupId,
            round: match.round,
            matchNumber: baseMatchNumber + index,
            matchFormat: matchFormat || undefined, // Use matchFormat from request or category default, or undefined if null
            status: 'SCHEDULED',
            participants: {
              create: [
                {
                  categoryRegistrationId: match.participant1Id,
                  position: 1,
                },
                {
                  categoryRegistrationId: match.participant2Id,
                  position: 2,
                },
              ],
            },
          },
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
            group: true,
            court: true,
          },
        })
      )
    );

    return successResponse(
      createdMatches,
      `Successfully generated ${createdMatches.length} match(es) for group`
    );
  } catch (error) {
    console.error('Error generating matches:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `Failed to generate matches: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

