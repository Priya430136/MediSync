import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, Heart, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const BottomBookingBanner = () => {
  return (
    <section className="py-12 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl p-8 sm:p-12 lg:p-16">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider border border-white/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Book Your Appointment</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Your Health Is <br />
                <span className="text-white/90 underline decoration-white/30 decoration-wavy">
                  Our Priority
                </span>
              </h2>

              <p className="text-white/90 text-sm sm:text-base max-w-lg leading-relaxed font-medium">
                Schedule your consultation with trusted board-certified medical professionals today. Enjoy 5-minute atomic slot locks, instant confirmations, and seamless follow-ups.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/book">
                  <Button
                    size="lg"
                    className="bg-white text-red-600 hover:bg-white/90 font-bold px-8 py-6 text-base rounded-full shadow-lg transition-all flex items-center gap-2 group"
                  >
                    <Calendar className="w-5 h-5 text-red-600" />
                    <span>Book Appointment Now</span>
                    <ArrowRight className="w-4 h-4 ml-1 text-red-600 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <Link to="/patient-portal">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 font-semibold px-6 py-6 text-base rounded-full"
                  >
                    <span>Patient Health Portal</span>
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 items-center pt-2 text-xs font-medium text-white/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white" /> Zero Double-Booking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white" /> Verified Clinicians
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white" /> 24/7 Availability
                </span>
              </div>
            </div>

            {/* Right Visual Composition (5 cols) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-72 sm:w-80 h-72 sm:h-80 flex items-center justify-center">
                
                {/* 3D Medical Cross Shield */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-48 h-48 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white text-red-600 shadow-xl flex items-center justify-center mb-3">
                    <Shield className="w-10 h-10 fill-red-600 text-red-600" />
                  </div>
                  <span className="text-white font-extrabold text-sm tracking-wide">
                    RapidResq Care
                  </span>
                  <span className="text-white/80 text-[11px]">
                    24/7 Emergency & Outpatient
                  </span>
                </motion.div>

                {/* Floating 3D Capsule Pill */}
                <motion.div
                  animate={{ y: [0, 10, 0], rotate: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -top-4 right-4 bg-white/20 backdrop-blur-lg border border-white/40 px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-white"
                >
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span>5-Min Slot Lock</span>
                </motion.div>

                {/* Floating Heart Health Badge */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-2 -left-2 bg-white/20 backdrop-blur-lg border border-white/40 p-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-bold text-white"
                >
                  <Heart className="w-5 h-5 fill-white text-white" />
                  <div>
                    <p className="text-[10px] text-white/80 font-normal">Quality Rating</p>
                    <p className="font-bold">4.9 / 5.0 Rated</p>
                  </div>
                </motion.div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
