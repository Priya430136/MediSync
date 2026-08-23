import { Users, Stethoscope, Clock, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export const Stats = () => {
  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Happy Patients",
    },
    {
      icon: Stethoscope,
      value: "200+",
      label: "Expert Doctors",
    },
    {
      icon: Clock,
      value: "24/7",
      label: "Emergency Support",
    },
    {
      icon: Building2,
      value: "30+",
      label: "Medical Departments",
    },
  ];

  return (
    <section className="py-8 relative z-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-card shadow-xl border border-border/70 rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center space-y-3 flex flex-col items-center"
                >
                  {/* Red Circular Icon Badge */}
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20 mb-1">
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  {/* Value */}
                  <div className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

