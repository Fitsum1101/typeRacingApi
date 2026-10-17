import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import authService from "../service/auth.service";
import { ApiResponse } from "../../../utils/apiResponse";

/**
 * POST /auth/register
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

/**
 * POST /auth/login
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json(new ApiResponse(200, result, "Logged in successfully"));
});

/**
 * GET /auth/me
 * Requires authentication middleware
 */
const me = catchAsync(async (req: any, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);

  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * POST /auth/refresh
 * Body: { refreshToken: string }
 */
const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshTokens(refreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, tokens, "Tokens refreshed successfully"));
});

/**
 * POST /auth/logout
 * Body: { refreshToken: string }
 */
const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  await authService.logoutUser(refreshToken);

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export default {
  register,
  login,
  me,
  refresh,
  logout,
};
