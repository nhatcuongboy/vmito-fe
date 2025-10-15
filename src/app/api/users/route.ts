import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with player role
    const users = await prisma.user.findMany({
      where: {
        role: 'PLAYER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        level: true,
        levelDescription: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
