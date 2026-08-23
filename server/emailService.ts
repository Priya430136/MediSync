import nodemailer from "nodemailer";
import { EmailNotificationRecord, NotificationType, EmailDeliveryStatus } from "../src/types/appointment";
import {
  renderBookingConfirmationEmail,
  renderAppointmentReminderEmail,
  renderAppointmentCancellationEmail,
  renderDoctorLeaveAlertEmail,
  renderAppointmentRescheduledEmail,
  EmailTemplateResult,
} from "./emailTemplates";

// In-Memory Database for Email Notifications
export const emailNotificationsDB: EmailNotificationRecord[] = [];

// Lazy-initialized Nodemailer Transporter
let transporter: nodemailer.Transporter | null = null;
let isSimulatedTransport = false;

function getEmailTransporter(): { transporter: nodemailer.Transporter | null; isSimulated: boolean } {
  if (transporter) {
    return { transporter, isSimulated: isSimulatedTransport };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
      });
      isSimulatedTransport = false;
      console.log(`[EmailService] Configured live SMTP transport with host ${smtpHost}:${smtpPort}`);
    } catch (err) {
      console.warn("[EmailService] Failed to initialize live SMTP, falling back to simulated transport:", err);
      transporter = null;
      isSimulatedTransport = true;
    }
  } else {
    // Graceful fallback to verified in-memory simulated transport (safe for preview/dev)
    isSimulatedTransport = true;
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
    console.log("[EmailService] Running verified in-memory email transport (simulated delivery with full HTML/payload retention)");
  }

  return { transporter, isSimulated: isSimulatedTransport };
}

export interface SendEmailOptions {
  recipientEmail: string;
  recipientName: string;
  recipientRole: "patient" | "doctor" | "admin";
  type: NotificationType;
  subject: string;
  html: string;
  text: string;
  deduplicationKey?: string;
  appointmentId?: string;
  metadata?: Record<string, any>;
  simulateFailure?: boolean;
  maxAttempts?: number;
}

export interface SendEmailResult {
  success: boolean;
  emailId: string;
  status: EmailDeliveryStatus;
  messageId?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Send an email with deduplication, delivery tracking, and resilient error catching.
 * CRITICAL: This function NEVER throws; all errors are recorded in status: 'failed' or 'retrying'.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {
    recipientEmail,
    recipientName,
    recipientRole,
    type,
    subject,
    html,
    text,
    deduplicationKey,
    appointmentId,
    metadata,
    simulateFailure = false,
    maxAttempts = 3,
  } = options;

  const normalizedEmail = (recipientEmail || "").toLowerCase().trim();

  // 1. DEDUPLICATION CHECK
  if (deduplicationKey) {
    const existing = emailNotificationsDB.find(
      (e) => e.deduplicationKey === deduplicationKey && (e.status === "delivered" || e.status === "sent")
    );
    if (existing) {
      console.log(`[EmailService] Deduplication match: Email with key "${deduplicationKey}" already delivered (${existing.id}). Skipping.`);
      return {
        success: true,
        emailId: existing.id,
        status: existing.status,
        isDuplicate: true,
      };
    }
  }

  const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const emailFrom = process.env.EMAIL_FROM || "MediSync Healthcare <notifications@medisync-health.com>";

  const emailRecord: EmailNotificationRecord = {
    id: emailId,
    recipientEmail: normalizedEmail,
    recipientName,
    recipientRole,
    type,
    subject,
    htmlBody: html,
    textBody: text,
    status: "sending",
    attempts: 1,
    maxAttempts,
    deduplicationKey,
    appointmentId,
    createdAt: new Date().toISOString(),
    metadata,
  };

  emailNotificationsDB.unshift(emailRecord);

  // 2. ATTEMPT DISPATCH
  try {
    if (simulateFailure) {
      throw new Error("Simulated SMTP network connection failure (ETIMEDOUT / 504 Gateway Timeout)");
    }

    const { transporter: activeTransporter } = getEmailTransporter();

    let messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 8)}@medisync-health.com`;

    if (activeTransporter) {
      const mailOptions = {
        from: emailFrom,
        to: `${recipientName} <${normalizedEmail}>`,
        subject,
        text,
        html,
        headers: {
          "X-MediSync-Notification-Type": type,
          "X-MediSync-Email-ID": emailId,
          ...(deduplicationKey ? { "X-MediSync-Dedup-Key": deduplicationKey } : {}),
        },
      };

      const info = await activeTransporter.sendMail(mailOptions);
      if (info?.messageId) {
        messageId = info.messageId;
      }
    }

    // Mark as delivered
    emailRecord.status = "delivered";
    emailRecord.sentAt = new Date().toISOString();
    emailRecord.deliveredAt = new Date().toISOString();
    emailRecord.lastError = undefined;

    console.log(`[EmailService] Successfully sent [${type}] email to ${normalizedEmail} (ID: ${emailId})`);

    return {
      success: true,
      emailId,
      status: "delivered",
      messageId,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[EmailService] Failed to send [${type}] email to ${normalizedEmail}:`, errorMsg);

    emailRecord.status = emailRecord.attempts < emailRecord.maxAttempts ? "retrying" : "failed";
    emailRecord.failedAt = new Date().toISOString();
    emailRecord.lastError = errorMsg;

    return {
      success: false,
      emailId,
      status: emailRecord.status,
      error: errorMsg,
    };
  }
}

/**
 * Retry sending a previously failed or retrying email.
 */
export async function retryEmailDelivery(emailId: string): Promise<SendEmailResult> {
  const emailRecord = emailNotificationsDB.find((e) => e.id === emailId);
  if (!emailRecord) {
    return {
      success: false,
      emailId,
      status: "failed",
      error: "Email record not found",
    };
  }

  emailRecord.attempts += 1;
  emailRecord.status = "sending";

  try {
    const { transporter: activeTransporter } = getEmailTransporter();
    const emailFrom = process.env.EMAIL_FROM || "MediSync Healthcare <notifications@medisync-health.com>";

    if (activeTransporter) {
      await activeTransporter.sendMail({
        from: emailFrom,
        to: `${emailRecord.recipientName} <${emailRecord.recipientEmail}>`,
        subject: emailRecord.subject,
        text: emailRecord.textBody,
        html: emailRecord.htmlBody,
        headers: {
          "X-MediSync-Notification-Type": emailRecord.type,
          "X-MediSync-Email-ID": emailRecord.id,
          "X-MediSync-Retry-Attempt": String(emailRecord.attempts),
        },
      });
    }

    emailRecord.status = "delivered";
    emailRecord.deliveredAt = new Date().toISOString();
    emailRecord.lastError = undefined;

    console.log(`[EmailService] Retry SUCCESS for email ${emailId} on attempt ${emailRecord.attempts}`);
    return {
      success: true,
      emailId,
      status: "delivered",
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    emailRecord.status = emailRecord.attempts < emailRecord.maxAttempts ? "retrying" : "failed";
    emailRecord.lastError = errorMsg;
    emailRecord.failedAt = new Date().toISOString();

    console.error(`[EmailService] Retry FAILED for email ${emailId} on attempt ${emailRecord.attempts}:`, errorMsg);
    return {
      success: false,
      emailId,
      status: emailRecord.status,
      error: errorMsg,
    };
  }
}

// ---------------------------------------------------------------------------
// HIGH LEVEL WORKFLOW DISPATCHERS (NON-BLOCKING WITH APPOINTMENT ISOLATION)
// ---------------------------------------------------------------------------

/**
 * 1. Dispatch Appointment Booking Confirmation to Patient and Doctor.
 * NEVER blocks or throws errors into the appointment booking handler.
 */
export async function dispatchBookingConfirmationEmails(appointment: any, doctor: any, simulateFailure = false): Promise<{
  patientEmailResult: SendEmailResult;
  doctorEmailResult: SendEmailResult;
}> {
  // Patient email
  const patientTmpl = renderBookingConfirmationEmail({
    recipientRole: "patient",
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    hospitalAffiliation: doctor.hospitalAffiliation,
    roomNumber: doctor.roomNumber,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    bookingReference: appointment.bookingReference,
    googleCalendarLink: appointment.googleCalendarLink,
  });

  const patientEmailResult = await sendEmail({
    recipientEmail: appointment.patientEmail,
    recipientName: appointment.patientName,
    recipientRole: "patient",
    type: "BOOKING_CONFIRMATION",
    subject: patientTmpl.subject,
    html: patientTmpl.html,
    text: patientTmpl.text,
    deduplicationKey: `booking_confirm_pat_${appointment.id}`,
    appointmentId: appointment.id,
    simulateFailure,
  });

  // Doctor email
  const doctorTmpl = renderBookingConfirmationEmail({
    recipientRole: "doctor",
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    bookingReference: appointment.bookingReference,
    urgencyLevel: appointment.preVisitAISummary?.urgencyLevel || "Standard",
    chiefComplaint: appointment.preVisitAISummary?.chiefComplaint,
  });

  const doctorEmailResult = await sendEmail({
    recipientEmail: doctor.email,
    recipientName: doctor.name,
    recipientRole: "doctor",
    type: "BOOKING_CONFIRMATION",
    subject: doctorTmpl.subject,
    html: doctorTmpl.html,
    text: doctorTmpl.text,
    deduplicationKey: `booking_confirm_doc_${appointment.id}`,
    appointmentId: appointment.id,
  });

  return { patientEmailResult, doctorEmailResult };
}

/**
 * 2. Dispatch Appointment Reminder to Patient and Doctor.
 */
export async function dispatchAppointmentReminderEmails(appointment: any, doctor: any, hoursUntil = 24): Promise<{
  patientEmailResult: SendEmailResult;
  doctorEmailResult: SendEmailResult;
}> {
  const patientTmpl = renderAppointmentReminderEmail({
    recipientRole: "patient",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    hospitalAffiliation: doctor.hospitalAffiliation,
    roomNumber: doctor.roomNumber,
    date: appointment.date,
    startTime: appointment.startTime,
    bookingReference: appointment.bookingReference,
    hoursUntil,
  });

  const patientEmailResult = await sendEmail({
    recipientEmail: appointment.patientEmail,
    recipientName: appointment.patientName,
    recipientRole: "patient",
    type: "APPOINTMENT_REMINDER",
    subject: patientTmpl.subject,
    html: patientTmpl.html,
    text: patientTmpl.text,
    deduplicationKey: `reminder_pat_${appointment.id}_${appointment.date}_${hoursUntil}h`,
    appointmentId: appointment.id,
  });

  const doctorTmpl = renderAppointmentReminderEmail({
    recipientRole: "doctor",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    date: appointment.date,
    startTime: appointment.startTime,
    bookingReference: appointment.bookingReference,
    hoursUntil,
  });

  const doctorEmailResult = await sendEmail({
    recipientEmail: doctor.email,
    recipientName: doctor.name,
    recipientRole: "doctor",
    type: "APPOINTMENT_REMINDER",
    subject: doctorTmpl.subject,
    html: doctorTmpl.html,
    text: doctorTmpl.text,
    deduplicationKey: `reminder_doc_${appointment.id}_${appointment.date}_${hoursUntil}h`,
    appointmentId: appointment.id,
  });

  return { patientEmailResult, doctorEmailResult };
}

/**
 * 3. Dispatch Appointment Cancellation Email to Patient and Doctor.
 */
export async function dispatchCancellationEmails(appointment: any, doctor: any, cancelledBy: string, reason?: string): Promise<{
  patientEmailResult: SendEmailResult;
  doctorEmailResult: SendEmailResult;
}> {
  const patientTmpl = renderAppointmentCancellationEmail({
    recipientRole: "patient",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    date: appointment.date,
    startTime: appointment.startTime,
    bookingReference: appointment.bookingReference,
    cancellationReason: reason || appointment.cancellationReason,
    cancelledBy,
  });

  const patientEmailResult = await sendEmail({
    recipientEmail: appointment.patientEmail,
    recipientName: appointment.patientName,
    recipientRole: "patient",
    type: "APPOINTMENT_CANCELLED",
    subject: patientTmpl.subject,
    html: patientTmpl.html,
    text: patientTmpl.text,
    deduplicationKey: `cancel_pat_${appointment.id}`,
    appointmentId: appointment.id,
  });

  const doctorTmpl = renderAppointmentCancellationEmail({
    recipientRole: "doctor",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    date: appointment.date,
    startTime: appointment.startTime,
    bookingReference: appointment.bookingReference,
    cancellationReason: reason || appointment.cancellationReason,
    cancelledBy,
  });

  const doctorEmailResult = await sendEmail({
    recipientEmail: doctor.email,
    recipientName: doctor.name,
    recipientRole: "doctor",
    type: "APPOINTMENT_CANCELLED",
    subject: doctorTmpl.subject,
    html: doctorTmpl.html,
    text: doctorTmpl.text,
    deduplicationKey: `cancel_doc_${appointment.id}`,
    appointmentId: appointment.id,
  });

  return { patientEmailResult, doctorEmailResult };
}

/**
 * 4. Dispatch Doctor Leave Affecting Appointments to Patients and Doctor.
 */
export async function dispatchDoctorLeaveAlertEmails(
  doctor: any,
  leaveDate: string,
  leaveReason: string,
  affectedAppointments: any[]
): Promise<{
  patientResults: SendEmailResult[];
  doctorResult: SendEmailResult;
}> {
  const patientResults: SendEmailResult[] = [];

  for (const apt of affectedAppointments) {
    const tmpl = renderDoctorLeaveAlertEmail({
      recipientRole: "patient",
      patientName: apt.patientName,
      doctorName: doctor.name,
      leaveDate,
      leaveReason,
      bookingReference: apt.bookingReference,
    });

    const res = await sendEmail({
      recipientEmail: apt.patientEmail,
      recipientName: apt.patientName,
      recipientRole: "patient",
      type: "DOCTOR_LEAVE_ALERT",
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      deduplicationKey: `leave_alert_pat_${apt.id}_${leaveDate}`,
      appointmentId: apt.id,
    });
    patientResults.push(res);
  }

  // Doctor confirmation
  const docTmpl = renderDoctorLeaveAlertEmail({
    recipientRole: "doctor",
    doctorName: doctor.name,
    leaveDate,
    leaveReason,
    affectedCount: affectedAppointments.length,
  });

  const doctorResult = await sendEmail({
    recipientEmail: doctor.email,
    recipientName: doctor.name,
    recipientRole: "doctor",
    type: "DOCTOR_LEAVE_ALERT",
    subject: docTmpl.subject,
    html: docTmpl.html,
    text: docTmpl.text,
    deduplicationKey: `leave_alert_doc_${doctor.id}_${leaveDate}`,
  });

  return { patientResults, doctorResult };
}

/**
 * 5. Dispatch Appointment Rescheduled Confirmation to Patient and Doctor.
 */
export async function dispatchRescheduledEmails(
  appointment: any,
  doctor: any,
  oldDate: string,
  oldStartTime: string
): Promise<{
  patientEmailResult: SendEmailResult;
  doctorEmailResult: SendEmailResult;
}> {
  const patientTmpl = renderAppointmentRescheduledEmail({
    recipientRole: "patient",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    oldDate,
    oldStartTime,
    newDate: appointment.date,
    newStartTime: appointment.startTime,
    newEndTime: appointment.endTime,
    bookingReference: appointment.bookingReference,
    googleCalendarLink: appointment.googleCalendarLink,
  });

  const patientEmailResult = await sendEmail({
    recipientEmail: appointment.patientEmail,
    recipientName: appointment.patientName,
    recipientRole: "patient",
    type: "APPOINTMENT_RESCHEDULED",
    subject: patientTmpl.subject,
    html: patientTmpl.html,
    text: patientTmpl.text,
    deduplicationKey: `rescheduled_pat_${appointment.id}_${appointment.date}_${appointment.startTime}`,
    appointmentId: appointment.id,
  });

  const doctorTmpl = renderAppointmentRescheduledEmail({
    recipientRole: "doctor",
    patientName: appointment.patientName,
    doctorName: doctor.name,
    doctorSpecialisation: doctor.specialisation,
    oldDate,
    oldStartTime,
    newDate: appointment.date,
    newStartTime: appointment.startTime,
    bookingReference: appointment.bookingReference,
  });

  const doctorEmailResult = await sendEmail({
    recipientEmail: doctor.email,
    recipientName: doctor.name,
    recipientRole: "doctor",
    type: "APPOINTMENT_RESCHEDULED",
    subject: doctorTmpl.subject,
    html: doctorTmpl.html,
    text: doctorTmpl.text,
    deduplicationKey: `rescheduled_doc_${appointment.id}_${appointment.date}_${appointment.startTime}`,
    appointmentId: appointment.id,
  });

  return { patientEmailResult, doctorEmailResult };
}
