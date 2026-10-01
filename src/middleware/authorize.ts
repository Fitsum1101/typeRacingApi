// import type { RequestHandler } from "express";
// import { StatusCodes } from "http-status-codes";

// import type { AuthenticatedRequest } from "../types/authMiddleare";
// import { ApiError } from "../utils/apiError";
// import type { UserRole } from "../generated/prisma/enums";

// export const authorize = (roles: UserRole[]): RequestHandler => {
//   return (req: AuthenticatedRequest, _res, next) => {
//     const user = req.user;

//     if (!user || !roles.includes(user.role)) {
//       return next(
//         new ApiError(
//           StatusCodes.UNAUTHORIZED,
//           "Authentication required or insufficient permissions",
//         ),
//       );
//     }

//     next();
//   };
// };
