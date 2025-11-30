import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, MatchFormat } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// GET /api/categories/:id - Get category details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            hostId: true,
          },
        },
        registrations: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        groups: {
          include: {
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
        },
        matches: {
          include: {
            participants: {
              include: {
                categoryRegistration: {
                  include: {
                    player: true,
                    pair: true,
                  },
                },
              },
            },
            court: true,
          },
          orderBy: {
            matchNumber: 'asc',
          },
        },
        _count: {
          select: {
            registrations: true,
            matches: true,
            groups: true,
          },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(category, 'Category retrieved successfully');
  } catch (error) {
    console.error('Error fetching category:', error);
    return errorResponse('Failed to fetch category', 500);
  }
}

// PUT /api/categories/:id - Update category (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update categories', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if category exists and user is the host
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    if (existingCategory.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const {
      hasGroupStage,
      averageMatchDuration,
      groupCount,
      winnersPerGroup,
      playersPerGroup,
      matchFormat,
    } = body;

    // Build update data
    const updateData: any = {};
    if (hasGroupStage !== undefined) updateData.hasGroupStage = hasGroupStage;
    if (averageMatchDuration !== undefined) {
      if (averageMatchDuration < 0) {
        return errorResponse('Average match duration must be non-negative', 400);
      }
      updateData.averageMatchDuration = averageMatchDuration;
    }
    if (groupCount !== undefined) {
      if (groupCount < 0) {
        return errorResponse('Group count must be non-negative', 400);
      }
      updateData.groupCount = groupCount;
    }
    if (winnersPerGroup !== undefined) {
      if (winnersPerGroup < 0) {
        return errorResponse('Winners per group must be non-negative', 400);
      }
      updateData.winnersPerGroup = winnersPerGroup;
    }
    if (playersPerGroup !== undefined) {
      if (playersPerGroup < 0) {
        return errorResponse('Players per group must be non-negative', 400);
      }
      updateData.playersPerGroup = playersPerGroup;
    }
    if (matchFormat !== undefined) {
      const validFormats = Object.values(MatchFormat);
      if (!validFormats.includes(matchFormat)) {
        return errorResponse('Invalid match format', 400);
      }
      updateData.matchFormat = matchFormat;
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            matches: true,
            groups: true,
          },
        },
      },
    });

    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    console.error('Error updating category:', error);
    return errorResponse('Failed to update category', 500);
  }
}

// DELETE /api/categories/:id - Delete category (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete categories', 403);
    }

    const { id } = await params;

    // Check if category exists and user is the host
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    if (existingCategory.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.category.delete({
      where: { id },
    });

    return successResponse(null, 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    return errorResponse('Failed to delete category', 500);
  }
}

