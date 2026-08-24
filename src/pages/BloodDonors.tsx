import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Droplet, 
  MapPin, 
  Search, 
  AlertCircle, 
  Heart, 
  BellRing, 
  Phone, 
  ShieldCheck, 
  ArrowLeft,
  Building2,
  Users,
  CheckCircle2,
  Share2,
  Activity,
  Send,
  Lock,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HospitalBloodBank, BloodRequest, DonorRecord } from "@/components/HospitalBloodBank";

const BloodDonors = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [isHospitalRole, setIsHospitalRole] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<"hospital" | "citizen">("citizen");

  // Citizen registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorCity, setDonorCity] = useState("");

  // Broadcast Request state
  const [reqType, setReqType] = useState("O-");
  const [reqUnits, setReqUnits] = useState("2");
  const [reqHospital, setReqHospital] = useState("");
  const [reqPatient, setReqPatient] = useState("");
  const [reqPhone, setReqPhone] = useState("");

  // Filter state for live requests
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Local requests and donors
  const [liveRequests, setLiveRequests] = useState<BloodRequest[]>([]);

  // Load user profile & role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, phone, blood_group")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile) {
            setUserRole(profile.role || "user");
            if (profile.blood_group) {
              setBloodType(profile.blood_group);
            }
            if (profile.full_name) {
              setDonorName(profile.full_name);
            }
            if (profile.phone) {
              setDonorPhone(profile.phone);
            }

            const isHosp = profile.role === "hospital" || profile.role === "admin" || profile.role === "operator" || profile.role === "doctor";
            setIsHospitalRole(isHosp);
            if (isHosp) {
              setActiveMode("hospital");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user in BloodDonors:", err);
      }
    };

    fetchUser();
    loadLiveRequests();

    // Check if user is already registered in local storage
    const savedDonor = localStorage.getItem("citizen_donor_profile");
    if (savedDonor) {
      try {
        const parsed = JSON.parse(savedDonor);
        setIsRegistered(true);
        if (parsed.bloodType) setBloodType(parsed.bloodType);
        if (parsed.name) setDonorName(parsed.name);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const loadLiveRequests = () => {
    const saved = localStorage.getItem("hospital_blood_requests");
    if (saved) {
      try {
        setLiveRequests(JSON.parse(saved));
      } catch (e) {
        setLiveRequests([]);
      }
    } else {
      // Default fallback
      const initial: BloodRequest[] = [
        {
          id: "REQ-8921",
          patientName: "Rahul Sharma (Trauma ICU)",
          bloodType: "O-",
          units: 3,
          department: "Emergency & Trauma",
          urgency: "Immediate",
          hospitalName: "Apollo Emergency Hospital, Jubilee Hills",
          contactPhone: "+91 98450 12345",
          requiredBy: "Next 2 Hours",
          status: "Active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "REQ-8922",
          patientName: "Neha Gupta (OT #4)",
          bloodType: "A+",
          units: 2,
          department: "Cardiothoracic Surgery",
          urgency: "Critical",
          hospitalName: "KIMS Hospital, Secunderabad",
          contactPhone: "+91 98450 67890",
          requiredBy: "Today, 6:00 PM",
          status: "Active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "REQ-8923",
          patientName: "Care Hospital Emergency Case",
          bloodType: "B+",
          units: 2,
          department: "General Medicine",
          urgency: "Critical",
          hospitalName: "Care Hospitals, Banjara Hills",
          contactPhone: "+91 98450 99887",
          requiredBy: "Today, 8:00 PM",
          status: "Active",
          createdAt: new Date().toISOString(),
        }
      ];
      setLiveRequests(initial);
      localStorage.setItem("hospital_blood_requests", JSON.stringify(initial));
    }
  };

  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType) {
      toast.error("Please select your blood group");
      return;
    }

    const donorData = {
      name: donorName || "Anonymous Hero",
      bloodType,
      phone: donorPhone || "+91 98765 00000",
      city: donorCity || "City Center",
      registeredAt: new Date().toISOString(),
    };

    localStorage.setItem("citizen_donor_profile", JSON.stringify(donorData));

    // Also add to hospital donor database in localStorage
    const savedDonorsStr = localStorage.getItem("hospital_blood_donors");
    const currentDonors: DonorRecord[] = savedDonorsStr ? JSON.parse(savedDonorsStr) : [];
    const newRecord: DonorRecord = {
      id: `DON-${Math.floor(100 + Math.random() * 900)}`,
      name: donorData.name,
      bloodType: donorData.bloodType,
      phone: donorData.phone,
      city: donorData.city,
      distanceKm: Number((1.5 + Math.random() * 5).toFixed(1)),
      available: true,
      lastDonation: "Never / Eligible now",
    };

    localStorage.setItem("hospital_blood_donors", JSON.stringify([newRecord, ...currentDonors]));

    // Update Supabase profile if logged in
    if (currentUser) {
      try {
        await supabase
          .from("profiles")
          .update({
            blood_group: bloodType,
            phone: donorPhone || undefined,
            full_name: donorName || undefined,
          })
          .eq("user_id", currentUser.id);
      } catch (err) {
        console.warn("Could not sync blood group to profile:", err);
      }
    }

    setIsRegistered(true);
    toast.success(`Hero Registered! You are now an active ${bloodType} donor in the RapidResQ network.`);
  };

  const handleBroadcastCitizen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqHospital.trim() || !reqPatient.trim()) {
      toast.error("Please fill in hospital and patient information");
      return;
    }

    const newReq: BloodRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: reqPatient.trim(),
      bloodType: reqType,
      units: Number(reqUnits),
      department: "Emergency Requisition",
      urgency: "Immediate",
      hospitalName: reqHospital.trim(),
      contactPhone: reqPhone.trim() || "+91 98450 00000",
      requiredBy: "Immediate / Today",
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    const updated = [newReq, ...liveRequests];
    setLiveRequests(updated);
    localStorage.setItem("hospital_blood_requests", JSON.stringify(updated));

    setReqHospital("");
    setReqPatient("");
    setReqPhone("");

    toast.error(
      `🚨 Emergency Request Broadcasted! Pinging verified ${reqType} donors within a 5km radius of ${reqHospital}.`,
      { duration: 5000 }
    );
  };

  const handleIWillDonate = (req: BloodRequest) => {
    toast.success(`Thank you! Connecting you with ${req.hospitalName} for Case ${req.patientName}.`);
    window.open(`tel:${req.contactPhone}`);
  };

  // Filter requests
  const filteredRequests = liveRequests.filter((r) => {
    const matchesType = filterType === "all" || r.bloodType === filterType;
    const matchesSearch =
      r.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bloodType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getBackLink = () => {
    if (userRole === "doctor") return { to: "/doctor-portal", label: "Back to Doctor Workspace" };
    if (userRole === "hospital" || (isHospitalRole && userRole !== "user")) return { to: "/hospital", label: "Back to Hospital ER Dashboard" };
    return { to: "/", label: "Back to Home" };
  };
  const backNav = getBackLink();

  return (
    <main className="portal-content min-h-screen bg-background pb-20 w-full overflow-x-hidden">
      <Navbar />

      {/* Top Banner with Navigation & Mode Selector */}
      <div className="pt-20 sm:pt-24 pb-8 px-4 w-full bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent border-b border-red-500/10">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link 
                to={backNav.to} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors bg-muted/60 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backNav.label}</span>
              </Link>
              {isHospitalRole && (
                <Badge className="bg-red-600 text-white font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5 mr-1" /> {userRole === "doctor" ? "Doctor Access" : "Hospital Staff Access"}
                </Badge>
              )}
            </div>

            {/* Role / View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-2xl border border-border">
              <Button
                size="sm"
                variant={activeMode === "hospital" ? "default" : "ghost"}
                className={`text-xs font-bold rounded-xl h-8 gap-1.5 ${
                  activeMode === "hospital" ? "bg-red-600 hover:bg-red-700 text-white shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setActiveMode("hospital");
                  toast.info("Switched to Hospital Blood Bank Management Mode");
                }}
              >
                <Building2 className="w-3.5 h-3.5" /> Hospital Blood Bank
              </Button>
              <Button
                size="sm"
                variant={activeMode === "citizen" ? "default" : "ghost"}
                className={`text-xs font-bold rounded-xl h-8 gap-1.5 ${
                  activeMode === "citizen" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setActiveMode("citizen");
                  toast.info("Switched to Citizen & Donor Portal View");
                }}
              >
                <Heart className="w-3.5 h-3.5" /> Citizen & Donor View
              </Button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 text-red-600 font-bold border border-red-500/20 text-xs">
              <Droplet className="w-3.5 h-3.5 fill-red-600" /> MEDISYNC REGIONAL BLOOD & PLASMA NETWORK
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              {activeMode === "hospital" ? (
                <>Hospital Blood Bank & <span className="text-red-600">Donor Ops</span></>
              ) : (
                <>Give Blood. <span className="text-red-600">Save Lives.</span></>
              )}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
              {activeMode === "hospital" 
                ? "Real-time storage inventory control, instant emergency blood requisitions, and direct verified donor dispatch."
                : "Join the local life-saving network. Register as a donor or instantly broadcast emergency requests to nearby hospitals and verified heroes."}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl mt-8">
        {/* VIEW MODE 1: HOSPITAL ROLE MANAGEMENT */}
        {activeMode === "hospital" ? (
          <div className="animate-in fade-in duration-300">
            <HospitalBloodBank isEmbedded={false} />
          </div>
        ) : (
          /* VIEW MODE 2: CITIZEN / DONOR HERO VIEW */
          <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* Left Column: Register & Emergency Broadcast */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Broadcast Card */}
              <Card className="border-2 border-red-500/20 shadow-lg shadow-red-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-red-500 animate-pulse" /> Need Blood Urgently?
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Broadcast a life-saving request to verified donors and nearby blood banks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBroadcastCitizen} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-patient" className="text-xs">Patient Name / Case ID</Label>
                      <Input
                        id="c-patient"
                        placeholder="e.g. S. Venkat (ICU Ward #3)"
                        value={reqPatient}
                        onChange={(e) => setReqPatient(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Blood Group Needed</Label>
                        <Select value={reqType} onValueChange={setReqType}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-units" className="text-xs">Units Required</Label>
                        <Input 
                          id="c-units" 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={reqUnits} 
                          onChange={(e) => setReqUnits(e.target.value)} 
                          className="h-9 text-xs" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="c-hosp" className="text-xs">Hospital Name & Address</Label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          id="c-hosp" 
                          className="pl-8 h-9 text-xs" 
                          placeholder="e.g. Apollo Hospital, Jubilee Hills" 
                          value={reqHospital} 
                          onChange={(e) => setReqHospital(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="c-phone" className="text-xs">Contact Phone for Donors</Label>
                      <Input 
                        id="c-phone" 
                        placeholder="+91 98450 00000" 
                        value={reqPhone} 
                        onChange={(e) => setReqPhone(e.target.value)} 
                        className="h-9 text-xs" 
                        required 
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-11 text-sm font-bold bg-destructive hover:bg-destructive/90 shadow-md shadow-destructive/20 gap-2 rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4" /> Broadcast Emergency Request
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Donor Registration Card */}
              <Card className="border border-border/70 shadow-sm relative overflow-hidden bg-card">
                {!isRegistered ? (
                  <>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" /> Register as a Life-Saver Hero
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Receive instant verified alerts when someone in your city urgently needs your blood group.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCitizenRegister} className="space-y-3.5">
                        <div className="space-y-1.5">
                          <Label htmlFor="d-name" className="text-xs">Your Full Name</Label>
                          <Input
                            id="d-name"
                            placeholder="e.g. Anand Verma"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Your Blood Group</Label>
                            <Select value={bloodType} onValueChange={setBloodType}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="d-city" className="text-xs">City / Area</Label>
                            <Input
                              id="d-city"
                              placeholder="e.g. Jubilee Hills"
                              value={donorCity}
                              onChange={(e) => setDonorCity(e.target.value)}
                              className="h-9 text-xs"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="d-phone" className="text-xs">Mobile Number</Label>
                          <Input
                            id="d-phone"
                            placeholder="+91 98765 43210"
                            value={donorPhone}
                            onChange={(e) => setDonorPhone(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full h-10 rounded-xl font-bold bg-primary text-xs" disabled={!bloodType}>
                          Join RapidResQ Donor Network
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Data secured & encrypted for medical emergency use only
                        </p>
                      </form>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                      <Heart className="w-7 h-7 text-red-600 fill-red-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">You are a Registered Hero!</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active donor: <strong className="text-foreground">{donorName}</strong> (<strong className="text-red-600 font-black">{bloodType}</strong>)
                      </p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl text-xs text-left w-full space-y-1">
                      <p className="flex items-center justify-between text-muted-foreground">
                        <span>Network Status:</span>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px] font-bold">
                          Active & Ready
                        </Badge>
                      </p>
                      <p className="flex items-center justify-between text-muted-foreground">
                        <span>Emergency Alerts:</span>
                        <span className="font-semibold text-foreground">SMS & Push Enabled</span>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold" onClick={() => setIsRegistered(false)}>
                      Update Donor Details
                    </Button>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Column: Live Regional Requisitions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Live Regional Hospital Requisitions
                </h2>
                <div className="flex items-center gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-28 h-9 text-xs rounded-xl">
                      <SelectValue placeholder="All Blood Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative w-36 sm:w-44">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                    <Input 
                      className="pl-8 h-9 text-xs rounded-xl" 
                      placeholder="Search hospital..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <Card className="p-8 text-center bg-muted/20 border-dashed">
                    <Droplet className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-semibold text-foreground">No active requisitions matching filter</p>
                    <p className="text-xs text-muted-foreground mt-0.5">All emergency blood requirements in this category are currently met.</p>
                  </Card>
                ) : (
                  filteredRequests.map((req) => (
                    <Card key={req.id} className="border border-border/70 hover:border-red-500/40 transition-colors shadow-sm overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Blood Group Header */}
                          <div className="p-4 sm:p-5 bg-red-500/5 sm:border-r border-b sm:border-b-0 border-red-500/10 flex flex-row sm:flex-col items-center justify-between sm:justify-center min-w-[110px]">
                            <div className="flex items-center sm:flex-col gap-2">
                              <Droplet className="w-6 h-6 text-red-600 fill-red-600/20 group-hover:scale-110 transition-transform" />
                              <span className="text-2xl font-black text-red-600">{req.bloodType}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground sm:mt-1">{req.units} Units</span>
                          </div>

                          {/* Details */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-foreground">{req.patientName}</h3>
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <span className="line-clamp-1">{req.hospitalName}</span>
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] font-bold shrink-0 ${
                                  req.urgency === 'Immediate' 
                                    ? 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse' 
                                    : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                }`}
                              >
                                {req.urgency}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
                              <span className="text-muted-foreground">
                                Required By: <strong className="text-foreground font-semibold">{req.requiredBy}</strong>
                              </span>

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs font-bold rounded-xl h-8 flex-1 sm:flex-initial"
                                  onClick={() => window.open(`tel:${req.contactPhone}`)}
                                >
                                  <Phone className="w-3.5 h-3.5 mr-1" /> Call Hospital
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="text-xs font-bold rounded-xl h-8 bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-initial"
                                  onClick={() => handleIWillDonate(req)}
                                >
                                  <Heart className="w-3.5 h-3.5 mr-1" /> I Can Donate
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default BloodDonors;
