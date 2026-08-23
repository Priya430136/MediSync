# 🏥 RapidResQ: Healthcare Appointment & Follow-Up Manager
> **Production-Ready Clinical Appointment Management, AI Symptom Triage, Concurrency Protection, Doctor Leave Conflict Resolution, and Medication Follow-Up Platform.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/)
[![Tests](https://img.shields.io/badge/tests-14%20passed-success.svg)](https://github.com/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents
1. [Project Overview](#-1-project-overview)
2. [Problem Statement](#-2-problem-statement)
3. [Key Features & Capabilities](#-3-key-features--capabilities)
4. [System Architecture & Tech Stack](#-4-system-architecture--tech-stack)
5. [Directory Structure](#-5-directory-structure)
6. [Quick Start & Local Setup](#-6-quick-start--local-setup)
7. [Environment Variables (`.env.example`)](#-7-environment-variables)
8. [Database Schema & Data Models](#-8-database-schema--data-models)
9. [REST API Documentation](#-9-rest-api-documentation)
10. [Role-Based Access Control (RBAC)](#-10-role-based-access-control-rbac)
11. [Double-Booking Prevention & Concurrency Strategy](#-11-double-booking-prevention--concurrency-strategy)
12. [Slot Hold Mechanism (5-Minute TTL Lock)](#-12-slot-hold-mechanism-5-minute-ttl-lock)
13. [Doctor Leave Management & Cascading Conflict Resolution](#-13-doctor-leave-management--cascading-conflict-resolution)
14. [AI Clinical Integration & Exact Prompts (Gemini 3.7 Flash)](#-14-ai-clinical-integration--exact-prompts)
15. [Notification Retry Engine & Background Workers](#-15-notification-retry-engine--background-workers)
16. [Google Calendar & iCal Integration](#-16-google-calendar--ical-integration)
17. [Automated Test Suite & Verification](#-17-automated-test-suite--verification)
18. [Production Deployment](#-18-production-deployment)
19. [Demo Accounts & Evaluation Credentials](#-19-demo-accounts--evaluation-credentials)

---

## 📌 1. Project Overview
**RapidResQ** is an enterprise full-stack healthcare scheduling and post-visit follow-up platform built for modern hospitals and multi-specialty clinical practices. It eliminates double-booking race conditions during high-volume outpatient scheduling, provides AI-driven clinical triage briefings to physicians prior to consultations, converts doctor prescriptions into patient-friendly follow-up guides, and automates daily medication reminder schedules.

---

## 🎯 2. Problem Statement
Traditional healthcare scheduling systems suffer from:
1. **Concurrency Race Conditions**: High patient volumes attempting to reserve the same time slot simultaneously result in double-bookings, clinician overload, and patient distress.
2. **Clinical Communication Gaps**: Doctors spend up to 40% of consultation time taking basic symptom histories without pre-visit triage intelligence.
3. **Doctor Absence Disruptions**: When a doctor abruptly takes sick or emergency leave, existing scheduled appointments are dropped or silently mismanaged.
4. **Poor Patient Follow-Up Compliance**: Medical prescriptions filled with complex dosage terms (e.g., "TDS AC for 5 days") lead to patient non-adherence and preventable complications.

RapidResQ addresses all four challenges through an atomic three-tier concurrency engine, pre-visit Gemini triage, automated leave-conflict cascading rescheduling, and automated medication reminder pipelines.

---

## 🌟 3. Key Features & Capabilities

### 🧑‍💼 Patient Experience
- **Doctor Discovery**: Search and filter physicians by specialisation (Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, General Medicine), rating, consultation fee, and available days.
- **Real-Time Interactive Booking**: Dynamic 15/30/45/60-minute time slot generation respecting doctor working hours and lunch break intervals.
- **5-Minute Slot Hold**: Temporary lock on selected slots while filling symptoms to prevent cart sniping.
- **Symptom Intake & AI Triage**: Real-time evaluation of patient symptoms, assigning Urgency Levels (*Low, Medium, High*) and generating 3 suggested clinical questions for the physician.
- **Patient Health Portal**: Manage active bookings, trigger 1-click cancellations or rescheduling, download `.ics` calendar files, view post-visit summaries, and mark daily medication reminders as taken/skipped.

### 🩺 Doctor Workspace
- **Clinical Dashboard**: Real-time view of daily appointment schedule, consultation status, and patient profiles.
- **Pre-Visit AI Briefing**: Review patient symptoms, duration, triage urgency badges, and AI-suggested clinical questions before beginning consultations.
- **Clinical Notes & Prescription Builder**: Digital Rx writer supporting multi-drug regimens, dosage, frequency, timing (*Before/After Meals*), duration, and clinical observations.
- **AI Post-Visit Translation**: 1-click transformation of complex clinical notes into plain-language patient summaries with automated dosage schedules and warning flags.
- **Leave & Availability Control**: Mark individual dates for approved leave with instant warning of affected patient bookings.

### 🛡️ Hospital Administrator Portal
- **Physician Roster Management**: Add, edit, deactivate doctors, configure working hours (start/end), lunch break windows, and slot granularity (15 to 60 mins).
- **Global Leave Management**: Audit doctor absences and trigger automated cascading cancellation/rescheduling notices to affected patients.
- **Master Booking Registry**: Real-time audit log of all appointments across departments with status filtering and cancellation reason logging.
- **Background Notification Manager**: Monitor email/SMS queue health, inspect retry attempts, and trigger manual retry for transient delivery failures.
- **Live Concurrency Stress Tester**: Interactive admin tool to simulate 3 simultaneous requests for the same slot to visually demonstrate atomic double-booking prevention.

---

## 🏗️ 4. System Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        RAPIDRESQ FRONTEND LAYER                        │
│   React 18 + TypeScript + Tailwind CSS + Lucide Icons + Radix UI       │
│     (Patient Portal / Doctor Portal / Admin Dashboard / Docs)          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP / REST / JSON
┌──────────────────────────────────▼─────────────────────────────────────┐
│                     EXPRESS 5 FULL-STACK BACKEND                       │
│  ├── Auth & RBAC Middleware (/api/auth, /api/users)                    │
│  ├── Concurrency Lock & Slot Hold Engine (/api/slots/hold)             │
│  ├── Appointment State Machine (/api/appointments)                     │
│  ├── Doctor Leave Conflict Resolver (/api/doctors/:id/leave)           │
│  ├── Gemini 3.7 Flash AI Service (/api/ai/pre-visit-summary)           │
│  ├── Google Calendar & iCal RFC 5545 Service (/calendar.ics)           │
│  └── Background Worker: Notification Queue & Medication Reminders      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       PERSISTENCE & INTEGRATIONS                       │
│  ├── PostgreSQL / Supabase Schema (Composite Unique Constraints)       │
│  ├── Google Gemini AI API (Pre-visit Triage & Post-visit Rx Summaries) │
│  ├── SendGrid / SMTP Transport (Idempotent Resilient Email Delivery)   │
│  └── Google Calendar API v3 (OAuth 2.0 Synchronized Events)            │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18 (Vite, TypeScript, Tailwind CSS, Lucide-React, Sonner Toasts, React Router DOM v6).
- **Backend**: Node.js, Express v5, ESBuild, TSX runtime.
- **AI / LLM**: Google Gemini 3.7 Flash via `@google/genai` TypeScript SDK with deterministic JSON schema parsing and fallback circuit breaker.
- **Calendar**: RFC 5545 `.ics` generator and Google Calendar OAuth 2.0 endpoint pipeline.
- **Testing**: Vitest + Testing Library with comprehensive unit and concurrency test suites.

---

## 📁 5. Directory Structure
```text
RapidResq/
├── server.ts                       # Express full-stack backend, APIs, AI, and worker engine
├── SYSTEM_DESIGN.md                # 800-word Technical System Architecture & Concurrency Spec
├── README.md                       # Comprehensive project documentation & runbook
├── .env.example                    # Environment variable template
├── package.json                    # Project dependencies and npm scripts
├── vite.config.ts                  # Vite build and server configuration
│
├── src/
│   ├── App.tsx                     # Main routing tree and RBAC configuration
│   ├── main.tsx                    # React application entry point
│   ├── pages/
│   │   ├── BookAppointment.tsx     # Patient doctor search, slot hold & booking workflow
│   │   ├── DoctorPortal.tsx        # Doctor appointment queue, pre-visit triage, Rx builder
│   │   ├── PatientPortal.tsx       # Patient dashboard, appointment history, Rx tracker
│   │   ├── AdminPortal.tsx         # Admin doctor roster, leave controls, concurrency tester
│   │   ├── SystemDesignDocs.tsx    # Interactive in-app System Architecture & Concurrency docs
│   │   ├── Auth.tsx                # Multi-role authentication & quick demo login
│   │   └── SOS.tsx                 # Emergency ambulance dispatch & rapid response
│   │
│   ├── components/
│   │   ├── Navbar.tsx              # Adaptive navigation with role-aware action buttons
│   │   ├── ProtectedRoute.tsx      # Client-side RBAC route gatekeeper
│   │   └── ui/                     # Accessible Radix UI design system components
│   │
│   ├── integrations/
│   │   └── supabase/client.ts      # Local & Cloud Supabase database and auth client
│   │
│   └── test/
│       ├── appointment-engine.test.ts # 12 Automated Unit & Concurrency test suites
│       └── setup.ts                # Vitest global test harness
```

---

## 🚀 6. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step-by-Step Installation
```bash
# 1. Clone the repository
git clone https://github.com/harshit1arora/Rapidresq---EPICS.git
cd Rapidresq---EPICS

# 2. Install all dependencies
npm install

# 3. Create environment configuration
cp .env.example .env

# 4. Start full-stack development server (Express + Vite on port 3000)
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🔑 7. Environment Variables

Create a `.env` file in the root directory using `.env.example` as a template:

```env
# Application Server Port
PORT=3000

# Google Gemini API Key for Clinical Triage and Summarization
GEMINI_API_KEY=your_gemini_api_key_here

# Google Calendar OAuth 2.0 Integration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# SMTP / Email Notification Service (SendGrid, Mailgun, or AWS SES)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_or_smtp_password
EMAIL_FROM=appointments@rapidresq-health.com

# Optional Supabase Database Connection
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## 🗄️ 8. Database Schema & Data Models

The system is designed around strict relational entity models:

### 1. `doctors`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`doc-1`, `doc-2`...) |
| `name` | `VARCHAR(255)` | Doctor full name |
| `specialisation` | `VARCHAR(100)` | Cardiology, Neurology, Pediatrics, etc. |
| `working_hours` | `JSONB` | `{ "start": "09:00", "end": "17:00" }` |
| `break_hours` | `JSONB` | `{ "start": "13:00", "end": "14:00" }` |
| `slot_duration_minutes` | `INT` | 15, 30, 45, or 60 minutes |
| `available_days` | `TEXT[]` | Array of active days |
| `leave_dates` | `TEXT[]` | Array of ISO dates (`YYYY-MM-DD`) on approved leave |
| `active` | `BOOLEAN` | Account status flag |

### 2. `appointments`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`apt-xxx`) |
| `booking_reference` | `VARCHAR(32)` | Unique user-friendly code (`RR-2026-XXXX`) |
| `doctor_id` | `VARCHAR(64)` | Foreign Key -> `doctors.id` |
| `patient_email` | `VARCHAR(255)` | Patient contact address |
| `date` | `DATE` | Consultation date (`YYYY-MM-DD`) |
| `start_time` | `VARCHAR(5)` | Start time (`HH:mm`) |
| `end_time` | `VARCHAR(5)` | End time (`HH:mm`) |
| `status` | `VARCHAR(32)` | `confirmed` \| `completed` \| `cancelled` \| `rescheduling_required` |
| `symptoms` | `TEXT` | Patient reported symptoms |
| `pre_visit_ai_summary`| `JSONB` | Urgency, chief complaint, 3 suggested questions |
| `clinical_notes` | `TEXT` | Doctor notes added post-consultation |
| `prescriptions` | `JSONB` | Medicines, dosage, frequency, duration |
| `post_visit_ai_summary`| `JSONB` | Plain-English summary and dosage guide |
| **Composite Unique Index** | `(doctor_id, date, start_time)` | Enforces atomic double-booking prevention |

### 3. `slot_holds`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key |
| `doctor_id` | `VARCHAR(64)` | Foreign Key -> `doctors.id` |
| `date` | `DATE` | Target date |
| `start_time` | `VARCHAR(5)` | Start time (`HH:mm`) |
| `hold_token` | `VARCHAR(64)` | Unique client reservation token |
| `expires_at` | `BIGINT` | Epoch timestamp (300,000ms TTL) |

### 4. `notifications`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key |
| `recipient_email` | `VARCHAR(255)` | Recipient address |
| `type` | `VARCHAR(64)` | `BOOKING_CONFIRMATION`, `DOCTOR_LEAVE_ALERT`, etc. |
| `status` | `VARCHAR(20)` | `queued` \| `sent` \| `failed` \| `retrying` |
| `attempts` | `INT` | Current delivery attempts (max 3) |
| `last_error` | `TEXT` | Log of last failure exception |

---

## 🌐 9. REST API Documentation

### Doctor & Availability Endpoints
- `GET /api/doctors` – List all active doctors with specialisation, ratings, and fees.
- `GET /api/doctors/:id` – Fetch detailed physician profile, schedule, and leave dates.
- `POST /api/doctors` – *(Admin)* Create a new doctor profile.
- `PUT /api/doctors/:id` – *(Admin)* Update physician schedule, slot duration, and working hours.
- `POST /api/doctors/:id/leave` – *(Admin/Doctor)* Mark doctor on leave; automatically updates affected bookings and notifies patients.
- `GET /api/slots?doctorId=:id&date=YYYY-MM-DD` – Returns dynamically calculated slots with `status: 'available' | 'held' | 'booked'`.

### Concurrency & Booking Endpoints
- `POST /api/slots/hold` – Temporarily reserves a slot for 5 minutes (`300s`).
  - **Body**: `{ doctorId, date, startTime, patientEmail }`
  - **Response 200**: `{ success: true, holdToken: "uuid", expiresAt: 1771800000000 }`
  - **Response 409**: `{ success: false, error: "Slot already held or booked" }`
- `POST /api/appointments` – Creates a confirmed appointment atomically.
  - **Body**: `{ doctorId, date, startTime, patientName, patientEmail, patientPhone, symptoms, holdToken }`
  - **Response 201**: Returns confirmed appointment object with booking reference.
  - **Response 409**: Returns `DOUBLE_BOOKING_PREVENTED`.
- `GET /api/appointments` – Query appointments filtered by `patientEmail`, `doctorId`, or `date`.
- `PUT /api/appointments/:id` – Update appointment details, post-visit notes, and prescriptions.
- `POST /api/appointments/:id/cancel` – Cancels an appointment and enqueues cancellation email.
- `GET /api/appointments/:id/calendar.ics` – Generates RFC 5545 `.ics` file for calendar synchronization.

### Clinical AI Endpoints
- `POST /api/ai/pre-visit-summary` – Generates structured triage, urgency level, and 3 doctor questions from symptoms.
- `POST /api/ai/post-visit-summary` – Converts clinical notes and prescriptions into patient-friendly instructions.

### Admin & System Reliability Endpoints
- `GET /api/notifications` – *(Admin)* Fetch all notification logs and status metrics.
- `POST /api/notifications/:id/retry` – *(Admin)* Manually re-trigger a failed notification job.
- `POST /api/test/concurrency` – Simulates 3 simultaneous concurrent bookings to prove race-condition safety.

---

## 🔒 10. Role-Based Access Control (RBAC)

| Role | Accessible Routes | Permitted Actions |
| :--- | :--- | :--- |
| **Patient** | `/book-appointment`, `/patient-portal`, `/my-medicines` | Book slots, enter symptoms, view prescriptions, cancel/reschedule, track medicines. |
| **Doctor** | `/doctor-portal` | Review patient symptom triage, enter post-visit notes, write prescriptions, manage leave. |
| **Hospital Admin** | `/admin-portal`, `/hospital`, `/system-design-docs` | Manage doctor rosters, configure working hours/slots, manage leave, monitor notifications. |

Client-side route guards in `src/components/ProtectedRoute.tsx` intercept unauthorized URL tampering and redirect users to `/auth`. All backend endpoints validate user identity and permissions.

---

## ⚡ 11. Double-Booking Prevention & Concurrency Strategy

RapidResQ guarantees zero double-bookings using a **Multi-Tiered Concurrency Engine**:

1. **Database-Level Composite Unique Constraint**:
   ```sql
   CREATE UNIQUE INDEX idx_unique_doctor_slot 
   ON appointments (doctor_id, date, start_time) 
   WHERE status IN ('confirmed', 'completed');
   ```
2. **Check-and-Set Ingress Locking**:
   In `server.ts`, the booking transaction performs an atomic lookup of the active schedule. If any concurrent thread commits the slot micro-seconds prior, the secondary request is caught and immediately responds with `HTTP 409 Conflict: DOUBLE_BOOKING_PREVENTED`.
3. **Live In-App Verification**:
   Navigate to the **Admin Portal (`/admin-portal`)** and click **"Run Live Concurrency Test"**. The system fires 3 simultaneous `Promise.all` requests against the exact same doctor and time slot, visually proving that exactly 1 request succeeds (HTTP 201) while 2 are rejected with atomic 409 Conflict responses.

---

## ⏱️ 12. Slot Hold Mechanism (5-Minute TTL Lock)

When a patient begins checkout:
1. `POST /api/slots/hold` generates a cryptographically random `holdToken` with a 300-second (5 min) TTL in the `slot_holds` registry.
2. During the 5 minutes, `GET /api/slots` returns the slot with `status: 'held'`, rendering it disabled for all other users.
3. If the patient abandons the session, the hold expires lazily (`Date.now() > expiresAt`).
4. Upon successful booking submission with the valid `holdToken`, the reservation is promoted to `confirmed` and the hold is purged atomically.

---

## 🏖️ 13. Doctor Leave Management & Cascading Conflict Resolution

When a doctor logs leave for a date (`POST /api/doctors/:id/leave`):
1. **Immediate Lock**: The date is blacklisted, immediately preventing any new bookings in `GET /api/slots`.
2. **Cascading State Transition**: The system queries all existing confirmed appointments on that date and transitions their status to `rescheduling_required` with the audit reason: `"Doctor on approved medical leave"`.
3. **Patient Notifications**: High-priority alert emails (`DOCTOR_LEAVE_ALERT`) are enqueued with direct links to pick a new consultation date.
4. **Physician Schedule Shield**: The doctor's queue is protected without destructive record deletion.

---

## 🤖 14. AI Clinical Integration & Exact Prompts

RapidResQ utilizes **Google Gemini 3.7 Flash** (`@google/genai`) for administrative summarization. It is strictly non-diagnostic and informs clinicians that output is for informational assistance only.

### 1. Pre-Visit Symptom Triage Prompt
```text
You are an expert clinical intake assistant.
Analyse these patient-reported symptoms and return a strictly valid JSON object with:
1. "urgencyLevel": either "Low", "Medium", or "High"
2. "chiefComplaint": concise 1-sentence summary of the main symptom
3. "suggestedQuestions": exactly 3 relevant clinical follow-up questions for the doctor to ask

Patient Symptoms: "${symptoms}"
```

### 2. Post-Visit Notes Simplification Prompt
```text
You are a compassionate healthcare communications assistant.
Convert these doctor clinical notes and prescriptions into a clear, patient-friendly summary:

Clinical Notes: "${clinicalNotes}"
Prescriptions: ${JSON.stringify(prescriptions)}

Return a strictly valid JSON object with:
1. "patientFriendlySummary": an empathetic, clear explanation of the diagnosis and recovery plan in simple language.
2. "medicationSchedule": array of items with { medicine, dosage, frequency, timing, instructions, duration }.
3. "followUpSteps": array of action items (e.g. rest, hydration, warning signs).
4. "warningSigns": array of red-flag symptoms that require immediate medical attention.
```

### 🛡️ Graceful Failure & Circuit Breaker
If the LLM encounters rate limits, network timeouts, or malformed outputs, RapidResQ activates a built-in deterministic fallback parser that computes keyword urgency and generates standard clinical questions without halting the booking workflow.

---

## 📬 15. Notification Retry Engine & Background Workers

- **Asynchronous Message Queue**: Booking confirmations, rescheduling notices, and cancellation emails are placed into a persistent `notifications` table.
- **Resilient Worker Loop**: An automatic background cron processes queued jobs every 60 seconds.
- **Exponential Backoff**: Transient SMTP or API failures trigger up to 3 automatic retries, logging error details without throwing unhandled exceptions.
- **Manual Intervention**: Admins can inspect failed notifications in `/admin-portal` and click **"Retry Now"** to re-dispatch.

---

## 📅 16. Google Calendar & iCal Integration

- **Universal RFC 5545 `.ics` Export**: Every booking provides a direct download link (`/api/appointments/:id/calendar.ics`) compatible with Apple Calendar, Microsoft Outlook, and Google Calendar.
- **Google Calendar OAuth 2.0 Integration**: Includes `/api/auth/google` initiation and token exchange routes to synchronize events directly into patient and doctor Google Calendar feeds.

---

## 🧪 17. Automated Test Suite & Verification

RapidResQ includes comprehensive Vitest automated test suites covering all critical business logic:

```bash
# Run all unit and integration tests
npm test
```

### Test Coverage Highlights (`src/test/appointment-engine.test.ts`):
- ✅ Slot generation strictly within working hours (excluding lunch breaks).
- ✅ Successful confirmed appointment creation and notification enqueueing.
- ✅ Strict atomic double-booking prevention on identical slots (HTTP 409).
- ✅ Concurrent booking stress testing (`Promise.all`).
- ✅ 5-minute slot hold locking and TTL token validation.
- ✅ Prevention of bookings during doctor approved leave dates.
- ✅ Cascading appointment status update (`rescheduling_required`) upon doctor leave.
- ✅ AI pre-visit structured triage output verification.
- ✅ Deterministic AI circuit breaker fallback on simulated LLM failures.
- ✅ Notification queue retry processor and attempt counter.
- ✅ Prescription frequency to daily reminder timestamp schedule parser.

---

## 🚢 18. Production Deployment

### Production Build & Launch
```bash
# 1. Build the production client bundle and backend CJS executable
npm run build

# 2. Start the production server
npm start
```
The production bundle compiles Vite assets into `/dist` and bundles `server.ts` into `dist/server.cjs` for high-performance deployment on Cloud Run, Render, AWS ECS, or Docker containers.

---

## 👥 19. Demo Accounts & Evaluation Credentials

Use the Quick-Login buttons on the `/auth` page or the credentials below to test each portal:

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@rapidresq.com` | `patient123` | `/patient-portal` & `/book-appointment` |
| **Doctor** | `doctor@rapidresq.com` | `doctor123` | `/doctor-portal` |
| **Admin** | `admin@rapidresq.com` | `admin123` | `/admin-portal` & `/system-design-docs` |
| **Hospital Admin** | `hospital@rapidresq.com` | `hospital123` | `/hospital` |
| **Ambulance Driver**| `driver@rapidresq.com` | `driver123` | `/driver` |

---

## 📄 License
This project is licensed under the MIT License.
