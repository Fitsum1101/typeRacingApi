import type { Request, Response, NextFunction, RequestHandler } from "express";
import Joi, { type Schema } from "joi";
import lodash from "lodash";
import { StatusCodes } from "http-status-codes";

const { pick } = lodash;
import { ApiError } from "../utils/apiError";

/**
 * Validation middleware factory function
 * Creates a middleware that validates request data against the provided schema
 *
 * @param schema - Joi validation schema with optional body, params, and query keys
 * @returns Express middleware function
 */
interface ValidationSchema {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

interface JoiErrorDetail {
  field: string;
  message: string;
  type: string;
}

const validate = (schema: ValidationSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const object = pick(req, Object.keys(validSchema));

    const {
      value,
      error,
    }: {
      value: Record<string, unknown>;
      error: Joi.ValidationError | undefined;
    } = Joi.compile(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorDetails: JoiErrorDetail[] = error.details.map((err: Joi.ValidationErrorItem) => {
        const pathParts = err.path.slice(1);
        const field = pathParts.length > 0 ? pathParts.join(".") : err.context?.key || "unknown";

        return {
          field,
          message: err.message.replace(/['"]/g, ""),
          type: err.type,
        };
      });

      return next(new ApiError(StatusCodes.BAD_REQUEST, "Validation failed", errorDetails));
    }

    Object.keys(value).forEach((key) => {
      if (value[key]) {
        Object.assign(req[key as keyof typeof req], value[key]);
      }
    });

    return next();
  };
};

export default validate;