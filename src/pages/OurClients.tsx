import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Star, Quote, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const OurClients = () => {
  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      role: "Cardiologist, Apollo Hospital",
      content: "RapidResQ has revolutionized how we handle emergency cases. The response time is incredible.",
      rating: 5
    },
    {
      name: "Rajesh Mehta",
      role: "CEO, HealthCare Plus",
      content: "Partnering with RapidResQ was the best decision. Their technology and service quality are unmatched.",
      rating: 5
    },
    {
      name: "Anita Desai",
      role: "Patient",
      content: "They saved my father's life during a cardiac emergency. The ambulance arrived in 6 minutes!",
      rating: 5
    },
    {
      name: "Dr. Amit Patel",
      role: "Emergency Medicine, Fortis",
      content: "The live tracking feature gives us real-time patient information before arrival. Game changer.",
      rating: 5
    },
    {
      name: "Suresh Kumar",
      role: "Insurance Manager",
      content: "The integration with our insurance systems is seamless. Claims processing is much faster now.",
      rating: 5
    },
    {
      name: "Meera Singh",
      role: "Patient Family Member",
      content: "Being able to track the ambulance in real-time gave us peace of mind during a stressful time.",
      rating: 5
    }
  ];

  const partners = [
    "Apollo Hospitals", "Fortis Healthcare", "Max Healthcare", "Manipal Hospitals",
    "Narayana Health", "AIIMS", "Medanta", "Columbia Asia", "Care Hospitals",
    "Cloudnine", "Rainbow Children's Hospital", "Aster DM Healthcare"
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
              Our <span className="text-primary">Clients</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Trusted by leading healthcare institutions and millions of patients across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-4xl font-bold text-foreground mb-2">500+</h3>
                <p className="text-muted-foreground">Partner Hospitals</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-4xl font-bold text-foreground mb-2">2M+</h3>
                <p className="text-muted-foreground">Happy Patients</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <Quote className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-4xl font-bold text-foreground mb-2">4.8/5</h3>
                <p className="text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-primary/20 mb-4" />
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-bold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-center mb-12">Our Partner Network</h2>
            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {partners.map((partner, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-center p-4 bg-muted rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <p className="font-semibold text-center text-muted-foreground">
                        {partner}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-16 bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Become a Partner
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join India's leading emergency healthcare network and serve millions of patients
              </p>
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-3 rounded-full font-semibold text-lg transition-colors">
                Partner With Us
              </button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OurClients;
