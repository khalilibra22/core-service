export class SessionTimeChangeRequest {
  id?: string; // Unique identifier for the session time change request
  sessionId?: string; // ID of the associated session
  requestedTime?: Date; // Requested new time for the session
  status?: string; // Status of the request (e.g., pending, approved, rejected)
  userId?: string; // ID of the user who made the request (teacher or student)
  reason?: string; // Reason for the time change request
  createdAt?: Date; // Date when the request was created
  updatedAt?: Date; // Date when the request was last updated
  deletedAt?: Date; // Soft delete column
}
