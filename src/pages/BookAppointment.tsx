import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Doctor, Slot, PreVisitAISummary } from "@/types/appointment";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Home,
  ChevronLeft,
  CalendarPlus,
  Download,
  Mail,
  ShieldCheck,
  Stethoscope,
  Activity,
  DollarSign,
  MapPin,
  RefreshCw,
  Search,
  Timer
} from "lucide-react";

export const BookAppointment = () => {
  const navigate = useNavigate();

  // Step state: 1: Select Doctor & Slot, 2: Symptoms & AI Triage, 3: Review & Confirm, 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Doctors & Filters
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialisationFilter, setSpecialisationFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Date & Slot state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Slot Hold State
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState<number>(0);

  // Patient Intake & Symptoms
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState(30);
  const [patientGender, setPatientGender] = useState("Female");

  const [symptoms, setSymptoms] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("1-3 days");
  const [medicalHistory, setMedicalHistory] = useState("None reported");
  const [allergies, setAllergies] = useState("None");

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<PreVisitAISummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Booking outcome
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Load doctors on mount & pre-fill logged in patient info
  useEffect(() => {
    loadDoctors();

    // Check supabase auth user
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) {
        const email = data.user.email || "";
        setPatientEmail(email);
        const name = data.user.user_metadata?.full_name || email.split("@")[0];
        setPatientName(name);
        if (data.user.user_metadata?.phone) {
          setPatientPhone(data.user.user_metadata.phone);
        }
      }
    }).catch(() => {});

    // Check profile
    const savedEmail = localStorage.getItem("rapidresq_patient_email");
    if (savedEmail && !patientEmail) {
      setPatientEmail(savedEmail);
    }
  }, [specialisationFilter]);

  const loadDoctors = async () => {
    try {
      const data = await API.getDoctors(specialisationFilter === "All" ? undefined : specialisationFilter, searchQuery);
      setDoctors(data);
      if (data.length > 0 && !selectedDoctor) {
        setSelectedDoctor(data[0]);
      }
    } catch (err: any) {
      toast.error("Failed to load doctors: " + err.message);
    }
  };

  // Load slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor?.id, selectedDate]);

  const loadSlots = async (doctorId: string, date: string) => {
    setSlotsLoading(true);
    try {
      const data = await API.getSlots(doctorId, date);
      setSlots(data.slots);
    } catch (err: any) {
      toast.error("Failed to load slots: " + err.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Countdown timer for active slot hold
  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldRemainingSeconds(remaining);

      if (remaining <= 0) {
        toast.error("Your 5-minute slot hold has expired. Please select a slot again.");
        setHoldToken(null);
        setHoldExpiresAt(null);
        setSelectedSlot(null);
        if (selectedDoctor) loadSlots(selectedDoctor.id, selectedDate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, selectedDoctor, selectedDate]);

  // Handle Slot Selection with Atomic 5-minute Hold
  const handleSelectSlot = async (slot: Slot) => {
    if (slot.status === "booked") {
      toast.error("This slot is already booked. Please choose an available time slot.");
      return;
    }
    if (slot.status === "held" && slot.holdToken !== holdToken) {
      toast.error("This slot is currently held by another patient during checkout.");
      return;
    }

    if (!selectedDoctor) return;

    try {
      // Release prior hold if different
      if (holdToken) {
        await API.releaseHold(holdToken);
      }

      const holdRes = await API.holdSlot({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        patientName,
        patientEmail,
      });

      setSelectedSlot(slot);
      setHoldToken(holdRes.holdToken);
      setHoldExpiresAt(holdRes.expiresAt);
      setHoldRemainingSeconds(holdRes.ttlSeconds);
      toast.success(`Slot ${slot.startTime} reserved exclusively for 5 minutes!`);
    } catch (err: any) {
      toast.error(err.error || "Failed to reserve slot.");
      loadSlots(selectedDoctor.id, selectedDate);
    }
  };

  // Generate Pre-Visit AI Summary
  const handleGenerateAISummary = async () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms before requesting AI pre-visit analysis.");
      return;
    }

    setAiLoading(true);
    try {
      const summary = await API.getPreVisitAISummary(symptoms, medicalHistory, allergies);
      setAiSummary(summary);
      toast.success("AI Pre-Visit symptom triage completed!");
    } catch (err: any) {
      toast.error("AI Analysis failed: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Confirm Final Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !symptoms) {
      toast.error("Please complete all required fields.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      toast.error("Authentication required. Please sign in to book your appointment.");
      navigate("/auth?redirect=/book");
      return;
    }

    const currentEmail = authData.user.email || patientEmail;
    if (!currentEmail) {
      toast.error("Patient email is required. Please ensure you are logged in.");
      return;
    }

    setBookingLoading(true);
    try {
      const booking = await API.bookAppointment({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        patientName: patientName || authData.user.user_metadata?.full_name || currentEmail.split("@")[0],
        patientEmail: currentEmail,
        patientPhone: patientPhone || authData.user.user_metadata?.phone || "",
        patientAge,
        patientGender,
        symptoms,
        symptomDuration,
        medicalHistory,
        allergies,
        holdToken: holdToken || undefined,
        preVisitAISummary: aiSummary || undefined,
      });

      localStorage.setItem("rapidresq_patient_email", patientEmail);
      localStorage.setItem("rapidresq_last_booking_email", patientEmail);
      window.dispatchEvent(new CustomEvent("rapidresq_appointment_booked", { detail: booking }));

      setConfirmedBooking(booking);
      setStep(4);
      toast.success("Appointment booked successfully with zero double-booking!");
    } catch (err: any) {
      if (err.code === "SLOT_CONFLICT_DOUBLE_BOOKING_PREVENTED") {
        toast.error("Sorry, this slot was just booked by another patient.");
        setStep(1);
        if (selectedDoctor) loadSlots(selectedDoctor.id, selectedDate);
      } else {
        toast.error(err.message || "Booking failed. Please try another slot.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Quick symptom sample chips
  const quickSymptoms = [
    "Heart fluttering and palpitations after coffee",
    "High fever (102°F), body ache, and throat soreness",
    "Severe throbbing headache with light sensitivity",
    "Persistent red itchy rash on inner forearms",
    "Sharp knee pain when climbing stairs or squatting",
    "Shortness of breath and wheezing during mild exercise"
  ];

  const specialisations = ["All", "Cardiology", "General Medicine", "Dermatology", "Pediatrics", "Neurology"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb / Quick Back Navigation */}
          <div className="flex items-center justify-between">
            <Link 
              to="/patient-portal" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Portal Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-semibold px-3 py-1">
                Patient Portal Desk
              </Badge>
              <Link 
                to="/patient-portal" 
                className="text-xs font-semibold text-muted-foreground hover:text-foreground border rounded-lg px-2.5 py-1 bg-muted/40 transition-colors"
              >
                My Care Hub
              </Link>
            </div>
          </div>

          {/* Top Banner / Progress Header */}
          <div className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Patient Portal • Specialist Consultation Booking
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Book Doctor Consultation
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-2xl mx-auto">
          Choose your medical specialist, lock your consultation slot, and receive pre-visit AI clinical preparation synced with your patient portal records.
        </p>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6 max-w-lg mx-auto">
          {[
            { num: 1, label: "Doctor & Slot" },
            { num: 2, label: "Symptoms & AI" },
            { num: 3, label: "Review" },
            { num: 4, label: "Confirmed" }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                      : step > s.num
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${step === s.num ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 max-w-[32px] ${step > s.num ? "bg-green-600" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Slot Hold Floating Timer Banner */}
      {holdToken && holdRemainingSeconds > 0 && step < 4 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-600 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Slot Held Exclusively ({selectedSlot?.startTime} - {selectedSlot?.endTime} with {selectedDoctor?.name})
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400">
                Atomic reservation active. Other patients cannot book this slot during your checkout.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow">
            <Timer className="w-3.5 h-3.5" />
            {Math.floor(holdRemainingSeconds / 60)}:{(holdRemainingSeconds % 60).toString().padStart(2, "0")}
          </div>
        </div>
      )}

      {/* STEP 1: SELECT DOCTOR & SLOT */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Doctor Selection & Filters */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-primary" /> 1. Choose Medical Specialist
                    </CardTitle>
                    <CardDescription>Filter by clinical discipline or search doctor by name</CardDescription>
                  </div>
                  {/* Search input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search doctor..."
                      className="pl-9 text-xs h-9"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        loadDoctors();
                      }}
                    />
                  </div>
                </div>

                {/* Specialisation filter pills */}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {specialisations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSpecialisationFilter(spec)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        specialisationFilter === spec
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 max-h-[500px] overflow-y-auto pr-2">
                {doctors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No doctors found for the selected criteria.
                  </div>
                ) : (
                  doctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-16 h-16 rounded-xl object-cover border shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-sm text-foreground">{doc.name}</h3>
                              <p className="text-xs text-primary font-semibold">{doc.specialisation}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs font-mono font-bold shrink-0">
                              ${doc.consultationFee}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{doc.bio}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              ⭐ {doc.rating} ({doc.reviewsCount} reviews)
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" /> {doc.hospitalAffiliation}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" /> {doc.slotDurationMinutes} min slots
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Date & Slot Selection */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" /> 2. Pick Date & Time Slot
                </CardTitle>
                <CardDescription>
                  {selectedDoctor ? `Viewing schedule for ${selectedDoctor.name}` : "Select a doctor first"}
                </CardDescription>

                {/* Date Input */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-foreground block mb-1">Consultation Date</label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedDoctor?.leaveDates?.includes(selectedDate) ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-red-700 dark:text-red-300">Doctor on Scheduled Leave</p>
                    <p className="text-xs text-red-600/90 dark:text-red-400 mt-1">
                      {selectedDoctor.name} is unavailable on {selectedDate}. Please select an alternate date.
                    </p>
                  </div>
                ) : slotsLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Calculating real-time slot locks...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No slots available on this date for {selectedDoctor?.name}.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                      <span>Available Time Slots ({selectedDoctor?.slotDurationMinutes} min each)</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Available</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Held</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Booked</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        const isBooked = slot.status === "booked";
                        const isHeld = slot.status === "held" && slot.holdToken !== holdToken;

                        return (
                          <button
                            key={slot.startTime}
                            disabled={isBooked || isHeld}
                            onClick={() => handleSelectSlot(slot)}
                            className={`p-2.5 rounded-lg text-xs font-semibold transition-all border text-center flex flex-col items-center justify-center gap-0.5 ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : isBooked
                                ? "bg-muted/50 text-muted-foreground/40 border-dashed border-border cursor-not-allowed line-through"
                                : isHeld
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 cursor-not-allowed"
                                : "bg-card hover:border-primary/50 text-foreground"
                            }`}
                          >
                            <span className="font-mono">{slot.startTime}</span>
                            <span className="text-[10px] font-normal opacity-80">
                              {isBooked ? "Booked" : isHeld ? "Held" : isSelected ? "Selected" : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Continue button */}
                <Button
                  className="w-full mt-4 font-bold"
                  disabled={!selectedSlot || !selectedDoctor}
                  onClick={() => setStep(2)}
                >
                  Continue to Symptom Form & AI Triage <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2: SYMPTOM FORM & AI TRIAGE */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Patient Details & Symptom Intake
                  </CardTitle>
                  <CardDescription>
                    Provide your symptoms for Gemini AI pre-visit triage. This will be provided to Dr. {selectedDoctor?.name}.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Change Slot
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Patient Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Email Address</label>
                  <Input value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Phone Number</label>
                  <Input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} className="text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Age</label>
                    <Input type="number" value={patientAge} onChange={(e) => setPatientAge(Number(e.target.value))} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Gender</label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Symptoms Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Describe Current Symptoms <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Detailed descriptions yield better AI triage</span>
                </div>
                <Textarea
                  placeholder="e.g. Sharp pain in chest when inhaling deeply, accompanied by shortness of breath and mild fever..."
                  rows={4}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="text-xs"
                />

                {/* Quick Symptom Chips */}
                <div className="mt-2">
                  <span className="text-[11px] text-muted-foreground block mb-1.5">Or pick quick sample symptom:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSymptoms.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSymptoms(chip)}
                        className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-md transition-colors text-left"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration & History */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Symptom Duration</label>
                  <Input value={symptomDuration} onChange={(e) => setSymptomDuration(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Known Medical History</label>
                  <Input value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} placeholder="e.g. Hypertension, Diabetes" className="text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Known Allergies</label>
                  <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts" className="text-xs" />
                </div>
              </div>

              {/* AI Pre-Visit Triage Trigger */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAISummary}
                  disabled={aiLoading || !symptoms.trim()}
                  className="w-full border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> Gemini 3.7 Flash Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-2" /> Generate AI Pre-Visit Triage Summary
                    </>
                  )}
                </Button>
              </div>

              {/* AI Summary Display Box */}
              {aiSummary && (
                <div className="p-4 bg-muted/50 border rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">AI Pre-Visit Clinical Briefing</h4>
                      {aiSummary.isFallback && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                          Heuristic Fallback
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs font-bold ${
                          aiSummary.urgencyLevel === "High"
                            ? "bg-red-500 text-white"
                            : aiSummary.urgencyLevel === "Medium"
                            ? "bg-amber-500 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        Urgency Level: {aiSummary.urgencyLevel}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Chief Complaint Synthesis
                    </span>
                    <p className="text-xs font-medium text-foreground bg-background p-2.5 rounded-lg border">
                      {aiSummary.chiefComplaint}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Three Suggested Questions for Dr. {selectedDoctor?.name}
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside bg-background p-2.5 rounded-lg border">
                      {aiSummary.suggestedQuestions.map((q, i) => (
                        <li key={i} className="text-xs text-foreground/90">{q}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety & Compliance Disclaimer */}
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Clinical Disclaimer:</strong> {aiSummary.disclaimer || "This summary is an AI clinical support feature to assist the doctor during consultation, not a medical diagnosis."}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!symptoms.trim()}
                  className="font-bold"
                >
                  Proceed to Review & Confirm <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: REVIEW & ATOMIC CONFIRMATION */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" /> Review & Confirm Appointment
              </CardTitle>
              <CardDescription>
                Verify details below. Upon confirmation, your slot will be locked atomically, Google Calendar event generated, and confirmation emails dispatched.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Doctor Details Summary */}
              <div className="p-4 bg-muted/40 rounded-xl border flex items-center gap-4">
                <img
                  src={selectedDoctor?.avatar}
                  alt={selectedDoctor?.name}
                  className="w-14 h-14 rounded-xl object-cover border"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-foreground">{selectedDoctor?.name}</h4>
                  <p className="text-xs text-primary font-semibold">{selectedDoctor?.specialisation}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedDoctor?.hospitalAffiliation} • {selectedDoctor?.roomNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Fee</span>
                  <span className="text-base font-mono font-bold text-foreground">${selectedDoctor?.consultationFee}</span>
                </div>
              </div>

              {/* Appointment Schedule & Slot Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-background border rounded-lg">
                  <span className="text-muted-foreground block text-[11px]">Date</span>
                  <span className="font-bold text-foreground">{selectedDate}</span>
                </div>
                <div className="p-3 bg-background border rounded-lg">
                  <span className="text-muted-foreground block text-[11px]">Time Window</span>
                  <span className="font-bold text-foreground">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
                </div>
                <div className="p-3 bg-background border rounded-lg">
                  <span className="text-muted-foreground block text-[11px]">Patient Name</span>
                  <span className="font-bold text-foreground">{patientName} ({patientAge}y, {patientGender})</span>
                </div>
                <div className="p-3 bg-background border rounded-lg">
                  <span className="text-muted-foreground block text-[11px]">Email & Phone</span>
                  <span className="font-bold text-foreground">{patientEmail}</span>
                </div>
              </div>

              {/* AI Triage Urgency Banner */}
              {aiSummary && (
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground">AI Triage Ready: </span>
                      <span className="text-muted-foreground">{aiSummary.chiefComplaint}</span>
                    </div>
                  </div>
                  <Badge className={aiSummary.urgencyLevel === "High" ? "bg-red-500" : aiSummary.urgencyLevel === "Medium" ? "bg-amber-500" : "bg-green-600"}>
                    {aiSummary.urgencyLevel}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back to Symptoms
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {bookingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Atomically Locking Slot...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Book Slot
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION & CALENDAR SYNC */}
      {step === 4 && confirmedBooking && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-green-500/30 bg-green-500/5 shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-foreground">
                Appointment Confirmed!
              </CardTitle>
              <CardDescription>
                Booking Reference: <span className="font-mono font-bold text-primary">{confirmedBooking.bookingReference}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              <div className="p-4 bg-card border rounded-xl space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-bold text-foreground">{confirmedBooking.doctorName} ({confirmedBooking.doctorSpecialisation})</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-bold text-foreground">{confirmedBooking.date} at {confirmedBooking.startTime} - {confirmedBooking.endTime}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-bold text-foreground">{confirmedBooking.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Urgency Rating</span>
                  <Badge className="font-bold">{confirmedBooking.preVisitAISummary?.urgencyLevel || "Low"}</Badge>
                </div>
              </div>

              {/* Google Calendar & Email Notification Integrations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Sync & Calendar Integrations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Google Calendar Direct Link */}
                  <a
                    href={confirmedBooking.googleCalendarLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-card hover:bg-muted/50 border rounded-xl flex items-center gap-3 transition-colors text-xs font-semibold"
                  >
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-foreground">Add to Google Calendar</span>
                      <span className="text-[10px] text-muted-foreground">One-click event sync</span>
                    </div>
                  </a>

                  {/* Download .ics */}
                  <a
                    href={`/api/appointments/${confirmedBooking.id}/calendar.ics`}
                    download
                    className="p-3 bg-card hover:bg-muted/50 border rounded-xl flex items-center gap-3 transition-colors text-xs font-semibold"
                  >
                    <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-foreground">Download .iCal (.ics)</span>
                      <span className="text-[10px] text-muted-foreground">Apple / Outlook / Cal</span>
                    </div>
                  </a>
                </div>

                {/* Email Confirmation Dispatched Banner */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-xs">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-blue-900 dark:text-blue-300">
                    Confirmation emails have been queued and sent to <strong>{confirmedBooking.patientEmail}</strong> and the doctor's clinic.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 font-bold"
                  onClick={() => navigate(`/patient-portal?email=${encodeURIComponent(confirmedBooking.patientEmail)}`)}
                >
                  Go to Patient Portal <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setSelectedSlot(null);
                    setHoldToken(null);
                    setSymptoms("");
                    setAiSummary(null);
                  }}
                >
                  Book Another Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};
export default BookAppointment;
