import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { AuthService } from "../service/auth.service";
import { ApiResponse } from "../../../utils/apiResponse";
// the one I showed earlier

export class AuthController {
  /**
   * POST /auth/register
   */
  static register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, result, "User registered successfully"));
  });

  /**
   * POST /auth/login
   */
  static login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Logged in successfully"));
  });

  /**
   * GET /auth/me
   * Requires authentication middleware
   */
  static me = catchAsync(async (req: any, res: Response) => {
    const user = await AuthService.me(req.user!.id);

    res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  });
}
