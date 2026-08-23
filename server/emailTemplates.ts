// Reusable MediSync Email Templates
// Standards:
// 1. Responsive, accessible HTML & plain text formatting
// 2. High contrast, clear hierarchy, MediSync branding
// 3. Appointment information presented without exposing unnecessary sensitive clinical details
// 4. Clear call-to-action buttons for portal access and calendar syncing

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = "#0284c7"; // Sky-600
const BRAND_DARK = "#0f172a"; // Slate-900
const BG_LIGHT = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER_COLOR = "#e2e8f0";

function baseEmailLayout(title: string, preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: ${BG_LIGHT}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    td { font-size: 14px; vertical-align: top; }
    .container { max-width: 580px; margin: 0 auto; padding: 24px 16px; }
    .card { background-color: ${CARD_BG}; border-radius: 12px; border: 1px solid ${BORDER_COLOR}; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { background-color: ${BRAND_DARK}; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 28px 24px; }
    .footer { text-align: center; padding: 24px 16px; font-size: 12px; color: #94a3b8; }
    .button { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center; }
    .details-box { background-color: #f1f5f9; border-radius: 8px; border: 1px solid ${BORDER_COLOR}; padding: 16px 20px; margin: 20px 0; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #e0f2fe; color: #0369a1; }
    .row { margin-bottom: 10px; }
    .row:last-child { margin-bottom: 0; }
    .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .val { font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 2px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>MediSync Healthcare</h1>
        <p>Intelligent Clinical Appointment System</p>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
    </div>
    <div class="footer">
      <p style="margin:0 0 8px;">MediSync Health • 100 Medical Center Parkway • (800) 555-RESQ</p>
      <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated healthcare communication. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

// 1. APPOINTMENT BOOKING CONFIRMATION
export function renderBookingConfirmationEmail(params: {
  recipientRole: "patient" | "doctor";
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialisation: string;
  hospitalAffiliation?: string;
  roomNumber?: string;
  date: string;
  startTime: string;
  endTime?: string;
  bookingReference: string;
  urgencyLevel?: string;
  chiefComplaint?: string;
  googleCalendarLink?: string;
}): EmailTemplateResult {
  const {
    recipientRole,
    patientName,
    doctorName,
    doctorSpecialisation,
    hospitalAffiliation = "MediSync Central Medical Center",
    roomNumber = "Consultation Suite 201",
    date,
    startTime,
    endTime,
    bookingReference,
    urgencyLevel = "Standard",
    chiefComplaint,
    googleCalendarLink,
  } = params;

  if (recipientRole === "patient") {
    const subject = `Appointment Confirmed: Dr. ${doctorName} on ${date} at ${startTime} (#${bookingReference})`;
    const preheader = `Your appointment with Dr. ${doctorName} has been confirmed for ${date} at ${startTime}.`;

    const html = baseEmailLayout(
      "Appointment Confirmed",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-success">Confirmed Booking</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Confirmed</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Booking Reference: <strong style="font-family:monospace;color:#0284c7;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dear <strong>${patientName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        Your medical consultation with <strong>Dr. ${doctorName}</strong> (${doctorSpecialisation}) is officially scheduled and confirmed.
      </p>

      <div class="details-box">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="row">
            <div class="label">Date</div>
            <div class="val">${date}</div>
          </div>
          <div class="row">
            <div class="label">Time</div>
            <div class="val">${startTime} ${endTime ? `– ${endTime}` : ''}</div>
          </div>
          <div class="row">
            <div class="label">Doctor</div>
            <div class="val">Dr. ${doctorName}</div>
          </div>
          <div class="row">
            <div class="label">Specialisation</div>
            <div class="val">${doctorSpecialisation}</div>
          </div>
          <div class="row" style="grid-column:1 / -1;">
            <div class="label">Location & Room</div>
            <div class="val">${hospitalAffiliation} • ${roomNumber}</div>
          </div>
        </div>
      </div>

      <div style="background-color:#eff6ff;border-left:4px solid #0284c7;padding:12px 16px;border-radius:4px;margin:20px 0;">
        <strong style="font-size:13px;color:#1e40af;">Pre-Visit Instructions:</strong>
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13px;color:#334155;line-height:1.5;">
          <li>Please arrive 10 minutes prior to your scheduled time.</li>
          <li>Bring a valid photo ID and any relevant previous medical records or current medications.</li>
          <li>If you need to reschedule or cancel, please do so at least 2 hours in advance.</li>
        </ul>
      </div>

      <div style="text-align:center;margin:24px 0 10px;">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" class="button" target="_blank" style="margin-right:8px;">Add to Google Calendar</a>` : ''}
      </div>
      `
    );

    const text = `APPOINTMENT CONFIRMED - MEDISYNC HEALTHCARE
Reference: #${bookingReference}

Dear ${patientName},
Your consultation with Dr. ${doctorName} (${doctorSpecialisation}) is confirmed.

DETAILS:
- Date: ${date}
- Time: ${startTime} ${endTime ? `– ${endTime}` : ''}
- Doctor: Dr. ${doctorName} (${doctorSpecialisation})
- Location: ${hospitalAffiliation} (${roomNumber})

Please arrive 10 minutes before your slot with a valid ID and any relevant medical records.
`;

    return { subject, html, text };
  } else {
    // Doctor Notification
    const subject = `New Appointment: ${patientName} on ${date} at ${startTime} [Urgency: ${urgencyLevel}]`;
    const preheader = `New patient consultation booked by ${patientName} for ${date} at ${startTime}.`;

    const html = baseEmailLayout(
      "New Patient Consultation",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-info">New Consultation</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">New Patient Scheduled</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Booking Reference: <strong style="font-family:monospace;color:#0284c7;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dr. <strong>${doctorName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        A new patient appointment has been booked for your clinical schedule.
      </p>

      <div class="details-box">
        <div class="row">
          <div class="label">Patient Name</div>
          <div class="val">${patientName}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;">
          <div class="row">
            <div class="label">Scheduled Date</div>
            <div class="val">${date}</div>
          </div>
          <div class="row">
            <div class="label">Slot Time</div>
            <div class="val">${startTime} ${endTime ? `– ${endTime}` : ''}</div>
          </div>
        </div>
        ${chiefComplaint ? `
        <div class="row" style="margin-top:10px;">
          <div class="label">Chief Complaint Summary</div>
          <div class="val" style="font-weight:normal;color:#334155;">${chiefComplaint}</div>
        </div>` : ''}
        <div class="row" style="margin-top:10px;">
          <div class="label">Triage Urgency</div>
          <div class="val"><span class="badge ${urgencyLevel === 'High' ? 'badge-danger' : urgencyLevel === 'Moderate' ? 'badge-warning' : 'badge-info'}">${urgencyLevel}</span></div>
        </div>
      </div>

      <p style="font-size:13px;color:#64748b;">
        Pre-visit AI clinical summary and suggested diagnostic questions are ready in your Doctor Portal.
      </p>
      `
    );

    const text = `NEW PATIENT CONSULTATION - MEDISYNC HEALTHCARE
Reference: #${bookingReference}

Dr. ${doctorName},
A new patient has scheduled a consultation with you:

- Patient: ${patientName}
- Date: ${date}
- Time: ${startTime} ${endTime ? `– ${endTime}` : ''}
- Triage Urgency: ${urgencyLevel}
${chiefComplaint ? `- Chief Complaint: ${chiefComplaint}` : ''}

Log in to your Doctor Portal to view full clinical details.
`;

    return { subject, html, text };
  }
}

// 2. APPOINTMENT REMINDER
export function renderAppointmentReminderEmail(params: {
  recipientRole: "patient" | "doctor";
  patientName: string;
  doctorName: string;
  doctorSpecialisation: string;
  hospitalAffiliation?: string;
  roomNumber?: string;
  date: string;
  startTime: string;
  bookingReference: string;
  hoursUntil?: number;
}): EmailTemplateResult {
  const {
    recipientRole,
    patientName,
    doctorName,
    doctorSpecialisation,
    hospitalAffiliation = "MediSync Central Medical Center",
    roomNumber = "Consultation Suite 201",
    date,
    startTime,
    bookingReference,
    hoursUntil = 24,
  } = params;

  if (recipientRole === "patient") {
    const subject = `Reminder: Upcoming Appointment with Dr. ${doctorName} on ${date} at ${startTime}`;
    const preheader = `Upcoming medical appointment reminder: ${date} at ${startTime} with Dr. ${doctorName}.`;

    const html = baseEmailLayout(
      "Appointment Reminder",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-warning">Upcoming Appointment</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Reminder</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">In ${hoursUntil} Hours • Ref: <strong style="font-family:monospace;color:#0284c7;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dear <strong>${patientName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        This is a friendly reminder of your upcoming consultation with <strong>Dr. ${doctorName}</strong>.
      </p>

      <div class="details-box">
        <div class="row">
          <div class="label">Date & Time</div>
          <div class="val">${date} at ${startTime}</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Doctor</div>
          <div class="val">Dr. ${doctorName} (${doctorSpecialisation})</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Location</div>
          <div class="val">${hospitalAffiliation} • ${roomNumber}</div>
        </div>
      </div>

      <p style="font-size:13px;color:#475569;line-height:1.5;">
        Please plan to arrive a few minutes early. If you need to make changes, please visit the MediSync Patient Portal.
      </p>
      `
    );

    const text = `APPOINTMENT REMINDER - MEDISYNC HEALTHCARE
Reference: #${bookingReference}

Dear ${patientName},
This is a reminder for your upcoming consultation:
- Doctor: Dr. ${doctorName} (${doctorSpecialisation})
- Date: ${date}
- Time: ${startTime}
- Location: ${hospitalAffiliation} (${roomNumber})

Please arrive 10 minutes early.
`;

    return { subject, html, text };
  } else {
    // Doctor schedule reminder
    const subject = `Schedule Reminder: Consultation with ${patientName} on ${date} at ${startTime}`;
    const preheader = `Clinical consultation reminder: ${patientName} on ${date} at ${startTime}.`;

    const html = baseEmailLayout(
      "Upcoming Consultation",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-info">Schedule Reminder</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Upcoming Consultation</h2>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dr. <strong>${doctorName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        You have an upcoming consultation with <strong>${patientName}</strong> scheduled for <strong>${date} at ${startTime}</strong> (Ref: #${bookingReference}).
      </p>
      `
    );

    const text = `CONSULTATION REMINDER - MEDISYNC HEALTHCARE
Dr. ${doctorName},
Reminder for your consultation with ${patientName} on ${date} at ${startTime} (Ref: #${bookingReference}).
`;

    return { subject, html, text };
  }
}

// 3. APPOINTMENT CANCELLATION
export function renderAppointmentCancellationEmail(params: {
  recipientRole: "patient" | "doctor";
  patientName: string;
  doctorName: string;
  doctorSpecialisation: string;
  date: string;
  startTime: string;
  bookingReference: string;
  cancellationReason?: string;
  cancelledBy?: string;
}): EmailTemplateResult {
  const {
    recipientRole,
    patientName,
    doctorName,
    doctorSpecialisation,
    date,
    startTime,
    bookingReference,
    cancellationReason = "Cancelled per user request",
    cancelledBy = "Patient",
  } = params;

  if (recipientRole === "patient") {
    const subject = `Appointment Cancelled: #${bookingReference} with Dr. ${doctorName}`;
    const preheader = `Your appointment #${bookingReference} scheduled for ${date} has been cancelled.`;

    const html = baseEmailLayout(
      "Appointment Cancelled",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-danger">Cancelled</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Cancelled</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Booking Reference: <strong style="font-family:monospace;color:#ef4444;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dear <strong>${patientName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        Your scheduled appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date} at ${startTime}</strong> has been cancelled.
      </p>

      <div class="details-box">
        <div class="row">
          <div class="label">Reason</div>
          <div class="val" style="color:#b91c1c;">${cancellationReason}</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Doctor</div>
          <div class="val">Dr. ${doctorName} (${doctorSpecialisation})</div>
        </div>
      </div>

      <p style="font-size:14px;color:#475569;line-height:1.5;">
        If you need medical assistance or would like to select an alternate time slot, please book anytime via our portal.
      </p>
      `
    );

    const text = `APPOINTMENT CANCELLED - MEDISYNC HEALTHCARE
Reference: #${bookingReference}

Dear ${patientName},
Your appointment with Dr. ${doctorName} on ${date} at ${startTime} has been cancelled.
Reason: ${cancellationReason}

You can book a new appointment at any time through the MediSync portal.
`;

    return { subject, html, text };
  } else {
    // Doctor Notification
    const subject = `Slot Cancelled: ${patientName} on ${date} at ${startTime}`;
    const preheader = `Patient ${patientName} has cancelled appointment #${bookingReference}.`;

    const html = baseEmailLayout(
      "Slot Cancelled",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-warning">Slot Reopened</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Cancelled</h2>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dr. <strong>${doctorName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        The consultation with <strong>${patientName}</strong> on <strong>${date} at ${startTime}</strong> (Ref: #${bookingReference}) has been cancelled by ${cancelledBy}.
      </p>
      <p style="font-size:13px;color:#64748b;">
        This slot has been automatically reopened in your clinical availability calendar.
      </p>
      `
    );

    const text = `APPOINTMENT CANCELLED - MEDISYNC HEALTHCARE
Dr. ${doctorName},
The consultation with ${patientName} on ${date} at ${startTime} (Ref: #${bookingReference}) has been cancelled. The time slot is now reopened.
`;

    return { subject, html, text };
  }
}

// 4. DOCTOR LEAVE AFFECTING APPOINTMENT
export function renderDoctorLeaveAlertEmail(params: {
  recipientRole: "patient" | "doctor";
  patientName?: string;
  doctorName: string;
  leaveDate: string;
  leaveReason?: string;
  bookingReference?: string;
  affectedCount?: number;
}): EmailTemplateResult {
  const {
    recipientRole,
    patientName = "Valued Patient",
    doctorName,
    leaveDate,
    leaveReason = "Scheduled Clinical Leave / Conference",
    bookingReference = "RESQ-PENDING",
    affectedCount = 1,
  } = params;

  if (recipientRole === "patient") {
    const subject = `Action Required: Dr. ${doctorName} on Leave (${leaveDate}) - Reschedule Appointment #${bookingReference}`;
    const preheader = `Dr. ${doctorName} is on leave on ${leaveDate}. Priority rescheduling is available.`;

    const html = baseEmailLayout(
      "Doctor Leave - Rescheduling Required",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-danger">Action Required</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Doctor on Scheduled Leave</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Appointment Ref: <strong style="font-family:monospace;color:#0284c7;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dear <strong>${patientName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        We regret to inform you that <strong>Dr. ${doctorName}</strong> is on scheduled clinical absence on <strong>${leaveDate}</strong> (${leaveReason}).
      </p>

      <div class="details-box" style="border-left:4px solid #f59e0b;">
        <div class="row">
          <div class="label">Status</div>
          <div class="val" style="color:#d97706;">Priority Rescheduling Required</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Impacted Date</div>
          <div class="val">${leaveDate}</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Doctor Reason</div>
          <div class="val" style="font-weight:normal;">${leaveReason}</div>
        </div>
      </div>

      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Your appointment has been given <strong>Priority Rescheduling Status</strong>. You can choose a new date or transfer your appointment to another available specialist with one click in your Patient Portal.
      </p>
      `
    );

    const text = `URGENT: DOCTOR ON LEAVE - RESCHEDULING REQUIRED
Reference: #${bookingReference}

Dear ${patientName},
Dr. ${doctorName} is on leave on ${leaveDate} (${leaveReason}).
Your appointment #${bookingReference} has been placed in priority rescheduling status.

Please log in to your MediSync Patient Portal to select a new date or transfer to another specialist.
`;

    return { subject, html, text };
  } else {
    // Doctor leave confirmation
    const subject = `Leave Registered: ${leaveDate} (${affectedCount} appointments affected)`;
    const preheader = `Your leave for ${leaveDate} has been confirmed. ${affectedCount} appointments flagged.`;

    const html = baseEmailLayout(
      "Leave Schedule Confirmed",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-info">Leave Registered</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Clinical Leave Confirmed</h2>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dr. <strong>${doctorName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        Your leave for <strong>${leaveDate}</strong> has been registered (${leaveReason}).
      </p>

      <div class="details-box">
        <div class="row">
          <div class="label">Date of Leave</div>
          <div class="val">${leaveDate}</div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="label">Affected Appointments</div>
          <div class="val">${affectedCount} patient booking(s) flagged for priority rescheduling</div>
        </div>
      </div>

      <p style="font-size:13px;color:#64748b;">
        All affected patients have received immediate automated rescheduling notifications.
      </p>
      `
    );

    const text = `LEAVE REGISTERED - MEDISYNC HEALTHCARE
Dr. ${doctorName},
Your leave for ${leaveDate} is registered. ${affectedCount} affected patient appointments have been placed into priority rescheduling with automatic alerts dispatched.
`;

    return { subject, html, text };
  }
}

// 5. APPOINTMENT RESCHEDULED
export function renderAppointmentRescheduledEmail(params: {
  recipientRole: "patient" | "doctor";
  patientName: string;
  doctorName: string;
  doctorSpecialisation: string;
  oldDate: string;
  oldStartTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime?: string;
  bookingReference: string;
  googleCalendarLink?: string;
}): EmailTemplateResult {
  const {
    recipientRole,
    patientName,
    doctorName,
    doctorSpecialisation,
    oldDate,
    oldStartTime,
    newDate,
    newStartTime,
    newEndTime,
    bookingReference,
    googleCalendarLink,
  } = params;

  if (recipientRole === "patient") {
    const subject = `Appointment Rescheduled: Dr. ${doctorName} on ${newDate} at ${newStartTime} (#${bookingReference})`;
    const preheader = `Your appointment #${bookingReference} has been successfully moved to ${newDate} at ${newStartTime}.`;

    const html = baseEmailLayout(
      "Appointment Rescheduled",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-success">Rescheduled</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Rescheduled</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Booking Reference: <strong style="font-family:monospace;color:#0284c7;">#${bookingReference}</strong></p>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dear <strong>${patientName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        Your appointment with <strong>Dr. ${doctorName}</strong> (${doctorSpecialisation}) has been successfully rescheduled.
      </p>

      <div class="details-box">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="row" style="background-color:#fee2e2;padding:8px 10px;border-radius:6px;">
            <div class="label" style="color:#991b1b;">Previous Time</div>
            <div class="val" style="color:#7f1d1d;text-decoration:line-through;">${oldDate} at ${oldStartTime}</div>
          </div>
          <div class="row" style="background-color:#dcfce7;padding:8px 10px;border-radius:6px;">
            <div class="label" style="color:#166534;">New Time</div>
            <div class="val" style="color:#14532d;">${newDate} at ${newStartTime}</div>
          </div>
        </div>

        <div class="row" style="margin-top:14px;">
          <div class="label">Doctor & Speciality</div>
          <div class="val">Dr. ${doctorName} (${doctorSpecialisation})</div>
        </div>
      </div>

      <div style="text-align:center;margin:24px 0 10px;">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" class="button" target="_blank">Update Google Calendar</a>` : ''}
      </div>
      `
    );

    const text = `APPOINTMENT RESCHEDULED - MEDISYNC HEALTHCARE
Reference: #${bookingReference}

Dear ${patientName},
Your consultation with Dr. ${doctorName} has been rescheduled:

- PREVIOUS: ${oldDate} at ${oldStartTime}
- NEW TIME: ${newDate} at ${newStartTime} ${newEndTime ? `– ${newEndTime}` : ''}
- Doctor: Dr. ${doctorName} (${doctorSpecialisation})

Your calendar and appointment details have been updated.
`;

    return { subject, html, text };
  } else {
    // Doctor Notification
    const subject = `Rescheduled: ${patientName} now on ${newDate} at ${newStartTime}`;
    const preheader = `Appointment #${bookingReference} with ${patientName} moved to ${newDate} at ${newStartTime}.`;

    const html = baseEmailLayout(
      "Appointment Rescheduled",
      preheader,
      `
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-info">Schedule Updated</span>
        <h2 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Appointment Rescheduled</h2>
      </div>

      <p style="font-size:15px;line-height:1.5;">Dr. <strong>${doctorName}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;">
        The appointment for <strong>${patientName}</strong> (Ref: #${bookingReference}) has been updated from ${oldDate} at ${oldStartTime} to:
      </p>

      <div class="details-box">
        <div class="row">
          <div class="label">New Scheduled Slot</div>
          <div class="val" style="font-size:16px;color:#0284c7;">${newDate} at ${newStartTime}</div>
        </div>
      </div>
      `
    );

    const text = `APPOINTMENT RESCHEDULED - MEDISYNC HEALTHCARE
Dr. ${doctorName},
Appointment #${bookingReference} with ${patientName} has been rescheduled to ${newDate} at ${newStartTime}.
`;

    return { subject, html, text };
  }
}
