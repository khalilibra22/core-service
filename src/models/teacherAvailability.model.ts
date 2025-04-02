export class TeacherAvailability {
  id?: string; // Unique identifier for the availability record
  teacherId?: string; // ID of the associated teacher
  startTime?: Date; // Start time of the availability period
  endTime?: Date; // End time of the availability period
  isAvailable?: boolean; // Indicates if the teacher is available during this period
  createdAt?: Date; // Date when the availability record was created
  updatedAt?: Date; // Date when the availability record was last updated
  deletedAt?: Date; // Soft delete column
}
