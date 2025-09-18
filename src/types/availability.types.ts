export interface Availability {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    isActive: boolean;
    isFree: boolean;
  }
  
  export interface CheckAvailabilitiesResponse {
    availabilities: Availability[];
  }
  
  export interface UpdateAvailabilitiesToUnavailableResponse {
    message: string;
    updatedCount: number;
    requestedCount: number;
  }

  export interface UpdateAvailabilitiesToUnavailableRequest {
    availabilityIds: string[];
  }

  export interface CheckAvailabilitiesRequest {
    availabilityIds: string[];
  }