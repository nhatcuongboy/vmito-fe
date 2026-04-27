import { NextRequest, NextResponse } from 'next/server';

const BE_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * Proxies AI chat requests to the vmito-be /ai/chat endpoint.
 * The BE holds the GEMINI_API_KEY and handles streaming via GeminiService.
 *
 * Expects the FE to forward the Authorization header (JWT Bearer token).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authorization =
      req.headers.get('Authorization') ?? req.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const beResponse = await fetch(`${BE_API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    if (!beResponse.ok || !beResponse.body) {
      const errText = await beResponse.text().catch(() => 'Unknown error');
      console.error('BE /ai/chat error:', beResponse.status, errText);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: beResponse.status }
      );
    }

    // Stream the BE response straight back to the browser
    return new Response(beResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('AI proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
