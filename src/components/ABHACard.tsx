import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Zap, Lock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Registration",
    description: "Create your ABHA using Aadhaar in under 60 seconds",
  },
  {
    icon: Shield,
    title: "Universal Access",
    description: "Access healthcare services across India with one ABHA ID",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your health data is encrypted and protected by ABDM standards",
  },
];

export const ABHACard = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-medical-blue-light to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            <Shield className="w-4 h-4" />
            ABHA Card (Health ID) Approved by NHA
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Create ABHA Health Card in less than 1 minute
            <span className="text-primary">⚡</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Get your unique Ayushman Bharat Health Account (ABHA) and join India's unified digital health ecosystem. 
            Your ABHA is your gateway to seamless healthcare across the country.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        <Card className="max-w-2xl mx-auto p-8 bg-card">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            Create ABHA Health Card in less than 1 minute ⚡
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Enter your Aadhaar Number
              </label>
              <Input 
                placeholder="XXXX XXXX XXXX" 
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Phone number for ABHA communications
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 bg-muted rounded-lg text-muted-foreground font-medium">
                  +91
                </div>
                <Input 
                  placeholder="Enter phone number" 
                  className="h-12 flex-1"
                />
              </div>
            </div>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg">
              Create ABHA
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
