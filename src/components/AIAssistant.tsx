import { Card } from "@/components/ui/card";
import { Brain, MessageSquare, Calendar, Languages } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Intelligent Symptom Analysis",
    description: "Describe your symptoms and get instant AI-powered analysis with personalized recommendations",
  },
  {
    icon: Calendar,
    title: "Doctor Matching & Booking",
    description: "Get matched with top-rated doctors and book appointments directly from the AI chat",
  },
  {
    icon: MessageSquare,
    title: "24/7 Health Guidance",
    description: "Your personal health companion available anytime to answer questions and provide support",
  },
  {
    icon: Languages,
    title: "Multi-language Support",
    description: "Available in English, Hindi, and voice support for seamless communication",
  },
];

export const AIAssistant = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
            <Brain className="w-4 h-4" />
            RapidResQ AI Assist - Your Health Companion
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Ask Any Health Question, Get Instant{" "}
            <span className="text-primary">AI-Powered Answers</span>
            <span className="text-primary">⚡</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your personal health assistant that understands your symptoms, provides personalized guidance, 
            and connects you with the right doctors. Available in English, Hindi, and voice support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 bg-card hover:shadow-lg transition-all hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
