export interface ExternalService {
    getUser(userId: string): Promise<any>;
  
    getUserByEmail(email: string): Promise<any>;
  
    getUserTopic(userTopicId: number): Promise<any>;
  
    checkAvailabilities(availabilityIds: string[]): Promise<any>;

    updateAvailabilitiesToUnavailable(availabilityIds: string[]): Promise<any>;

    healthCheck(): Promise<any>;
  }
  