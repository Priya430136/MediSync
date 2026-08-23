import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Ambulance, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  Car, 
  Radio, 
  Building2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Home,
  Lock,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  fullName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z.string()
    .min(6, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "driver", "operator", "hospital", "doctor"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

type ValidationErrors = Record<string, string>;

const DEMO_ACCOUNTS = [
  {
    role: "user",
    label: "Patient",
    email: "patient@rapidresq.com",
    password: "Password@123",
    name: "Priya Sehrawat",
    icon: User,
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
    destination: "/patient-portal",
    desc: "Book doctors, view records & SOS"
  },
  {
    role: "doctor",
    label: "Doctor",
    email: "doctor@rapidresq.com",
    password: "Password@123",
    name: "Dr. Ananya Sharma",
    icon: Stethoscope,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
    destination: "/doctor-portal",
    desc: "Patient queue, AI summary & prescriptions"
  },
  {
    role: "driver",
    label: "Ambulance Driver",
    email: "driver@rapidresq.com",
    password: "Password@123",
    name: "Rajesh Kumar",
    icon: Car,
    color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
    destination: "/driver",
    desc: "Live GPS tracking & emergency dispatch"
  },
  {
    role: "operator",
    label: "Dispatch Operator",
    email: "operator@rapidresq.com",
    password: "Password@123",
    name: "Amit Verma",
    icon: Radio,
    color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
    destination: "/operator-dashboard",
    desc: "Triaging 108 SOS calls & triage queue"
  },
  {
    role: "hospital",
    label: "Hospital Admin",
    email: "hospital@rapidresq.com",
    password: "Password@123",
    name: "Apollo Emergency Admin",
    icon: Building2,
    color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
    destination: "/hospital",
    desc: "ICU bed tracker & blood inventory"
  }
];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "signin");
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});

  // Controlled form states for quick demo auto-filling
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const redirectParam = searchParams.get("redirect") || searchParams.get("returnUrl");

  const getRedirectForRole = (role?: string) => {
    // If a redirect URL parameter was passed (and is a relative path), respect it
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      return redirectParam;
    }

    switch (role) {
      case "doctor":
        return "/doctor-portal";
      case "driver":
        return "/driver";
      case "operator":
        return "/operator-dashboard";
      case "hospital":
        return "/hospital";
      case "user":
      default:
        return "/patient-portal";
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          // Determine role for redirection
          const user = session.user;
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const role = profile?.role || user.user_metadata?.role || 'user';
          const destination = getRedirectForRole(role);
          navigate(destination, { replace: true });
          return;
        }
      } catch (err) {
        console.warn("Session check error on Auth page:", err);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkExistingSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user && isMounted) {
        const user = session.user;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role || 'user';
        const destination = getRedirectForRole(role);
        navigate(destination, { replace: true });
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, redirectParam]);

  const handleQuickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (error) throw error;

      toast({
        title: `Welcome, ${account.name}!`,
        description: `Signed in as ${account.label}. Redirecting...`,
      });

      const destination = redirectParam && redirectParam.startsWith('/')
        ? redirectParam 
        : account.destination;

      setTimeout(() => {
        navigate(destination);
      }, 300);
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignUpErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      fullName: (formData.get("full-name") as string || "").trim(),
      phone: (formData.get("phone") as string || "").trim().replace(/[\s\-\(\)]/g, ""),
      email: (formData.get("signup-email") as string || "").trim().toLowerCase(),
      password: formData.get("signup-password") as string || "",
      role: formData.get("role") as string || "user",
    };

    // Validate input
    const validationResult = signUpSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors: ValidationErrors = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setSignUpErrors(errors);
      setLoading(false);
      return;
    }

    const { fullName, phone, email, password, role } = validationResult.data;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            phone: phone,
            role: role
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        // Upsert user profile into database
        await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: fullName,
            phone: phone,
            email: email,
            role: role
          });
      }

      // Check if email confirmation is required by Supabase project settings
      if (data?.user && !data?.session) {
        toast({
          title: "Check your email",
          description: "A confirmation link has been sent to complete your registration.",
        });
      } else {
        toast({
          title: "Account Created!",
          description: `Welcome to RapidResQ, ${fullName}. You are now signed in.`,
        });
        const destination = getRedirectForRole(role);
        navigate(destination);
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not complete registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignInErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      email: (formData.get("signin-email") as string || signInEmail).trim().toLowerCase(),
      password: formData.get("signin-password") as string || signInPassword,
    };

    // Validate input
    const validationResult = signInSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors: ValidationErrors = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setSignInErrors(errors);
      setLoading(false);
      return;
    }

    const { email, password } = validationResult.data;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile to redirect to appropriate dashboard
      const user = data?.user;
      let targetRole = "user";

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        targetRole = profile?.role || user.user_metadata?.role || "user";
      }

      const targetPath = getRedirectForRole(targetRole);

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to RapidResQ.",
      });
      navigate(targetPath);
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <div className="flex items-center gap-1.5 text-destructive text-xs mt-1.5 font-medium">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Connecting to RapidResQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden text-white bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-slate-900/80 to-slate-950" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
              <Ambulance className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">RAPIDRESQ</h1>
              <p className="text-xs text-primary-foreground/80 font-medium">Emergency Health & Triage Grid</p>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-6 max-w-md"
          >
            <h2 className="text-4xl font-extrabold leading-tight">
              Life-saving care, <br />
              <span className="text-primary-foreground/80">when seconds count.</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Unified emergency dispatch, AI-powered triage, and synchronized doctor appointment booking with sub-second concurrency protection.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-4">
              {[
                "Instant Doctor Appointments with 5-Min Slot Hold",
                "Gemini AI Clinical Summary & Triage Engine",
                "108 Emergency Ambulance GPS Dispatch",
                "ABDM Compliant Electronic Health Records"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 text-xs font-medium text-slate-300 bg-white/5 w-fit px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ISO 27001 Certified & ABDM Health Grid Ready</span>
        </div>
      </div>

      {/* Right side Auth Form */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-background">
        {/* Top Back to Home Navigation */}
        <div className="w-full max-w-lg mb-2 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1 px-2.5 rounded-lg border border-border/60 hover:bg-muted/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home (Landing Page)</span>
          </Link>
          <span className="text-[11px] text-muted-foreground font-medium">MediSync RapidResQ</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Mobile Header */}
          <div className="text-center mb-4 block lg:hidden">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Ambulance className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">RAPIDRESQ</h1>
            </div>
            <p className="text-xs text-muted-foreground">Emergency healthcare & doctor booking portal</p>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="bg-muted/40 border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Instant Demo Access</h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">1-Click Auto Login</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc)}
                    className="flex flex-col text-left p-2.5 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-background transition-all group relative overflow-hidden bg-card/60"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg border ${acc.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{acc.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 p-1 rounded-xl h-12">
              <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-semibold transition-all">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-semibold transition-all">
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="mt-0 focus-visible:outline-none">
              <Card className="border border-border/60 shadow-sm bg-card rounded-2xl">
                <CardContent className="p-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs font-semibold">Email Address</Label>
                      <Input
                        id="signin-email"
                        name="signin-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="patient@rapidresq.com"
                        required
                        className={`h-11 ${signInErrors.email ? "border-destructive" : ""}`}
                      />
                      <ErrorMessage message={signInErrors.email} />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-xs font-semibold">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setSignInEmail("patient@rapidresq.com");
                            setSignInPassword("Password@123");
                          }}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Use Demo Password
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          name="signin-password"
                          type={showPassword ? "text" : "password"}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className={`h-11 pr-10 ${signInErrors.password ? "border-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <ErrorMessage message={signInErrors.password} />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-sm font-bold gap-2 rounded-xl shadow-md"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to RapidResQ</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
              <Card className="border border-border/60 shadow-sm bg-card rounded-2xl">
                <CardContent className="p-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label htmlFor="full-name" className="text-xs font-semibold">Full Name</Label>
                        <Input
                          id="full-name"
                          name="full-name"
                          type="text"
                          placeholder="Dr. Rajesh Patel"
                          required
                          className={`h-10 ${signUpErrors.fullName ? "border-destructive" : ""}`}
                        />
                        <ErrorMessage message={signUpErrors.fullName} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+919876543210"
                          required
                          className={`h-10 ${signUpErrors.phone ? "border-destructive" : ""}`}
                        />
                        <ErrorMessage message={signUpErrors.phone} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs font-semibold">Email Address</Label>
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        placeholder="doctor@hospital.org"
                        required
                        className={`h-10 ${signUpErrors.email ? "border-destructive" : ""}`}
                      />
                      <ErrorMessage message={signUpErrors.email} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-semibold">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          required
                          className={`h-10 pr-10 ${signUpErrors.password ? "border-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <ErrorMessage message={signUpErrors.password} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-xs font-semibold">Primary Role / Account Type</Label>
                      <select
                        id="role"
                        name="role"
                        defaultValue="user"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="user">Patient / Citizen</option>
                        <option value="doctor">Consulting Doctor / Specialist</option>
                        <option value="driver">Ambulance Driver</option>
                        <option value="operator">Emergency Dispatch Operator</option>
                        <option value="hospital">Hospital Administrator</option>
                      </select>
                      <ErrorMessage message={signUpErrors.role} />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-sm font-bold gap-2 rounded-xl shadow-md mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Register & Continue</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            By accessing RapidResQ, you agree to our emergency protocols and health data protection guidelines.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;

