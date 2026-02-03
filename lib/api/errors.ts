/**
 * Custom API error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): { message: string; code?: string; details?: unknown } {
    const result: { message: string; code?: string; details?: unknown } = {
      message: this.message,
    };
    if (this.code) result.code = this.code;
    if (this.details !== undefined) result.details = this.details;
    return result;
  }
}

/**
 * Common API error factories
 */
export const ApiErrors = {
  notFound: (resource: string, id?: string): ApiError =>
    new ApiError(
      404,
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      'NOT_FOUND'
    ),

  unauthorized: (message = 'Unauthorized'): ApiError =>
    new ApiError(401, message, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden'): ApiError =>
    new ApiError(403, message, 'FORBIDDEN'),

  badRequest: (message: string, details?: unknown): ApiError =>
    new ApiError(400, message, 'BAD_REQUEST', details),

  validation: (message: string, details?: unknown): ApiError =>
    new ApiError(400, message, 'VALIDATION_ERROR', details),

  conflict: (message: string): ApiError =>
    new ApiError(409, message, 'CONFLICT'),

  tooManyRequests: (message = 'Too many requests'): ApiError =>
    new ApiError(429, message, 'TOO_MANY_REQUESTS'),

  internal: (message = 'Internal server error'): ApiError =>
    new ApiError(500, message, 'INTERNAL_ERROR'),
};

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
