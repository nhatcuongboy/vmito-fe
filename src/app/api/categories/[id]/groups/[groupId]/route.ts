import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface GroupParams {
  id: string;
  groupId: string;
}

// PUT /api/categories/:id/groups/:groupId - Update group (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<GroupParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update groups', 403);
    }

    const { id: categoryId, groupId } = await params;
    const body = await request.json();

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

    // Check if group exists
    const existingGroup = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return errorResponse('Group not found', 404);
    }

    if (existingGroup.categoryId !== categoryId) {
      return errorResponse('Group does not belong to this category', 400);
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.groupNumber !== undefined) {
      // Validate groupNumber is unique within category
      const existingWithNumber = await prisma.categoryGroup.findFirst({
        where: {
          categoryId,
          groupNumber: body.groupNumber,
          id: { not: groupId },
        },
      });

      if (existingWithNumber) {
        return errorResponse('Group number already exists in this category', 400);
      }

      if (body.groupNumber < 1) {
        return errorResponse('Group number must be at least 1', 400);
      }

      updateData.groupNumber = body.groupNumber;
    }

    const group = await prisma.categoryGroup.update({
      where: { id: groupId },
      data: updateData,
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
        _count: {
          select: {
            registrations: true,
            matches: true,
          },
        },
      },
    });

    return successResponse(group, 'Group updated successfully');
  } catch (error) {
    console.error('Error updating group:', error);
    return errorResponse('Failed to update group', 500);
  }
}

// DELETE /api/categories/:id/groups/:groupId - Delete group (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<GroupParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete groups', 403);
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

    // Check if group exists
    const existingGroup = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return errorResponse('Group not found', 404);
    }

    if (existingGroup.categoryId !== categoryId) {
      return errorResponse('Group does not belong to this category', 400);
    }

    // Delete group (cascade will delete group registrations and matches)
    await prisma.categoryGroup.delete({
      where: { id: groupId },
    });

    return successResponse(null, 'Group deleted successfully');
  } catch (error) {
    console.error('Error deleting group:', error);
    return errorResponse('Failed to delete group', 500);
  }
}





