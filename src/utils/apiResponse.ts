import type { IApiResponse } from "../types/apiResponse";

/**
 * API response object.
 */
export class ApiResponse<T = unknown> implements IApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: T, message?: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message || "Success";
    this.success = statusCode < 400;
  }
}
