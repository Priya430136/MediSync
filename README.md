# MediSync
### Healthcare Appointment Scheduling & Clinical Follow-Up Platform

[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-14%20passed-success.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

MediSync is a full-stack scheduling and clinical follow-up platform for hospitals and multi-specialty practices. It eliminates double-booking under concurrent load, gives physicians AI-generated pre-visit triage, converts clinical notes into patient-friendly instructions, and automates medication reminders — with dedicated portals for patients, doctors, and administrators.

---

## Why It Matters

| Problem | Solution |
|---|---|
| Race conditions cause double-bookings at peak demand | Three-layer atomic concurrency control (DB constraint + transactional check + short-lived hold lock) |
| Physicians spend significant consult time on basic history-taking | AI pre-visit triage delivers urgency level and suggested questions before the visit |
| Doctor leave silently strands existing bookings | Automatic cascade: affected appointments flagged, patients notified, one-click rescheduling |
| Complex prescriptions lead to poor patient adherence | AI converts clinical notes into plain-language, structured medication schedules |

---

## Key Capabilities

**Patient** — doctor search & filtering, real-time slot booking with a 5-minute hold, AI symptom triage, appointment history with cancel/reschedule, `.ics` calendar export, medication reminders.

**Doctor** — daily clinical dashboard, AI pre-visit briefings, digital prescription builder, one-click AI-generated patient summaries, leave management with automatic conflict detection.

**Admin** — physician roster and scheduling configuration, leave and rescheduling oversight, notification queue monitoring with retry controls, live concurrency stress-test tool.

---

## Architecture

```
React 18 + TypeScript + Tailwind (Patient / Doctor / Admin portals)
                 │  REST / JSON
Express 5 backend — Auth & RBAC · Slot Hold Engine · Appointment
State Machine · Leave Conflict Resolver · Gemini AI Service ·
Calendar Sync · Notification Worker
                 │
PostgreSQL (Supabase) · Google Gemini API · SMTP · Google Calendar API
```

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Router |
| Backend | Node.js, Express 5, esbuild, tsx |
| Data | PostgreSQL / Supabase, composite unique constraints |
| AI | Google Gemini (`@google/genai`), with deterministic fallback on failure |
| Integrations | Google Calendar (OAuth 2.0), RFC 5545 `.ics` export, SMTP |
| Testing | Vitest + Testing Library |

---

## Getting Started

```bash
git clone <repository-url>
cd medisync
npm install
cp .env.example .env
npm run dev        # http://localhost:3000
```

**Requirements:** Node.js ≥ 18, npm ≥ 9.

**Environment variables:** Gemini API key, Google Calendar OAuth credentials, SMTP credentials, and (optionally) a Supabase connection. See `.env.example` for the full list.

```bash
npm run build && npm start   # production build & launch
```

---

## Reliability & Safety Design

- **Zero double-bookings**: a composite unique DB index on `(doctor_id, date, start_time)` backs an atomic check-and-set booking transaction; concurrent collisions return `409 DOUBLE_BOOKING_PREVENTED`. Verifiable live via the Admin Portal's concurrency stress test.
- **5-minute slot hold**: prevents a slot from being claimed by another patient while one user completes intake, without requiring active polling.
- **Doctor leave cascade**: marking a doctor on leave blocks new bookings for that date and automatically flags existing appointments for rescheduling, with patient notifications queued.
- **Resilient notifications**: booking, cancellation, and reminder emails run through a durable queue with a 60-second worker loop and exponential-backoff retries (max 3 attempts), with admin visibility into failures.
- **AI with a safety net**: triage and summarization are informational, not diagnostic; a deterministic fallback parser keeps the booking flow working if the LLM call fails or times out.

---

## API Overview

| Area | Endpoints |
|---|---|
| Auth & RBAC | `/api/auth/*`, role-gated frontend routes via `ProtectedRoute` |
| Doctors & Availability | `/api/doctors`, `/api/doctors/:id/leave`, `/api/slots` |
| Booking | `/api/slots/hold`, `/api/appointments` (CRUD + cancel/reschedule) |
| Clinical AI | `/api/ai/pre-visit-summary`, `/api/ai/post-visit-summary` |
| Calendar | `/api/appointments/:id/calendar.ics`, Google Calendar OAuth sync |
| Admin & Ops | `/api/notifications`, notification retry, concurrency test endpoint |

Full request/response schemas are documented in-app at `/system-design-docs`.

---

## Testing

```bash
npm test
```

Automated coverage includes slot generation, atomic double-booking prevention, concurrent booking stress tests, hold-token TTL validation, leave-driven rescheduling cascades, AI triage output and fallback behavior, and notification retry logic.

---

## Access Control

| Role | Portal | Scope |
|---|---|---|
| Patient | `/patient-portal` | Book, cancel/reschedule, view prescriptions, track medication |
| Doctor | `/doctor-portal` | Review triage, record notes, prescribe, manage leave |
| Admin | `/admin-portal` | Manage roster, scheduling, leave, notifications |

Demo accounts for each role are available from the login screen for evaluation purposes.

---

## License
MIT
