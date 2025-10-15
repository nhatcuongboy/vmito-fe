import { NextResponse } from 'next/server';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    message,
  });
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error,
    },
    { status }
  );
}
