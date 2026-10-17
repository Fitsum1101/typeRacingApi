import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { extractBearerToken, verifyAccessToken } from "../utils/jwt";

const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          "Access denied, no token provided",
        ),
      );
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "User not found"));
    }

    if (!user.isActive) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Account is disabled"));
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    };

    return next();
  } catch (err) {
    if (
      err instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        err.name,
      )
    ) {
      return next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          "Invalid or expired access token",
        ),
      );
    }

    return next(err);
  }
};

export default authenticate;
