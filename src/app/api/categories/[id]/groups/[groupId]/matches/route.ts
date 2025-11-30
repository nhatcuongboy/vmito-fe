import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface GroupParams {
  id: string;
  groupId: string;
}

// GET /api/categories/:id/groups/:groupId/matches - Get all matches for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<GroupParams> }
) {
  try {
    const { id: categoryId, groupId } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
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

    const matches = await prisma.categoryMatch.findMany({
      where: {
        categoryId,
        groupId,
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
      orderBy: {
        matchNumber: 'asc',
      },
    });

    return successResponse(matches, 'Matches retrieved successfully');
  } catch (error) {
    console.error('Error fetching group matches:', error);
    return errorResponse('Failed to fetch group matches', 500);
  }
}





