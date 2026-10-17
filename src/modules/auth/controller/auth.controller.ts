import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshTokens,
  logoutUser,
} from "../service/auth.service";
import { ApiResponse } from "../../../utils/apiResponse";

/**
 * POST /auth/register
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

/**
 * POST /auth/login
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json(new ApiResponse(200, result, "Logged in successfully"));
});

/**
 * GET /auth/me
 * Requires authentication middleware
 */
export const me = catchAsync(async (req: any, res: Response) => {
  const user = await getCurrentUser(req.user!.id);

  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * POST /auth/refresh
 * Body: { refreshToken: string }
 */
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await refreshTokens(refreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, tokens, "Tokens refreshed successfully"));
});

/**
 * POST /auth/logout
 * Body: { refreshToken: string }
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  await logoutUser(refreshToken);

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});
