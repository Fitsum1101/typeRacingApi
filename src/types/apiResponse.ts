export interface IApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message?: string;
  success: boolean;
}
