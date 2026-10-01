import { IApiError } from "../types/apiError";

/**
 * Custom error class for handling API errors.
 */
export class ApiError extends Error implements IApiError {
  statusCode: number;
  success: boolean;
  errors: unknown[];

  constructor(statusCode: number, message: string, errors: unknown[] = [], stack?: string) {
    super(message || "Something went wrong");
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Creates a new ApiError instance */
  static createError(statusCode: number, message: string, errors: unknown[] = []): ApiError {
    return new ApiError(statusCode, message, errors);
  }

  /** HTTP 400 */
  static badRequest(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(400, message, errors);
  }

  /** HTTP 404 */
  static notFound(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(404, message, errors);
  }

  /** HTTP 403 */
  static forbidden(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(403, message, errors);
  }

  /** HTTP 401 */
  static unauthorized(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(401, message, errors);
  }

  /** HTTP 409 */
  static conflict(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(409, message, errors);
  }

  /** HTTP 500 */
  static internal(message: string, errors: unknown[] = []): ApiError {
    return ApiError.createError(500, message, errors);
  }
}
