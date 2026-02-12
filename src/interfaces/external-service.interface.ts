export interface ExternalService {
  getUser(userId: string): Promise<any>;

  getUserByEmail(email: string): Promise<any>;

  getUserTopic(userTopicId: number): Promise<any>;

  checkAvailabilities(availabilityIds: string[], allowUnavailable?: boolean): Promise<any>;

  updateAvailabilitiesToUnavailable(availabilities: { availabilityId: string, reservedUntil?: string }[]): Promise<any>;

  healthCheck(): Promise<any>;
}
