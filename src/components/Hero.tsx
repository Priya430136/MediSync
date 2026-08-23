import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  UserCheck, 
  ArrowRight, 
  Lock, 
  Pill, 
  Clock, 
  Brain, 
  FileText, 
  RotateCcw,
  Star,
  Activity,
  HeartPulse
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import doctorIllustration from "@/assets/doctor-illustration.png";

export const Hero = () => {
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const specialties = [
    { name: "Cardiology", count: "12 Doctors" },
    { name: "Neurology", count: "8 Doctors" },
    { name: "General Medicine", count: "24 Doctors" },
    { name: "Pediatrics", count: "10 Doctors" },
    { name: "Orthopedics", count: "14 Doctors" },
  ];

  return (
    <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-background via-medical-blue-light/15 to-background">
      {/* Dynamic Ambient Medical Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[15%] right-[-10%] w-[40%] h-[55%] bg-blue-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-5%] left-[25%] w-[50%] h-[40%] bg-emerald-500/5 rounded-full blur-[140px]" />
        {/* Subtle grid lines for high-tech clinical feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        {/* Main Grid: Clinical Headline + Visual Presentation */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Headline, Value Proposition & Primary CTAs (7 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs border border-primary/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Next-Gen Clinical Scheduling & Triage</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Double-Booking Guarantee</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.12] tracking-tight">
              Precision Healthcare Scheduling &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">
                AI Clinical Triage.
              </span>
            </h1>
            
            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Connect with leading board-certified specialists with zero scheduling race conditions. Experience 5-minute atomic slot locks, pre-visit symptom analysis, and seamless post-consultation medication tracking.
            </p>

            {/* Quick Specialty Pill Filters */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider block">
                Popular Clinical Specialties:
              </span>
              <div className="flex flex-wrap gap-2">
                {specialties.map((spec) => (
                  <button
                    key={spec.name}
                    onClick={() => {
                      setSelectedSpecialty(spec.name);
                      navigate(`/book?specialty=${encodeURIComponent(spec.name)}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/70 text-foreground transition-all shadow-2xs group cursor-pointer"
                  >
                    <HeartPulse className="w-3 h-3 text-primary/70 group-hover:scale-110 transition-transform" />
                    <span>{spec.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/book">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 py-6 text-base rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Doctor Appointment</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link to="/patient-portal">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-border hover:bg-accent text-foreground font-semibold px-6 py-6 text-base rounded-full shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Patient Health Portal</span>
                </Button>
              </Link>
            </div>

            {/* Clinical Trust Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
              {[
                { title: "5-Min Slot Hold", desc: "Prevents double-booking" },
                { title: "Gemini 3.7 Flash", desc: "Pre-visit symptom triage" },
                { title: "1-Click iCal Export", desc: "Apple, Google & Outlook" },
                { title: "Medication Reminders", desc: "Daily adherence logs" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-4.5">{item.desc}</p>
                </div>
              ))}
            </div>

          </motion.div>

          {/* Right Column: Hero Visual with the 3D Reference Image (5 Cols) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative z-10 w-full aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 to-card/40 p-2.5 shadow-2xl backdrop-blur-2xl border border-border/70 flex items-center justify-center">
              <img 
                src={doctorIllustration} 
                alt="3D Medical consultation and doctor hospital scene" 
                className="w-full h-full object-contain drop-shadow-xl select-none"
              />
              
              {/* Floating Status Badge 1: Pre-Visit AI Triage */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-5 right-5 bg-card/95 backdrop-blur-xl border border-border/80 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-[240px]"
              >
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">AI Symptom Triage</p>
                  <p className="font-bold text-xs text-foreground leading-tight">Instant Physician Briefing</p>
                </div>
              </motion.div>

              {/* Floating Status Badge 2: Verified Doctor Profile */}
              <motion.div 
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-5 left-5 bg-card/95 backdrop-blur-xl border border-border/80 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-[260px]"
              >
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-foreground">Verified Specialist</span>
                    <span className="flex items-center text-[10px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" /> 4.9
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">5-Min Slot Lock Protected</p>
                </div>
              </motion.div>
            </div>

            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/15 via-blue-500/10 to-transparent rounded-[2.5rem] blur-2xl -z-10 pointer-events-none" />
          </motion.div>

        </div>

        {/* Dual Value Propositions: Patients vs. Doctors & Clinics */}
        <div className="mt-14 pt-12 border-t border-border/60">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Comprehensive Healthcare Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Designed for Patients & Healthcare Providers
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Streamlining the entire consultation lifecycle from initial intake to recovery compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Patient Value Proposition Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">For Patients & Families</h3>
                    <p className="text-xs text-muted-foreground">Effortless care navigation and adherence</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[11px]">
                  Patient Experience
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Lock className="w-3.5 h-3.5 text-primary" /> 5-Min Slot Hold
                  </div>
                  <p className="text-[11px] text-muted-foreground">Guarantees your slot while you enter symptoms with zero race conditions.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Brain className="w-3.5 h-3.5 text-primary" /> AI Symptom Triage
                  </div>
                  <p className="text-[11px] text-muted-foreground">Pre-consult urgency score (Low/Med/High) and 3 suggested doctor questions.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> 1-Click iCal Export
                  </div>
                  <p className="text-[11px] text-muted-foreground">Direct RFC 5545 calendar integration for Apple, Google, and Outlook.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Medicine Tracker
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clear dosage guides with daily taken/skipped adherence logging.</p>
                </div>
              </div>

              <Link to="/book">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-500/30 gap-1.5">
                  <span>Start Patient Booking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Doctor & Clinic Value Proposition Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">For Clinicians & Practices</h3>
                    <p className="text-xs text-muted-foreground">Intelligent workspace and roster management</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20 text-[11px]">
                  Clinical Workspace
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Pre-Visit Briefing
                  </div>
                  <p className="text-[11px] text-muted-foreground">Start every consultation with chief complaints and AI diagnostic inquiries.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Digital Rx Writer
                  </div>
                  <p className="text-[11px] text-muted-foreground">Multi-drug regimens with 1-click plain-language patient translation.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Leave Auto-Cascade
                  </div>
                  <p className="text-[11px] text-muted-foreground">Absences instantly safeguard schedule and trigger patient rescheduling alerts.</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Granular Roster
                  </div>
                  <p className="text-[11px] text-muted-foreground">Configurable 15 to 60-min slots with automatic lunch break exclusions.</p>
                </div>
              </div>

              <Link to="/doctor-portal">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold hover:bg-blue-500/10 hover:text-blue-700 hover:border-blue-500/30 gap-1.5">
                  <span>Enter Doctor Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
