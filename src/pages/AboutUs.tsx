import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Target, Heart, Shield, Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
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
              About <span className="text-primary">RapidResQ</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Revolutionizing emergency healthcare with technology-driven solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardContent className="p-8">
                <Target className="w-12 h-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To provide instant, reliable, and affordable emergency healthcare services to every Indian, 
                  ensuring that medical help is just a tap away when seconds count.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <Heart className="w-12 h-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To become India's most trusted healthcare companion, creating a future where quality 
                  emergency medical care is accessible to everyone, everywhere.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose RapidResQ?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Lightning Fast</h3>
                  <p className="text-muted-foreground">
                    Average ambulance arrival time under 8 minutes across major cities
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Fully Certified</h3>
                  <p className="text-muted-foreground">
                    ISO certified and ABDM compliant with highest safety standards
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Trusted by Millions</h3>
                  <p className="text-muted-foreground">
                    Over 2 million users trust us for their emergency healthcare needs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold text-primary mb-2">2M+</p>
                  <p className="text-muted-foreground">Active Users</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-2">500+</p>
                  <p className="text-muted-foreground">Partner Hospitals</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-2">50K+</p>
                  <p className="text-muted-foreground">Emergency Responses</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-2">100+</p>
                  <p className="text-muted-foreground">Cities Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-16 text-center">
            <Award className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Awards & Recognition</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card>
                <CardContent className="p-6">
                  <p className="font-bold text-lg mb-2">Healthcare Innovation Award 2024</p>
                  <p className="text-sm text-muted-foreground">Ministry of Health</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-bold text-lg mb-2">Best Emergency Services Platform</p>
                  <p className="text-sm text-muted-foreground">Healthcare Summit 2024</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-bold text-lg mb-2">Digital Health Leader</p>
                  <p className="text-sm text-muted-foreground">Tech Health Awards</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
