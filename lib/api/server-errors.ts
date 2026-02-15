import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, isApiError } from './errors';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const body: ErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function handleRouteError(
  error: unknown,
  fallbackMessage: string,
  context: string
) {
  console.error(context, error);

  if (error instanceof ZodError) {
    return apiErrorResponse(400, 'VALIDATION_ERROR', 'Validation error', error.flatten());
  }

  if (isApiError(error)) {
    const apiError = error as ApiError;
    return apiErrorResponse(
      apiError.statusCode,
      apiError.code || 'API_ERROR',
      apiError.message,
      apiError.details
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return apiErrorResponse(500, 'INTERNAL_ERROR', message);
}
