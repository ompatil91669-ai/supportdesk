
import { NextFunction, Request, Response } from "express";
import { AppError, errorHandler } from "../src/middleware/errorHandler";

describe("errorHandler", () => {
  let capturedStatus: number;
  let capturedBody: unknown;

  const req = {} as Request;
  const res = {
    status(code: number) {
      capturedStatus = code;
      return this;
    },
    json(body: unknown) {
      capturedBody = body;
      return this;
    },
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    capturedStatus = 200;
    capturedBody = undefined;
  });

  it("preserves the status and envelope for known application errors", () => {
    errorHandler(
      new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered"),
      req,
      res,
      next
    );

    expect(capturedStatus).toBe(409);
    expect(capturedBody).toEqual({
      data: null,
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email is already registered",
      },
      meta: {},
    });
  });

  it("returns a generic response and logs unexpected errors", () => {
    const logError = jest.spyOn(console, "error").mockImplementation(() => {});
    const internalError = new Error("Database password or internal details");

    try {
      errorHandler(internalError, req, res, next);

      expect(capturedStatus).toBe(500);
      expect(capturedBody).toEqual({
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
        meta: {},
      });
      expect(JSON.stringify(capturedBody)).not.toContain("Database password");
      expect(logError).toHaveBeenCalledWith(
        "Unexpected server error:",
        internalError
      );
    } finally {
      logError.mockRestore();
    }
  });
});
