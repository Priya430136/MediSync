import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Droplet, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Unlink,
  Link2
} from "lucide-react";
import { useSanitize } from "@/hooks/use-sanitize";
import { handleApiError } from "@/utils/api-resilience";
import { API } from "@/lib/api";
import { GoogleCalendarManager } from "@/components/GoogleCalendarManager";

const Profile = () => {
  const navigate = useNavigate();
  const { sanitize } = useSanitize();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    blood_group: "",
    emergency_contact: "",
  });

  // Google Calendar Integration State
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [showFullCalendarManager, setShowFullCalendarManager] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Fallback for demo or guest user
      const guestEmail = localStorage.getItem("rapidresq_guest_email") || "michael.chen@example.com";
      setUser({ id: "demo-user-1", email: guestEmail });
      setProfile(prev => ({ ...prev, email: guestEmail, full_name: "Michael Chen" }));
      loadCalendarStatus(guestEmail);
      setLoading(false);
      return;
    }
    setUser(user);
    loadProfile(user.id);
    loadCalendarStatus(user.email || "michael.chen@example.com");
  };

  const loadCalendarStatus = async (email: string) => {
    setLoadingCalendar(true);
    try {
      const status = await API.getCalendarStatus(email);
      setCalendarStatus(status);
    } catch (err) {
      console.warn("Could not load Google Calendar status:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleConnectCalendar = async () => {
    setCalendarSyncing(true);
    try {
      const targetEmail = profile.email || user?.email || "michael.chen@example.com";
      const res = await API.connectCalendar({
        email: targetEmail,
        role: "patient",
        userId: user?.id || "demo-user-1",
        scope: "https://www.googleapis.com/auth/calendar.events"
      });
      toast.success(res.message || "Google Calendar connected successfully!");
      await loadCalendarStatus(targetEmail);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Google Calendar");
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setCalendarSyncing(true);
    try {
      const targetEmail = profile.email || user?.email || "michael.chen@example.com";
      await API.disconnectCalendar(targetEmail);
      toast.success("Google Calendar unlinked from your profile");
      await loadCalendarStatus(targetEmail);
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect calendar");
    } finally {
      setCalendarSyncing(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        handleApiError(error, "loading profile");
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          email: user?.email || "",
          address: data.address || "",
          blood_group: data.blood_group || "",
          emergency_contact: data.emergency_contact || "",
        });
      }
    } catch (error: any) {
      // Error already handled by handleApiError
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: sanitize(profile.full_name),
          phone: sanitize(profile.phone),
          address: sanitize(profile.address),
          blood_group: sanitize(profile.blood_group),
          emergency_contact: sanitize(profile.emergency_contact),
        })
        .eq("user_id", user.id);

      if (error) {
        handleApiError(error, "updating profile");
        throw error;
      }
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      // Error already handled
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <User className="w-8 h-8" />
                My Profile
              </CardTitle>
              <CardDescription>
                Manage your personal information and emergency details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      className="pl-10"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      className="pl-10"
                      value={profile.email}
                      disabled
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <div className="relative">
                    <Droplet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="blood_group"
                      className="pl-10"
                      value={profile.blood_group}
                      onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                      placeholder="e.g., A+, B-, O+"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-10"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Your full address"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emergency_contact"
                      className="pl-10"
                      value={profile.emergency_contact}
                      onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                      placeholder="Emergency contact number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GOOGLE ACCOUNT & CALENDAR INTEGRATION STATUS SECTION */}
          <Card className="border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-900/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Connected Google Calendar
                      {calendarStatus?.connected ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Linked & Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Automatically synchronize confirmed clinical appointments, reschedule updates, and cancellation events with Google Calendar
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCalendarStatus(profile.email || user?.email || "michael.chen@example.com")}
                    disabled={loadingCalendar}
                    className="text-xs gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCalendar ? "animate-spin" : ""}`} />
                    Refresh Status
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullCalendarManager(!showFullCalendarManager)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    {showFullCalendarManager ? "Hide Advanced" : "Advanced Sync"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Google Account Email</span>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {profile.email || user?.email || "michael.chen@example.com"}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">OAuth Scope & Permissions</span>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      calendar.events (Read/Write)
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Sync Mode</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Real-time Bidirectional
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {calendarStatus?.connected 
                      ? `Your account is linked. When appointments are booked or rescheduled, calendar invites and notifications are dispatched automatically.`
                      : `Click "Connect Google Account" to authorize calendar sync and receive calendar invites for your appointments.`}
                  </p>

                  <div className="flex items-center gap-2">
                    {calendarStatus?.connected ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnectCalendar}
                        disabled={calendarSyncing}
                        className="text-xs gap-1.5 h-8"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        Disconnect Calendar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleConnectCalendar}
                        disabled={calendarSyncing}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 font-medium shadow-sm"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {calendarSyncing ? "Connecting..." : "Connect Google Account"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Advanced Calendar Manager */}
              {showFullCalendarManager && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <GoogleCalendarManager
                    currentUser={{
                      email: profile.email || user?.email,
                      fullName: profile.full_name,
                      role: "patient",
                      userId: user?.id,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
