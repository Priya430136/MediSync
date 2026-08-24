import React, { useState, useEffect } from "react";
import { 
  Droplet, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Send, 
  BellRing, 
  Search, 
  Filter, 
  Users, 
  Building2, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Activity,
  Heart,
  Calendar,
  Share2,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface BloodStockItem {
  type: string;
  units: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodType: string;
  units: number;
  department: string;
  urgency: "Immediate" | "Critical" | "High" | "Standard";
  hospitalName: string;
  contactPhone: string;
  requiredBy: string;
  status: "Active" | "Fulfilled" | "Cancelled";
  createdAt: string;
}

export interface DonorRecord {
  id: string;
  name: string;
  bloodType: string;
  phone: string;
  city: string;
  distanceKm: number;
  available: boolean;
  lastDonation: string;
}

const DEFAULT_INVENTORY: BloodStockItem[] = [
  { type: "O+", units: 14, minThreshold: 8, lastUpdated: "Just now" },
  { type: "O-", units: 2, minThreshold: 5, lastUpdated: "10 mins ago" },
  { type: "A+", units: 11, minThreshold: 6, lastUpdated: "1 hour ago" },
  { type: "A-", units: 3, minThreshold: 4, lastUpdated: "2 hours ago" },
  { type: "B+", units: 18, minThreshold: 6, lastUpdated: "30 mins ago" },
  { type: "B-", units: 1, minThreshold: 4, lastUpdated: "Today, 8:00 AM" },
  { type: "AB+", units: 8, minThreshold: 4, lastUpdated: "3 hours ago" },
  { type: "AB-", units: 2, minThreshold: 3, lastUpdated: "Yesterday" },
];

const DEFAULT_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-8921",
    patientName: "Rahul Sharma (Trauma ICU)",
    bloodType: "O-",
    units: 3,
    department: "Emergency & Trauma",
    urgency: "Immediate",
    hospitalName: "Apollo Emergency Hospital",
    contactPhone: "+91 98450 12345",
    requiredBy: "Next 2 Hours",
    status: "Active",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "REQ-8922",
    patientName: "Neha Gupta (OT #4)",
    bloodType: "A-",
    units: 2,
    department: "Cardiothoracic Surgery",
    urgency: "Critical",
    hospitalName: "Apollo Emergency Hospital",
    contactPhone: "+91 98450 12345",
    requiredBy: "Today, 6:00 PM",
    status: "Active",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "REQ-8919",
    patientName: "Devi Prasad",
    bloodType: "B+",
    units: 2,
    department: "Oncology Daycare",
    urgency: "Standard",
    hospitalName: "Apollo Emergency Hospital",
    contactPhone: "+91 98450 12345",
    requiredBy: "Tomorrow Morning",
    status: "Fulfilled",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

const DEFAULT_DONORS: DonorRecord[] = [
  { id: "DON-01", name: "Anand Verma", bloodType: "O-", phone: "+91 98765 43210", city: "Jubilee Hills", distanceKm: 2.1, available: true, lastDonation: "4 months ago" },
  { id: "DON-02", name: "Kavita Reddy", bloodType: "O-", phone: "+91 98765 43211", city: "Banjara Hills", distanceKm: 3.4, available: true, lastDonation: "6 months ago" },
  { id: "DON-03", name: "Suresh Iyer", bloodType: "A-", phone: "+91 98765 43212", city: "Madhapur", distanceKm: 4.8, available: true, lastDonation: "3 months ago" },
  { id: "DON-04", name: "Vikram Malhotra", bloodType: "B-", phone: "+91 98765 43213", city: "Gachibowli", distanceKm: 5.2, available: false, lastDonation: "1 month ago" },
  { id: "DON-05", name: "Priya Nair", bloodType: "AB-", phone: "+91 98765 43214", city: "Begumpet", distanceKm: 6.0, available: true, lastDonation: "5 months ago" },
  { id: "DON-06", name: "Rohan Das", bloodType: "O+", phone: "+91 98765 43215", city: "Secunderabad", distanceKm: 7.5, available: true, lastDonation: "2 months ago" },
  { id: "DON-07", name: "Sunita Patel", bloodType: "A+", phone: "+91 98765 43216", city: "Hitec City", distanceKm: 3.9, available: true, lastDonation: "4 months ago" },
  { id: "DON-08", name: "Mohammed Tariq", bloodType: "B+", phone: "+91 98765 43217", city: "Ameerpet", distanceKm: 4.1, available: true, lastDonation: "7 months ago" },
];

export const HospitalBloodBank: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  // Inventory state
  const [inventory, setInventory] = useState<BloodStockItem[]>(() => {
    const saved = localStorage.getItem("hospital_blood_inventory");
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  });

  // Requests state
  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem("hospital_blood_requests");
    return saved ? JSON.parse(saved) : DEFAULT_REQUESTS;
  });

  // Donors state
  const [donors, setDonors] = useState<DonorRecord[]>(() => {
    const saved = localStorage.getItem("hospital_blood_donors");
    return saved ? JSON.parse(saved) : DEFAULT_DONORS;
  });

  const [donorFilterType, setDonorFilterType] = useState<string>("all");
  const [donorSearch, setDonorSearch] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // New Request Form state
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [reqPatient, setReqPatient] = useState("");
  const [reqBloodType, setReqBloodType] = useState("O-");
  const [reqUnits, setReqUnits] = useState(2);
  const [reqDept, setReqDept] = useState("Emergency & Trauma");
  const [reqUrgency, setReqUrgency] = useState<"Immediate" | "Critical" | "High" | "Standard">("Immediate");
  const [reqRequiredBy, setReqRequiredBy] = useState("Within 2 Hours");
  const [reqPhone, setReqPhone] = useState("+91 98450 12345");

  // New Donation Intake Form state
  const [isIntakeDialogOpen, setIsIntakeDialogOpen] = useState(false);
  const [intakeDonorName, setIntakeDonorName] = useState("");
  const [intakeBloodType, setIntakeBloodType] = useState("O+");
  const [intakeUnits, setIntakeUnits] = useState(1);
  const [intakePhone, setIntakePhone] = useState("");

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("hospital_blood_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("hospital_blood_requests", JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem("hospital_blood_donors", JSON.stringify(donors));
  }, [donors]);

  // Inventory Adjustments
  const adjustUnits = (type: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.type === type) {
          const newUnits = Math.max(0, item.units + delta);
          toast.success(
            delta > 0
              ? `Added 1 unit to ${type} (Now ${newUnits} units)`
              : `Deducted 1 unit from ${type} (Now ${newUnits} units)`
          );
          return {
            ...item,
            units: newUnits,
            lastUpdated: "Just now",
          };
        }
        return item;
      })
    );
  };

  // Broadcast Emergency Requisition
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqPatient.trim()) {
      toast.error("Please enter the patient or case reference");
      return;
    }

    const newReq: BloodRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: reqPatient.trim(),
      bloodType: reqBloodType,
      units: Number(reqUnits),
      department: reqDept,
      urgency: reqUrgency,
      hospitalName: "Apollo Emergency Hospital",
      contactPhone: reqPhone,
      requiredBy: reqRequiredBy,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    const matchingDonors = donors.filter(
      (d) => d.bloodType === reqBloodType && d.available
    );

    setRequests([newReq, ...requests]);
    setIsBroadcastDialogOpen(false);
    setReqPatient("");

    toast.success(
      `🚨 Emergency Request ${newReq.id} Broadcasted! Notified ${matchingDonors.length} matching nearby ${reqBloodType} donors via SMS and Network Push.`,
      { duration: 5000 }
    );
  };

  // Toggle Request Status
  const toggleRequestStatus = (id: string, newStatus: "Fulfilled" | "Cancelled" | "Active") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast.info(`Request ${id} marked as ${newStatus}`);
  };

  // Handle Intake
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeDonorName.trim()) {
      toast.error("Please enter donor name");
      return;
    }

    // Add units to inventory
    setInventory((prev) =>
      prev.map((item) =>
        item.type === intakeBloodType
          ? { ...item, units: item.units + Number(intakeUnits), lastUpdated: "Just now" }
          : item
      )
    );

    // Register / update donor record
    const newDonor: DonorRecord = {
      id: `DON-${Math.floor(10 + Math.random() * 90)}`,
      name: intakeDonorName.trim(),
      bloodType: intakeBloodType,
      phone: intakePhone.trim() || "+91 98000 00000",
      city: "Hospital Walk-in",
      distanceKm: 0.1,
      available: false, // Just donated
      lastDonation: "Today",
    };

    setDonors([newDonor, ...donors]);
    setIsIntakeDialogOpen(false);
    setIntakeDonorName("");
    setIntakePhone("");

    toast.success(`Successfully logged donation! Added ${intakeUnits} unit(s) of ${intakeBloodType} to blood bank inventory.`);
  };

  // Ping Donor via WhatsApp or Call
  const handlePingDonor = (donor: DonorRecord, request?: BloodRequest) => {
    const bloodNeeded = request ? request.bloodType : donor.bloodType;
    const msg = encodeURIComponent(
      `🚨 URGENT MEDICAL BROADCAST - Apollo Emergency Hospital: We urgently require ${bloodNeeded} blood for a critical patient. Are you available to donate today? Please call back at ${request?.contactPhone || "+91 98450 12345"}.`
    );
    window.open(`https://wa.me/${donor.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
    toast.success(`Dispatched direct emergency alert to ${donor.name} (${donor.phone})`);
  };

  // Calculated totals
  const totalUnits = inventory.reduce((acc, curr) => acc + curr.units, 0);
  const criticalItems = inventory.filter((item) => item.units < item.minThreshold);
  const activeRequests = requests.filter((r) => r.status === "Active");

  // Filtered donors
  const filteredDonors = donors.filter((d) => {
    const matchesType = donorFilterType === "all" || d.bloodType === donorFilterType;
    const matchesSearch =
      d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.city.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.bloodType.toLowerCase().includes(donorSearch.toLowerCase());
    const matchesAvail = onlyAvailable ? d.available : true;
    return matchesType && matchesSearch && matchesAvail;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-600 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Blood Units</p>
              <p className="text-3xl font-black text-foreground mt-0.5">{totalUnits} <span className="text-sm font-medium text-muted-foreground">units</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">Across 8 blood groups</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Droplet className="w-6 h-6 text-red-600 fill-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${criticalItems.length > 0 ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-emerald-500'} shadow-sm`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Critical Shortages</p>
              <p className={`text-3xl font-black mt-0.5 ${criticalItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {criticalItems.length} <span className="text-sm font-medium">types</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {criticalItems.length > 0 ? `Needs: ${criticalItems.map((i) => i.type).join(", ")}` : "All groups above safe threshold"}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${criticalItems.length > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Requisitions</p>
              <p className="text-3xl font-black text-purple-600 mt-0.5">{activeRequests.length} <span className="text-sm font-medium text-muted-foreground">broadcasts</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">Emergency OT & ICU requisitions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <BellRing className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Donors</p>
              <p className="text-3xl font-black text-blue-600 mt-0.5">{donors.length} <span className="text-sm font-medium text-muted-foreground">heroes</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">{donors.filter(d => d.available).length} immediately available</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-red-600" />
          <span className="font-bold text-base text-foreground">Apollo Hospital Central Blood Bank & Donor Operations</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Intake walk-in donor Dialog */}
          <Dialog open={isIntakeDialogOpen} onOpenChange={setIsIntakeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-bold text-xs gap-1.5 h-9 rounded-xl border-emerald-500/30 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10">
                <Plus className="w-3.5 h-3.5" /> Log Walk-in Donation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" /> Record Donor Blood Collection
                </DialogTitle>
                <DialogDescription>
                  Enter donor details and add units directly to the hospital blood storage inventory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleIntakeSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="donor-name">Donor Full Name</Label>
                  <Input 
                    id="donor-name" 
                    placeholder="e.g. Ramesh Chandra" 
                    value={intakeDonorName} 
                    onChange={(e) => setIntakeDonorName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-blood-type">Blood Group</Label>
                    <Select value={intakeBloodType} onValueChange={setIntakeBloodType}>
                      <SelectTrigger id="donor-blood-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-units">Units Collected</Label>
                    <Input 
                      id="donor-units" 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={intakeUnits} 
                      onChange={(e) => setIntakeUnits(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="donor-phone">Contact Phone</Label>
                  <Input 
                    id="donor-phone" 
                    placeholder="+91 98765 00000" 
                    value={intakePhone} 
                    onChange={(e) => setIntakePhone(e.target.value)} 
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsIntakeDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="font-bold bg-emerald-600 hover:bg-emerald-700">Add to Stock</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Emergency Broadcast Dialog */}
          <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold text-xs gap-1.5 h-9 rounded-xl bg-destructive hover:bg-destructive/90 shadow-md shadow-destructive/20">
                <BellRing className="w-3.5 h-3.5 animate-pulse" /> Broadcast Blood Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-5 h-5" /> Issue Emergency Blood Requisition
                </DialogTitle>
                <DialogDescription>
                  Broadcasts an instant SOS requisition to all verified local donors in the network and public live feed.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="req-patient">Patient / Case Reference</Label>
                  <Input 
                    id="req-patient" 
                    placeholder="e.g. Suresh Rao (Trauma Case #102)" 
                    value={reqPatient} 
                    onChange={(e) => setReqPatient(e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="req-blood-type">Blood Group Needed</Label>
                    <Select value={reqBloodType} onValueChange={setReqBloodType}>
                      <SelectTrigger id="req-blood-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-units">Units Required</Label>
                    <Input 
                      id="req-units" 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={reqUnits} 
                      onChange={(e) => setReqUnits(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="req-urgency">Urgency Level</Label>
                    <Select value={reqUrgency} onValueChange={(v: any) => setReqUrgency(v)}>
                      <SelectTrigger id="req-urgency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">🚨 Immediate (OT / Trauma)</SelectItem>
                        <SelectItem value="Critical">⚠️ Critical (&lt; 2 Hours)</SelectItem>
                        <SelectItem value="High">⏳ High (&lt; 6 Hours)</SelectItem>
                        <SelectItem value="Standard">📋 Standard (Planned)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-dept">Department</Label>
                    <Select value={reqDept} onValueChange={setReqDept}>
                      <SelectTrigger id="req-dept">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emergency & Trauma">Emergency & Trauma</SelectItem>
                        <SelectItem value="Cardiothoracic Surgery">Cardiothoracic Surgery</SelectItem>
                        <SelectItem value="ICU / CCU">ICU / CCU</SelectItem>
                        <SelectItem value="Obstetrics & Gynecology">Obstetrics & Gynecology</SelectItem>
                        <SelectItem value="Oncology / Hematology">Oncology / Hematology</SelectItem>
                        <SelectItem value="General Surgery">General Surgery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="req-reqby">Needed By</Label>
                    <Input 
                      id="req-reqby" 
                      placeholder="e.g. Next 1 hour" 
                      value={reqRequiredBy} 
                      onChange={(e) => setReqRequiredBy(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-phone">Hospital Duty Desk Phone</Label>
                    <Input 
                      id="req-phone" 
                      placeholder="+91 98450 12345" 
                      value={reqPhone} 
                      onChange={(e) => setReqPhone(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsBroadcastDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="font-bold bg-destructive hover:bg-destructive/90">
                    <Send className="w-4 h-4 mr-1.5" /> Broadcast to All Donors
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Section 1: Real-time Blood Stock Inventory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-600" /> Live Blood Bank Stock & Thresholds
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitor, reserve, and increment/decrement units directly. Color codes indicate critical shortage warnings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {inventory.map((item) => {
            const isCritical = item.units < item.minThreshold;
            const isLow = item.units >= item.minThreshold && item.units < item.minThreshold + 3;
            
            return (
              <Card 
                key={item.type} 
                className={`overflow-hidden transition-all border ${
                  isCritical 
                    ? "border-destructive/60 bg-destructive/5 shadow-md shadow-destructive/10" 
                    : isLow 
                    ? "border-amber-500/40 bg-amber-500/5" 
                    : "border-border/60 bg-card hover:border-primary/40"
                }`}
              >
                <div className={`h-1.5 w-full ${isCritical ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-emerald-500"}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <span className="text-base font-black text-red-600">{item.type}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">Type {item.type}</span>
                        <p className="text-[10px] text-muted-foreground">Min safe: {item.minThreshold} units</p>
                      </div>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCritical 
                          ? "bg-destructive/15 text-destructive border-destructive/30 animate-pulse" 
                          : isLow 
                          ? "bg-amber-500/15 text-amber-700 border-amber-500/30" 
                          : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                      }`}
                    >
                      {isCritical ? "CRITICAL" : isLow ? "LOW" : "ADEQUATE"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-2xl font-black text-foreground">{item.units}</span>
                      <span className="text-xs font-semibold text-muted-foreground ml-1">Units</span>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-foreground hover:bg-background"
                        onClick={() => adjustUnits(item.type, -1)}
                        disabled={item.units === 0}
                        title="Deduct 1 unit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-foreground hover:bg-background"
                        onClick={() => adjustUnits(item.type, 1)}
                        title="Add 1 unit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Stock level</span>
                      <span>{Math.min(100, Math.round((item.units / (item.minThreshold * 2)) * 100))}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (item.units / (item.minThreshold * 2)) * 100)} 
                      className="h-1.5" 
                    />
                  </div>

                  {isCritical && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="w-full h-7 text-[10px] font-bold rounded-lg mt-1 gap-1"
                      onClick={() => {
                        setReqBloodType(item.type);
                        setReqUnits(Math.max(2, item.minThreshold - item.units));
                        setIsBroadcastDialogOpen(true);
                      }}
                    >
                      <BellRing className="w-3 h-3" /> Broadcast SOS for {item.type}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Hospital Emergency Blood Requisitions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" /> Active Emergency Requisitions
            </h3>
            <p className="text-xs text-muted-foreground">
              Live patient requests broadcasted to the regional donor network and emergency fleet.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {requests.map((req) => (
            <Card key={req.id} className={`border ${req.status === 'Active' ? 'border-purple-500/30 bg-purple-500/5' : 'border-border/60 bg-card/60 opacity-80'}`}>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg font-black text-red-600 leading-none">{req.bloodType}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">{req.units} Units</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{req.patientName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{req.id}</Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-bold ${
                          req.urgency === 'Immediate' 
                            ? 'bg-destructive/15 text-destructive border-destructive/30' 
                            : req.urgency === 'Critical'
                            ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                        }`}
                      >
                        {req.urgency}
                      </Badge>
                      {req.status === 'Fulfilled' && (
                        <Badge className="bg-emerald-600 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Fulfilled
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                      <span><strong>Dept:</strong> {req.department}</span>
                      <span>•</span>
                      <span><strong>Required By:</strong> {req.requiredBy}</span>
                      <span>•</span>
                      <span><strong>Duty Desk:</strong> {req.contactPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {req.status === 'Active' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold h-8 rounded-xl border-purple-500/30 text-purple-700 hover:bg-purple-500/10"
                        onClick={() => {
                          setDonorFilterType(req.bloodType);
                          toast.info(`Filtering verified ${req.bloodType} donors below.`);
                        }}
                      >
                        <Search className="w-3.5 h-3.5 mr-1" /> Find Donors
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs font-bold h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => toggleRequestStatus(req.id, "Fulfilled")}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Mark Fulfilled
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold h-8 rounded-xl"
                      onClick={() => toggleRequestStatus(req.id, "Active")}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-open Requisition
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 3: Verified Donor Registry & Direct Emergency Dispatch */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Regional Verified Blood Donors Directory
            </h3>
            <p className="text-xs text-muted-foreground">
              Filter by blood group and proximity. Dispatch WhatsApp emergency alerts or call directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-40 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search name/city..."
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <Select value={donorFilterType} onValueChange={setDonorFilterType}>
              <SelectTrigger className="w-28 h-9 text-xs rounded-xl">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant={onlyAvailable ? "default" : "outline"}
              className="text-xs font-semibold h-9 rounded-xl gap-1"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
            >
              <Activity className="w-3.5 h-3.5" /> Available Only
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-muted/20 border border-dashed rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">No donors matching current criteria</p>
              <p className="text-xs text-muted-foreground mt-0.5">Try changing blood group filter or search term.</p>
            </div>
          ) : (
            filteredDonors.map((donor) => (
              <Card key={donor.id} className="border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <span className="text-base font-black text-red-600">{donor.bloodType}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{donor.name}</h4>
                        <p className="text-xs text-muted-foreground">{donor.city} • <span className="font-medium text-foreground">{donor.distanceKm} km</span> away</p>
                      </div>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-bold ${
                        donor.available 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {donor.available ? "Available" : "Donated recently"}
                    </Badge>
                  </div>

                  <div className="bg-muted/40 p-2 rounded-xl text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Last Donated: <strong className="text-foreground">{donor.lastDonation}</strong></span>
                    <span>ID: {donor.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold rounded-xl h-8 gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                      onClick={() => handlePingDonor(donor)}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp SOS
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs font-bold rounded-xl h-8 gap-1.5 bg-primary hover:bg-primary/90"
                      onClick={() => window.open(`tel:${donor.phone}`)}
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Donor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
