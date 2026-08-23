import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Doctor, Appointment, PrescriptionItem, Slot } from "@/types/appointment";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GoogleCalendarManager } from "@/components/GoogleCalendarManager";
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  Sparkles,
  Pill,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  HeartPulse,
  Mail,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Home,
  Check,
  Send,
  Eye,
  Building,
  DollarSign,
  Award
} from "lucide-react";

export const DoctorPortal = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("doc-1");
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active consultation dialog state
  const [activeConsultation, setActiveConsultation] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [vitals, setVitals] = useState({
    bp: "120/80 mmHg",
    heartRate: "72 bpm",
    temperature: "98.6 °F",
    spo2: "99%"
  });

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: "rx-temp-1",
      medicineName: "",
      dosage: "500mg",
      frequency: "Twice daily after meals",
      timing: "After Meals",
      durationDays: 5,
      instructions: "Take with water."
    }
  ]);

  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [regeneratingPostVisitId, setRegeneratingPostVisitId] = useState<string | null>(null);
  const [testingPostVisit, setTestingPostVisit] = useState(false);
  const [postVisitTestModalOpen, setPostVisitTestModalOpen] = useState(false);
  const [postVisitTestResults, setPostVisitTestResults] = useState<any>(null);

  // Leave Management State
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("Scheduled Medical Conference");
  const [markingLeave, setMarkingLeave] = useState(false);

  // Slot Preview State
  const todayStr = new Date().toISOString().split("T")[0];
  const [previewDate, setPreviewDate] = useState(todayStr);
  const [previewSlots, setPreviewSlots] = useState<Slot[]>([]);
  const [loadingPreviewSlots, setLoadingPreviewSlots] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<string>("available");
  const [regeneratingAiId, setRegeneratingAiId] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorAppointments(selectedDoctorId);
      loadDoctorSlotPreview(selectedDoctorId, previewDate);
    }
  }, [selectedDoctorId]);

  const loadDoctors = async () => {
    try {
      const docs = await API.getDoctors();
      setDoctors(docs);
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id);
        setActiveDoctor(docs[0]);
      }
    } catch (err: any) {
      toast.error("Failed to load doctors: " + err.message);
    }
  };

  const loadDoctorAppointments = async (docId: string) => {
    setLoading(true);
    try {
      const apts = await API.getAppointments({ doctorId: docId });
      setAppointments(apts);
      const current = doctors.find(d => d.id === docId);
      if (current) setActiveDoctor(current);
    } catch (err: any) {
      toast.error("Failed to load doctor appointments: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSlotPreview = async (docId: string, date: string) => {
    setLoadingPreviewSlots(true);
    try {
      const res = await API.getSlots(docId, date);
      setPreviewSlots(res.slots || []);
      setPreviewStatus(res.status || "available");
    } catch (err: any) {
      toast.error("Failed to preview slots: " + err.message);
    } finally {
      setLoadingPreviewSlots(false);
    }
  };

  const handleOpenConsultation = (apt: Appointment) => {
    setActiveConsultation(apt);
    setDiagnosis(apt.diagnosis || "");
    setClinicalNotes(apt.clinicalNotes || "");
    setFollowUpInstructions(apt.followUpInstructions || "");
    if (apt.vitals) setVitals(apt.vitals as any);
    if (apt.prescriptions && apt.prescriptions.length > 0) {
      setPrescriptions(apt.prescriptions);
    } else {
      setPrescriptions([
        {
          id: `rx-${Date.now()}`,
          medicineName: "",
          dosage: "1 Tablet",
          frequency: "Twice daily after meals",
          timing: "After Meals",
          durationDays: 5,
          instructions: "Take with water."
        }
      ]);
    }
  };

  const handleAddPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        medicineName: "",
        dosage: "1 Tablet",
        frequency: "Once daily",
        timing: "After Meals",
        durationDays: 5,
        instructions: ""
      }
    ]);
  };

  const handleRemovePrescriptionRow = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleUpdatePrescriptionRow = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  // Finalize consultation & Trigger AI Post-Visit Summary
  const handleFinalizeConsultation = async () => {
    if (!activeConsultation) return;
    if (!diagnosis.trim() && !clinicalNotes.trim() && prescriptions.filter(p => p.medicineName.trim()).length === 0) {
      toast.error("Please enter clinical notes, diagnosis, or prescribed medications.");
      return;
    }

    const validPrescriptions = prescriptions.filter(p => p.medicineName.trim().length > 0);

    setSubmittingNotes(true);
    try {
      const response = await API.submitPostVisitNotes(activeConsultation.id, {
        clinicalNotes,
        prescriptions: validPrescriptions,
        followUpInstructions,
        diagnosis,
        vitals
      });

      if (response.aiGenerated) {
        toast.success("Consultation saved! AI patient-friendly summary and medication reminders generated.");
      } else {
        toast.info("Clinical notes & prescription securely saved in database. AI summary queued/fallback ready.");
      }

      setActiveConsultation(null);
      await loadDoctorAppointments(selectedDoctorId);
    } catch (err: any) {
      toast.error("Failed to finalize consultation: " + err.message);
    } finally {
      setSubmittingNotes(false);
    }
  };

  // Regenerate Post-Visit AI Summary
  const handleRegeneratePostVisitAISummary = async (aptId: string) => {
    setRegeneratingPostVisitId(aptId);
    try {
      const res = await API.regeneratePostVisitAISummary(aptId);
      toast.success("Patient-friendly AI summary regenerated successfully!");
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, postVisitAISummary: res.summary } : a));
    } catch (err: any) {
      toast.error("Regeneration failed: " + err.message);
    } finally {
      setRegeneratingPostVisitId(null);
    }
  };

  // Run Post-Visit Workflow Automated Tests
  const handleRunPostVisitTest = async () => {
    setTestingPostVisit(true);
    setPostVisitTestResults(null);
    setPostVisitTestModalOpen(true);
    try {
      const res = await API.runPostVisitWorkflowTest();
      setPostVisitTestResults(res);
      if (res.allTestsPassed) {
        toast.success("All Post-Visit Workflow & Resilience Tests Passed!");
      } else {
        toast.error("Some Post-Visit tests did not pass.");
      }
    } catch (err: any) {
      toast.error("Post-Visit workflow test failed to execute: " + err.message);
    } finally {
      setTestingPostVisit(false);
    }
  };

  // Regenerate Pre-Visit AI Summary
  const handleRegenerateAISummary = async (aptId: string) => {
    setRegeneratingAiId(aptId);
    try {
      const res = await API.regeneratePreVisitAISummary(aptId);
      toast.success("AI Pre-Visit analysis refreshed!");
      // Update local state
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, preVisitAISummary: res.summary } : a));
      if (activeConsultation?.id === aptId) {
        setActiveConsultation(prev => prev ? { ...prev, preVisitAISummary: res.summary } : null);
      }
    } catch (err: any) {
      toast.error("Regeneration failed: " + err.message);
    } finally {
      setRegeneratingAiId(null);
    }
  };

  // Handle Mark Leave with Live Conflict Detection
  const handleMarkLeave = async () => {
    if (!leaveDate) {
      toast.error("Please select a date to mark leave.");
      return;
    }

    setMarkingLeave(true);
    try {
      const result = await API.markDoctorLeave(selectedDoctorId, leaveDate, leaveReason);
      if (result.conflictsCount > 0) {
        toast.warning(
          `Leave marked. ${result.conflictsCount} patient booking(s) detected and automatically notified for priority rescheduling!`
        );
      } else {
        toast.success(`Leave marked for ${leaveDate} with 0 conflicting bookings.`);
      }
      setLeaveDate("");
      await loadDoctors();
      await loadDoctorAppointments(selectedDoctorId);
      loadDoctorSlotPreview(selectedDoctorId, previewDate);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark leave.");
    } finally {
      setMarkingLeave(false);
    }
  };

  // Handle Cancel Leave
  const handleRemoveLeave = async (date: string) => {
    try {
      await API.removeDoctorLeave(selectedDoctorId, date);
      toast.success(`Leave on ${date} removed. You are now available on this day.`);
      await loadDoctors();
      loadDoctorSlotPreview(selectedDoctorId, previewDate);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove leave.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
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
                to="/patient-portal" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Patient Portal
              </Link>
              <Link 
                to="/admin" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Admin Portal
              </Link>
            </div>
          </div>

          {/* Top Header & Doctor Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 mr-1" /> Doctor Workspace
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Doctor Portal & Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your clinical credentials, manage schedule leave, inspect live slots, review patient pre-visit AI briefings, and submit consultation notes.
          </p>
        </div>

        {/* Doctor Selector */}
        <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border">
          <span className="text-xs text-muted-foreground font-medium">Doctor Workspace:</span>
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              const found = doctors.find(d => d.id === e.target.value);
              if (found) setActiveDoctor(found);
            }}
            className="text-xs font-semibold bg-background border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialisation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Summary Banner */}
      {activeDoctor && (
        <Card className="border shadow-sm bg-muted/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={activeDoctor.avatar}
                alt={activeDoctor.name}
                className="w-14 h-14 rounded-xl object-cover border"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-base text-foreground">{activeDoctor.name}</h3>
                <p className="text-xs text-primary font-semibold">{activeDoctor.specialisation} • {activeDoctor.qualifications}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeDoctor.hospitalAffiliation} ({activeDoctor.roomNumber})</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div>
                <span className="block font-bold text-foreground">{activeDoctor.workingHours.start} - {activeDoctor.workingHours.end}</span>
                <span>Working Hours</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="block font-bold text-foreground">{activeDoctor.slotDurationMinutes} mins</span>
                <span>Slot Duration</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="block font-bold text-foreground">{appointments.length} Total</span>
                <span>Appointments</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-lg">
          <TabsTrigger value="queue" className="text-xs font-bold">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Queue ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs font-bold">
            <User className="w-3.5 h-3.5 mr-1.5" /> My Profile
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Leave & Slots
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Google Calendar
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PATIENT QUEUE & AI PRE-VISIT BRIEFINGS */}
        <TabsContent value="queue" className="space-y-6">
          {/* Post-Visit Workflow Diagnostics & Verification Banner */}
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground block">Post-Visit Workflow & Resilience Verification</span>
                <span className="text-muted-foreground text-[11px]">
                  Validates clinical notes submission, prescription source-of-truth immutability, LLM timeout/failure resilience, and patient portal summary delivery.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunPostVisitTest}
              disabled={testingPostVisit}
              className="text-xs font-bold shrink-0 border-primary/30 text-primary hover:bg-primary/10"
            >
              {testingPostVisit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Running Resilience Tests...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" /> Run Post-Visit Workflow Test
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading patient appointments...
            </div>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-3">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-base text-foreground">No appointments in your queue</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Patients booking consultations with {activeDoctor?.name} will appear here along with Gemini AI pre-visit briefings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <Card
                  key={apt.id}
                  className={`border transition-all ${
                    apt.status === "completed"
                      ? "border-green-500/30 bg-green-500/5"
                      : apt.preVisitAISummary?.urgencyLevel === "High"
                      ? "border-red-500/40 shadow-sm"
                      : "border-border shadow-sm"
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground">{apt.patientName}</h4>
                          <span className="text-xs text-muted-foreground">
                            ({apt.patientAge}y, {apt.patientGender})
                          </span>
                          <Badge
                            className={`text-[10px] font-bold ${
                              apt.preVisitAISummary?.urgencyLevel === "High"
                                ? "bg-red-500 text-white"
                                : apt.preVisitAISummary?.urgencyLevel === "Medium"
                                ? "bg-amber-500 text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            AI Urgency: {apt.preVisitAISummary?.urgencyLevel || "Low"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Scheduled: <span className="font-bold text-foreground">{apt.date}</span> at <span className="font-bold text-foreground">{apt.startTime} - {apt.endTime}</span> • Ref: {apt.bookingReference}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Status: {apt.status.toUpperCase()}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleOpenConsultation(apt)}
                          className={apt.status === "completed" ? "bg-muted text-foreground hover:bg-muted/80 text-xs" : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          {apt.status === "completed" ? "Edit Notes / Summary" : "Start Consultation"}
                        </Button>
                      </div>
                    </div>

                    {/* Pre-Visit AI Briefing Box for Doctor */}
                    <div className="p-4 bg-muted/40 rounded-xl border space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-bold text-foreground">Pre-Visit AI Clinical Briefing (Gemini 3.7 Flash)</span>
                          {apt.preVisitAISummary?.isFallback && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                              Heuristic Fallback
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] font-bold ${
                              apt.preVisitAISummary?.urgencyLevel === "High"
                                ? "bg-red-500 text-white"
                                : apt.preVisitAISummary?.urgencyLevel === "Medium"
                                ? "bg-amber-500 text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            Urgency: {apt.preVisitAISummary?.urgencyLevel || "Low"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegenerateAISummary(apt.id)}
                            disabled={regeneratingAiId === apt.id}
                            className="h-6 text-[10px] px-2"
                          >
                            {regeneratingAiId === apt.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Refreshing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" /> Re-analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="font-semibold text-muted-foreground block text-[11px]">Patient Symptoms:</span>
                          <p className="text-foreground italic bg-background p-2 rounded border">{apt.symptoms}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground block text-[11px]">Chief Complaint (AI Synthesized):</span>
                          <p className="text-foreground font-medium bg-background p-2 rounded border">
                            {apt.preVisitAISummary?.chiefComplaint || apt.symptoms}
                          </p>
                        </div>
                      </div>

                      {apt.preVisitAISummary && apt.preVisitAISummary.suggestedQuestions && (
                        <div>
                          <span className="font-semibold text-muted-foreground block text-[11px] mb-1">
                            Three Suggested Questions for the Doctor:
                          </span>
                          <ul className="space-y-1 bg-background p-2.5 rounded-lg border text-foreground/90 list-disc list-inside">
                            {apt.preVisitAISummary.suggestedQuestions.map((q, i) => (
                              <li key={i} className="text-xs">{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Clinical Non-Diagnosis Disclaimer */}
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Clinical Support Feature:</strong> {apt.preVisitAISummary?.disclaimer || "This summary is an AI summarization/support feature to assist during consultation, not a medical diagnosis."}
                        </span>
                      </div>
                    </div>

                    {/* If Completed: Post-Visit Consultation Notes & AI Patient-Friendly Summary */}
                    {apt.status === "completed" && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-bold text-emerald-950 dark:text-emerald-300 text-sm">
                              Doctor's Post-Visit Record & AI Patient Summary
                            </h4>
                            {apt.postVisitAISummary?.isFallback && (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                                Heuristic Fallback
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegeneratePostVisitAISummary(apt.id)}
                            disabled={regeneratingPostVisitId === apt.id}
                            className="h-6 text-[10px] px-2 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            {regeneratingPostVisitId === apt.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Regenerating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" /> Regenerate / Retry AI Summary
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Doctor's Clinical Diagnosis & Notes (Source of Truth) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-background/80 p-3 rounded-lg border">
                          <div>
                            <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                              Clinical Diagnosis:
                            </span>
                            <p className="text-foreground font-semibold">{apt.diagnosis || "Consultation Completed"}</p>
                          </div>
                          {apt.followUpInstructions && (
                            <div>
                              <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                                Follow-Up Instructions:
                              </span>
                              <p className="text-foreground">{apt.followUpInstructions}</p>
                            </div>
                          )}
                          {apt.clinicalNotes && (
                            <div className="sm:col-span-2 pt-1 border-t">
                              <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                                Doctor's Clinical Notes (Secure Source of Truth):
                              </span>
                              <p className="text-foreground text-xs leading-relaxed italic">{apt.clinicalNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Doctor's Original Prescriptions */}
                        {apt.prescriptions && apt.prescriptions.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-primary" /> Doctor's Prescribed Medications (Source of Truth)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {apt.prescriptions.map((rx, idx) => (
                                <div key={idx} className="p-2.5 bg-background border rounded-lg space-y-1">
                                  <div className="flex justify-between font-bold text-foreground">
                                    <span>{rx.medicineName}</span>
                                    <span className="text-primary font-mono">{rx.dosage}</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {rx.frequency} • {rx.timing} ({rx.durationDays || rx.duration} days)
                                  </p>
                                  {rx.instructions && (
                                    <p className="text-[10px] text-muted-foreground italic">Note: {rx.instructions}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI-Generated Patient-Friendly Summary Box */}
                        {apt.postVisitAISummary && (
                          <div className="space-y-2.5 pt-2 border-t border-emerald-500/20">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-bold text-emerald-950 dark:text-emerald-300 text-xs">
                                AI Patient-Friendly Summary (Delivered to Patient Portal)
                              </span>
                            </div>
                            <p className="text-foreground/90 font-medium bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 leading-relaxed">
                              {apt.postVisitAISummary.patientFriendlySummary}
                            </p>

                            {/* Medication schedule generated by AI */}
                            {apt.postVisitAISummary.medicationSchedule && apt.postVisitAISummary.medicationSchedule.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground text-[11px] block">Medication Schedule:</span>
                                <div className="space-y-1">
                                  {apt.postVisitAISummary.medicationSchedule.map((m, i) => (
                                    <div key={i} className="p-2 bg-background border rounded text-[11px] flex justify-between items-center">
                                      <div>
                                        <strong>{m.medicine}</strong> ({m.dosage}) - <span className="text-muted-foreground">{m.frequency}, {m.timing}</span>
                                      </div>
                                      <span className="text-[10px] text-primary font-medium">{m.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Follow-up steps */}
                            {apt.postVisitAISummary.followUpSteps && (
                              <div>
                                <span className="font-semibold text-foreground text-[11px] block mb-1">Follow-up Steps:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] bg-background p-2.5 rounded border">
                                  {apt.postVisitAISummary.followUpSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Important instructions */}
                            {apt.postVisitAISummary.importantInstructions && (
                              <div>
                                <span className="font-semibold text-foreground text-[11px] block mb-1">Important Instructions:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] bg-background p-2.5 rounded border">
                                  {apt.postVisitAISummary.importantInstructions.map((ins, i) => (
                                    <li key={i}>{ins}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: DOCTOR PROFILE & SCHEDULE INFORMATION */}
        <TabsContent value="profile" className="space-y-6">
          {activeDoctor && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Doctor Details */}
              <div className="md:col-span-7 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Doctor Profile & Credentials
                    </CardTitle>
                    <CardDescription>Your verified clinical profile and hospital affiliations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border">
                      <img
                        src={activeDoctor.avatar}
                        alt={activeDoctor.name}
                        className="w-16 h-16 rounded-xl object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-base font-bold text-foreground">{activeDoctor.name}</h4>
                        <p className="text-xs text-primary font-semibold">{activeDoctor.specialisation}</p>
                        <p className="text-[11px] text-muted-foreground">{activeDoctor.qualifications} • {activeDoctor.experienceYears} Years Experience</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Email</span>
                        <span className="font-semibold text-foreground">{activeDoctor.email}</span>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Phone</span>
                        <span className="font-semibold text-foreground">{activeDoctor.phone}</span>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Hospital / Hub</span>
                        <span className="font-semibold text-foreground">{activeDoctor.hospitalAffiliation}</span>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Consultation Room</span>
                        <span className="font-semibold text-foreground">{activeDoctor.roomNumber}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-card border rounded-lg">
                      <span className="text-[10px] text-muted-foreground block mb-1">Clinical Bio</span>
                      <p className="text-muted-foreground leading-relaxed">{activeDoctor.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Working Hours & Availability Rules */}
              <div className="md:col-span-5 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Working Hours & Slot Configuration
                    </CardTitle>
                    <CardDescription>Active scheduling parameters configured by Admin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/40 border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Working Hours</span>
                        <span className="font-bold text-sm text-foreground">{activeDoctor.workingHours.start} - {activeDoctor.workingHours.end}</span>
                      </div>
                      <div className="p-3 bg-muted/40 border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Break Time</span>
                        <span className="font-bold text-sm text-foreground">
                          {activeDoctor.breakHours ? `${activeDoctor.breakHours.start} - ${activeDoctor.breakHours.end}` : "None"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/40 border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Slot Duration</span>
                        <span className="font-bold text-sm text-primary">{activeDoctor.slotDurationMinutes} Minutes</span>
                      </div>
                      <div className="p-3 bg-muted/40 border rounded-lg">
                        <span className="text-[10px] text-muted-foreground block">Consultation Fee</span>
                        <span className="font-bold text-sm text-green-700 dark:text-green-400 font-mono">${activeDoctor.consultationFee}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Scheduled Working Days:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeDoctor.availableDays.map((day, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            ✓ {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: LEAVE MANAGEMENT & LIVE SLOT PREVIEW */}
        <TabsContent value="leave" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Mark Leave Form */}
            <div className="md:col-span-6 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Request / Mark Leave
                  </CardTitle>
                  <CardDescription>
                    Record an upcoming absence for {activeDoctor?.name}. Patients with conflicts will be automatically flagged.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Leave Date</label>
                    <Input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Reason for Leave</label>
                    <Input
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="e.g. Medical Conference, Personal Leave"
                      className="text-xs"
                    />
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-blue-600" /> Automated Conflict Resolution Engine
                    </span>
                    <p className="text-blue-800/90 dark:text-blue-400">
                      When you confirm leave, any booked patients for that date will immediately receive an email alert and their slots will be flagged for priority free rebooking.
                    </p>
                  </div>

                  <Button
                    onClick={handleMarkLeave}
                    disabled={markingLeave || !leaveDate}
                    className="w-full font-bold bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    {markingLeave ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> Resolving Conflicts...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Confirm Leave & Trigger Patient Alerts
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Leave Records */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Active Leave Days for {activeDoctor?.name}
                  </CardTitle>
                  <CardDescription>Scheduled unavailability dates</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeDoctor?.leaveDates?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No leave days currently registered.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeDoctor?.leaveDates?.map((ld, i) => (
                        <div key={i} className="p-3 bg-muted/40 border rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span className="font-bold text-foreground">{ld}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-[10px]">On Leave</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveLeave(ld)}
                              className="h-7 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live Slot Generator Preview for Doctor */}
            <div className="md:col-span-6 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" /> Live Slot Availability Inspector
                  </CardTitle>
                  <CardDescription>
                    Test how patients see your appointment slots on any given date.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Select Date to Inspect</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={previewDate}
                        onChange={(e) => {
                          setPreviewDate(e.target.value);
                          if (activeDoctor) loadDoctorSlotPreview(activeDoctor.id, e.target.value);
                        }}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activeDoctor && loadDoctorSlotPreview(activeDoctor.id, previewDate)}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                      </Button>
                    </div>
                  </div>

                  {loadingPreviewSlots ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Calculating live slots from backend...
                    </div>
                  ) : previewStatus === "leave" ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="font-bold text-red-700 dark:text-red-300">Marked On Leave</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Zero slots shown to patients on {previewDate}.</p>
                    </div>
                  ) : previewStatus === "non_working_day" ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                      <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="font-bold text-amber-700 dark:text-amber-300">Non-Working Day</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">This day is not in your configured working days.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Generated Slots: {previewSlots.length}</span>
                        <span>Available: {previewSlots.filter(s => s.status === "available").length}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {previewSlots.map((s, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-center font-mono text-xs ${
                              s.status === "booked"
                                ? "bg-muted text-muted-foreground line-through border-dashed"
                                : s.status === "held"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                : "bg-card text-foreground border-border"
                            }`}
                          >
                            <span className="block font-bold">{s.startTime}</span>
                            <span className="text-[10px] font-sans font-normal opacity-80">{s.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: GOOGLE CALENDAR SYNC & OAUTH INTEGRATION */}
        <TabsContent value="calendar" className="space-y-6">
          <GoogleCalendarManager
            currentUser={{
              email: activeDoctor?.email,
              fullName: activeDoctor?.name,
              role: "doctor",
              userId: activeDoctor?.id,
            }}
            onRefreshAppointments={loadAppointments}
          />
        </TabsContent>
      </Tabs>

      {/* CLINICAL CONSULTATION MODAL / POST-VISIT AI SUMMARY GENERATOR */}
      <Dialog open={!!activeConsultation} onOpenChange={(open) => !open && setActiveConsultation(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Clinical Consultation: {activeConsultation?.patientName}
            </DialogTitle>
            <DialogDescription>
              Record diagnosis, vitals, and medications. Gemini AI will convert notes into a patient-friendly summary and schedule medication reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Pre-Visit AI Briefing Box for Doctor */}
            <div className="p-4 bg-muted/40 rounded-xl border space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" /> Pre-Visit AI Briefing & Triage Summary
                </div>
                <Badge
                  className={`text-[10px] font-bold ${
                    activeConsultation?.preVisitAISummary?.urgencyLevel === "High"
                      ? "bg-red-500 text-white"
                      : activeConsultation?.preVisitAISummary?.urgencyLevel === "Medium"
                      ? "bg-amber-500 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  Urgency: {activeConsultation?.preVisitAISummary?.urgencyLevel || "Low"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Reported Symptoms:</span>
                  <p className="text-foreground italic">{activeConsultation?.symptoms}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Chief Complaint:</span>
                  <p className="text-foreground font-medium">{activeConsultation?.preVisitAISummary?.chiefComplaint || activeConsultation?.symptoms}</p>
                </div>
              </div>

              {activeConsultation?.preVisitAISummary?.suggestedQuestions && (
                <div className="pt-2 border-t">
                  <span className="font-semibold text-muted-foreground block text-[11px] mb-1">
                    Three Suggested Questions for Consultation:
                  </span>
                  <ul className="space-y-1 text-foreground/90 list-disc list-inside bg-background p-2 rounded border">
                    {activeConsultation.preVisitAISummary.suggestedQuestions.map((q, i) => (
                      <li key={i} className="text-xs">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>AI summarization support feature for doctor review. Not a medical diagnosis.</span>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5 uppercase tracking-wider">
                Patient Vitals
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Blood Pressure</span>
                  <Input value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })} className="text-xs" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Heart Rate</span>
                  <Input value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} className="text-xs" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Temperature</span>
                  <Input value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} className="text-xs" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-0.5">SpO2 Oxygen</span>
                  <Input value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} className="text-xs" />
                </div>
              </div>
            </div>

            {/* Diagnosis & Clinical Notes */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Primary Diagnosis <span className="text-red-500">*</span>
                </label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Upper Respiratory Infection, Stage 1 Hypertension"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Clinical Examination Notes <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter detailed clinical findings, auscultation results, patient condition, severity..."
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Follow-up Instructions & Patient Advice
                </label>
                <Textarea
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Schedule review in 7 days if symptoms persist. Rest voice, drink 2.5L fluids daily. Return immediately if high fever or chest tightness develops."
                  className="text-xs"
                />
              </div>
            </div>

            {/* Prescriptions Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Prescribed Medications
                </label>
                <Button size="sm" variant="outline" onClick={handleAddPrescriptionRow} className="text-xs h-7">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
                </Button>
              </div>

              <div className="space-y-3">
                {prescriptions.map((rx, idx) => (
                  <div key={rx.id || idx} className="p-3 bg-muted/40 border rounded-lg space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Medicine Name</span>
                        <Input
                          value={rx.medicineName}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "medicineName", e.target.value)}
                          placeholder="e.g. Amoxicillin, Paracetamol"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Dosage</span>
                        <Input
                          value={rx.dosage}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "dosage", e.target.value)}
                          placeholder="e.g. 500mg"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Timing</span>
                        <select
                          value={rx.timing}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "timing", e.target.value as any)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="Before Meals">Before Meals</option>
                          <option value="After Meals">After Meals</option>
                          <option value="With Meals">With Meals</option>
                          <option value="Bedtime">Bedtime</option>
                          <option value="As Needed">As Needed</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 flex items-end justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePrescriptionRow(idx)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                      <div className="sm:col-span-6">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Frequency</span>
                        <Input
                          value={rx.frequency}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "frequency", e.target.value)}
                          placeholder="e.g. Twice daily with meals"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Days</span>
                        <Input
                          type="number"
                          value={rx.durationDays}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "durationDays", Number(e.target.value))}
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Instructions</span>
                        <Input
                          value={rx.instructions}
                          onChange={(e) => handleUpdatePrescriptionRow(idx, "instructions", e.target.value)}
                          placeholder="e.g. Drink plenty of water"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finalize Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveConsultation(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleFinalizeConsultation}
                disabled={submittingNotes}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {submittingNotes ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Generating AI Patient Summary & Reminders...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Finalize Consultation & Dispatch AI Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* POST-VISIT WORKFLOW RESILIENCE TEST RESULTS MODAL */}
      <Dialog open={postVisitTestModalOpen} onOpenChange={setPostVisitTestModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Post-Visit Workflow Verification Suite
            </DialogTitle>
            <DialogDescription className="text-xs">
              Automated end-to-end audit for clinical data persistence, prescription source-of-truth immutability, LLM timeout/failure resilience, and summary delivery.
            </DialogDescription>
          </DialogHeader>

          {testingPostVisit ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="font-semibold text-foreground">Executing comprehensive post-visit resilience test matrix...</p>
              <p className="text-[11px] text-muted-foreground">Simulating LLM timeouts, malformed JSON recoveries, and source-of-truth immutability checks.</p>
            </div>
          ) : postVisitTestResults ? (
            <div className="space-y-4 text-xs">
              {/* Overall status banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  postVisitTestResults.allTestsPassed
                    ? "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
                    : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {postVisitTestResults.allTestsPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {postVisitTestResults.allTestsPassed
                        ? "All Workflow & Resilience Tests Passed (6/6)"
                        : "Resilience Suite Encountered Issues"}
                    </h4>
                    <p className="text-[11px] opacity-90">{postVisitTestResults.message}</p>
                  </div>
                </div>
                <Badge className={postVisitTestResults.allTestsPassed ? "bg-green-600 text-white text-xs font-bold" : "bg-red-600 text-white"}>
                  {postVisitTestResults.allTestsPassed ? "PASSED" : "FAILED"}
                </Badge>
              </div>

              {/* Individual test steps breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-foreground block text-xs uppercase tracking-wider">Test Suite Breakdown:</span>
                {postVisitTestResults.tests &&
                  postVisitTestResults.tests.map((t: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/40 border rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-foreground">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          {t.testName}
                        </span>
                        <Badge
                          variant="outline"
                          className={t.passed ? "text-green-600 border-green-500/30 bg-green-500/5 text-[10px]" : "text-red-600 border-red-500/30 bg-red-500/5 text-[10px]"}
                        >
                          {t.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] pl-5">{t.detail}</p>
                    </div>
                  ))}
              </div>

              {/* Sample AI Summary Preview */}
              {postVisitTestResults.sampleSummary && (
                <div className="p-3 bg-background border rounded-xl space-y-2">
                  <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider">
                    Generated Sample Patient-Friendly Summary:
                  </span>
                  <p className="text-foreground text-xs leading-relaxed bg-muted/30 p-2.5 rounded-lg border">
                    {postVisitTestResults.sampleSummary.patientFriendlySummary}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button size="sm" onClick={() => setPostVisitTestModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
};
export default DoctorPortal;
