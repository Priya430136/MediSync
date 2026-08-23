import { Doctor, Slot, Appointment, PreVisitAISummary, PostVisitAISummary, NotificationRecord, MedicationReminder, BackgroundJob, EmailNotificationRecord, NotificationType } from "@/types/appointment";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    // Check localStorage auth session
    const storedSession = localStorage.getItem("rapidresq_auth_session");
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (parsed?.access_token) {
        headers["Authorization"] = `Bearer ${parsed.access_token}`;
        return headers;
      }
    }
  } catch (e) {
    console.warn("Could not read auth token from localStorage", e);
  }

  return headers;
}

export const API = {
  // Doctors Directory & Management
  async getDoctors(specialisation?: string, search?: string, activeOnly = false): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (specialisation) params.append("specialisation", specialisation);
    if (search) params.append("search", search);
    if (activeOnly) params.append("activeOnly", "true");
    const res = await fetch(`/api/doctors?${params.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async getDoctor(id: string): Promise<Doctor | null> {
    const res = await fetch(`/api/doctors/${id}`);
    const json = await res.json();
    return json.data || null;
  },

  async createDoctor(data: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create doctor profile");
    return json.data;
  },

  async updateDoctor(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch(`/api/doctors/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update doctor profile");
    return json.data;
  },

  async deleteDoctor(id: string): Promise<void> {
    const res = await fetch(`/api/doctors/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete doctor profile");
  },

  // Doctor Leave Management
  async markDoctorLeave(id: string, date: string, reason?: string) {
    const res = await fetch(`/api/doctors/${id}/leave`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to mark doctor leave");
    return json;
  },

  async getDoctorLeaves(id: string): Promise<{ doctorId: string; leaveDates: string[]; records: any[] }> {
    const res = await fetch(`/api/doctors/${id}/leaves`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to fetch doctor leaves");
    return json.data || { doctorId: id, leaveDates: [], records: [] };
  },

  async removeDoctorLeave(id: string, date: string): Promise<{ success: boolean; message: string; leaveDates: string[] }> {
    const res = await fetch(`/api/doctors/${id}/leave/${date}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to cancel doctor leave");
    return json;
  },

  // Slots Calculation & Live Hold Mechanism
  async getSlots(doctorId: string, date: string): Promise<{ slots: Slot[]; status: string; dayName: string; doctor?: any }> {
    const res = await fetch(`/api/slots?doctorId=${doctorId}&date=${date}`);
    const json = await res.json();
    return {
      slots: json.slots || [],
      status: json.status || "available",
      dayName: json.dayName || "",
      doctor: json.doctor,
    };
  },

  async holdSlot(data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    patientName: string;
    patientEmail: string;
  }): Promise<{ holdToken: string; expiresAt: number; ttlSeconds: number }> {
    const res = await fetch("/api/slots/hold", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || "Failed to hold slot") as any;
      err.code = json.code;
      err.remainingSeconds = json.remainingSeconds;
      throw err;
    }
    return json;
  },

  async releaseHold(holdToken: string): Promise<void> {
    await fetch("/api/slots/release-hold", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ holdToken }),
    });
  },

  // AI Summaries
  async getPreVisitAISummary(symptoms: string, history?: string, allergies?: string): Promise<PreVisitAISummary> {
    const res = await fetch("/api/ai/pre-visit-summary", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ symptoms, history, allergies }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to generate AI pre-visit summary");
    return json.data;
  },

  async getPostVisitAISummary(diagnosis: string, clinicalNotes: string, prescriptions: any[]): Promise<PostVisitAISummary> {
    const res = await fetch("/api/ai/post-visit-summary", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ diagnosis, clinicalNotes, prescriptions }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to generate AI post-visit summary");
    return json.data;
  },

  // Appointments
  async getAppointments(filters?: { patientEmail?: string; doctorId?: string; status?: string; date?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.patientEmail) params.append("patientEmail", filters.patientEmail);
    if (filters?.doctorId) params.append("doctorId", filters.doctorId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.date) params.append("date", filters.date);

    const res = await fetch(`/api/appointments?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async getAppointment(id: string): Promise<Appointment | null> {
    const res = await fetch(`/api/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || null;
  },

  async bookAppointment(data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientAge: number;
    patientGender: string;
    symptoms: string;
    symptomDuration: string;
    medicalHistory?: string;
    allergies?: string;
    holdToken?: string;
    preVisitAISummary?: PreVisitAISummary;
  }): Promise<Appointment> {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || "Booking failed") as any;
      err.code = json.code;
      err.conflictDetails = json.conflictDetails;
      throw err;
    }
    return json.data;
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update appointment");
    return json.data;
  },

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to cancel appointment");
    return json.data;
  },

  async rescheduleAppointment(id: string, data: {
    newDate: string;
    newStartTime: string;
    newEndTime?: string;
    newDoctorId?: string;
    reason?: string;
    patientEmail?: string;
  }): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}/reschedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || "Failed to reschedule appointment") as any;
      err.code = json.code;
      throw err;
    }
    return json.data;
  },

  // Reminders
  async getReminders(patientEmail?: string): Promise<MedicationReminder[]> {
    const params = new URLSearchParams();
    if (patientEmail) params.append("patientEmail", patientEmail);
    const res = await fetch(`/api/reminders?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async updateReminderStatus(id: string, status: "scheduled" | "taken" | "skipped"): Promise<MedicationReminder> {
    const res = await fetch(`/api/reminders/${id}/status`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return json.data;
  },

  // Notifications Queue
  async getNotificationQueue(): Promise<NotificationRecord[]> {
    const res = await fetch("/api/notifications/queue", {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async retryNotification(notificationId: string): Promise<NotificationRecord> {
    const res = await fetch("/api/notifications/retry", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notificationId }),
    });
    const json = await res.json();
    return json.data;
  },

  // Automated Availability & Concurrency Testing
  async runDoctorAvailabilityTest() {
    const res = await fetch("/api/system/test-doctor-availability", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  async runConcurrencyTest(doctorId?: string, date?: string, startTime?: string) {
    const res = await fetch("/api/system/concurrency-test", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ doctorId, date, startTime }),
    });
    return await res.json();
  },

  async regeneratePreVisitAISummary(id: string): Promise<{ summary: PreVisitAISummary; appointment: Appointment }> {
    const res = await fetch(`/api/appointments/${id}/regenerate-ai-summary`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to regenerate AI summary");
    return { summary: json.data, appointment: json.appointment };
  },

  async getAITechnicalLogs() {
    const res = await fetch("/api/ai/technical-logs", {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async runLeaveWorkflowTest() {
    const res = await fetch("/api/system/test-leave-workflow", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  async submitPostVisitNotes(id: string, data: {
    clinicalNotes: string;
    prescriptions: PrescriptionItem[];
    followUpInstructions?: string;
    diagnosis?: string;
    vitals?: { bp?: string; heartRate?: string; temperature?: string; spo2?: string };
  }): Promise<{ data: Appointment; aiGenerated: boolean; message: string }> {
    const res = await fetch(`/api/appointments/${id}/post-visit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to submit post-visit consultation notes");
    return json;
  },

  async regeneratePostVisitAISummary(id: string): Promise<{ summary: PostVisitAISummary; appointment: Appointment }> {
    const res = await fetch(`/api/appointments/${id}/regenerate-post-visit-summary`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to regenerate post-visit AI summary");
    return { summary: json.data, appointment: json.appointment };
  },

  async runPostVisitWorkflowTest() {
    const res = await fetch("/api/system/test-post-visit-workflow", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  async runAISymptomWorkflowTest() {
    const res = await fetch("/api/system/test-ai-symptom-workflow", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  // Background Jobs & Asynchronous Engine
  async getBackgroundJobs(filters?: { type?: string; status?: string; patientEmail?: string }): Promise<BackgroundJob[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.patientEmail) params.append("patientEmail", filters.patientEmail);
    const res = await fetch(`/api/background-jobs?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async retryBackgroundJob(jobId: string): Promise<BackgroundJob> {
    const res = await fetch(`/api/background-jobs/${jobId}/retry`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to retry background job");
    return json.data;
  },

  async runBackgroundWorkerTick(): Promise<{ processedCount: number; jobs: BackgroundJob[] }> {
    const res = await fetch("/api/background-jobs/run-worker-tick", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to trigger background worker tick");
    return json;
  },

  async retryReminder(reminderId: string): Promise<MedicationReminder> {
    const res = await fetch(`/api/reminders/${reminderId}/retry`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to retry medication reminder");
    return json.data;
  },

  async generateAppointmentReminders(appointmentId: string): Promise<{ createdCount: number; duplicatesPrevented: number; reminders: MedicationReminder[] }> {
    const res = await fetch(`/api/reminders/generate-for-appointment/${appointmentId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to generate appointment reminders");
    return json;
  },

  async runBackgroundJobsTest() {
    const res = await fetch("/api/system/test-background-jobs", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  // Email Notification System Methods
  async getEmails(filters?: { status?: string; recipientEmail?: string; type?: string; appointmentId?: string }): Promise<EmailNotificationRecord[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.recipientEmail) params.append("recipientEmail", filters.recipientEmail);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.appointmentId) params.append("appointmentId", filters.appointmentId);
    const res = await fetch(`/api/emails?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async getEmail(id: string): Promise<EmailNotificationRecord | null> {
    const res = await fetch(`/api/emails/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || null;
  },

  async retryEmail(id: string): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`/api/emails/${id}/retry`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to retry email delivery");
    return json;
  },

  async previewEmailTemplate(type: NotificationType, role: "patient" | "doctor" = "patient"): Promise<{ subject: string; html: string; text: string }> {
    const params = new URLSearchParams({ type, role });
    const res = await fetch(`/api/emails/templates/preview?${params.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async sendTestEmail(payload: { recipientEmail?: string; recipientName?: string; type?: NotificationType; simulateFailure?: boolean }) {
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async sendAppointmentReminder(appointmentId: string, hoursUntil = 24) {
    const res = await fetch(`/api/appointments/${appointmentId}/send-reminder`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ hoursUntil }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send appointment reminder");
    return json;
  },

  async runEmailNotificationTest() {
    const res = await fetch("/api/system/test-email-notifications", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  // Google Calendar Integration
  async getCalendarStatus(email?: string) {
    const params = new URLSearchParams();
    if (email) params.append("email", email);
    const res = await fetch(`/api/calendar/status?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  async connectCalendar(payload: {
    email: string;
    role?: "patient" | "doctor" | "admin";
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    userId?: string;
  }) {
    const res = await fetch("/api/calendar/connect", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to connect Google Calendar");
    return json;
  },

  async disconnectCalendar(email: string) {
    const res = await fetch("/api/calendar/disconnect", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to disconnect Google Calendar");
    return json;
  },

  async getCalendarAccounts() {
    const res = await fetch("/api/calendar/accounts", {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async getCalendarEvents(params?: { appointmentId?: string; recipientEmail?: string; status?: string }) {
    const sp = new URLSearchParams();
    if (params?.appointmentId) sp.append("appointmentId", params.appointmentId);
    if (params?.recipientEmail) sp.append("recipientEmail", params.recipientEmail);
    if (params?.status) sp.append("status", params.status);
    const res = await fetch(`/api/calendar/events?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async syncCalendarEvent(appointmentId: string, simulateFailure = false) {
    const res = await fetch(`/api/calendar/sync/${appointmentId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ simulateFailure }),
    });
    const json = await res.json();
    return json;
  },

  async refreshCalendarToken(email: string) {
    const res = await fetch("/api/calendar/refresh-token", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to refresh calendar token");
    return json;
  },

  async runGoogleCalendarTests() {
    const res = await fetch("/api/system/test-google-calendar", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  },
};

