import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const defaultLogLevel = isProduction ? "warn" : "info";

export const logger = pino({
  level: process.env.LOG_LEVEL || defaultLogLevel,
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
  base: undefined,
});


