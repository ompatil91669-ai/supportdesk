import { Response } from "express";

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200
): void {
  res.status(statusCode).json({
    data,
    error: null,
    meta: {},
  });
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string
): void {
  res.status(statusCode).json({
    data: null,
    error: {
      code,
      message,
    },
    meta: {},
  });
}
