import { AvailabilityDto } from "../dtos/availability.dto";
import { RestApiSetup } from "../config/restApiSetup";

export class ExternalService {
  private api: RestApiSetup;
  private baseURL: string;

  constructor() {
    this.baseURL = "http://localhost:5000";
    this.api = new RestApiSetup(this.baseURL);
  }

  async checkTeacherAvailabilities(
    availabilityIdsArray: string[]
  ): Promise<AvailabilityDto[]> {
    const availabilities = await this.api.post<AvailabilityDto[]>(
      "/availabilities/check",
      JSON.stringify({
        availabilityIds: availabilityIdsArray,
      })
    );
    return availabilities;
  }
}
