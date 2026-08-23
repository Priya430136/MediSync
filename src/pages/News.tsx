import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Award, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const News = () => {
  const news = [
    {
      title: "RapidResQ Expands to 50 New Cities",
      date: "March 15, 2024",
      category: "Expansion",
      description: "Our emergency services now reach 150 cities across India, bringing life-saving care to millions more.",
      image: "📍"
    },
    {
      title: "Awarded Healthcare Innovation Award 2024",
      date: "March 10, 2024",
      category: "Award",
      description: "Recognized by the Ministry of Health for revolutionizing emergency healthcare delivery in India.",
      image: "🏆"
    },
    {
      title: "Partnership with 100 New Hospitals",
      date: "March 5, 2024",
      category: "Partnership",
      description: "Strengthening our hospital network to provide seamless emergency care across the country.",
      image: "🏥"
    },
    {
      title: "2 Million Users Milestone Achieved",
      date: "February 28, 2024",
      category: "Milestone",
      description: "Crossed 2 million registered users, making us India's largest emergency healthcare platform.",
      image: "🎉"
    },
    {
      title: "New AI-Powered Emergency Triage",
      date: "February 20, 2024",
      category: "Technology",
      description: "Launched AI assistant that helps assess emergency severity and recommends appropriate care.",
      image: "🤖"
    },
    {
      title: "Series B Funding of $50M Raised",
      date: "February 15, 2024",
      category: "Funding",
      description: "Secured Series B funding to accelerate expansion and technology development.",
      image: "💰"
    }
  ];

  const events = [
    {
      title: "Healthcare Summit 2024",
      date: "April 15-17, 2024",
      location: "Mumbai Convention Center",
      description: "Join us at India's largest healthcare technology summit"
    },
    {
      title: "Emergency Care Workshop",
      date: "April 25, 2024",
      location: "Online Webinar",
      description: "Free training session for healthcare professionals on emergency response"
    },
    {
      title: "Product Demo Day",
      date: "May 5, 2024",
      location: "Bangalore Tech Park",
      description: "Experience our latest features and meet the team"
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
              News & <span className="text-primary">Events</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest from RapidResQ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">150+</h3>
                <p className="text-muted-foreground">Cities Covered</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">2M+</h3>
                <p className="text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-primary/10 to-background">
              <CardContent className="pt-8 pb-8">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">15+</h3>
                <p className="text-muted-foreground">Awards Won</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8">Latest News</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {news.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{item.image}</span>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {item.date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Calendar className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription>
                      <p className="mb-1">{event.date}</p>
                      <p>{event.location}</p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{event.description}</p>
                    <button className="text-primary hover:underline font-semibold">
                      Learn More →
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-16 bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Want to Stay Updated?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Subscribe to our newsletter for the latest news and updates
              </p>
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
                />
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg font-semibold">
                  Subscribe
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default News;
