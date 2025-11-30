import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface RegistrationParams {
  id: string;
  groupId: string;
  registrationId: string;
}

// DELETE /api/categories/:id/groups/:groupId/registrations/:registrationId - Remove registration from group (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RegistrationParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can remove registrations from groups', 403);
    }

    const { id: categoryId, groupId, registrationId } = await params;

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

    // Check if group registration exists
    const groupRegistration = await prisma.categoryGroupRegistration.findUnique({
      where: {
        groupId_categoryRegistrationId: {
          groupId,
          categoryRegistrationId: registrationId,
        },
      },
    });

    if (!groupRegistration) {
      return errorResponse('Registration is not assigned to this group', 404);
    }

    // Delete group registration (cascade will handle related data if needed)
    await prisma.categoryGroupRegistration.delete({
      where: {
        id: groupRegistration.id,
      },
    });

    return successResponse(null, 'Registration removed from group successfully');
  } catch (error) {
    console.error('Error removing registration from group:', error);
    return errorResponse('Failed to remove registration from group', 500);
  }
}





