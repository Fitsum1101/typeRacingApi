// import type { Response, NextFunction, RequestHandler } from "express";
// import { StatusCodes } from "http-status-codes";

// import { ApiError } from "../utils/apiError";
// import { verifyAccessToken } from "../utils/jwtToken";
// import { prisma } from "../config/db";
// import { extractToken } from "../utils/token";
// import type { AuthenticatedRequest } from "../types/authMiddleare";

// const authenticate: RequestHandler = async (
//   req: AuthenticatedRequest,
//   _res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const token = extractToken(req);

//     if (!token) {
//       return next(
//         new ApiError(
//           StatusCodes.UNAUTHORIZED,
//           "Access denied, no token provided",
//         ),
//       );
//     }

//     const decoded = verifyAccessToken(token) as { id: string };

//     const user = await prisma.user.findUnique({
//       where: { id: decoded.id },
//     });

//     if (!user) {
//       return next(new ApiError(StatusCodes.UNAUTHORIZED, "User not found"));
//     }

//     if (!user.isActive) {
//       return next(new ApiError(StatusCodes.FORBIDDEN, "Account is disabled"));
//     }

//     req.user = {
//       id: user.id,
//       points: Number(user.points),
//       role: user.role,
//       username: user.username,
//       email: user.email,
//     };

//     next();
//   } catch (err) {
//     console.error("Authentication error:", err);

//     return next(
//       new ApiError(StatusCodes.UNAUTHORIZED, "Authentication failed"),
//     );
//   }
// };

// export default authenticate;
