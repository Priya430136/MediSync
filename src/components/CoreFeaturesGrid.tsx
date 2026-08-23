import { Stethoscope, Cpu, Ambulance, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface FeatureCard {
  number: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
  badgeIcon: typeof Stethoscope;
  imageUrl: string;
}

const careFeatures: FeatureCard[] = [
  {
    number: "01",
    title: "Expert Doctors",
    description:
      "Experienced specialists providing personalized diagnosis and treatment with advanced medical expertise.",
    linkText: "Learn More",
    linkUrl: "/book",
    badgeIcon: Stethoscope,
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80",
  },
  {
    number: "02",
    title: "Advanced Technology",
    description:
      "Modern healthcare technology delivering accurate diagnosis, AI symptom triage, and innovative treatment solutions.",
    linkText: "Learn More",
    linkUrl: "/book",
    badgeIcon: Cpu,
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=500&q=80",
  },
  {
    number: "03",
    title: "Emergency Care",
    description:
      "24/7 emergency services designed to provide fast and reliable medical support and real-time ambulance dispatch.",
    linkText: "Learn More",
    linkUrl: "/sos",
    badgeIcon: Ambulance,
    imageUrl: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=500&q=80",
  },
  {
    number: "04",
    title: "Patient Wellness",
    description:
      "Complete healthcare programs focused on prevention, recovery, daily medication adherence, and long-term wellness.",
    linkText: "Learn More",
    linkUrl: "/patient-portal",
    badgeIcon: Heart,
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80",
  },
];

export const CoreFeaturesGrid = () => {
  return (
    <section id="features" className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold tracking-wide border border-red-200 dark:border-red-900/50">
            Our Care Approach
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            4 Powerful Ways <span className="text-red-600">We Care For You</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Delivering comprehensive medical excellence across clinical consultations, diagnostics, and recovery.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {careFeatures.map((item, idx) => {
            const BadgeIcon = item.badgeIcon;
            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Number Badge (01, 02, 03, 04) in Red Circle */}
                <div className="absolute top-5 left-5 z-10 w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {item.number}
                </div>

                <div className="space-y-4">
                  {/* Visual Image container with floating red specialty icon */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-muted/40 p-1 mb-2">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Floating Red Action Icon */}
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-red-600 text-white shadow-md flex items-center justify-center border-2 border-background">
                      <BadgeIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Learn More Link */}
                <div className="pt-4 mt-4 border-t border-border/50">
                  <Link
                    to={item.linkUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

