import { describe, expect, test } from 'vitest';

import { ApiError, ApiErrors, isApiError } from '@/lib/api/errors';

describe('api errors', () => {
  test('ApiError serialisiert optionale Felder sauber', () => {
    const error = new ApiError(400, 'Ungueltig', 'BAD_REQUEST', { field: 'email' });

    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(400);
    expect(error.toJSON()).toEqual({
      message: 'Ungueltig',
      code: 'BAD_REQUEST',
      details: { field: 'email' },
    });
  });

  test('Factory-Fehler bauen die erwarteten Standardwerte', () => {
    expect(ApiErrors.notFound('Goal', 'g-1').toJSON()).toEqual({
      message: 'Goal with id "g-1" not found',
      code: 'NOT_FOUND',
    });
    expect(ApiErrors.unauthorized().statusCode).toBe(401);
    expect(ApiErrors.forbidden().code).toBe('FORBIDDEN');
    expect(ApiErrors.badRequest('Fehler', { foo: 'bar' }).details).toEqual({ foo: 'bar' });
    expect(ApiErrors.validation('Validierung').code).toBe('VALIDATION_ERROR');
    expect(ApiErrors.conflict('Konflikt').statusCode).toBe(409);
    expect(ApiErrors.tooManyRequests().code).toBe('TOO_MANY_REQUESTS');
    expect(ApiErrors.internal().statusCode).toBe(500);
  });

  test('type guard erkennt nur ApiError Instanzen', () => {
    expect(isApiError(ApiErrors.internal())).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError({ statusCode: 500, message: 'fake' })).toBe(false);
  });
});
