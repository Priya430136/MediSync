export type UserRole = "patient" | "doctor" | "admin" | "hospital" | "user";

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  leaveDate: string; // YYYY-MM-DD
  reason?: string;
  status: "pending" | "approved" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface SlotHold {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  holdToken: string;
  patientName: string;
  patientEmail: string;
  expiresAt: number; // timestamp ms
  createdAt: number;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialisation: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  avatar: string;
  bio: string;
  workingHours: { start: string; end: string };
  breakHours: { start: string; end: string };
  slotDurationMinutes: number;
  availableDays: string[];
  leaveDates: string[];
  rating: number;
  reviewsCount: number;
  hospitalAffiliation: string;
  roomNumber: string;
  active: boolean;
}

export interface Slot {
  startTime: string;
  endTime: string;
  status: "available" | "held" | "booked";
  holdToken: string | null;
  holdRemainingSeconds: number;
}

export interface PreVisitAISummary {
  urgencyLevel: "Low" | "Medium" | "High";
  chiefComplaint: string;
  suggestedQuestions: string[];
  generatedAt: string;
  model: string;
  status: "success" | "failed" | "fallback";
  isFallback: boolean;
  disclaimer: string;
  errorMessage?: string;
  errorType?: "TIMEOUT" | "RATE_LIMIT" | "MALFORMED_JSON" | "MISSING_FIELDS" | "API_FAILURE" | "API_KEY_MISSING" | "UNKNOWN";
  rawSymptomsAnalyzed?: string;
  possibleCauses?: string[];
  recommendedTests?: string[];
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timing: "Before Meals" | "After Meals" | "With Meals" | "As Needed" | "Bedtime";
  durationDays: number;
  duration?: string; // e.g. "5 days"
  instructions: string;
}

export interface PostVisitAISummary {
  patientFriendlySummary: string; // Simple explanation
  medicationSchedule: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    timing?: string;
    instructions?: string;
    duration: string;
  }>;
  followUpSteps: string[]; // Follow-up steps
  importantInstructions: string[]; // Important instructions & precautions
  warningSigns?: string[];
  nextVisitRecommendation?: string;
  generatedAt: string;
  model: string;
  status?: "success" | "failed" | "fallback" | "pending";
  isFallback?: boolean;
  errorMessage?: string;
  errorType?: "TIMEOUT" | "RATE_LIMIT" | "MALFORMED_JSON" | "MISSING_FIELDS" | "API_FAILURE" | "API_KEY_MISSING" | "UNKNOWN";
}

export interface RescheduleRecord {
  fromDoctorId: string;
  fromDoctorName: string;
  fromDate: string;
  fromStartTime: string;
  toDoctorId: string;
  toDoctorName: string;
  toDate: string;
  toStartTime: string;
  rescheduledAt: string;
  rescheduledBy?: string;
  reason?: string;
}

export interface LeaveConflictDetails {
  leaveDate: string;
  reason: string;
  recordedAt: string;
  originalStartTime: string;
  originalEndTime: string;
}

export interface Appointment {
  id: string;
  bookingReference: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialisation: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled" | "rescheduling_required";
  cancellationReason?: string;
  leaveConflictDetails?: LeaveConflictDetails;
  rescheduleHistory?: RescheduleRecord[];
  symptoms: string;
  symptomDuration: string;
  medicalHistory?: string;
  allergies?: string;
  preVisitAISummary?: PreVisitAISummary;
  diagnosis?: string;
  clinicalNotes?: string;
  followUpInstructions?: string;
  submittedAt?: string;
  submittedByDoctorId?: string;
  vitals?: {
    bp?: string;
    heartRate?: string;
    temperature?: string;
    spo2?: string;
  };
  prescriptions?: PrescriptionItem[];
  postVisitAISummary?: PostVisitAISummary;
  googleCalendarEventId?: string;
  googleCalendarLink?: string;
  patientCalendarEventId?: string;
  doctorCalendarEventId?: string;
  patientCalendarStatus?: "synced" | "failed" | "not_connected" | "retrying";
  doctorCalendarStatus?: "synced" | "failed" | "not_connected" | "retrying";
  calendarSyncError?: string;
  calendarLastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GoogleCalendarAccount {
  id: string;
  userId: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  status: "connected" | "disconnected" | "expired" | "error";
  scope: string;
  calendarId?: string;
  syncEnabled: boolean;
  connectedAt: string;
  lastSyncedAt?: string;
  lastRefreshedAt?: string;
  expiresAt?: number;
  isExpired?: boolean;
  lastError?: string;
}

export interface GoogleCalendarEventRecord {
  id: string;
  appointmentId: string;
  bookingReference: string;
  recipientEmail: string;
  recipientRole: "patient" | "doctor";
  googleEventId: string;
  htmlLink?: string;
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  status: "created" | "updated" | "deleted" | "failed" | "retrying";
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface GoogleCalendarTestResult {
  testId: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
  checks: Array<{ check: string; passed: boolean; details?: string }>;
}

export interface GoogleCalendarTestReport {
  success: boolean;
  allTestsPassed: boolean;
  summary: string;
  timestamp: string;
  results: GoogleCalendarTestResult[];
}


export type NotificationType = 
  | "BOOKING_CONFIRMATION" 
  | "APPOINTMENT_REMINDER" 
  | "APPOINTMENT_CANCELLED" 
  | "DOCTOR_LEAVE_ALERT" 
  | "APPOINTMENT_RESCHEDULED"
  | "POST_VISIT_SUMMARY_READY" 
  | "MEDICATION_REMINDER";

export type EmailDeliveryStatus = "queued" | "sending" | "sent" | "delivered" | "failed" | "retrying";

export interface EmailNotificationRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: "patient" | "doctor" | "admin";
  type: NotificationType;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: EmailDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  deduplicationKey?: string;
  jobId?: string;
  appointmentId?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: "patient" | "doctor" | "admin";
  type: NotificationType;
  subject: string;
  message: string;
  htmlBody?: string;
  status: "sent" | "queued" | "failed" | "retrying" | "delivered";
  deliveryStatus?: EmailDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  deduplicationKey?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  metadata?: Record<string, any>;
}

export interface MedicationReminder {
  id: string;
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timeSlot: string;
  scheduledTime: string;
  status: "scheduled" | "sent" | "delivered" | "taken" | "skipped" | "missed" | "failed" | "retrying";
  date: string;
  instructions: string;
  deduplicationKey: string;
  jobId?: string;
  sentAt?: string;
  deliveredAt?: string;
  takenAt?: string;
  skippedAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type JobType = 
  | "MEDICATION_REMINDER"
  | "GENERATE_MEDICATION_REMINDERS"
  | "EMAIL_NOTIFICATION"
  | "SMS_NOTIFICATION"
  | "APPOINTMENT_REMINDER"
  | "POST_VISIT_AI_SUMMARY"
  | "GENERIC_ASYNC_TASK";

export type JobStatus = "pending" | "scheduled" | "processing" | "completed" | "failed" | "retrying" | "cancelled";

export interface BackgroundJob {
  id: string;
  type: JobType;
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  backoffDelayMs: number;
  nextRunAt: string;
  lastRunAt?: string;
  completedAt?: string;
  lastError?: string;
  errorLog: Array<{ timestamp: string; error: string; attempt: number }>;
  deduplicationKey?: string;
  createdAt: string;
  updatedAt: string;
}

