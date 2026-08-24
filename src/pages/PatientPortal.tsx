import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Appointment, MedicationReminder, Slot } from "@/types/appointment";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { OperationsCommandBar } from "@/components/OperationsCommandBar";
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  Pill,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CalendarPlus,
  Download,
  Mail,
  RefreshCw,
  XCircle,
  Stethoscope,
  HeartPulse,
  Activity,
  AlertCircle,
  PlusCircle,
  ChevronRight,
  History,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Home,
  Search,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PatientPortal = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email");

  const [patientEmail, setPatientEmail] = useState<string>(() => {
    return emailFromUrl || localStorage.getItem("rapidresq_patient_email") || localStorage.getItem("rapidresq_last_booking_email") || "michael.chen@example.com";
  });
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [knownEmails, setKnownEmails] = useState<string[]>([
    "michael.chen@example.com",
    "emma.watson@example.com",
    "alice@test.com"
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Rescheduling state
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [rescheduleStatus, setRescheduleStatus] = useState<string>("available");
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Sync with URL parameter or Supabase auth on load
  useEffect(() => {
    if (emailFromUrl && emailFromUrl.trim()) {
      setPatientEmail(emailFromUrl.trim());
      setKnownEmails(prev => Array.from(new Set([emailFromUrl.trim(), ...prev])));
    } else {
      supabase.auth.getUser().then(({ data }: any) => {
        if (data?.user?.email) {
          const authEmail = data.user.email;
          setKnownEmails(prev => Array.from(new Set([authEmail, ...prev])));
          // If no specific email is in localStorage or URL, prefer auth email
          if (!localStorage.getItem("rapidresq_patient_email")) {
            setPatientEmail(authEmail);
          }
        }
      }).catch(() => {});
    }

    const saved = localStorage.getItem("rapidresq_patient_email") || localStorage.getItem("rapidresq_last_booking_email");
    if (saved) {
      setKnownEmails(prev => Array.from(new Set([saved, ...prev])));
    }
  }, [emailFromUrl]);

  // Discover other booked patient emails from existing appointments
  const discoverAllEmails = useCallback(async () => {
    try {
      const allApts = await API.getAppointments();
      if (Array.isArray(allApts) && allApts.length > 0) {
        const discovered = allApts.map(a => a.patientEmail).filter(Boolean);
        setKnownEmails(prev => Array.from(new Set([...prev, ...discovered])));
      }
    } catch (e) {
      // Non-blocking discovery
    }
  }, []);

  useEffect(() => {
    discoverAllEmails();
  }, [discoverAllEmails]);

  // Load patient appointments & reminders
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams = patientEmail === "ALL_PATIENTS" ? {} : { patientEmail };
      const [apts, rems] = await Promise.all([
        API.getAppointments(filterParams),
        patientEmail === "ALL_PATIENTS" ? API.getReminders() : API.getReminders(patientEmail),
      ]);
      setAppointments(apts || []);
      setReminders(rems || []);

      // If we got appointments, add their emails to known list
      if (Array.isArray(apts)) {
        const foundEmails = apts.map(a => a.patientEmail).filter(Boolean);
        if (foundEmails.length > 0) {
          setKnownEmails(prev => Array.from(new Set([...prev, ...foundEmails])));
        }
      }
    } catch (err: any) {
      toast.error("Failed to load patient data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [patientEmail]);

  // Load data on email change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to cross-tab / event-based booking notifications
  useEffect(() => {
    const handleAppointmentBooked = (e: any) => {
      const bookedEmail = e?.detail?.patientEmail;
      if (bookedEmail) {
        setKnownEmails(prev => Array.from(new Set([bookedEmail, ...prev])));
        setPatientEmail(bookedEmail);
        setSearchParams({ email: bookedEmail });
      }
      loadData();
    };

    window.addEventListener("rapidresq_appointment_booked", handleAppointmentBooked);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("rapidresq_appointment_booked", handleAppointmentBooked);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData, setSearchParams]);

  const handleSelectEmail = (selected: string) => {
    setPatientEmail(selected);
    if (selected === "ALL_PATIENTS") {
      searchParams.delete("email");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ email: selected });
      localStorage.setItem("rapidresq_patient_email", selected);
    }
  };

  const handleApplyCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailInput.trim()) return;
    const clean = customEmailInput.trim().toLowerCase();
    setKnownEmails(prev => Array.from(new Set([clean, ...prev])));
    setPatientEmail(clean);
    setSearchParams({ email: clean });
    localStorage.setItem("rapidresq_patient_email", clean);
    setIsEditingEmail(false);
    setCustomEmailInput("");
  };

  const handleOpenRescheduleModal = async (apt: Appointment) => {
    setReschedulingAppointment(apt);
    setSelectedSlot(null);
    setRescheduleReason(
      apt.status === "rescheduling_required"
        ? "Rescheduling due to doctor scheduled leave"
        : "Patient requested schedule adjustment"
    );

    // Pick a sensible next date (tomorrow or current date + 1 day)
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    const dateStr = baseDate.toISOString().split("T")[0];
    setRescheduleDate(dateStr);

    await loadSlotsForReschedule(apt.doctorId, dateStr);
  };

  const loadSlotsForReschedule = async (doctorId: string, date: string) => {
    setLoadingRescheduleSlots(true);
    setSelectedSlot(null);
    try {
      const res = await API.getSlots(doctorId, date);
      setRescheduleSlots(res.slots || []);
      setRescheduleStatus(res.status || "available");
    } catch (err: any) {
      toast.error("Failed to fetch slots for date: " + err.message);
      setRescheduleSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setRescheduleDate(newDate);
    if (reschedulingAppointment) {
      loadSlotsForReschedule(reschedulingAppointment.doctorId, newDate);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingAppointment || !selectedSlot) {
      toast.error("Please select an available time slot.");
      return;
    }

    setSubmittingReschedule(true);
    try {
      const updated = await API.rescheduleAppointment(reschedulingAppointment.id, {
        newDate: rescheduleDate,
        newStartTime: selectedSlot.startTime,
        newEndTime: selectedSlot.endTime,
        reason: rescheduleReason,
        patientEmail,
      });

      toast.success(`Appointment successfully rescheduled to ${updated.date} at ${updated.startTime}!`);
      setReschedulingAppointment(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule appointment.");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleMarkReminder = async (id: string, status: "taken" | "skipped") => {
    try {
      await API.updateReminderStatus(id, status);
      toast.success(`Medication marked as ${status}!`);
      loadData();
    } catch (err: any) {
      toast.error("Failed to update reminder: " + err.message);
    }
  };

  const handleRetryMedReminder = async (id: string) => {
    try {
      await API.retryReminder(id);
      toast.success("Medication reminder queued for immediate retry!");
      loadData();
    } catch (err: any) {
      toast.error("Failed to retry reminder: " + err.message);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await API.cancelAppointment(id, "Cancelled by patient");
      toast.success("Appointment cancelled successfully.");
      loadData();
    } catch (err: any) {
      toast.error("Failed to cancel appointment: " + err.message);
    }
  };

  // Leave conflict / Rescheduling required appointments
  const leaveAlertAppointments = appointments.filter(a => a.status === "rescheduling_required");
  const upcomingAppointments = appointments.filter(a => a.status === "confirmed");
  const completedAppointments = appointments.filter(a => a.status === "completed");

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
                to="/admin" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary border rounded-lg px-2.5 py-1 bg-muted/30"
              >
                Admin Portal
              </Link>
            </div>
          </div>

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold">
              <User className="w-3.5 h-3.5 mr-1" /> Patient Portal
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            My Health & Appointments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your consultations, AI pre-visit briefings, post-visit prescriptions, and medication schedules.
          </p>
        </div>

        {/* Patient Account & Email Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-muted/40 p-3 rounded-xl border">
          {!isEditingEmail ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Patient:
              </span>
              <select
                value={patientEmail}
                onChange={(e) => handleSelectEmail(e.target.value)}
                className="text-xs font-bold bg-background border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary max-w-[220px] truncate"
              >
                <option value="ALL_PATIENTS">🌐 View All Consultations</option>
                {knownEmails.map((email) => (
                  <option key={email} value={email}>
                    {email === "michael.chen@example.com"
                      ? "Michael Chen (Cardiology)"
                      : email === "emma.watson@example.com"
                      ? "Emma Watson (Flu / Meds)"
                      : email}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingEmail(true)}
                className="text-xs text-muted-foreground hover:text-primary px-2 h-8"
                title="Enter custom email"
              >
                <Search className="w-3.5 h-3.5 mr-1" /> Other Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleApplyCustomEmail} className="flex items-center gap-1.5">
              <Input
                type="email"
                placeholder="Enter patient email..."
                value={customEmailInput}
                onChange={(e) => setCustomEmailInput(e.target.value)}
                className="h-8 text-xs w-48 bg-background"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-8 text-xs font-bold px-2.5">
                <Check className="w-3.5 h-3.5 mr-1" /> Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingEmail(false)}
                className="h-8 text-xs px-2"
              >
                Cancel
              </Button>
            </form>
          )}

          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="text-xs font-semibold px-2.5 h-8 bg-background"
              title="Refresh appointments"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin text-primary" : ""}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => navigate("/book")} className="text-xs font-bold shrink-0 h-8">
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Book New
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Second Patient Care Operations Command Bar */}
      <OperationsCommandBar
        happeningText={`Tracking health records for ${patientEmail === "ALL_PATIENTS" ? "all connected patients" : patientEmail}.`}
        happeningMetrics={[
          { label: 'Upcoming', value: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length, tone: 'normal' },
          { label: 'Medicines', value: reminders.filter(r => r.active).length, tone: 'good' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, tone: 'normal' },
        ]}
        attentionText={
          leaveAlertAppointments.length > 0
            ? `⚠️ Action required: Dr. ${leaveAlertAppointments[0].doctorName} scheduled leave affects your booking.`
            : appointments.some(a => a.status === 'pending')
            ? `1 consultation booking is pending doctor clinic confirmation.`
            : `All consultations and daily medicine schedules are up to date.`
        }
        attentionSeverity={leaveAlertAppointments.length > 0 ? 'critical' : 'normal'}
        nextActionText={
          leaveAlertAppointments.length > 0
            ? "Click below to select an alternate slot with priority zero-wait rescheduling."
            : "Book a specialist doctor consultation or view your e-prescriptions."
        }
        primaryActionLabel={leaveAlertAppointments.length > 0 ? "📅 Reschedule Booking" : "➕ Book Doctor"}
        onPrimaryAction={() => {
          if (leaveAlertAppointments.length > 0) {
            handleOpenRescheduleModal(leaveAlertAppointments[0]);
          } else {
            navigate('/book');
          }
        }}
        secondaryActionLabel="My Prescriptions"
        onSecondaryAction={() => navigate('/prescriptions')}
      />

      {/* Leave Conflict Alert Banner */}
      {leaveAlertAppointments.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>Doctor Leave Notice: Action Required for {leaveAlertAppointments.length} Appointment(s)</span>
          </div>
          <div className="space-y-2">
            {leaveAlertAppointments.map((apt) => (
              <div key={apt.id} className="p-3 bg-background border border-red-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-foreground">
                    Dr. {apt.doctorName} is on leave for your scheduled slot on {apt.date} at {apt.startTime}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{apt.cancellationReason || "Doctor has recorded official leave on this date."}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenRescheduleModal(apt)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold shrink-0 text-xs"
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Priority Reschedule Now <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="appointments" className="text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Appointments ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="medications" className="text-xs font-bold">
            <Pill className="w-3.5 h-3.5 mr-1.5" /> Daily Reminders ({reminders.length})
          </TabsTrigger>
          <TabsTrigger value="summaries" className="text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Summaries
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: APPOINTMENTS */}
        <TabsContent value="appointments" className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading your appointments...
            </div>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-3">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-base text-foreground">No appointments booked yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Find a top clinical specialist, check real-time slots, and book your consultation with AI triage.
                </p>
                <Button onClick={() => navigate("/book")} className="font-bold text-xs mt-2">
                  Book Appointment Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <Card
                  key={apt.id}
                  className={`border transition-all ${
                    apt.status === "rescheduling_required"
                      ? "border-red-500/40 bg-red-500/5"
                      : apt.status === "completed"
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border hover:border-primary/40 shadow-sm"
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{apt.doctorName}</h3>
                          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                            {apt.doctorSpecialisation}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ref: <span className="font-mono font-bold text-foreground">{apt.bookingReference}</span> • Booked on {new Date(apt.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs font-bold ${
                            apt.status === "confirmed"
                              ? "bg-blue-600 text-white"
                              : apt.status === "completed"
                              ? "bg-green-600 text-white"
                              : apt.status === "rescheduling_required"
                              ? "bg-red-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {apt.status === "rescheduling_required" ? "Doctor On Leave - Reschedule Needed" : apt.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Schedule & Slot details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-background border rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Date</span>
                        <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> {apt.date}
                        </span>
                      </div>
                      <div className="p-2.5 bg-background border rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Time Slot</span>
                        <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-primary" /> {apt.startTime} - {apt.endTime}
                        </span>
                      </div>
                      <div className="p-2.5 bg-background border rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">AI Urgency Level</span>
                        <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> {apt.preVisitAISummary?.urgencyLevel || "Standard"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-background border rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Patient</span>
                        <span className="font-bold text-foreground mt-0.5 block">{apt.patientName}</span>
                      </div>
                    </div>

                    {/* Leave Conflict Warning Box if on Leave */}
                    {(apt.status === "rescheduling_required" || apt.leaveConflictDetails) && (
                      <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-red-700 dark:text-red-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> Doctor Leave Conflict Recorded
                          </span>
                          <span className="text-[10px] font-normal">History Preserved</span>
                        </div>
                        <p className="text-red-900/90 dark:text-red-200">
                          {apt.cancellationReason || apt.leaveConflictDetails?.reason || "Dr. " + apt.doctorName + " is unavailable on " + apt.date + " due to scheduled leave."}
                        </p>
                        {apt.leaveConflictDetails && (
                          <div className="p-2 bg-background/80 rounded border border-red-500/20 text-[11px] text-muted-foreground">
                            <span>Original Affected Slot: <strong>{apt.leaveConflictDetails.originalDate} ({apt.leaveConflictDetails.originalStartTime} - {apt.leaveConflictDetails.originalEndTime})</strong></span>
                            <span className="block mt-0.5">Flagged At: {new Date(apt.leaveConflictDetails.flaggedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {apt.status === "rescheduling_required" && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenRescheduleModal(apt)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs mt-1"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Select New Date & Time Slot
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Reschedule History Audit Trail */}
                    {apt.rescheduleHistory && apt.rescheduleHistory.length > 0 && (
                      <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <History className="w-3.5 h-3.5 text-primary" /> Reschedule History & Audit Log
                        </div>
                        <div className="space-y-1.5">
                          {apt.rescheduleHistory.map((rec, i) => (
                            <div key={i} className="p-2 bg-background border rounded-lg text-[11px] space-y-1">
                              <div className="flex items-center justify-between font-medium">
                                <span className="flex items-center gap-1">
                                  <span className="line-through text-muted-foreground">{rec.previousDate} {rec.previousStartTime}</span>
                                  <ArrowRight className="w-3 h-3 text-primary" />
                                  <strong className="text-foreground">{rec.newDate} {rec.newStartTime}</strong>
                                </span>
                                <span className="text-[10px] text-muted-foreground">{new Date(rec.rescheduledAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-muted-foreground text-[10px]">Reason: {rec.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pre-Visit Symptoms Briefing */}
                    <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> Pre-Visit AI Triage & Symptoms
                        </span>
                        {apt.preVisitAISummary?.urgencyLevel && (
                          <Badge className="text-[10px] font-bold" variant="secondary">
                            Urgency: {apt.preVisitAISummary.urgencyLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{apt.symptoms}</p>

                      {apt.preVisitAISummary && (
                        <div className="pt-2 border-t border-border/60 mt-2 space-y-1">
                          <p className="text-[11px] font-semibold text-foreground">
                            AI Chief Complaint: <span className="font-normal text-muted-foreground">{apt.preVisitAISummary.chiefComplaint}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* If Completed: Post-Visit AI Summary & Prescriptions */}
                    {apt.status === "completed" && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-3.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-green-500/20 pb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <h4 className="font-bold text-green-950 dark:text-green-300 text-sm">
                              Doctor's Post-Visit Plan & AI Patient Summary
                            </h4>
                          </div>
                          {apt.postVisitAISummary && (
                            <Badge className="bg-green-600 text-white text-[10px] font-semibold">
                              <Sparkles className="w-3 h-3 mr-1" /> AI Translated for Patient
                            </Badge>
                          )}
                        </div>

                        {/* AI Simple Explanation */}
                        {apt.postVisitAISummary?.patientFriendlySummary && (
                          <div className="space-y-1">
                            <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider">
                              Simple Summary of Your Visit:
                            </span>
                            <p className="text-foreground/90 font-medium bg-background/90 p-3 rounded-lg border leading-relaxed">
                              {apt.postVisitAISummary.patientFriendlySummary}
                            </p>
                          </div>
                        )}

                        {/* Doctor's Clinical Diagnosis & Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border">
                          <div>
                            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                              Official Diagnosis:
                            </span>
                            <p className="text-foreground font-bold">{apt.diagnosis || "Consultation Completed"}</p>
                          </div>
                          {apt.followUpInstructions && (
                            <div>
                              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                                Doctor's Follow-Up Advice:
                              </span>
                              <p className="text-foreground font-medium">{apt.followUpInstructions}</p>
                            </div>
                          )}
                        </div>

                        {/* Medication Schedule (AI Formatted) */}
                        {apt.postVisitAISummary?.medicationSchedule && apt.postVisitAISummary.medicationSchedule.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-primary" /> Medication Schedule
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {apt.postVisitAISummary.medicationSchedule.map((med, idx) => (
                                <div key={idx} className="p-2.5 bg-background border rounded-lg space-y-1">
                                  <div className="flex justify-between font-bold text-foreground">
                                    <span>{med.medicine}</span>
                                    <span className="text-primary font-mono">{med.dosage}</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {med.frequency} • {med.timing} ({med.duration})
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Doctor's Original Prescriptions (Source of Truth) */}
                        {apt.prescriptions && apt.prescriptions.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider">
                              Doctor's Prescriptions (Source of Truth):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {apt.prescriptions.map((rx, idx) => (
                                <div key={idx} className="p-2 bg-background border rounded-lg text-[11px] space-y-0.5">
                                  <div className="flex justify-between font-bold text-foreground">
                                    <span>{rx.medicineName}</span>
                                    <span className="text-primary">{rx.dosage}</span>
                                  </div>
                                  <p className="text-muted-foreground text-[10px]">
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

                        {/* Follow up steps */}
                        {apt.postVisitAISummary?.followUpSteps && apt.postVisitAISummary.followUpSteps.length > 0 && (
                          <div className="pt-1">
                            <span className="font-bold text-foreground block text-[11px] mb-1">Follow-up Steps:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] bg-background/80 p-2.5 rounded-lg border">
                              {apt.postVisitAISummary.followUpSteps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Important instructions */}
                        {apt.postVisitAISummary?.importantInstructions && apt.postVisitAISummary.importantInstructions.length > 0 && (
                          <div className="pt-1">
                            <span className="font-bold text-foreground block text-[11px] mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                              <AlertCircle className="w-3.5 h-3.5" /> Important Instructions & Precautions:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/20">
                              {apt.postVisitAISummary.importantInstructions.map((ins, i) => (
                                <li key={i}>{ins}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {apt.googleCalendarLink && (
                          <a
                            href={apt.googleCalendarLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted border rounded-lg text-xs font-semibold text-foreground transition-colors"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" /> Add to Google Calendar
                          </a>
                        )}
                        <a
                          href={`/api/appointments/${apt.id}/calendar.ics`}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted border rounded-lg text-xs font-semibold text-foreground transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" /> .iCal (.ics)
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        {(apt.status === "confirmed" || apt.status === "rescheduling_required") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRescheduleModal(apt)}
                            className="text-xs text-primary hover:bg-primary/5 font-semibold"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Reschedule Slot
                          </Button>
                        )}

                        {apt.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(apt.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: MEDICATION REMINDERS */}
        <TabsContent value="medications" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" /> Active Prescription Reminders
              </CardTitle>
              <CardDescription>
                System generates scheduled medication reminders automatically based on doctor prescription frequency.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {reminders.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active medication reminders for this patient profile. Complete a consultation to receive automated reminders.
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        rem.status === "taken"
                          ? "bg-green-500/5 border-green-500/30"
                          : rem.status === "skipped"
                          ? "bg-muted/40 border-dashed"
                          : "bg-card border-border shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${rem.status === "taken" ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"}`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">{rem.medicineName}</h4>
                            <Badge variant="outline" className="text-[10px] font-semibold">{rem.timeSlot}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rem.instructions} • {rem.frequency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {rem.status === "taken" ? (
                          <Badge className="bg-green-600 text-white text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Dose Taken
                          </Badge>
                        ) : (rem.status === "failed" || rem.status === "retrying") ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-600 text-white text-xs font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {rem.status.toUpperCase()}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryMedReminder(rem.id)}
                              className="text-xs h-8"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" /> Retry
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleMarkReminder(rem.id, "taken")}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Taken
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkReminder(rem.id, "skipped")}
                              className="text-xs text-muted-foreground"
                            >
                              Skip
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AI SUMMARIES EXPLORER */}
        <TabsContent value="summaries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Pre-Visit AI Triage Summaries
                </CardTitle>
                <CardDescription>Generated for doctors prior to each consultation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.filter(a => a.preVisitAISummary).map(apt => (
                  <div key={apt.id} className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>{apt.doctorName}</span>
                      <Badge className="text-[10px]">{apt.preVisitAISummary?.urgencyLevel}</Badge>
                    </div>
                    <p className="text-muted-foreground">{apt.preVisitAISummary?.chiefComplaint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" /> Post-Visit Clinical Summaries
                </CardTitle>
                <CardDescription>Patient-friendly translations of doctor notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">No completed consultations yet.</p>
                ) : (
                  completedAppointments.map(apt => (
                    <div key={apt.id} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>{apt.doctorName} ({apt.doctorSpecialisation})</span>
                        <span className="text-muted-foreground">{apt.date}</span>
                      </div>
                      <p className="text-foreground/90 font-medium">{apt.postVisitAISummary?.patientFriendlySummary || "Clinical consultation recorded."}</p>
                      {apt.prescriptions && apt.prescriptions.length > 0 && (
                        <div className="text-[11px] text-muted-foreground pt-1 border-t">
                          <strong>Prescribed:</strong> {apt.prescriptions.map(p => `${p.medicineName} (${p.dosage})`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* RESCHEDULE APPOINTMENT MODAL */}
      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CalendarPlus className="w-5 h-5 text-primary" /> Reschedule Appointment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a new date and an available time slot for your consultation with <strong>{reschedulingAppointment?.doctorName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {reschedulingAppointment && (
            <div className="space-y-4 text-xs">
              {/* Doctor & original slot summary */}
              <div className="p-3 bg-muted/40 border rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-foreground">
                  <span>{reschedulingAppointment.doctorName}</span>
                  <span className="text-primary">{reschedulingAppointment.doctorSpecialisation}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Current / Original Slot: <span className="line-through">{reschedulingAppointment.date} ({reschedulingAppointment.startTime} - {reschedulingAppointment.endTime})</span>
                </p>
                {reschedulingAppointment.status === "rescheduling_required" && (
                  <p className="text-red-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Doctor leave conflict active. Choose an upcoming working date below.
                  </p>
                )}
              </div>

              {/* Date Selector */}
              <div>
                <label className="font-bold text-foreground block mb-1">Select New Consultation Date</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-foreground block mb-1">Reason for Rescheduling (Optional)</label>
                <Input
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Schedule adjustment, doctor requested reschedule"
                  className="text-xs"
                />
              </div>

              {/* Available Slots Grid */}
              <div className="space-y-2">
                <label className="font-bold text-foreground block">Available Time Slots for {rescheduleDate}</label>

                {loadingRescheduleSlots ? (
                  <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Fetching live doctor slots...
                  </div>
                ) : rescheduleStatus === "leave" ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="font-bold text-red-700 dark:text-red-300">Doctor on Leave</p>
                    <p className="text-[11px] text-muted-foreground">Dr. {reschedulingAppointment.doctorName} is unavailable on {rescheduleDate}. Please select another date.</p>
                  </div>
                ) : rescheduleStatus === "non_working_day" ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                    <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="font-bold text-amber-700 dark:text-amber-300">Non-Working Day</p>
                    <p className="text-[11px] text-muted-foreground">This day is outside the doctor's active clinical schedule.</p>
                  </div>
                ) : rescheduleSlots.filter(s => s.status === "available").length === 0 ? (
                  <div className="p-4 bg-muted/40 border rounded-xl text-center text-muted-foreground text-xs">
                    No available slots remaining on this day. Please select a different date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {rescheduleSlots.map((slot, idx) => {
                      const isAvail = slot.status === "available";
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-lg border text-center transition-all text-xs font-semibold ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 shadow-sm"
                              : isAvail
                              ? "bg-card hover:bg-muted text-foreground border-border"
                              : "bg-muted/40 text-muted-foreground line-through opacity-50 cursor-not-allowed border-dashed"
                          }`}
                        >
                          <span className="block font-mono text-xs">{slot.startTime}</span>
                          <span className="text-[10px] opacity-80 block">{isAvail ? (isSelected ? "Selected" : "Available") : "Booked"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReschedulingAppointment(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submittingReschedule || !selectedSlot}
              onClick={handleConfirmReschedule}
              className="bg-primary text-primary-foreground font-bold text-xs"
            >
              {submittingReschedule ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Confirming Reschedule...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Confirm Reschedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
};
export default PatientPortal;
