import { RestApiSetup } from "../config/rest-api-setup";
import { logger } from "../utils/logger";
import { ExternalService } from "../interfaces/external-service.interface";

export class HttpService implements ExternalService {
    private httpClient: RestApiSetup;
    private baseURL: string;
    private chatHttpClient: RestApiSetup;
    private chatBaseURL: string;

    constructor() {
        try {
            this.baseURL = (process.env.USER_SERVICE_URL || 'http://localhost:5000/v1') + '/inbounds';
            this.httpClient = new RestApiSetup(`${this.baseURL}`);
            this.chatBaseURL = process.env.CHAT_SERVICE_URL || 'http://localhost:5002/v1';
            this.chatHttpClient = new RestApiSetup(this.chatBaseURL);
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

    async getTopic(topicId: number): Promise<any> {
        try {
            if (!topicId || typeof topicId !== 'number' || topicId <= 0) {
                throw new Error('Invalid topicId provided');
            }
            // inbounds/topics/id
            const response = await this.httpClient.get(`${this.baseURL}/topics/${topicId}`);
            return response.data;
        } catch (error: any) {
            logger.error({ err: error, topicId }, 'Failed to get topic');
            if (error?.response?.status === 404) {
                throw new Error(`Topic with ID ${topicId} not found`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to get topic: ${error?.message || error}`);
        }
    }

    async getSubject(subjectId: number): Promise<any> {
        try {
            if (!subjectId || typeof subjectId !== 'number' || subjectId <= 0) {
                throw new Error('Invalid subjectId provided');
            }
            // inbounds/subjects/id
            const response = await this.httpClient.get(`${this.baseURL}/subjects/${subjectId}`);
            return response.data;
        } catch (error: any) {
            logger.error({ err: error, subjectId }, 'Failed to get subject');
            if (error?.response?.status === 404) {
                throw new Error(`Subject with ID ${subjectId} not found`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to get subject: ${error?.message || error}`);
        }
    }

    async initiatePayment(payload: any): Promise<{ transactionId: string; paymentUrl?: string; message?: string }> {
        try {
            const response = await this.httpClient.post(`/payments/initiate`, payload);
            return response.data as { transactionId: string; paymentUrl?: string; message?: string };
        } catch (error) {
            logger.error({ err: error }, "Failed to initiate payment via user-service");
            throw error;
        }
    }

    async checkAvailabilities(availabilityIds: string[], allowUnavailable?: boolean): Promise<any> {
        try {
            const response = await this.httpClient.post(`${this.baseURL}/availabilities/check`, {
                availabilityIds: availabilityIds,
                allowUnavailable: allowUnavailable
            });
            return response.data;
        } catch (error: any) {
            logger.error({ err: error, responseData: error?.response?.data }, 'Failed to check availabilities');
            if (error?.response?.status >= 500) {
                throw new Error(`User service is currently unavailable`);
            }
            throw new Error(`Failed to check availabilities: ${error?.message || error}`);
        }
    }

    async updateAvailabilitiesToUnavailable(availabilities: { availabilityId: string, reservedUntil?: string }[]): Promise<any> {
        try {
            if (!Array.isArray(availabilities) || availabilities.length === 0) {
                throw new Error('Invalid availabilities provided - must be a non-empty array');
            }
            const payload = availabilities.map(a => ({
                id: a.availabilityId.trim(),
                reservedUntil: a.reservedUntil
            }));
            return await this.httpClient.put(`${this.baseURL}/availabilities/update-to-unavailable`, { availabilityIds: payload });
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

    async createChatGroup(payload: { name?: string | null; type?: string | null; ownerId?: string | null; members?: string[]; profilePicture?: string }): Promise<string | null> {
        const safePayload: any = {
            name: payload?.name?.trim(),
            groupType: payload?.type,
            userId: payload?.ownerId?.trim(),
        };

        if (payload?.profilePicture) {
            safePayload.profilePicture = payload.profilePicture;
        }

        // Add members array if provided and valid
        if (payload?.members && Array.isArray(payload.members) && payload.members.length > 0) {
            safePayload.members = payload.members;
        }
        try {
            if (!safePayload.name || !safePayload.groupType || !safePayload.userId) {
                throw new Error('Invalid chat group payload');
            }

            const response = await this.chatHttpClient.post(`/groups`, safePayload);
            const groupId = (response?.data as { id: string })?.id;
            if (!groupId) {
                throw new Error('Chat group creation response missing group id');
            }
            return `${groupId}`;
        } catch (error: any) {
            logger.error({ err: error, payload: safePayload }, 'Failed to create chat group');
            return null;
        }
    }

    async joinChatGroup(groupId: string, studentId: string): Promise<boolean> {
        try {
            if (!groupId || typeof groupId !== 'string') {
                throw new Error('Invalid groupId provided');
            }
            if (!studentId || typeof studentId !== 'string') {
                throw new Error('Invalid studentId provided');
            }

            const response = await this.chatHttpClient.post(`/groups/${groupId}/join`, { userId: studentId });
            return true;
        } catch (error: any) {
            logger.error({ err: error, groupId, studentId }, 'Failed to join chat group');
            if (error?.response?.status === 404) {
                throw new Error(`Chat group with ID ${groupId} not found`);
            }
            if (error?.response?.status === 409) {
                throw new Error(`User is already a member of this chat group`);
            }
            if (error?.response?.status >= 500) {
                throw new Error(`Chat service is currently unavailable`);
            }
            throw new Error(`Failed to join chat group: ${error?.message || error}`);
        }
    }
}