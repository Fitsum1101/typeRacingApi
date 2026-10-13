import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express route handler/middleware to automatically catch any errors
 * and forward them to the Express error handler using next().
 *
 * This eliminates the need for try/catch blocks in each controller function
 * and helps maintain clean controller code.
 *
 * @param fn - The async function to wrap
 * @returns The wrapped function that handles errors
 *
 * @example
 * const getUsers = catchAsync(async (req, res, next) => {
 *   const users = await userService.getUsers();
 *   res.status(200).json({ success: true, data: users });
 * });
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
