import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { CoreFeaturesGrid } from "@/components/CoreFeaturesGrid";
import { SpecialistDoctors } from "@/components/SpecialistDoctors";
import { HealthcareSuiteShowcase } from "@/components/HealthcareSuiteShowcase";
import { EmergencyServices } from "@/components/EmergencyServices";
import { ABHACard } from "@/components/ABHACard";
import { BottomBookingBanner } from "@/components/BottomBookingBanner";
import { AIAssistant } from "@/components/AIAssistant";
import { Chatbot } from "@/components/Chatbot";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Stats />
      <CoreFeaturesGrid />
      <SpecialistDoctors />
      <HealthcareSuiteShowcase />
      <EmergencyServices />
      <ABHACard />
      <BottomBookingBanner />
      <AIAssistant />
      <Chatbot />
      <Footer />
    </div>
  );
};

export default Index;

