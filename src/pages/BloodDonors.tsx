import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, MapPin, Search, AlertCircle, Heart, BellRing, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Mock data for MVP demonstration
const MOCK_REQUESTS = [
  { id: 1, type: "O-", patient: "Rahul Sharma", hospital: "Apollo Hospital, Jubilee Hills", requiredBy: "Today, 6:00 PM", urgency: "Critical", distance: "2.4 km" },
  { id: 2, type: "A+", patient: "Neha Gupta", hospital: "KIMS Hospital, Secunderabad", requiredBy: "Tomorrow, 10:00 AM", urgency: "High", distance: "5.1 km" },
  { id: 3, type: "B+", patient: "Anonymous", hospital: "Care Hospitals, Banjara Hills", requiredBy: "Today, 8:00 PM", urgency: "Critical", distance: "3.8 km" },
];

const BloodDonors = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType) return;
    setIsRegistered(true);
    toast({
      title: "Hero Registered! 🦸‍♂️",
      description: `You are now registered as an ${bloodType} donor. We will ping you if someone nearby needs help!`,
    });
  };

  const handleBroadcast = () => {
    toast({
      title: "Emergency Broadcast Sent! 🚨",
      description: "Pinging 42 registered donors within a 5km radius.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-b from-red-500/10 to-transparent">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-red-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-left mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 font-bold border border-red-500/20 mb-2">
              <Droplet className="w-4 h-4 fill-red-600" /> RAPIDRESQ DONOR NETWORK
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
              Give Blood. <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Save Lives.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium">
              Join the fastest-growing local blood and plasma donor network. Register as a donor or instantly broadcast a life-saving request to people nearby.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Register & Broadcast */}
          <div className="lg:col-span-5 space-y-6">
            {/* Broadcast Request Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-red-500/20 shadow-xl shadow-red-500/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <BellRing className="w-6 h-6 text-red-500" /> Need Blood Urgently?
                  </CardTitle>
                  <CardDescription className="text-base">
                    Ping all active donors within a 5km radius instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Blood Type Needed</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Units Required</Label>
                      <Input type="number" min="1" placeholder="e.g. 2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hospital Location</Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Enter hospital name or address" />
                    </div>
                  </div>
                  <Button 
                    onClick={handleBroadcast}
                    className="w-full h-14 text-lg font-bold bg-destructive hover:bg-destructive/90 shadow-[0_0_30px_rgba(239,68,68,0.3)] gap-2 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 animate-pulse" /> Broadcast Emergency Request
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Donor Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border border-border/50 shadow-lg relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
                {!isRegistered ? (
                  <>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary" /> Register as a Hero
                      </CardTitle>
                      <CardDescription>
                        We will securely notify you if someone in your city needs your blood type.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Your Blood Type</Label>
                          <Select value={bloodType} onValueChange={setBloodType}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Select your blood group" /></SelectTrigger>
                            <SelectContent>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={!bloodType}>
                          Become a Donor
                        </Button>
                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1 mt-4">
                          <ShieldCheck className="w-3 h-3" /> Your identity remains fully anonymous
                        </p>
                      </form>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                      <Heart className="w-10 h-10 text-green-500 fill-green-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold">You are a Hero!</h3>
                    <p className="text-muted-foreground">
                      You are actively registered as an <strong className="text-foreground">{bloodType}</strong> donor. Keep an eye on your notifications.
                    </p>
                    <Button variant="outline" className="mt-4 rounded-full" onClick={() => setIsRegistered(false)}>
                      Update Status
                    </Button>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Active Live Feed */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between"
            >
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Live Local Requests
              </h2>
              <div className="relative w-48 hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input className="pl-9 h-10 rounded-full bg-muted/50 border-none" placeholder="Filter by type..." />
              </div>
            </motion.div>

            <div className="space-y-4">
              {MOCK_REQUESTS.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border border-border/50 group">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Blood Type Badge */}
                        <div className="p-6 sm:p-8 bg-red-500/5 sm:border-r border-b sm:border-b-0 border-red-500/10 flex flex-col items-center justify-center min-w-[120px]">
                          <Droplet className="w-8 h-8 text-red-500 fill-red-500/20 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-3xl font-black text-red-600">{req.type}</span>
                        </div>
                        
                        {/* Request Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-foreground">Requires {req.type} Blood</h3>
                              <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-1 text-sm">
                                <MapPin className="w-3.5 h-3.5" /> {req.hospital} <span className="text-sm border ml-2 px-1.5 rounded-md bg-muted/50">{req.distance}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 uppercase tracking-widest animate-pulse shadow-sm">
                              {req.urgency}
                            </span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 sm:mt-0 gap-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Needed by: </span>
                              <strong className="text-foreground">{req.requiredBy}</strong>
                            </div>
                            <Button className="rounded-full shadow-md font-bold px-6 bg-primary hover:bg-primary/90 hidden sm:flex">
                              <Phone className="w-4 h-4 mr-2" /> Connect
                            </Button>
                            {/* Mobile button */}
                            <Button className="w-full rounded-xl font-bold bg-primary sm:hidden">
                              <Phone className="w-4 h-4 mr-2" /> Connect with Family
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load More mock */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center pt-4"
            >
              <Button variant="ghost" className="text-muted-foreground rounded-full">
                Load more requests...
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodDonors;
