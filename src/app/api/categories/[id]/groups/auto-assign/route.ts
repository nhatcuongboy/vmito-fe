import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';
import { autoAssignTeamsToGroups } from '@/utils/auto-assign';

interface CategoryParams {
  id: string;
}

// POST /api/categories/:id/groups/auto-assign - Auto assign all registrations to groups (HOST only)
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
      return errorResponse('Only HOST can auto-assign registrations', 403);
    }

    const { id: categoryId } = await params;
    const body = await request.json();
    const { shuffle = true, strategy = 'round-robin' } = body;

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

    if (!category.groupCount || category.groupCount < 1) {
      return errorResponse('Group count must be at least 1', 400);
    }

    // Get all groups
    const groups = await prisma.categoryGroup.findMany({
      where: { categoryId },
      orderBy: {
        groupNumber: 'asc',
      },
    });

    if (groups.length === 0) {
      return errorResponse('No groups found. Please create groups first.', 400);
    }

    if (groups.length !== category.groupCount) {
      return errorResponse(
        `Expected ${category.groupCount} groups, but found ${groups.length}`,
        400
      );
    }

    // Get all registrations
    const registrations = await prisma.categoryRegistration.findMany({
      where: { categoryId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (registrations.length === 0) {
      return errorResponse('No registrations found', 400);
    }

    // Check if any registrations are already assigned
    const existingAssignments = await prisma.categoryGroupRegistration.findMany({
      where: {
        categoryRegistrationId: { in: registrations.map((r) => r.id) },
      },
    });

    if (existingAssignments.length > 0) {
      return errorResponse(
        'Some registrations are already assigned to groups. Please remove them first.',
        400
      );
    }

    // Use utility function to calculate assignments
    const assignmentResult = autoAssignTeamsToGroups(
      registrations.map((r) => r.id),
      groups.map((g) => ({ id: g.id, groupNumber: g.groupNumber })),
      { shuffle, strategy }
    );

    // Convert to assignment format
    const assignments: Array<{ groupId: string; categoryRegistrationId: string }> = [];

    Object.entries(assignmentResult.assignments).forEach(([groupId, registrationIds]) => {
      registrationIds.forEach((registrationId) => {
        assignments.push({
          groupId,
          categoryRegistrationId: registrationId,
        });
      });
    });

    // Create all assignments in a transaction
    const groupRegistrations = await prisma.$transaction(
      assignments.map((assignment) =>
        prisma.categoryGroupRegistration.create({
          data: assignment,
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
            group: true,
          },
        })
      )
    );

    // Group results by groupId for response
    const result: Record<string, typeof groupRegistrations> = {};
    groupRegistrations.forEach((gr) => {
      if (!result[gr.groupId]) {
        result[gr.groupId] = [];
      }
      result[gr.groupId].push(gr);
    });

    return successResponse(
      result,
      `Successfully assigned ${registrations.length} registration(s) to ${groups.length} group(s)`
    );
  } catch (error) {
    console.error('Error auto-assigning registrations:', error);
    return errorResponse('Failed to auto-assign registrations', 500);
  }
}

