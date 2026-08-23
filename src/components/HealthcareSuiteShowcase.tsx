import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Brain, 
  UserCheck, 
  Stethoscope, 
  Building, 
  Lock, 
  Pill, 
  Mail, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

export const HealthcareSuiteShowcase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"patient" | "doctor" | "admin" | "architecture">("patient");

  return (
    <section id="healthcare-suite" className="py-20 bg-muted/30 border-y border-border/60 relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            ENTERPRISE CLINICAL SUITE & CONCURRENCY ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Healthcare Appointment & <span className="text-primary">Follow-Up Manager</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Full-stack clinical management architecture featuring zero-collision slot booking, Gemini 3.7 Flash pre-visit triage briefings, cascading doctor leave resolution, and automated medication compliance pipelines.
          </p>
        </div>

        {/* Role & Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          <Button
            variant={activeTab === "patient" ? "default" : "outline"}
            onClick={() => setActiveTab("patient")}
            className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Patient Experience
          </Button>
          <Button
            variant={activeTab === "doctor" ? "default" : "outline"}
            onClick={() => setActiveTab("doctor")}
            className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
          >
            <Stethoscope className="w-4 h-4" />
            Doctor Workspace
          </Button>
          <Button
            variant={activeTab === "admin" ? "default" : "outline"}
            onClick={() => setActiveTab("admin")}
            className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
          >
            <Building className="w-4 h-4" />
            Hospital Administration
          </Button>
          <Button
            variant={activeTab === "architecture" ? "default" : "outline"}
            onClick={() => setActiveTab("architecture")}
            className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Concurrency & System Architecture
          </Button>
        </div>

        {/* Dynamic Showcase Body */}
        {activeTab === "patient" && (
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  1. Discovery, Hold & Pre-Visit Intake
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Frictionless Doctor Search with 5-Minute Slot Locks
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Patients filter certified specialists by clinical department, experience, and fees. Once a time slot is selected, a 5-minute cryptographic lock (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">holdToken</code>) reserves the slot while symptom details are entered.
                </p>
                <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Lock className="w-4 h-4" /> 5-Min Slot Hold
                    </div>
                    <p className="text-xs text-muted-foreground">Prevents cart sniping while you describe your symptoms.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Brain className="w-4 h-4" /> AI Symptom Triage
                    </div>
                    <p className="text-xs text-muted-foreground">Classifies urgency (Low/Med/High) and generates doctor questions.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Calendar className="w-4 h-4" /> 1-Click iCal Export
                    </div>
                    <p className="text-xs text-muted-foreground">Direct RFC 5545 .ics download for Apple, Google, and Outlook.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Pill className="w-4 h-4" /> Medication Schedule
                    </div>
                    <p className="text-xs text-muted-foreground">Daily dosage tracking with taken/skipped compliance buttons.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button onClick={() => navigate("/book")} size="lg" className="font-bold text-sm gap-2">
                  <Calendar className="w-4 h-4" /> Book an Appointment Now
                </Button>
                <Button onClick={() => navigate("/patient-portal")} variant="outline" size="lg" className="font-semibold text-sm gap-2">
                  <UserCheck className="w-4 h-4" /> Open Patient Health Portal
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Intake Preview</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Slot Held (04:48)</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-foreground">Dr. Ananya Sharma (Cardiology)</span>
                  <span className="font-mono text-primary font-bold">10:00 AM</span>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5" /> AI Pre-Visit Triage Output
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Urgency Level:</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Medium Urgency</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    "Patient reports persistent morning dizziness and mild shortness of breath upon exertion for 4 days."
                  </p>
                </div>
                <div className="p-3 bg-card border rounded-lg space-y-1.5">
                  <span className="font-semibold text-foreground text-[11px]">3 Suggested Questions for Doctor:</span>
                  <ul className="list-disc list-inside text-muted-foreground text-[10px] space-y-1">
                    <li>How frequently do the dizzy spells occur during positional changes?</li>
                    <li>Are you currently monitoring home resting blood pressure?</li>
                    <li>Any associated palpitations, chest tightness, or syncope?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "doctor" && (
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="text-blue-600 border-blue-500/30 bg-blue-500/5">
                  2. Clinical Queue, AI Briefing & Rx Writer
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Physician Workspace with Instant Pre-Visit Intelligence
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Doctors start consultations equipped with AI symptom summaries, duration metrics, and targeted clinical inquiries. Post-consultation, the digital Rx builder translates complex regimens into plain-English patient guides.
                </p>
                <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      <Stethoscope className="w-4 h-4" /> Consultation Queue
                    </div>
                    <p className="text-xs text-muted-foreground">Real-time schedule with active consultation status markers.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      <FileText className="w-4 h-4" /> Multi-Drug Rx Writer
                    </div>
                    <p className="text-xs text-muted-foreground">Dosage, frequency (OD/BD/TDS), timing, and duration.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      <Sparkles className="w-4 h-4" /> AI Patient Summary
                    </div>
                    <p className="text-xs text-muted-foreground">1-click plain-English translation with warning flag alerts.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      <Calendar className="w-4 h-4" /> Leave Management
                    </div>
                    <p className="text-xs text-muted-foreground">Mark absences with automated cascading patient rescheduling.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button onClick={() => navigate("/doctor-portal")} size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold text-sm gap-2">
                  <Stethoscope className="w-4 h-4" /> Launch Doctor Workspace
                </Button>
                <Button onClick={() => navigate("/auth")} variant="outline" size="lg" className="font-semibold text-sm gap-2">
                  <UserCheck className="w-4 h-4" /> Doctor Demo Sign-In
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor Queue View</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">Active Session</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Rahul Verma (Age 42)</span>
                    <Badge className="bg-red-500/10 text-red-600 text-[10px] border-red-500/20">High Urgency</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">Chief Complaint: Severe intermittent chest tightness radiating to left shoulder.</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                  <span className="font-semibold text-foreground text-[11px]">Prescription Formatter:</span>
                  <div className="bg-card p-2 rounded border font-mono text-[10px] space-y-1">
                    <div className="text-primary font-bold">1. Atorvastatin 20mg</div>
                    <div className="text-muted-foreground">Once daily at bedtime • 30 days</div>
                    <div className="text-primary font-bold pt-1">2. Metoprolol 25mg</div>
                    <div className="text-muted-foreground">Twice daily after meals • 14 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="text-purple-600 border-purple-500/30 bg-purple-500/5">
                  3. Schedules, Roster & System Health
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Centralized Administration & Live Concurrency Stress Testing
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Hospital admins configure working hours, slot durations (15 to 60 min), and lunch break exclusions. When doctors log approved leaves, the system cascades affected appointments to <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">rescheduling_required</code> and triggers notification alerts.
                </p>
                <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                      <Clock className="w-4 h-4" /> Working Hours & Granularity
                    </div>
                    <p className="text-xs text-muted-foreground">15, 30, 45, or 60-min slots with custom break periods.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                      <RotateCcw className="w-4 h-4" /> Cascading Leave Resolver
                    </div>
                    <p className="text-xs text-muted-foreground">Protects patients by automating rescheduling queues.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                      <Mail className="w-4 h-4" /> Resilient Email Queue
                    </div>
                    <p className="text-xs text-muted-foreground">Background worker with automatic retries and error logging.</p>
                  </div>
                  <div className="p-3.5 bg-card border rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                      <Zap className="w-4 h-4" /> Concurrency Stress Tester
                    </div>
                    <p className="text-xs text-muted-foreground">Simulate 3 simultaneous requests to prove race condition safety.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button onClick={() => navigate("/admin-portal")} size="lg" className="bg-purple-600 hover:bg-purple-700 font-bold text-sm gap-2">
                  <Building className="w-4 h-4" /> Open Admin Dashboard
                </Button>
                <Button onClick={() => navigate("/system-design-docs")} variant="outline" size="lg" className="font-semibold text-sm gap-2">
                  <FileText className="w-4 h-4" /> View Technical System Specs
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Concurrency Terminal</span>
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">Stress Test Passed</Badge>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-muted/60 rounded border text-[11px] text-foreground">
                  <span className="text-emerald-500 font-bold">REQ #1:</span> HTTP 201 Created • Slot Confirmed (apt-8821)
                </div>
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-600">
                  <span className="font-bold">REQ #2:</span> HTTP 409 Conflict • DOUBLE_BOOKING_PREVENTED
                </div>
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-600">
                  <span className="font-bold">REQ #3:</span> HTTP 409 Conflict • DOUBLE_BOOKING_PREVENTED
                </div>
                <p className="text-[10px] text-muted-foreground font-sans pt-1">
                  Verified across 3 simultaneous parallel requests for same doctor & slot.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "architecture" && (
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            <Card className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Atomic Concurrency Guard</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Composite unique constraints on <code className="font-mono text-primary">(doctor_id, date, start_time)</code> with check-and-set transaction handling eliminate double-bookings permanently.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 font-mono text-muted-foreground">
                  <div>✓ Check-and-set ingress lock</div>
                  <div>✓ 5-Minute temporary slot TTL</div>
                  <div>✓ HTTP 409 Conflict response</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Leave Conflict Engine</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Absences marked by doctors trigger automated state mutations to <code className="font-mono text-blue-600">rescheduling_required</code> without destructive data loss.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 font-mono text-muted-foreground">
                  <div>✓ Immediate date blacklist</div>
                  <div>✓ Non-destructive state audit</div>
                  <div>✓ Enqueued patient alert email</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Idempotent Background Worker</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Asynchronous email notifications and medication reminder jobs execute with exponential backoff (max 3 attempts) and deduplication keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 font-mono text-muted-foreground">
                  <div>✓ 60-Second background cron</div>
                  <div>✓ md5 deduplication hash</div>
                  <div>✓ Manual retry triggers in UI</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Demo Navigation Strip */}
        <div className="mt-14 p-6 bg-card border rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-foreground text-base">Explore RapidResQ Application Portals</h4>
            <p className="text-xs text-muted-foreground">Jump directly into any role-based interface or review the technical documentation.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button size="sm" variant="outline" onClick={() => navigate("/book")} className="text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" /> Book Appointment
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/patient-portal")} className="text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Patient Portal
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/doctor-portal")} className="text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Doctor Portal
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin-portal")} className="text-xs font-semibold">
              <Building className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Admin Console
            </Button>
            <Button size="sm" variant="default" onClick={() => navigate("/system-design-docs")} className="text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> System Design Write-Up
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
