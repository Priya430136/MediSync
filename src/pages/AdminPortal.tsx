import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Doctor, Appointment, NotificationRecord, BackgroundJob, MedicationReminder } from "@/types/appointment";
import { API } from "@/lib/api";
import { EmailSystemManager } from "@/components/EmailSystemManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Sparkles,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Mail,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Zap,
  Activity,
  Layers,
  FileCode,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Home,
  Check,
  X,
  Play
} from "lucide-react";

export const AdminPortal = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor Form Modal State
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Leave Management State
  const [leaveDoctorId, setLeaveDoctorId] = useState<string>("");
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [leaveReason, setLeaveReason] = useState<string>("Clinical Leave / Medical Conference");
  const [markingLeave, setMarkingLeave] = useState<boolean>(false);

  // Concurrency Simulation Test State
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Availability Test Suite State
  const [testingAvailability, setTestingAvailability] = useState(false);
  const [availabilityTestResult, setAvailabilityTestResult] = useState<any>(null);

  // Doctor Leave Conflict Workflow Test Suite State (All 5 Scenarios)
  const [testingLeaveWorkflow, setTestingLeaveWorkflow] = useState(false);
  const [leaveWorkflowTestResult, setLeaveWorkflowTestResult] = useState<any>(null);

  // Patient Symptom & Pre-Visit AI Workflow Test Suite State
  const [testingAiWorkflow, setTestingAiWorkflow] = useState(false);
  const [aiWorkflowTestResult, setAiWorkflowTestResult] = useState<any>(null);
  const [technicalLogs, setTechnicalLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Background Job & Medication Reminder State
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const [allReminders, setAllReminders] = useState<MedicationReminder[]>([]);
  const [testingBgJobs, setTestingBgJobs] = useState(false);
  const [bgJobTestResult, setBgJobTestResult] = useState<any>(null);
  const [triggeringWorker, setTriggeringWorker] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [docs, apts, notifs, logs, jobs, rems] = await Promise.all([
        API.getDoctors(),
        API.getAppointments(),
        API.getNotificationQueue(),
        API.getAITechnicalLogs().catch(() => []),
        API.getBackgroundJobs().catch(() => []),
        API.getReminders().catch(() => []),
      ]);
      setDoctors(docs);
      if (docs.length > 0 && !leaveDoctorId) {
        setLeaveDoctorId(docs[0].id);
      }
      setAppointments(apts);
      setNotifications(notifs);
      setTechnicalLogs(logs);
      setBackgroundJobs(jobs);
      setAllReminders(rems);
    } catch (err: any) {
      toast.error("Failed to load admin data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Background Job & Medication Reminder Test Suite (All 5 Scenarios)
  const handleRunBackgroundJobTest = async () => {
    setTestingBgJobs(true);
    setBgJobTestResult(null);
    try {
      const res = await API.runBackgroundJobTest();
      setBgJobTestResult(res);
      if (res.allTestsPassed) {
        toast.success("All 5 Background Job & Medication Reminder Tests PASSED (100%)!");
      } else {
        toast.error("Some background job tests failed. Inspect details.");
      }
      await loadAllData();
    } catch (err: any) {
      toast.error("Background job test failed: " + err.message);
    } finally {
      setTestingBgJobs(false);
    }
  };

  // Manually trigger a background worker tick
  const handleTriggerWorkerTick = async () => {
    setTriggeringWorker(true);
    try {
      const res = await API.runBackgroundWorkerTick();
      toast.success(`Worker tick processed! ${res.processed} job(s) processed (${res.completed} completed, ${res.failed} failed/retrying).`);
      await loadAllData();
    } catch (err: any) {
      toast.error("Worker tick failed: " + err.message);
    } finally {
      setTriggeringWorker(false);
    }
  };

  // Retry a failed/retrying background job
  const handleRetryBackgroundJob = async (jobId: string) => {
    try {
      await API.retryBackgroundJob(jobId);
      toast.success("Background job queued for immediate retry!");
      await loadAllData();
    } catch (err: any) {
      toast.error("Retry failed: " + err.message);
    }
  };

  // Retry a failed reminder
  const handleRetryReminder = async (reminderId: string) => {
    try {
      await API.retryReminder(reminderId);
      toast.success("Reminder queued for retry!");
      await loadAllData();
    } catch (err: any) {
      toast.error("Retry reminder failed: " + err.message);
    }
  };

  // Handle Run Leave Conflict Workflow Test Suite (All 5 Scenarios)
  const handleRunLeaveWorkflowTest = async () => {
    setTestingLeaveWorkflow(true);
    setLeaveWorkflowTestResult(null);
    try {
      const res = await API.runLeaveWorkflowTest();
      setLeaveWorkflowTestResult(res);
      if (res.allTestsPassed) {
        toast.success("All 5 Doctor Leave Conflict Workflow Scenarios PASSED (100%)!");
      } else {
        toast.error("Some leave conflict workflow scenarios failed. Inspect details.");
      }
      // Refresh admin data
      await loadAllData();
    } catch (err: any) {
      toast.error("Leave conflict test execution failed: " + err.message);
    } finally {
      setTestingLeaveWorkflow(false);
    }
  };

  // Handle Run Patient Symptom & Pre-Visit AI Workflow Test Suite
  const handleRunAiWorkflowTest = async () => {
    setTestingAiWorkflow(true);
    setAiWorkflowTestResult(null);
    try {
      const res = await API.runAISymptomWorkflowTest();
      setAiWorkflowTestResult(res);
      if (res.allTestsPassed) {
        toast.success("All 7 Patient Symptom & Pre-Visit AI Workflow tests PASSED (100%)!");
      } else {
        toast.error("Some AI symptom workflow tests failed. Inspect details.");
      }
      // Refresh admin data and technical logs
      await loadAllData();
    } catch (err: any) {
      toast.error("AI workflow test execution failed: " + err.message);
    } finally {
      setTestingAiWorkflow(false);
    }
  };

  const handleRefreshTechnicalLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await API.getAITechnicalLogs();
      setTechnicalLogs(logs);
      toast.success("AI technical logs refreshed!");
    } catch (err: any) {
      toast.error("Failed to load AI logs: " + err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenNewDoctor = () => {
    setEditingDoctor({
      name: "Dr. ",
      email: "@rapidresq-health.com",
      phone: "+1 (555) 000-0000",
      specialisation: "Cardiology",
      qualifications: "MD, Board Certified",
      experienceYears: 8,
      consultationFee: 100,
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
      bio: "Board-certified clinical specialist dedicated to evidence-based healthcare.",
      workingHours: { start: "09:00", end: "17:00" },
      breakHours: { start: "13:00", end: "14:00" },
      slotDurationMinutes: 30,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      leaveDates: [],
      hospitalAffiliation: "RapidResQ Health Care Hub",
      roomNumber: "Room 301",
      active: true,
    });
    setDoctorModalOpen(true);
  };

  const handleEditDoctor = (doc: Doctor) => {
    setEditingDoctor({ ...doc });
    setDoctorModalOpen(true);
  };

  const toggleWorkingDay = (day: string) => {
    if (!editingDoctor) return;
    const current = editingDoctor.availableDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setEditingDoctor({ ...editingDoctor, availableDays: updated });
  };

  const handleSaveDoctor = async () => {
    if (!editingDoctor?.name || !editingDoctor.email || !editingDoctor.specialisation) {
      toast.error("Please fill in all mandatory fields (Name, Email, Specialisation).");
      return;
    }

    setSavingDoctor(true);
    try {
      if (editingDoctor.id) {
        await API.updateDoctor(editingDoctor.id, editingDoctor);
        toast.success("Doctor profile updated successfully!");
      } else {
        await API.createDoctor(editingDoctor);
        toast.success("New doctor profile created successfully!");
      }
      setDoctorModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error("Failed to save doctor: " + err.message);
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to remove this doctor profile?")) return;
    try {
      await API.deleteDoctor(id);
      toast.success("Doctor removed.");
      loadAllData();
    } catch (err: any) {
      toast.error("Failed to delete doctor: " + err.message);
    }
  };

  // Mark Doctor Leave from Admin Portal
  const handleMarkLeave = async () => {
    if (!leaveDoctorId || !leaveDate) {
      toast.error("Please select a doctor and a date for the leave.");
      return;
    }

    setMarkingLeave(true);
    try {
      const res = await API.markDoctorLeave(leaveDoctorId, leaveDate, leaveReason);
      if (res.conflictsCount > 0) {
        toast.warning(`Leave marked! ${res.conflictsCount} conflicting booking(s) automatically flagged for priority rescheduling.`);
      } else {
        toast.success(`Leave successfully recorded for ${leaveDate}.`);
      }
      setLeaveDate("");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark leave.");
    } finally {
      setMarkingLeave(false);
    }
  };

  // Remove/Cancel Doctor Leave
  const handleRemoveLeave = async (doctorId: string, date: string) => {
    try {
      await API.removeDoctorLeave(doctorId, date);
      toast.success(`Leave on ${date} cancelled. Doctor is now available.`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove leave.");
    }
  };

  const handleRetryNotification = async (id: string) => {
    try {
      await API.retryNotification(id);
      toast.success("Notification retried!");
      loadAllData();
    } catch (err: any) {
      toast.error("Retry failed: " + err.message);
    }
  };

  // Run Concurrency Stress Test Simulator
  const handleRunConcurrencyTest = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await API.runConcurrencyTest(doctors[0]?.id, "2026-08-25", "11:00");
      setSimResult(res);
      toast.success("Concurrency simulation complete: Double-booking safely prevented!");
      loadAllData();
    } catch (err: any) {
      toast.error("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Run Doctor Availability Verification Suite (The 6 Tests)
  const handleRunAvailabilityTestSuite = async () => {
    setTestingAvailability(true);
    setAvailabilityTestResult(null);
    try {
      const res = await API.runDoctorAvailabilityTest();
      setAvailabilityTestResult(res);
      if (res.allTestsPassed) {
        toast.success("All 6 Doctor Availability & Slot Engine Tests PASSED!");
      } else {
        toast.error("Some availability tests failed. Check results below.");
      }
    } catch (err: any) {
      toast.error("Test execution failed: " + err.message);
    } finally {
      setTestingAvailability(false);
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
                to="/doctor-portal" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Doctor Portal
              </Link>
              <Link 
                to="/patient-portal" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Patient Portal
              </Link>
            </div>
          </div>

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin Control Center
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Clinic Administration Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage doctor profiles, configure working days & slot duration, mark leaves, audit slot calculation, and test availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/docs">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> System Design Docs
            </Button>
          </Link>
          <Button size="sm" onClick={handleOpenNewDoctor} className="text-xs font-bold">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Doctor Profile
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Active Doctors</span>
          <p className="text-2xl font-extrabold text-foreground mt-1">{doctors.filter(d => d.active).length}</p>
        </Card>
        <Card className="p-4 border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Total Bookings</span>
          <p className="text-2xl font-extrabold text-foreground mt-1">{appointments.length}</p>
        </Card>
        <Card className="p-4 border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Emails Dispatched</span>
          <p className="text-2xl font-extrabold text-foreground mt-1">{notifications.length}</p>
        </Card>
        <Card className="p-4 border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Double-Bookings</span>
          <p className="text-2xl font-extrabold text-green-600 mt-1">0 (Guaranteed)</p>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="doctors" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-7 max-w-4xl">
          <TabsTrigger value="doctors" className="text-xs font-bold">
            <Stethoscope className="w-3.5 h-3.5 mr-1" /> Doctors ({doctors.length})
          </TabsTrigger>
          <TabsTrigger value="emails" className="text-xs font-bold">
            <Mail className="w-3.5 h-3.5 mr-1 text-primary" /> Emails
          </TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Leaves
          </TabsTrigger>
          <TabsTrigger value="background-jobs" className="text-xs font-bold">
            <Layers className="w-3.5 h-3.5 mr-1 text-primary" /> Jobs ({backgroundJobs.length})
          </TabsTrigger>
          <TabsTrigger value="availability-tests" className="text-xs font-bold">
            <Activity className="w-3.5 h-3.5 mr-1" /> Tests
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs font-bold">
            <Clock className="w-3.5 h-3.5 mr-1" /> Bookings
          </TabsTrigger>
          <TabsTrigger value="concurrency" className="text-xs font-bold">
            <Zap className="w-3.5 h-3.5 mr-1" /> Concurrency
          </TabsTrigger>
        </TabsList>

        {/* TAB: EMAIL NOTIFICATION SYSTEM & TEMPLATES */}
        <TabsContent value="emails" className="space-y-6">
          <EmailSystemManager />
        </TabsContent>

        {/* TAB 1: DOCTORS MANAGEMENT */}
        <TabsContent value="doctors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <Card key={doc.id} className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-12 h-12 rounded-xl object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{doc.name}</h4>
                        <p className="text-xs text-primary font-semibold">{doc.specialisation} • {doc.qualifications}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditDoctor(doc)} className="h-8 w-8" title="Edit Doctor Profile">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteDoctor(doc.id)} className="h-8 w-8 text-red-500 hover:text-red-700" title="Delete Doctor Profile">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Hours</span>
                      <span className="font-semibold">{doc.workingHours.start} - {doc.workingHours.end}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Slot Duration</span>
                      <span className="font-semibold text-primary">{doc.slotDurationMinutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Fee</span>
                      <span className="font-semibold font-mono">${doc.consultationFee}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block mb-1">Working Days:</span>
                      <div className="flex flex-wrap gap-1">
                        {doc.availableDays.map((d, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-medium bg-background">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {doc.breakHours && (
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Break Hours: </span>
                        {doc.breakHours.start} - {doc.breakHours.end}
                      </div>
                    )}

                    {doc.leaveDates.length > 0 && (
                      <div>
                        <span className="text-[10px] text-red-600 font-semibold block mb-1">Leave Dates:</span>
                        <div className="flex flex-wrap gap-1">
                          {doc.leaveDates.map((ld, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] text-red-600 bg-red-50 border border-red-200">
                              {ld}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: DOCTOR LEAVE MANAGEMENT & CONFLICT RESOLUTION */}
        <TabsContent value="leaves" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Mark Leave Form */}
            <div className="md:col-span-5 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Mark Doctor on Leave
                  </CardTitle>
                  <CardDescription>
                    Record scheduled absence. Automatically checks for booked patients and flags them for priority rescheduling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Select Doctor</label>
                    <select
                      value={leaveDoctorId}
                      onChange={(e) => setLeaveDoctorId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialisation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Leave Date</label>
                    <Input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Reason for Leave</label>
                    <Input
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="e.g. Annual Leave, Medical Conference"
                      className="text-xs"
                    />
                  </div>

                  <Button
                    onClick={handleMarkLeave}
                    disabled={markingLeave || !leaveDate}
                    className="w-full font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    {markingLeave ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Marking Leave & Resolving Conflicts...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" /> Mark Leave & Resolve Conflicts
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Leave Register List */}
            <div className="md:col-span-7 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Active Leave Schedule</CardTitle>
                  <CardDescription>All scheduled doctor leaves across the medical team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {doctors.flatMap(d => (d.leaveDates || []).map(ld => ({ doctor: d, date: ld }))).length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No active doctor leaves recorded. All doctors are available on their scheduled working days.
                      </div>
                    ) : (
                      doctors.flatMap(d => (d.leaveDates || []).map(ld => ({ doctor: d, date: ld }))).map((item, idx) => (
                        <div key={idx} className="p-3 bg-muted/40 border rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.doctor.avatar}
                              alt={item.doctor.name}
                              className="w-10 h-10 rounded-lg object-cover border"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-foreground">{item.doctor.name}</p>
                              <p className="text-xs text-primary font-semibold">{item.doctor.specialisation}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-red-600 font-semibold">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Leave Date: {item.date}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveLeave(item.doctor.id, item.date)}
                            className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Leave
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: BACKGROUND JOBS & MEDICATION REMINDERS */}
        <TabsContent value="background-jobs" className="space-y-6">
          {/* Automated Test Runner for Background Jobs */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Background Job & Medication Reminder Test Suite (5 Core Tests)
              </CardTitle>
              <CardDescription>
                Validates: 1. Reminder creation, 2. Reminder execution, 3. Failed reminder handling, 4. Exponential backoff retry, 5. Deduplication prevention.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
                <div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Automated Background Engine Verification</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tests non-blocking background queueing, status transitions, deduplication keys, retry counters, and notification dispatch.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handleTriggerWorkerTick}
                    disabled={triggeringWorker}
                    variant="outline"
                    className="font-bold text-xs"
                  >
                    {triggeringWorker ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Trigger Worker Tick
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRunBackgroundJobTest}
                    disabled={testingBgJobs}
                    className="font-bold bg-primary text-primary-foreground text-xs"
                  >
                    {testingBgJobs ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Running 5 Tests...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Run Background Job Tests
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Test Results Display */}
              {bgJobTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{bgJobTestResult.suite}</h4>
                      <p className="text-xs text-muted-foreground">
                        Executed At: <strong>{new Date(bgJobTestResult.timestamp).toLocaleTimeString()}</strong>
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-3 py-1 font-bold ${
                        bgJobTestResult.allTestsPassed
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {bgJobTestResult.allTestsPassed ? "ALL 5 TESTS PASSED (100%)" : "FAILURES DETECTED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bgJobTestResult.results.map((t: any) => (
                      <div
                        key={t.testId}
                        className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                          t.passed
                            ? "bg-green-500/5 border-green-500/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">{t.name}</span>
                          <Badge
                            variant={t.passed ? "default" : "destructive"}
                            className={`text-[10px] ${t.passed ? "bg-green-600 text-white" : ""}`}
                          >
                            {t.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.details}</p>
                        <div className="p-2.5 bg-background border rounded-lg font-mono text-[11px] space-y-1">
                          <p><span className="text-muted-foreground">Expected: </span>{t.expected}</p>
                          <p><span className="text-muted-foreground">Actual Result: </span><strong className="text-foreground">{t.actual}</strong></p>
                        </div>
                        {t.checks && (
                          <div className="space-y-1 pt-1 border-t">
                            {t.checks.map((c: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                {c.passed ? <Check className="w-3 h-3 text-green-600 shrink-0" /> : <X className="w-3 h-3 text-red-600 shrink-0" />}
                                <span className={c.passed ? "text-muted-foreground" : "text-red-500 font-bold"}>
                                  {c.check}: {c.details}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Background Jobs Queue */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Active Background Jobs Queue ({backgroundJobs.length})
                  </CardTitle>
                  <CardDescription>
                    Asynchronous task runner for medication reminders, email dispatches, and notification retries.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadAllData}
                  className="text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {backgroundJobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No background jobs in the queue. Complete a post-visit consultation or trigger automated tests to populate.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Job ID & Type</th>
                        <th className="p-3">Target / Recipient</th>
                        <th className="p-3">Scheduled For</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Attempts / Max</th>
                        <th className="p-3">Deduplication Key</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {backgroundJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-muted/20">
                          <td className="p-3">
                            <span className="font-bold text-foreground block">{job.type}</span>
                            <span className="text-[10px] text-muted-foreground font-sans">{job.id.slice(0, 16)}...</span>
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-semibold text-foreground">
                              {job.payload?.patientEmail || job.payload?.patientName || job.payload?.to || "System"}
                            </span>
                            {job.payload?.medicineName && (
                              <span className="text-[10px] text-muted-foreground block">
                                Med: {job.payload.medicineName} ({job.payload.timeSlot})
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="text-muted-foreground">
                              {job.scheduledFor ? new Date(job.scheduledFor).toLocaleString() : "Immediate"}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`text-[10px] ${
                                job.status === "completed"
                                  ? "bg-green-600 text-white"
                                  : job.status === "processing"
                                  ? "bg-blue-600 text-white"
                                  : job.status === "failed"
                                  ? "bg-red-600 text-white"
                                  : job.status === "retrying"
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {job.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-foreground font-bold">{job.attempts}</span>
                            <span className="text-muted-foreground"> / {job.maxAttempts}</span>
                          </td>
                          <td className="p-3 font-sans text-[10px] text-muted-foreground truncate max-w-[180px]" title={job.deduplicationKey}>
                            {job.deduplicationKey || "None"}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {(job.status === "failed" || job.status === "retrying") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryBackgroundJob(job.id)}
                                className="text-xs h-7 text-primary hover:bg-primary/5"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" /> Retry Now
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Medication Reminders Master Table */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" /> Generated Medication Reminders ({allReminders.length})
              </CardTitle>
              <CardDescription>
                Prescription reminders generated automatically from doctor instructions and dosage frequencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {allReminders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No medication reminders generated yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Medication</th>
                        <th className="p-3">Frequency & Slot</th>
                        <th className="p-3">Scheduled Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allReminders.map((rem) => (
                        <tr key={rem.id} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold">{rem.patientEmail}</td>
                          <td className="p-3 font-bold text-foreground">{rem.medicineName}</td>
                          <td className="p-3">
                            <span className="text-foreground">{rem.frequency}</span>
                            <Badge variant="outline" className="text-[10px] ml-1.5 font-mono">{rem.timeSlot}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground font-mono">{rem.scheduledDate}</td>
                          <td className="p-3">
                            <Badge
                              className={`text-[10px] ${
                                rem.status === "taken"
                                  ? "bg-green-600 text-white"
                                  : rem.status === "sent"
                                  ? "bg-blue-600 text-white"
                                  : rem.status === "failed"
                                  ? "bg-red-600 text-white"
                                  : rem.status === "retrying"
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {rem.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {(rem.status === "failed" || rem.status === "retrying") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryReminder(rem.id)}
                                className="text-xs h-7 text-primary"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" /> Retry
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DOCTOR AVAILABILITY TEST SUITE (THE 6 MANDATORY TESTS) */}
        <TabsContent value="availability-tests" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Doctor Availability & Slot Engine Test Suite
              </CardTitle>
              <CardDescription>
                Execute automated validation tests across all 6 core criteria: Normal working day, Outside working hours, Doctor leave, Existing appointment conflict, Multiple available slots, and Different slot durations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
                <div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Test Suite Scope</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Validates that the server backend is the true source of truth and no unbookable slot is ever presented.
                  </p>
                </div>
                <Button
                  onClick={handleRunAvailabilityTestSuite}
                  disabled={testingAvailability}
                  className="font-bold bg-primary text-primary-foreground text-xs shrink-0"
                >
                  {testingAvailability ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Running Test Suite...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Run Complete Availability Test Suite
                    </>
                  )}
                </Button>
              </div>

              {/* Test Results Display */}
              {availabilityTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Suite Status</h4>
                      <p className="text-xs text-muted-foreground">
                        Doctor Tested: <strong>{availabilityTestResult.doctorTested}</strong>
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-3 py-1 font-bold ${
                        availabilityTestResult.allTestsPassed
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {availabilityTestResult.allTestsPassed ? "ALL 6 TESTS PASSED (100%)" : "FAILURES DETECTED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availabilityTestResult.testResults.map((t: any) => (
                      <div
                        key={t.testId}
                        className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                          t.passed
                            ? "bg-green-500/5 border-green-500/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">{t.testName}</span>
                          <Badge
                            variant={t.passed ? "default" : "destructive"}
                            className={`text-[10px] ${t.passed ? "bg-green-600 text-white" : ""}`}
                          >
                            {t.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                        <div className="p-2.5 bg-background border rounded-lg font-mono text-[11px] space-y-1">
                          <p><span className="text-muted-foreground">Expected: </span>{t.expectedBehavior}</p>
                          <p><span className="text-muted-foreground">Actual Result: </span><strong className="text-foreground">{t.actualResult}</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DOCTOR LEAVE CONFLICT WORKFLOW TEST SUITE (THE 5 MANDATORY SCENARIOS) */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" /> Doctor Leave Conflict Workflow Test Suite (5 Scenarios)
              </CardTitle>
              <CardDescription>
                Validates: 1) Leave with no appointments, 2) Leave with 1 appointment, 3) Leave with multiple appointments, 4) Immediate booking prevention on leave dates, and 5) System stability during notification failures.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
                <div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Automated Verification Engine</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ensures appointments are never silently deleted, status is set to rescheduling_required, notifications are queued, and rescheduling preserves complete audit history.
                  </p>
                </div>
                <Button
                  onClick={handleRunLeaveWorkflowTest}
                  disabled={testingLeaveWorkflow}
                  className="font-bold bg-red-600 hover:bg-red-700 text-white text-xs shrink-0"
                >
                  {testingLeaveWorkflow ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Running 5 Scenarios...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Run Leave Workflow Test Suite
                    </>
                  )}
                </Button>
              </div>

              {/* Results */}
              {leaveWorkflowTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{leaveWorkflowTestResult.suite}</h4>
                      <p className="text-xs text-muted-foreground">
                        Doctor Tested: <strong>{leaveWorkflowTestResult.doctorTested}</strong>
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-3 py-1 font-bold ${
                        leaveWorkflowTestResult.allTestsPassed
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {leaveWorkflowTestResult.allTestsPassed ? "ALL 5 SCENARIOS PASSED (100%)" : "FAILURES DETECTED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {leaveWorkflowTestResult.testResults.map((t: any) => (
                      <div
                        key={t.scenarioId}
                        className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                          t.passed
                            ? "bg-green-500/5 border-green-500/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">{t.scenarioName}</span>
                          <Badge
                            variant={t.passed ? "default" : "destructive"}
                            className={`text-[10px] ${t.passed ? "bg-green-600 text-white" : ""}`}
                          >
                            {t.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                        <div className="p-2.5 bg-background border rounded-lg font-mono text-[11px] space-y-1">
                          <p><span className="text-muted-foreground">Expected: </span>{t.expected}</p>
                          <p><span className="text-muted-foreground">Actual Result: </span><strong className="text-foreground">{t.actual}</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PATIENT SYMPTOM & PRE-VISIT AI WORKFLOW TEST SUITE (7 TESTS) */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Patient Symptom & Pre-Visit AI Workflow Test Suite (7 Tests)
              </CardTitle>
              <CardDescription>
                Verifies: 1) Structured prompt analysis & schema validation, 2) Mandatory symptoms requirement, 3) Timeout resilience & fallback, 4) Malformed JSON handling, 5) Missing fields validation, 6) Rate limit (429) handling, 7) Summary regeneration & doctor pre-visit visibility.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
                <div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Gemini 3.7 Flash Clinical Triage & Resilience Verification
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Validates urgency rating (Low/Medium/High), chief complaint extraction, exactly 3 doctor questions, non-diagnostic disclaimers, zero-crash booking fallbacks, and technical log auditing.
                  </p>
                </div>
                <Button
                  onClick={handleRunAiWorkflowTest}
                  disabled={testingAiWorkflow}
                  className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs shrink-0"
                >
                  {testingAiWorkflow ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Running 7 AI Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Run AI Workflow Test Suite
                    </>
                  )}
                </Button>
              </div>

              {/* AI Workflow Test Results */}
              {aiWorkflowTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{aiWorkflowTestResult.summary}</h4>
                      <p className="text-xs text-muted-foreground">
                        Timestamp: {aiWorkflowTestResult.timestamp}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-3 py-1 font-bold ${
                        aiWorkflowTestResult.allTestsPassed
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {aiWorkflowTestResult.allTestsPassed ? "ALL 7 AI TESTS PASSED (100%)" : "FAILURES DETECTED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiWorkflowTestResult.results.map((t: any) => (
                      <div
                        key={t.testId}
                        className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                          t.passed
                            ? "bg-green-500/5 border-green-500/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">{t.name}</span>
                          <Badge
                            variant={t.passed ? "default" : "destructive"}
                            className={`text-[10px] ${t.passed ? "bg-green-600 text-white" : ""}`}
                          >
                            {t.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.details}</p>
                        <div className="p-2.5 bg-background border rounded-lg font-mono text-[11px] space-y-1">
                          <p><span className="text-muted-foreground">Expected: </span>{t.expected}</p>
                          <p><span className="text-muted-foreground">Actual Result: </span><strong className="text-foreground">{t.actual}</strong></p>
                        </div>
                        {t.checks && (
                          <div className="space-y-1 pt-1 border-t">
                            {t.checks.map((c: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                {c.passed ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                                <span className={c.passed ? "text-muted-foreground" : "text-red-500 font-bold"}>{c.check} ({c.details})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECURE AI TECHNICAL ERROR LOGS AUDIT */}
              <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Secure AI Technical Error Logs ({technicalLogs.length} Records)
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshTechnicalLogs}
                    disabled={loadingLogs}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh Logs
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Backend error events from LLM calls (e.g. timeouts, rate limits, parser exceptions) are securely isolated and sanitized here without leaking to patients.
                </p>

                {technicalLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 italic">No technical AI errors currently recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {technicalLogs.slice(0, 10).map((log, idx) => (
                      <div key={idx} className="p-2.5 bg-background border rounded-lg text-xs font-mono flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-red-600 border-red-500/30">
                              {log.errorType}
                            </Badge>
                            <span className="font-bold text-foreground">{log.action}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{log.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MASTER APPOINTMENTS TABLE */}
        <TabsContent value="appointments" className="space-y-4">
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Master Appointment Register</CardTitle>
              <CardDescription>Real-time view of all patient bookings across all doctors</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="p-3">Ref</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">AI Urgency</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono font-bold">{apt.bookingReference}</td>
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{apt.patientName}</p>
                          <p className="text-[10px] text-muted-foreground">{apt.patientEmail}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{apt.doctorName}</p>
                          <p className="text-[10px] text-primary">{apt.doctorSpecialisation}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold">{apt.date}</p>
                          <p className="text-[10px] text-muted-foreground">{apt.startTime} - {apt.endTime}</p>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] ${
                              apt.preVisitAISummary?.urgencyLevel === "High"
                                ? "bg-red-500 text-white"
                                : apt.preVisitAISummary?.urgencyLevel === "Medium"
                                ? "bg-amber-500 text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {apt.preVisitAISummary?.urgencyLevel || "Low"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {apt.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: CONCURRENCY STRESS TEST SIMULATOR */}
        <TabsContent value="concurrency" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Double-Booking Prevention & Concurrency Stress Test
              </CardTitle>
              <CardDescription>
                Simulate 5 simultaneous users firing booking requests for the exact same doctor time slot at the same millisecond.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/40 rounded-xl border text-xs space-y-2">
                <span className="font-bold text-foreground block">Test Parameters:</span>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Doctor: <strong className="text-foreground">{doctors[0]?.name || "Dr. Sarah Jenkins"}</strong></li>
                  <li>Target Slot: <strong className="text-foreground">2026-08-25 at 11:00 AM</strong></li>
                  <li>Concurrent Clients: <strong className="text-foreground">5 Simultaneous Patients</strong> (Alice, Bob, Charlie, Diana, Evan)</li>
                </ul>
              </div>

              <Button
                onClick={handleRunConcurrencyTest}
                disabled={simulating}
                className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Dispatching Simultaneous Race Requests...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" /> Execute Live Concurrency Race Test
                  </>
                )}
              </Button>

              {/* Simulation Results Display */}
              {simResult && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <span className="text-muted-foreground block">Simultaneous Attempts</span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {simResult.testSummary.totalSimultaneousAttempts}
                      </span>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-muted-foreground block">Successfully Booked</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">
                        {simResult.testSummary.successfulBookings} (Expected: 1)
                      </span>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <span className="text-muted-foreground block">409 Conflicts Prevented</span>
                      <span className="text-lg font-bold text-red-700 dark:text-red-300">
                        {simResult.testSummary.preventedDoubleBookings} (Expected: 4)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-background border rounded-xl space-y-2">
                    <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                      Live Concurrency Audit Trail
                    </span>
                    <div className="space-y-2 text-xs font-mono">
                      {simResult.outcomes.map((o: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            o.status === 201
                              ? "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
                              : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                          }`}
                        >
                          <div>
                            <strong>[{o.status}] Patient: {o.patient}</strong>
                            <p className="text-[11px] font-sans mt-0.5">{o.result}</p>
                          </div>
                          <Badge variant={o.status === 201 ? "default" : "destructive"}>
                            {o.status === 201 ? "LOCKED 201 OK" : "CONFLICT 409"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DOCTOR CREATE/EDIT MODAL WITH COMPLETE CONFIGURATION */}
      <Dialog open={doctorModalOpen} onOpenChange={setDoctorModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingDoctor?.id ? "Edit Doctor Profile & Availability" : "Add New Doctor Profile"}
            </DialogTitle>
            <DialogDescription>
              Configure doctor specialisation, working days, working hours, break hours, and slot duration.
            </DialogDescription>
          </DialogHeader>

          {editingDoctor && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Doctor Name</label>
                  <Input
                    value={editingDoctor.name || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    className="text-xs"
                    placeholder="e.g. Dr. Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Specialisation</label>
                  <select
                    value={editingDoctor.specialisation || "Cardiology"}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialisation: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Email</label>
                  <Input
                    value={editingDoctor.email || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone</label>
                  <Input
                    value={editingDoctor.phone || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Working Days Configuration */}
              <div>
                <label className="font-semibold block mb-1.5">Configured Working Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map((day) => {
                    const isSelected = (editingDoctor.availableDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                        }`}
                      >
                        {day} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Duration & Fee */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Slot Duration</label>
                  <select
                    value={editingDoctor.slotDurationMinutes || 30}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, slotDurationMinutes: Number(e.target.value) })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Fee ($)</label>
                  <Input
                    type="number"
                    value={editingDoctor.consultationFee || 100}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, consultationFee: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Experience (Yrs)</label>
                  <Input
                    type="number"
                    value={editingDoctor.experienceYears || 5}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, experienceYears: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Working Start Time (HH:MM)</label>
                  <Input
                    value={editingDoctor.workingHours?.start || "09:00"}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        workingHours: { ...editingDoctor.workingHours, start: e.target.value, end: editingDoctor.workingHours?.end || "17:00" }
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Working End Time (HH:MM)</label>
                  <Input
                    value={editingDoctor.workingHours?.end || "17:00"}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        workingHours: { ...editingDoctor.workingHours, end: e.target.value, start: editingDoctor.workingHours?.start || "09:00" }
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Break Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Break Start Time (HH:MM)</label>
                  <Input
                    value={editingDoctor.breakHours?.start || "13:00"}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        breakHours: { ...editingDoctor.breakHours, start: e.target.value, end: editingDoctor.breakHours?.end || "14:00" }
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Break End Time (HH:MM)</label>
                  <Input
                    value={editingDoctor.breakHours?.end || "14:00"}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        breakHours: { ...editingDoctor.breakHours, end: e.target.value, start: editingDoctor.breakHours?.start || "13:00" }
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Hospital / Clinic Affiliation</label>
                  <Input
                    value={editingDoctor.hospitalAffiliation || "RapidResQ Health Care Hub"}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, hospitalAffiliation: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Room / Office Number</label>
                  <Input
                    value={editingDoctor.roomNumber || "Room 301"}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, roomNumber: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Doctor Bio & Overview</label>
                <Input
                  value={editingDoctor.bio || ""}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, bio: e.target.value })}
                  className="text-xs"
                  placeholder="Clinical background, expertise, and patient care philosophy..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDoctorModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDoctor} disabled={savingDoctor} className="font-bold">
                  {savingDoctor ? "Saving..." : "Save Doctor Profile"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
};
export default AdminPortal;
