import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { appV1 } from "../app/app-v1";
import pinoHttp from "pino-http";
import crypto from "crypto";
import { logger } from "../utils/logger";
// Initialize event system
import "../events";
import { startEscalationCron } from "../background/escalation.cron";

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());

app.use(express.json());

app.use(
  pinoHttp({
    logger,
    genReqId: (req) =>
      (req.headers["x-request-id"] as string) || crypto.randomUUID(),
    customSuccessMessage: function (req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
  })
);

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    // JSON parsing error
    res.status(400).json({ error: "Invalid JSON" });
    return; // Stop execution after sending response
  }
  next(err); // Forward the error if it's not a JSON parsing error
});

app.use("/v1", appV1);

app.get("/", async (req: Request, res: Response) => {
  res.send("running !");
});

// global process-level safety nets
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled Promise Rejection");
});
process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught Exception");
});

app.listen(port, () => {
  logger.info({ port }, `Server running on http://localhost:${port}`);
  startEscalationCron();
});

export default app;
