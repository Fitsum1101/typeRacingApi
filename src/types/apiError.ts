export interface IApiError {
  statusCode: number;
  message: string;
  success: boolean;
  errors?: unknown[];
  stack?: string;
  currentUsage?: undefined | number | undefined;
}
