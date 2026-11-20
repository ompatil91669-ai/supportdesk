
import { errorHandler } from "../src/middleware/errorHandler";
import { Request, Response, NextFunction } from "express";

let capturedStatus = 200;
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

const next = (() => {}) as NextFunction;

const internalError = new Error("Database password or internal details");

errorHandler(internalError, req, res, next);

console.log("HTTP Status:", capturedStatus);
console.log("Response:", JSON.stringify(capturedBody, null, 2));
