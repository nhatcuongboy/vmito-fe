import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface RegistrationParams {
  id: string;
  registrationId: string;
}

// DELETE /api/categories/:id/registrations/:registrationId - Remove registration (HOST only)
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
      return errorResponse('Only HOST can remove registrations', 403);
    }

    const { id: categoryId, registrationId } = await params;

    // Check if registration exists and user is the host
    const registration = await prisma.categoryRegistration.findUnique({
      where: { id: registrationId },
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
      },
    });

    if (!registration) {
      return errorResponse('Registration not found', 404);
    }

    if (registration.categoryId !== categoryId) {
      return errorResponse('Registration does not belong to this category', 400);
    }

    if (registration.category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.categoryRegistration.delete({
      where: { id: registrationId },
    });

    return successResponse(null, 'Registration removed successfully');
  } catch (error) {
    console.error('Error removing registration:', error);
    return errorResponse('Failed to remove registration', 500);
  }
}

