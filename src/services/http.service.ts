import { RestApiSetup } from "../config/rest-api-setup";
import { logger } from "../utils/logger";
import { ExternalService } from "../interfaces/external-service.interface";

export class HttpService implements ExternalService {
    private httpClient: RestApiSetup;
    private baseURL: string;
    
    constructor() {
        try {
            this.baseURL = (process.env.USER_SERVICE_URL || 'http://localhost:5000/v1')+'/inbounds';
            this.httpClient = new RestApiSetup(`${this.baseURL}`);
            //this.httpClient.setAuthToken(process.env.USER_SERVICE_API_KEY || 'default-api-key-for-development');
        } catch (error) {
            logger.error({ err: error }, 'HttpService initialization failed');
            throw new Error(`HttpService initialization failed: ${error}`);
        }
    }

    async getUser(userId: string): Promise<any> {
        try {
            if (!userId || typeof userId !== 'string') {
                throw new Error('Invalid userId provided');
            }
            const response = await this.httpClient.get(`${this.baseURL}/users/${userId}/minimal`);
            return response.data;
        } catch (error: any) {
            logger.error({ err: error, userId }, 'Failed to get user');
            if (error?.response?.status === 404) {
                throw new Error(`User with ID ${userId} not found`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to get user: ${error?.message || error}`);
        }
    }

    async getUserByEmail(email: string): Promise<any> {
        try {
            if (!email || typeof email !== 'string') {
                throw new Error('Invalid email provided');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
            return await this.httpClient.get(`${this.baseURL}/users/email/${email.trim()}`);
        } catch (error: any) {
            logger.error({ err: error, email }, 'Failed to get user by email');
            if (error?.response?.status === 404) {
                throw new Error(`User with email ${email} not found`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to get user by email: ${error?.message || error}`);
        }
    }

    async getUserTopic(userTopicId: number): Promise<any> {
        try {
            if (!userTopicId || typeof userTopicId !== 'number' || userTopicId <= 0) {
                throw new Error('Invalid userTopicId provided');
            }
            const response = await this.httpClient.get(`${this.baseURL}/users/topics/${userTopicId}`);
            return response.data;
        } catch (error: any) {
            logger.error({ err: error, userTopicId }, 'Failed to get user topic');
            if (error?.response?.status === 404) {
                throw new Error(`User topic with ID ${userTopicId} not found`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to get user topic: ${error?.message || error}`);
        }
    }

    async checkAvailabilities(availabilityIds: string[]): Promise<any> {
        try {
            const response = await this.httpClient.post(`${this.baseURL}/availabilities/check`, { availabilityIds: availabilityIds });
            return response.data;
        } catch (error: any) {
            logger.error({ err: error }, 'Failed to check availabilities');
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to check availabilities: ${error?.message || error}`);
        }
    }

    async updateAvailabilitiesToUnavailable(availabilityIds: string[]): Promise<any> {
        try {
            if (!Array.isArray(availabilityIds) || availabilityIds.length === 0) {
                throw new Error('Invalid availabilityIds provided - must be a non-empty array');
            }
            const invalidIds = availabilityIds.filter(id => !id || typeof id !== 'string');
            if (invalidIds.length > 0) {
                throw new Error('Invalid availability IDs found in array');
            }
            return await this.httpClient.put(`${this.baseURL}/availabilities/update-to-unavailable`, { availabilityIds: availabilityIds.map(id => id.trim()) });
        } catch (error: any) {
            logger.error({ err: error }, 'Failed to update availabilities to unavailable');
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to update availabilities: ${error?.message || error}`);
        }
    }

    async healthCheck(): Promise<any> {
        try {
            return await this.httpClient.get(`/health`);
        } catch (error: any) {
            logger.error({ err: error }, 'Health check failed');
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Health check failed: ${error?.message || error}`);
        }
    }
}