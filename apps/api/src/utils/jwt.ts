import jwt, { JwtPayload } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded === "string" ||
    !decoded ||
    typeof (decoded as JwtPayload).userId !== "string" ||
    !Object.values(Role).includes((decoded as JwtPayload).role as Role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: (decoded as JwtPayload).userId as string,
    role: (decoded as JwtPayload).role as Role,
  };
}