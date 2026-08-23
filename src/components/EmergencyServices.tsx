import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance, Phone, MapPin, Clock, AlertCircle, Siren, ArrowRight, PhoneCall, Heart, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const EmergencyServices = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCallEmergency = (number: string) => {
    window.open(`tel:${number}`);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-destructive/10 via-background to-destructive/5">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Siren className="w-10 h-10 text-destructive animate-pulse" aria-hidden="true" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">{t('emergency.title')}</h2>
            <Siren className="w-10 h-10 text-destructive animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('emergency.subtitle')}
          </p>
        </div>

        {/* Main SOS Banner */}
        <Card className="bg-destructive text-destructive-foreground border-none shadow-2xl mb-12 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive via-destructive to-red-700 opacity-90" />
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 flex items-center justify-center animate-pulse" aria-hidden="true">
                  <AlertCircle className="w-12 h-12 md:w-14 md:h-14" />
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold mb-2">Medical Emergency?</h3>
                  <p className="text-lg text-destructive-foreground/90 max-w-md">
                    Press SOS for immediate ambulance dispatch with real-time GPS tracking
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/sos">
                  <Button 
                    size="lg" 
                    className="bg-white text-destructive hover:bg-white/90 text-xl px-12 py-8 h-auto font-bold shadow-lg group"
                    aria-label="Press SOS for immediate emergency assistance"
                  >
                    🚨 PRESS SOS
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-destructive text-lg px-8 py-8 h-auto"
                  onClick={() => handleCallEmergency('108')}
                  aria-label="Call emergency hotline 108"
                >
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Call 108
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-destructive/20 hover:border-destructive hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate('/sos')}>
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3 group-hover:bg-destructive/20 transition-colors">
                <Ambulance className="w-7 h-7 text-destructive" />
              </div>
              <CardTitle className="text-foreground">{t('emergency.ambulance')}</CardTitle>
              <CardDescription>{t('emergency.ambulanceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors"
              >
                Book Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all group cursor-pointer bg-gradient-to-b from-red-500/5 to-transparent" onClick={() => navigate('/blood-donors')}>
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 group-hover:bg-red-500/20 transition-colors">
                <Heart className="w-7 h-7 text-red-500" />
              </div>
              <CardTitle className="text-foreground">Blood Donors</CardTitle>
              <CardDescription>Instantly ping registered blood donors within a 5km radius or register as a hero.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-red-500 text-red-600 hover:bg-red-500 hover:text-white group-hover:bg-red-500 group-hover:text-white transition-colors"
              >
                Find Donors
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group cursor-pointer bg-gradient-to-b from-primary/5 to-transparent" onClick={() => navigate('/triage')}>
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-foreground">AI Smart Triage</CardTitle>
              <CardDescription>Check your symptoms instantly with our AI Matrix to get an emergency severity score.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white transition-colors"
              >
                Scan Symptoms
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 hover:border-destructive hover:shadow-lg transition-all group cursor-pointer" onClick={() => handleCallEmergency('108')}>
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3 group-hover:bg-destructive/20 transition-colors">
                <Phone className="w-7 h-7 text-destructive" />
              </div>
              <CardTitle className="text-foreground">24/7 Hotline</CardTitle>
              <CardDescription>Emergency medical consultation available anytime, anywhere</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors"
              >
                Call Now
                <Phone className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Types */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-6">We Handle All Emergencies</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Cardiac Emergencies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Ambulance className="w-4 h-4 text-orange-500" />
              <span>Road Accidents</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Breathing Issues</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Medical Emergencies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>Pregnancy & Labor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
