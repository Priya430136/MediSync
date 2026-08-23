import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, TrendingUp, Users, Heart, Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Careers = () => {
  const openings = [
    {
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Bangalore",
      type: "Full-time",
      experience: "4-6 years"
    },
    {
      title: "Product Manager - Healthcare",
      department: "Product",
      location: "Mumbai",
      type: "Full-time",
      experience: "5-8 years"
    },
    {
      title: "Emergency Response Coordinator",
      department: "Operations",
      location: "Delhi NCR",
      type: "Full-time",
      experience: "2-4 years"
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      experience: "3-5 years"
    },
    {
      title: "Data Analyst",
      department: "Analytics",
      location: "Bangalore",
      type: "Full-time",
      experience: "2-4 years"
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Pune",
      type: "Full-time",
      experience: "3-5 years"
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
              Join Our <span className="text-primary">Mission</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Help us revolutionize emergency healthcare and save lives every day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <Card className="text-center">
              <CardContent className="pt-8">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Meaningful Work</h3>
                <p className="text-muted-foreground">
                  Your code and ideas save lives every day
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Fast Growth</h3>
                <p className="text-muted-foreground">
                  Rapid career advancement in a scaling startup
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Great Team</h3>
                <p className="text-muted-foreground">
                  Work with passionate, talented individuals
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">Why RapidResQ?</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Innovation at Core</h3>
                  <p className="text-muted-foreground">
                    Work with cutting-edge technology in healthcare, AI, and real-time systems
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Impact That Matters</h3>
                  <p className="text-muted-foreground">
                    See the direct impact of your work in saving lives across India
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Inclusive Culture</h3>
                  <p className="text-muted-foreground">
                    Diverse team, flat hierarchy, and open communication
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Learning & Growth</h3>
                  <p className="text-muted-foreground">
                    Conferences, courses, mentorship, and unlimited learning opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
            <div className="grid gap-6 max-w-4xl mx-auto">
              {openings.map((job, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.experience}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{job.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full sm:w-auto">Apply Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Don't See Your Role?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Button size="lg" variant="outline" className="px-12">
                Send Your Resume
              </Button>
            </CardContent>
          </Card>

          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12">Perks & Benefits</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="font-bold mb-2">🏥 Health Insurance</p>
                  <p className="text-sm text-muted-foreground">Comprehensive coverage for you and family</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="font-bold mb-2">🏠 Work from Home</p>
                  <p className="text-sm text-muted-foreground">Flexible hybrid work model</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="font-bold mb-2">📚 Learning Budget</p>
                  <p className="text-sm text-muted-foreground">Annual budget for courses and books</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="font-bold mb-2">🌴 Generous Leave</p>
                  <p className="text-sm text-muted-foreground">Flexible time off policy</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Careers;
