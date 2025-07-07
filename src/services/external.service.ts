import { AvailabilityDto } from "../dtos/availability.dto";
import { RestApiSetup } from "../config/restApiSetup";

export class ExternalService {
  private api: RestApiSetup;
  private baseURL: string;

  constructor() {
    this.baseURL = "https://user-service-0u8y.onrender.com";
    this.api = new RestApiSetup(this.baseURL);
  }

  async checkTeacherAvailabilities(
    availabilityIdsArray: string[]
  ): Promise<AvailabilityDto[]> {
    try {
      const response = await this.api.post<AvailabilityDto[]>(
        "/availabilities/check",
        JSON.stringify({
          availabilityIds: availabilityIdsArray,
        })
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch availabilities");
      }

      return response.data;
    } catch (error) {
      throw new Error("Some availabilities are not available");
    }
  }

  async updateAvailabilitiesStatus(availabilityIds: string[]): Promise<void> {
    try {
      const response = await this.api.patch(
        "/availabilities/bulk-unavailable",
        JSON.stringify({
          availabilityIds,
        })
      );
      if (response.status !== 200) {
        throw new Error("Failed to update availabilities status");
      }
    } catch (error) {
      throw new Error("Failed to update availabilities status");
    }
  }
}
