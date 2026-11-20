import "./config/env";
import express, { Request, Response, NextFunction } from "express";
import ticketRoutes from "./routes/ticket.routes";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { successResponse } from "./utils/response";

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req: Request, res: Response) => {
  successResponse(res, { status: "ok" });
});

app.use("/tickets", ticketRoutes);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Route not found"));
});

app.use(errorHandler);

export default app;
