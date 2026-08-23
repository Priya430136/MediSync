import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Baby, Scissors, ArrowRight, Star, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface DoctorCard {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  imageUrl: string;
  badgeIcon: typeof Heart;
  badgeColor: string;
  availability: string;
  consultationFee: string;
}

const doctors: DoctorCard[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    rating: 4.9,
    reviewsCount: 142,
    experience: "12+ Yrs Exp",
    imageUrl: "https://images.unsplash.com/photo-1594824813639-491176b91ea3?auto=format&fit=crop&w=600&q=80",
    badgeIcon: Heart,
    badgeColor: "bg-red-500 text-white",
    availability: "Today, 4 Slots",
    consultationFee: "₹800",
  },
  {
    id: "doc-2",
    name: "Dr. Michael Brown",
    specialty: "Neurology",
    rating: 4.8,
    reviewsCount: 98,
    experience: "15+ Yrs Exp",
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    badgeIcon: Brain,
    badgeColor: "bg-red-500 text-white",
    availability: "Tomorrow, 6 Slots",
    consultationFee: "₹950",
  },
  {
    id: "doc-3",
    name: "Dr. Emily Davis",
    specialty: "Pediatrics",
    rating: 5.0,
    reviewsCount: 210,
    experience: "9+ Yrs Exp",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    badgeIcon: Baby,
    badgeColor: "bg-red-500 text-white",
    availability: "Today, 2 Slots",
    consultationFee: "₹700",
  },
  {
    id: "doc-4",
    name: "Dr. David Wilson",
    specialty: "Surgery",
    rating: 4.9,
    reviewsCount: 165,
    experience: "18+ Yrs Exp",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",
    badgeIcon: Scissors,
    badgeColor: "bg-red-500 text-white",
    availability: "Wed, 5 Slots",
    consultationFee: "₹1,200",
  },
];

export const SpecialistDoctors = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold tracking-wide border border-red-200 dark:border-red-900/50">
            Our Medical Experts
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Meet <span className="text-red-600">Our Specialist Doctors</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Highly qualified doctors dedicated to providing you and your loved ones the best healthcare.
          </p>
        </div>

        {/* 4 Doctor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor, idx) => {
            const BadgeIcon = doctor.badgeIcon;
            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-card border border-border/70 rounded-3xl p-6 text-center shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Doctor Avatar with soft pink/red circular backdrop & badge */}
                <div className="relative mx-auto mb-5">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-b from-red-100 to-red-50 dark:from-red-950/50 dark:to-red-900/20 mx-auto overflow-hidden p-1 border-2 border-red-200/60 dark:border-red-800/40 flex items-center justify-center relative">
                    <img
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top rounded-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Specialty Icon Floating Badge */}
                  <div className="absolute bottom-0 right-3 w-8 h-8 rounded-full bg-red-600 text-white shadow-md flex items-center justify-center border-2 border-background">
                    <BadgeIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-red-600 transition-colors">
                    {doctor.name}
                  </h3>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {doctor.specialty}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {doctor.rating}
                    </span>
                    <span>•</span>
                    <span>{doctor.experience}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Button
                    onClick={() => navigate(`/book?doctor=${encodeURIComponent(doctor.name)}&specialty=${encodeURIComponent(doctor.specialty)}`)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/book?doctor=${encodeURIComponent(doctor.name)}`)}
                    className="w-full text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
