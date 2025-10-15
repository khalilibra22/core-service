export interface HealthCheckRequest {}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}

export interface GrpcClientOptions {
    serverAddress?: string;
    apiKey?: string;
    deadline?: number;
    useSecureCredentials?: boolean;
  }

// Augment IncomingMessage to include pino-http logger instance
declare module "http" {
  interface IncomingMessage {
    log: import("pino").Logger;
  }
}