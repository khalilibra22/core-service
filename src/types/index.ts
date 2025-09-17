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