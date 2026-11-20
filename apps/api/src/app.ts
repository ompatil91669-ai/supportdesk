
import "./config/env";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import ticketRoutes from "./routes/ticket.routes";
import authRoutes from "./routes/auth.routes";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { successResponse } from "./utils/response";
import { createSwaggerDocument } from "./docs/swagger";

const app = express();

// Security headers
app.use(helmet());

// Allow requests from approved frontend origins
const allowedOrigins = [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new AppError(
            403,
            "CORS_NOT_ALLOWED",
            "Origin not allowed"
          )
        );
      }
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests
app.use(express.json({ limit: "100kb" }));

// Request logger
app.use(requestLogger);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  successResponse(res, { status: "ok" });
});

const swaggerDocument = createSwaggerDocument();

app.get("/docs/openapi.json", (_req: Request, res: Response) => {
  res.json(swaggerDocument);
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// API routes
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// Handle unknown routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      "Route not found"
    )
  );
});

// Central error handler
app.use(errorHandler);

export default app;
