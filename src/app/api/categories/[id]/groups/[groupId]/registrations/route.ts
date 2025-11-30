import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface GroupParams {
  id: string;
  groupId: string;
}

// POST /api/categories/:id/groups/:groupId/registrations - Assign registration to group (HOST only)
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
    const { categoryRegistrationId } = body;

    if (!categoryRegistrationId) {
      return errorResponse('categoryRegistrationId is required', 400);
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

    // Check if registration exists and belongs to category
    const registration = await prisma.categoryRegistration.findUnique({
      where: { id: categoryRegistrationId },
    });

    if (!registration) {
      return errorResponse('Registration not found', 404);
    }

    if (registration.categoryId !== categoryId) {
      return errorResponse('Registration does not belong to this category', 400);
    }

    // Check if registration is already assigned to a group
    const existingAssignment = await prisma.categoryGroupRegistration.findFirst({
      where: {
        categoryRegistrationId,
      },
      include: {
        group: true,
      },
    });

    if (existingAssignment) {
      return errorResponse(
        `Registration is already assigned to ${existingAssignment.group.name || `Group ${existingAssignment.group.groupNumber}`}`,
        400
      );
    }

    // Create group registration assignment
    const groupRegistration = await prisma.categoryGroupRegistration.create({
      data: {
        groupId,
        categoryRegistrationId,
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
    });

    return successResponse(groupRegistration, 'Registration assigned to group successfully');
  } catch (error) {
    console.error('Error assigning registration to group:', error);
    return errorResponse('Failed to assign registration to group', 500);
  }
}





