import { useState, useEffect } from "react";
import { Heart, User, Video, CreditCard, FileText, Pill, Menu, X, LogOut, LayoutDashboard, Droplet, Brain, ChevronDown, Activity, Calendar, Stethoscope, ShieldCheck, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      if (!userId) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.warn("Error fetching profile in Navbar:", err);
      }
    };

    supabase.auth.getUser().then((res: any) => {
      const u = res?.data?.user;
      if (isMounted) {
        setUser(u ?? null);
        if (u?.id) fetchProfile(u.id);
      }
    }).catch((err: any) => {
      console.warn("Error getting user in Navbar:", err);
    });
    
    const authListener = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      const u = session?.user ?? null;
      if (isMounted) {
        setUser(u);
        if (u?.id) {
          fetchProfile(u.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const NavItem = ({ to, icon: Icon, children, mobile = false }: { to: string, icon?: any, children: React.ReactNode, mobile?: boolean }) => {
    const baseClass = mobile
      ? "text-lg py-3 font-semibold hover:text-primary transition-colors flex items-center gap-3 w-full border-b border-border/50"
      : "relative text-sm font-semibold text-foreground/80 hover:text-primary transition-colors group px-1 py-2 flex items-center gap-1.5";
      
    return (
      <Link to={to} className={baseClass} onClick={() => setIsOpen(false)}>
        {Icon && <Icon className={mobile ? "w-5 h-5 text-primary" : "w-4 h-4 text-primary group-hover:scale-110 transition-transform"} />}
        {children}
        {!mobile && <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 origin-left transition-transform group-hover:scale-x-100 rounded-full" />}
      </Link>
    );
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <NavItem to="/" mobile={mobile}>{t('nav.home')}</NavItem>
      <NavItem to="/book" icon={Calendar} mobile={mobile}>
        <span className="text-primary font-bold">Book Doctor</span>
      </NavItem>
      <NavItem to="/patient-portal" icon={User} mobile={mobile}>
        <span>Patient Portal</span>
      </NavItem>
      <NavItem to="/doctor-portal" icon={Stethoscope} mobile={mobile}>
        <span>Doctor Queue</span>
      </NavItem>
      <NavItem to="/sos" mobile={mobile}>
        <span className="text-destructive font-bold">SOS</span>
      </NavItem>
      <NavItem to="/triage" icon={Brain} mobile={mobile}>
        <span className="font-semibold">AI Triage</span>
      </NavItem>

      {mobile ? (
        <>
          <NavItem to="/admin" icon={ShieldCheck} mobile={mobile}>Admin Portal</NavItem>
          <NavItem to="/docs" icon={BookOpen} mobile={mobile}>System Architecture</NavItem>
          <NavItem to="/blood-donors" icon={Droplet} mobile={mobile}>
            <span className="text-red-500 font-bold">Blood Donors</span>
          </NavItem>
          <NavItem to="/video-consultation" icon={Video} mobile={mobile}>Video Consult</NavItem>
          <NavItem to="/products" mobile={mobile}>{t('nav.products')}</NavItem>
          {user && (
            <>
              <NavItem to="/my-medicines" icon={Pill} mobile={mobile}>Medicines</NavItem>
              <NavItem to="/prescriptions" icon={FileText} mobile={mobile}>Records</NavItem>
            </>
          )}
          <NavItem to="/about" mobile={mobile}>{t('nav.aboutUs')}</NavItem>
        </>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-primary transition-colors px-1 py-2 outline-none group relative">
              More Services <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 origin-left transition-transform group-hover:scale-x-100 rounded-full" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-background/90 backdrop-blur-3xl border-border shadow-2xl p-2 rounded-xl">
              <Link to="/admin">
                <DropdownMenuItem className="cursor-pointer gap-3 py-2.5 rounded-lg focus:bg-primary/10 transition-colors">
                  <div className="bg-blue-500/10 p-2 rounded-md"><ShieldCheck className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <span className="font-bold text-foreground text-xs block">Admin Portal</span>
                    <span className="text-[10px] text-muted-foreground">Concurrency audit & queue</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <Link to="/docs">
                <DropdownMenuItem className="cursor-pointer gap-3 py-2.5 rounded-lg focus:bg-primary/10 transition-colors">
                  <div className="bg-purple-500/10 p-2 rounded-md"><BookOpen className="w-4 h-4 text-purple-600" /></div>
                  <div>
                    <span className="font-bold text-foreground text-xs block">System Design Docs</span>
                    <span className="text-[10px] text-muted-foreground">800w architecture specification</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="my-1.5 bg-border/50" />
              <Link to="/blood-donors">
                <DropdownMenuItem className="cursor-pointer gap-3 py-2 rounded-lg focus:bg-primary/10 transition-colors">
                  <div className="bg-red-500/10 p-2 rounded-md"><Droplet className="w-4 h-4 text-red-500" /></div>
                  <span className="font-medium text-xs">Blood Donors Hub</span>
                </DropdownMenuItem>
              </Link>
              <Link to="/video-consultation">
                <DropdownMenuItem className="cursor-pointer gap-3 py-2 rounded-lg focus:bg-primary/10 transition-colors">
                  <div className="bg-primary/10 p-2 rounded-md"><Video className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium text-xs">Video Consult</span>
                </DropdownMenuItem>
              </Link>
              <Link to="/products">
                <DropdownMenuItem className="cursor-pointer gap-3 py-2 rounded-lg focus:bg-primary/10 transition-colors">
                  <div className="bg-primary/10 p-2 rounded-md"><Activity className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium text-xs">Emergency Products</span>
                </DropdownMenuItem>
              </Link>
              {user && (
                <>
                  <DropdownMenuSeparator className="my-1.5 bg-border/50" />
                  <Link to="/my-medicines">
                    <DropdownMenuItem className="cursor-pointer gap-3 py-2 rounded-lg focus:bg-primary/10 transition-colors">
                      <div className="bg-primary/10 p-2 rounded-md"><Pill className="w-4 h-4 text-primary" /></div>
                      <span className="font-medium text-xs">Medicines</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/prescriptions">
                    <DropdownMenuItem className="cursor-pointer gap-3 py-2 rounded-lg focus:bg-primary/10 transition-colors">
                      <div className="bg-primary/10 p-2 rounded-md"><FileText className="w-4 h-4 text-primary" /></div>
                      <span className="font-medium text-xs">Health Records</span>
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <NavItem to="/about" mobile={mobile}>{t('nav.aboutUs')}</NavItem>
        </>
      )}
    </>
  );

  const DashboardLink = () => {
    if (!profile?.role) return null;
    const path = profile.role === 'driver' ? '/driver' : 
                 profile.role === 'hospital' ? '/hospital' : 
                 profile.role === 'operator' ? '/operator-dashboard' : 
                 profile.role === 'doctor' ? '/doctor-portal' :
                 profile.role === 'user' ? '/patient-portal' : null;
    
    if (!path) return null;

    return (
      <Link to={path}>
        <DropdownMenuItem className="cursor-pointer font-medium rounded-lg">
          <LayoutDashboard className="w-4 h-4 mr-2 text-primary" />
          {profile.role === 'doctor' ? 'Doctor Workspace' : 
           profile.role === 'user' ? 'My Health Portal' : 'Dashboard'}
        </DropdownMenuItem>
      </Link>
    );
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "pt-2 pb-2 px-2 lg:px-4" 
          : "pt-4 pb-4 px-2 lg:px-4 bg-background/0"
      }`}
    >
      <div className={`mx-auto w-full transition-all duration-300 ${isScrolled ? "max-w-7xl bg-background/80 backdrop-blur-xl border border-border bg-clip-padding rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)]" : "max-w-7xl bg-transparent border-transparent"}`}>
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="w-7 h-7 text-primary fill-primary group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all" />
              </motion.div>
            </div>
            <span className="text-xl font-extrabold text-foreground tracking-tight uppercase">MEDISYNC</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-center gap-6">
            <div className="flex items-center gap-6 pr-6 border-r border-border/50">
              <NavLinks />
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-colors border border-primary/20 bg-background/50">
                      <User className="w-5 h-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl mt-2 p-2">
                    <DropdownMenuLabel className="font-normal px-2 py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{profile?.full_name || user.email}</p>
                        <p className="text-xs font-medium text-muted-foreground capitalize">{profile?.role || 'User'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DashboardLink />
                      <Link to="/profile">
                        <DropdownMenuItem className="cursor-pointer font-medium rounded-lg">
                          <User className="w-4 h-4 mr-2" /> Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/bookings">
                        <DropdownMenuItem className="cursor-pointer font-medium rounded-lg">
                          <FileText className="w-4 h-4 mr-2" /> My Bookings
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/health-cards">
                        <DropdownMenuItem className="cursor-pointer font-medium rounded-lg">
                          <CreditCard className="w-4 h-4 mr-2" /> Health Cards
                        </DropdownMenuItem>
                      </Link>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem 
                        className="cursor-pointer font-semibold text-white focus:text-white bg-destructive hover:bg-destructive/90 rounded-lg mt-1" 
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Sign out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="rounded-full shadow-lg hover:shadow-primary/25 transition-all font-semibold px-6">Sign In</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu" className="rounded-full border-border/50 bg-background/50 backdrop-blur-md">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[400px] border-l border-border/50 bg-background/95 backdrop-blur-xl p-6">
                <SheetHeader className="mb-8 text-left">
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                    <Heart className="w-6 h-6 text-primary fill-primary" />
                    MEDISYNC
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  <NavLinks mobile />
                  
                  <div className="mt-8">
                    {user ? (
                      <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                        <div className="mb-2">
                          <p className="font-bold text-lg">{profile?.full_name || user.email}</p>
                          <p className="text-sm font-medium text-primary capitalize">{profile?.role || 'User'}</p>
                        </div>
                        <nav className="flex flex-col gap-2">
                          <Link to="/profile" onClick={() => setIsOpen(false)} className="py-2 text-foreground/80 hover:text-foreground font-medium flex items-center gap-2"><User className="w-4 h-4" />Profile</Link>
                          <Link to="/bookings" onClick={() => setIsOpen(false)} className="py-2 text-foreground/80 hover:text-foreground font-medium flex items-center gap-2"><FileText className="w-4 h-4" />My Bookings</Link>
                        </nav>
                        <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start rounded-xl mt-4 font-bold shadow-sm">
                          <LogOut className="w-4 h-4 mr-2" /> Sign out
                        </Button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button className="w-full rounded-2xl h-12 text-lg font-bold shadow-lg">Sign In / Register</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
