import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface GroupParams {
  id: string;
  groupId: string;
}

// POST /api/categories/:id/groups/:groupId/registrations/bulk - Bulk assign registrations to group (HOST only)
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
      return errorResponse('Only HOST can assign registrations to groups', 403);
    }

    const { id: categoryId, groupId } = await params;
    const body = await request.json();
    const { categoryRegistrationIds } = body;

    if (!Array.isArray(categoryRegistrationIds) || categoryRegistrationIds.length === 0) {
      return errorResponse('categoryRegistrationIds must be a non-empty array', 400);
    }

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

    // Check if group exists and belongs to category
    const group = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (group.categoryId !== categoryId) {
      return errorResponse('Group does not belong to this category', 400);
    }

    // Check if all registrations exist and belong to category
    const registrations = await prisma.categoryRegistration.findMany({
      where: {
        id: { in: categoryRegistrationIds },
      },
    });

    if (registrations.length !== categoryRegistrationIds.length) {
      return errorResponse('One or more registrations not found', 404);
    }

    const invalidRegistrations = registrations.filter(
      (r) => r.categoryId !== categoryId
    );

    if (invalidRegistrations.length > 0) {
      return errorResponse('One or more registrations do not belong to this category', 400);
    }

    // Check if any registration is already assigned to a group
    const existingAssignments = await prisma.categoryGroupRegistration.findMany({
      where: {
        categoryRegistrationId: { in: categoryRegistrationIds },
      },
      include: {
        group: true,
      },
    });

    if (existingAssignments.length > 0) {
      const groupNames = existingAssignments.map(
        (a) => a.group.name || `Group ${a.group.groupNumber}`
      );
      return errorResponse(
        `Some registrations are already assigned to groups: ${groupNames.join(', ')}`,
        400
      );
    }

    // Create group registration assignments in bulk
    const groupRegistrations = await prisma.$transaction(
      categoryRegistrationIds.map((registrationId) =>
        prisma.categoryGroupRegistration.create({
          data: {
            groupId,
            categoryRegistrationId: registrationId,
          },
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

    return successResponse(
      groupRegistrations,
      `Successfully assigned ${groupRegistrations.length} registration(s) to group`
    );
  } catch (error) {
    console.error('Error bulk assigning registrations to group:', error);
    return errorResponse('Failed to assign registrations to group', 500);
  }
}





