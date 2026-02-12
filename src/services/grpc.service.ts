import * as grpc from '@grpc/grpc-js';
import { LoadProto } from '../config/grpc-setup';
import { GrpcClientOptions, HealthCheckRequest, HealthCheckResponse } from '../types';
import { GetUserByEmailRequest, GetUserRequest, GetUserTopicsRequest, MinimalUser, UserTopic } from '../types/user.types';
import { CheckAvailabilitiesRequest, CheckAvailabilitiesResponse, UpdateAvailabilitiesToUnavailableRequest, UpdateAvailabilitiesToUnavailableResponse } from '../types/availability.types';
import { ExternalService } from '../interfaces/external-service.interface';

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: grpc.status,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Proto loading with lazy initialization


export class GrpcExternalService implements ExternalService {
  private client: any;
  private deadline: number;
  private apiKey: string;
  private isInitialized: boolean = false;

  constructor(options: GrpcClientOptions = {}) {
    const {
      serverAddress = process.env.USER_SERVICE_URL || 'localhost:50051',
      //serverAddress = 'localhost:50051',
      apiKey = process.env.USER_SERVICE_API_KEY,
      deadline = 30000,
      useSecureCredentials = process.env.NODE_ENV === 'production'
    } = options;

    this.deadline = deadline;
    this.apiKey = apiKey || ''; // Allow empty initially, validate when methods are called

    // Initialize client lazily
    this.initializeClient(serverAddress, useSecureCredentials);
  }

  private async initializeClient(serverAddress: string, useSecureCredentials: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      const proto = await LoadProto();
      const credentials = useSecureCredentials
        ? grpc.credentials.createSsl()
        : grpc.credentials.createInsecure();

      this.client = new proto.UserService(serverAddress, credentials);
      this.isInitialized = true;
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to initialize gRPC client',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private createDeadline(): Date {
    return new Date(Date.now() + this.deadline);
  }

  private createMetadata(): grpc.Metadata {
    const metadata = new grpc.Metadata();
    metadata.add('x-api-key', this.apiKey);
    return metadata;
  }

  // Input validation helper
  private validateInput(value: any, fieldName: string, type: 'string' | 'number' | 'array'): void {
    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    switch (type) {
      case 'string':
        if (typeof value !== 'string' || value.trim() === '') {
          throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || value < 0) {
          throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
        }
        break;
      case 'array':
        if (!Array.isArray(value) || value.length === 0) {
          throw new ValidationError(`${fieldName} must be a non-empty array`, fieldName);
        }
        break;
    }
  }

  // Promisify gRPC calls with API key authentication and proper error handling
  private async promisifyCall<T>(method: string, request: any): Promise<T> {
    if (!this.apiKey) {
      throw new ValidationError('API key is required for gRPC calls', 'apiKey');
    }

    await this.initializeClient(process.env.USER_SERVICE_URL || 'localhost:50051', process.env.NODE_ENV === 'production');

    return new Promise((resolve, reject) => {
      const metadata = this.createMetadata();

      this.client[method](
        request,
        metadata,
        { deadline: this.createDeadline() },
        (error: grpc.ServiceError | null, response: T) => {
          if (error) {
            const serviceError = new ExternalServiceError(
              `gRPC call ${method} failed: ${error.message}`,
              error.code,
              error.details
            );
            reject(serviceError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Set a new API key
  setApiKey(apiKey: string): void {
    this.validateInput(apiKey, 'apiKey', 'string');
    this.apiKey = apiKey;
  }

  // Get current API key (for debugging - don't expose in production)
  getApiKey(): string {
    if (process.env.NODE_ENV === 'production') {
      return '[REDACTED]';
    }
    return this.apiKey.substring(0, 10) + '...';
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get single user by ID
  async getUser(userId: string): Promise<MinimalUser> {
    this.validateInput(userId, 'userId', 'string');

    try {
      const request: GetUserRequest = { user_id: userId };
      const response = await this.promisifyCall<MinimalUser>('GetUser', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to get user',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<MinimalUser> {
    this.validateInput(email, 'email', 'string');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    try {
      const request: GetUserByEmailRequest = { email };
      const response = await this.promisifyCall<MinimalUser>('GetUserByEmail', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to get user by email',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Get user topic by ID
  async getUserTopic(userTopicId: number): Promise<UserTopic> {
    this.validateInput(userTopicId, 'userTopicId', 'number');

    try {
      const request: GetUserTopicsRequest = { user_topic_id: userTopicId };
      const response = await this.promisifyCall<UserTopic>('GetUserTopic', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to get user topic',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Check availabilities by IDs
  async checkAvailabilities(availabilityIds: string[]): Promise<CheckAvailabilitiesResponse> {
    this.validateInput(availabilityIds, 'availabilityIds', 'array');

    try {
      const request: CheckAvailabilitiesRequest = { availabilityIds };
      const response = await this.promisifyCall<CheckAvailabilitiesResponse>('CheckAvailabilities', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to check availabilities',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Update availabilities to unavailable
  async updateAvailabilitiesToUnavailable(availabilities: { availabilityId: string, reservedUntil?: string }[]): Promise<UpdateAvailabilitiesToUnavailableResponse> {
    this.validateInput(availabilities, 'availabilities', 'array');

    try {
      const availabilityIds = availabilities.map(a => a.availabilityId);
      const request: UpdateAvailabilitiesToUnavailableRequest = { availabilityIds };
      const response = await this.promisifyCall<UpdateAvailabilitiesToUnavailableResponse>('UpdateAvailabilitiesToUnavailable', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to update availabilities to unavailable',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const request: HealthCheckRequest = {};
      const response = await this.promisifyCall<HealthCheckResponse>('HealthCheck', request);
      return response;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Health check failed',
        grpc.status.INTERNAL,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Close the client connection
  close(): void {
    if (this.client) {
      this.client.close();
      this.isInitialized = false;
    }
  }
}

