import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// GET /api/categories/:id/groups - Get all groups for a category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    const groups = await prisma.categoryGroup.findMany({
      where: { categoryId: id },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            registrations: true,
            matches: true,
          },
        },
      },
      orderBy: {
        groupNumber: 'asc',
      },
    });

    return successResponse(groups, 'Groups retrieved successfully');
  } catch (error) {
    console.error('Error fetching groups:', error);
    return errorResponse('Failed to fetch groups', 500);
  }
}

// POST /api/categories/:id/groups - Create groups based on groupCount (HOST only)
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
      return errorResponse('Only HOST can create groups', 403);
    }

    const { id } = await params;

    // Check if category exists and user is the host
    const category = await prisma.category.findUnique({
      where: { id },
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

    // Check if groups already exist
    const existingGroups = await prisma.categoryGroup.findMany({
      where: { categoryId: id },
    });

    if (existingGroups.length > 0) {
      return errorResponse('Groups already exist for this category', 400);
    }

    // Create groups
    const groups = [];
    for (let i = 1; i <= category.groupCount; i++) {
      const group = await prisma.categoryGroup.create({
        data: {
          categoryId: id,
          groupNumber: i,
          name: `Group ${i}`,
        },
        include: {
          _count: {
            select: {
              registrations: true,
              matches: true,
            },
          },
        },
      });
      groups.push(group);
    }

    return successResponse(groups, 'Groups created successfully');
  } catch (error) {
    console.error('Error creating groups:', error);
    return errorResponse('Failed to create groups', 500);
  }
}





