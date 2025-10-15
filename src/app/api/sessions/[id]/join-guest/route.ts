import { NextRequest } from 'next/server';
import { errorResponse } from '@/app/lib/api-response';

// POST /api/sessions/[id]/join-guest - DEPRECATED
// This API is deprecated. Use /api/join-by-code for player-specific codes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return errorResponse(
    'This API is deprecated. Please use /api/join-by-code for joining sessions with player-specific codes.',
    410 // Gone
  );
}
