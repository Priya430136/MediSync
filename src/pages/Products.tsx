import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Hospital, Ambulance, Users, Calendar, FileText, Heart, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Products = () => {
  const products = [
    {
      icon: Ambulance,
      title: "Emergency Services",
      description: "24/7 ambulance booking with live tracking and quick response",
      features: ["Real-time GPS tracking", "Sub-8 minute response", "Trained paramedics", "Advanced life support"]
    },
    {
      icon: Calendar,
      title: "Doctor Appointments",
      description: "Book consultations with specialists across all medical fields",
      features: ["Video consultations", "In-person visits", "Same-day appointments", "Prescription delivery"]
    },
    {
      icon: Hospital,
      title: "Hospital Network",
      description: "Access to 500+ partner hospitals nationwide",
      features: ["Cashless treatment", "Bed availability check", "OPD & IPD services", "Lab tests at home"]
    },
    {
      icon: FileText,
      title: "Health Records (ABHA)",
      description: "Digital health records integrated with ABDM",
      features: ["Unified health ID", "Secure cloud storage", "Easy sharing", "Complete history"]
    },
    {
      icon: Heart,
      title: "Health Monitoring",
      description: "Track vitals and manage chronic conditions",
      features: ["Daily vitals tracking", "Medication reminders", "Health reports", "AI insights"]
    },
    {
      icon: Shield,
      title: "Health Insurance",
      description: "Compare and purchase health insurance plans",
      features: ["Multiple providers", "Instant comparison", "Cashless claims", "Renewal reminders"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Our <span className="text-primary">Products</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete healthcare ecosystem designed to provide seamless medical services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {products.map((product, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <product.icon className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  <CardDescription className="text-base">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full">Learn More</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-12 text-center">
              <Smartphone className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                All Services in One App
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Download RapidResQ to access emergency services, book appointments, manage health records, and more.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="px-8">
                  Download for Android
                </Button>
                <Button size="lg" variant="outline" className="px-8">
                  Download for iOS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Products;
