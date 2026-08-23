import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  Calendar,
  Sparkles,
  Database,
  Server,
  Code2,
  CheckCircle2,
  FileCode,
  ArrowRight,
  ArrowLeft,
  Home
} from "lucide-react";

export const SystemDesignDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Breadcrumb / Quick Back Navigation */}
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link 
                to="/admin" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Admin Portal
              </Link>
              <Link 
                to="/book" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="border-b pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Engineering Specifications
          </Badge>
          <Badge className="bg-green-600 text-white text-xs">Production Grade</Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
          System Architecture & Concurrency Design Document
        </h1>
        <p className="text-base text-muted-foreground mt-2 max-w-3xl">
          Complete architectural blueprint for high-concurrency doctor appointment scheduling, ABDM compliance, Gemini 3.7 Flash clinical triage, atomic double-booking prevention, and calendar integrations.
        </p>
      </div>

      {/* Navigation Jump Bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-xl border text-xs font-semibold">
        <a href="#concurrency" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          1. Double-Booking Prevention
        </a>
        <a href="#slot-hold" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          2. Slot Hold (5-min TTL)
        </a>
        <a href="#doctor-leave" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          3. Doctor Leave Conflict Handling
        </a>
        <a href="#notifications" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          4. Notification Retry Queue
        </a>
        <a href="#ai-prompts" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          5. Gemini LLM Architecture
        </a>
        <a href="#api-spec" className="px-3 py-1.5 bg-background hover:bg-muted border rounded-lg transition-colors">
          6. API & DB Schema
        </a>
      </div>

      {/* SECTION 1: DOUBLE-BOOKING PREVENTION */}
      <section id="concurrency" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            1. Double-Booking Prevention & Concurrency Control
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              In high-traffic outpatient hospital platforms, hundreds of patients may attempt to book the same prime consultation slot (e.g., Monday 10:00 AM) simultaneously. Without atomic concurrency safeguards, race conditions lead to catastrophic double-bookings, clinical scheduling confusion, and patient distress.
            </p>

            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider pt-2">
              Three-Tier Defense Architecture:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <span className="font-bold text-foreground block flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-primary" /> Tier 1: Atomic Database Constraint
                </span>
                <p className="text-muted-foreground">
                  A composite unique index is enforced on <code>(doctor_id, appointment_date, start_time)</code> with a partial index filter <code>WHERE status IN ('confirmed', 'completed')</code>. Any duplicate concurrent insert is rejected at the database engine level with a unique constraint violation error.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <span className="font-bold text-foreground block flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" /> Tier 2: Check-and-Set Ingress Locking
                </span>
                <p className="text-muted-foreground">
                  The API booking endpoint executes an atomic read-then-write transaction. Before creating the record, the engine validates whether a confirmed appointment already occupies the exact window <code>[startTime, endTime)</code>. If found, it immediately aborts and returns <code>HTTP 409 Conflict</code>.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <span className="font-bold text-foreground block flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-primary" /> Tier 3: Distributed Mutex (Redis/In-Memory)
                </span>
                <p className="text-muted-foreground">
                  In distributed multi-instance deployments, a distributed mutex key <code>lock:slot:{"{doctorId}"}:{"{date}"}:{"{startTime}"}</code> is acquired with a 2000ms lease during the checkout confirmation transaction, ensuring serialized evaluation across all application pods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: 5-MINUTE SLOT HOLD TTL */}
      <section id="slot-hold" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            2. Slot Hold Mechanism (5-Minute Distributed TTL Lock)
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              When a patient clicks an available time slot and begins filling out their symptoms or payment details, the system must temporarily hold that slot so other users don't snipe it from under them.
            </p>

            <div className="p-4 bg-muted/40 rounded-xl border space-y-3 text-xs">
              <h4 className="font-bold text-foreground">How the 5-Minute Hold Lifecycle Operates:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong>Hold Acquisition:</strong> The client sends <code>POST /api/slots/hold</code>. The backend verifies that the slot is unheld and unbooked, then creates a temporary hold record with a cryptographically secure UUID <code>holdToken</code> and a 300-second (5 min) expiry timestamp.
                </li>
                <li>
                  <strong>Real-Time Slot Status:</strong> When other patients query <code>GET /api/slots</code>, held slots are designated as <code>status: 'held'</code> and rendered as disabled in their interface.
                </li>
                <li>
                  <strong>Automatic Expiry (TTL):</strong> If the patient closes their tab or fails to confirm within 300 seconds, the hold record automatically expires. No background cron is strictly required because all validation lookups discard expired tokens on-the-fly (<code>expiresAt &lt; Date.now()</code>).
                </li>
                <li>
                  <strong>Atomic Conversion on Booking:</strong> When the patient submits <code>POST /api/appointments</code> with their <code>holdToken</code>, the server validates token ownership, converts the slot to <code>status: 'confirmed'</code>, and deletes the hold record atomically.
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3: DOCTOR LEAVE & CONFLICT HANDLING */}
      <section id="doctor-leave" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/10 text-red-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            3. Doctor Leave Conflict Handling & Cascading Patient Notifications
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              When a doctor suddenly registers planned or emergency leave (e.g. <code>POST /api/doctors/:id/leave</code>), existing confirmed patient appointments on that date become unserviceable.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-900 dark:text-red-300">
                <strong>Step 1: Conflict Detection:</strong> The server queries all appointments matching <code>doctorId</code>, <code>date</code>, and <code>status = 'confirmed'</code>.
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-300">
                <strong>Step 2: Status Transition:</strong> Each conflicting appointment is immediately transitioned to <code>rescheduling_required</code> with a detailed <code>cancellationReason</code>.
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-900 dark:text-blue-300">
                <strong>Step 3: Priority Notification Dispatch:</strong> The system dispatches high-priority email notices to each affected patient with a 1-click priority rescheduling link that bypasses queue restrictions.
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-900 dark:text-green-300">
                <strong>Step 4: Slot Availability Invalidation:</strong> All slot generation endpoints block the entire date from future bookings for that doctor.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: NOTIFICATION RETRY QUEUE */}
      <section id="notifications" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            4. Notification Failure Handling & Exponential Backoff Retry Queue
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              Email delivery through external SMTP/SES gateways is prone to transient network blips, rate limits, and mailbox timeouts.
            </p>

            <div className="p-4 bg-muted/40 rounded-xl border space-y-2 text-xs">
              <h4 className="font-bold text-foreground">Resilience & Retry Strategy:</h4>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                <li>
                  <strong>Asynchronous Dispatch:</strong> Notifications are never dispatched in the synchronous HTTP request path; instead, they are enqueued into the notification queue.
                </li>
                <li>
                  <strong>Exponential Backoff:</strong> Failed deliveries retry with jittered exponential backoff: <code>delay = min(base * 2^attempts, maxDelay)</code> (e.g. 5s, 15s, 45s).
                </li>
                <li>
                  <strong>Dead-Letter Queue (DLQ):</strong> After 5 failed attempts, the notification moves to <code>failed</code> status for admin inspection and manual retry without losing the audit trail.
                </li>
                <li>
                  <strong>Idempotency Keys:</strong> Every notification record has an <code>idempotencyKey</code> derived from <code>{"{appointmentId}"}_{"{notificationType}"}</code> to prevent duplicate emails from being sent to patients.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 5: GEMINI AI ARCHITECTURE */}
      <section id="ai-prompts" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            5. Gemini 3.7 Flash Clinical LLM Architecture
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              We leverage <strong>Gemini 3.7 Flash</strong> (<code>gemini-3.7-flash</code>) via the official <code>@google/genai</code> SDK for both Pre-Visit Symptom Triage and Post-Visit Clinical Summary generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <span className="font-bold text-primary block">Pre-Visit Symptom Triage Prompt</span>
                <p className="text-muted-foreground">
                  Translates unstructured patient symptom descriptions, duration, and medical history into a concise 1-2 sentence chief complaint, an urgency classification (<code>Low</code>, <code>Medium</code>, <code>High</code>), and exactly 3 targeted diagnostic questions for the doctor.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <span className="font-bold text-green-600 block">Post-Visit Clinical Summary Prompt</span>
                <p className="text-muted-foreground">
                  Converts doctor's clinical notes, diagnosis, and prescription lines into a warm, empathetic 2-3 sentence layperson overview, a structured medication schedule with timings, a follow-up checklist, and emergency warning signs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 6: API & DATABASE SCHEMA */}
      <section id="api-spec" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <Code2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            6. REST API Endpoint Specification
          </h2>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead className="bg-muted/60 text-muted-foreground border-b">
                  <tr>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Concurrency / AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-2.5 text-blue-600 font-bold">GET</td>
                    <td className="p-2.5">/api/doctors</td>
                    <td className="p-2.5">List specialists with filters</td>
                    <td className="p-2.5">Read cache</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-green-600 font-bold">GET</td>
                    <td className="p-2.5">/api/slots</td>
                    <td className="p-2.5">Compute real-time doctor slots</td>
                    <td className="p-2.5">Reflects active 5-min holds</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-amber-600 font-bold">POST</td>
                    <td className="p-2.5">/api/slots/hold</td>
                    <td className="p-2.5">Acquire 5-min exclusive slot lock</td>
                    <td className="p-2.5">Atomic 300s TTL token</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">POST</td>
                    <td className="p-2.5">/api/ai/pre-visit-summary</td>
                    <td className="p-2.5">Gemini 3.7 Flash pre-visit triage</td>
                    <td className="p-2.5">Urgency + 3 Doctor Questions</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-green-600 font-bold">POST</td>
                    <td className="p-2.5">/api/appointments</td>
                    <td className="p-2.5">Atomically commit appointment</td>
                    <td className="p-2.5">Zero double-booking guarantee</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">POST</td>
                    <td className="p-2.5">/api/ai/post-visit-summary</td>
                    <td className="p-2.5">Gemini 3.7 Flash post-visit summary</td>
                    <td className="p-2.5">Medication Reminders + iCal</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-red-600 font-bold">POST</td>
                    <td className="p-2.5">/api/doctors/:id/leave</td>
                    <td className="p-2.5">Mark doctor leave date</td>
                    <td className="p-2.5">Cascades patient reschedule alerts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Link to="/book">
          <Button className="font-bold text-xs">
            <Calendar className="w-4 h-4 mr-1.5" /> Launch Booking Flow
          </Button>
        </Link>
        <Link to="/admin">
          <Button variant="outline" className="font-bold text-xs">
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Open Admin Portal <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
        </div>
      </main>
    </div>
  );
};
export default SystemDesignDocs;
