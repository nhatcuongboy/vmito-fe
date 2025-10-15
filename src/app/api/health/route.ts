import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();

    // Simple query to verify connection
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();

    // Get database info
    const dbStatus = {
      connected: true,
      userCount,
      sessionCount,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasDefaultHost: !!process.env.DEFAULT_HOST_ID,
    };

    return NextResponse.json({
      success: true,
      data: dbStatus,
      message: 'Database connection successful',
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
