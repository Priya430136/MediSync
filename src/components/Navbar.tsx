import React, { useState, useEffect } from "react";
import { 
  Heart, 
  User, 
  Menu, 
  LogOut, 
  ChevronDown, 
  Activity, 
  Siren, 
  Home, 
  RefreshCw, 
  Lock,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  ChevronRight,
  ExternalLink,
  Shield,
  Stethoscope,
  Building2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getPortalNavConfig, NavLinkItem, PortalType } from "@/config/portalNavConfig";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showPortalSwitcher, setShowPortalSwitcher] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('portal_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const navigate = useNavigate();
  const location = useLocation();
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
      toast({
        title: "Signed out",
        description: "You have been safely signed out.",
      });
      navigate("/");
    }
  };

  // Get dynamic portal-specific navigation items and styles based on current route and user role
  let currentRole = profile?.role || user?.user_metadata?.role;
  if (!currentRole && user?.email) {
    const email = user.email.toLowerCase();
    if (email.includes('doctor')) currentRole = 'doctor';
    else if (email.includes('hospital')) currentRole = 'hospital';
    else if (email.includes('admin')) currentRole = 'admin';
    else currentRole = 'user';
  }

  const navConfig = getPortalNavConfig(location.pathname, currentRole);
  const isPortal = navConfig.portal !== 'landing';
  const PortalIcon = navConfig.portalIcon;

  // Synchronize body class for page layout offset when inside a portal & collapsed state
  useEffect(() => {
    if (isPortal) {
      document.body.classList.add('in-portal');
      if (isSidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    } else {
      document.body.classList.remove('in-portal');
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('in-portal');
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isPortal, isSidebarCollapsed]);

  // Sidebar Vertical Navigation Link Component
  const SidebarNavItem = ({ 
    item, 
    onItemClick 
  }: { 
    item: NavLinkItem; 
    onItemClick?: () => void;
  }) => {
    const isCurrent = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
    const Icon = item.icon;

    return (
      <Link 
        to={item.to} 
        onClick={onItemClick}
        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group relative ${
          isCurrent 
            ? "bg-primary/10 text-primary border border-primary/25 shadow-xs font-bold" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
              isCurrent 
                ? 'bg-primary text-primary-foreground shadow-xs' 
                : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col text-left truncate">
            <span className={`text-xs leading-tight truncate ${isCurrent ? 'text-primary font-bold' : 'text-foreground'}`}>
              {item.label}
            </span>
            {item.description && (
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        </div>

        {item.badge ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20 shrink-0">
            {item.badge}
          </span>
        ) : isCurrent ? (
          <ChevronRight className="w-3.5 h-3.5 text-primary opacity-80 shrink-0" />
        ) : null}
      </Link>
    );
  };

  // Reusable Sidebar Content Component for Desktop Sidebar & Mobile Sheet Drawer
  const PortalSidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Top Header & Identity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <Link to="/" onClick={onNavigate} className="flex items-center gap-2 group" title="Go to MEDISYNC Home Page">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-foreground leading-none">
                MEDISYNC
              </span>
              <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">
                HEALTH PLATFORM
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link 
              to="/" 
              onClick={onNavigate}
              className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              title="Return to Main Site"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>

            {/* Collapse Sidebar Button (Desktop only) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSidebarCollapsed(true);
                localStorage.setItem('portal_sidebar_collapsed', 'true');
                toast({
                  title: "Sidebar Hidden",
                  description: "Click the floating menu icon at top-left anytime to re-open.",
                });
              }}
              className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
              title="Hide Sidebar"
              aria-label="Hide Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Portal Badge (Links to portal dashboard) */}
        <Link 
          to={navConfig.homeLink} 
          onClick={onNavigate}
          className={`p-2.5 rounded-xl border ${navConfig.badgeBg} ${navConfig.badgeBorder} flex items-center justify-between gap-2 shadow-2xs hover:opacity-90 transition-opacity group`}
          title={`Go to ${navConfig.portalName} Dashboard`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg bg-background/80 ${navConfig.badgeText} group-hover:scale-105 transition-transform`}>
              <PortalIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none">
                Active Portal
              </span>
              <span className={`text-xs font-bold ${navConfig.badgeText}`}>
                {navConfig.portalName}
              </span>
            </div>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 ${navConfig.badgeText} opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
        </Link>

        {/* Navigation Item List */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1">
            {navConfig.portalName} Services
          </p>
          <div className="space-y-1">
            {navConfig.items.map((item) => (
              <SidebarNavItem 
                key={item.to} 
                item={item} 
                onItemClick={onNavigate} 
              />
            ))}
          </div>
        </div>

        {/* Quick Portal Switcher Accordion */}
        <div className="pt-2 border-t border-border/60">
          <button 
            type="button"
            onClick={() => setShowPortalSwitcher(!showPortalSwitcher)}
            className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-primary" /> Switch Healthcare Portal
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPortalSwitcher ? 'rotate-180' : ''}`} />
          </button>
          
          {showPortalSwitcher && (
            <div className="grid grid-cols-1 gap-1.5 pt-2 pb-1">
              <Link 
                to="/patient-portal" 
                onClick={onNavigate}
                className={`text-[11px] font-semibold p-2 rounded-lg text-left transition-colors flex items-center justify-between ${
                  navConfig.portal === 'patient' 
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30' 
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20'
                }`}
              >
                <span>1. Patient Portal</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </Link>
              <Link 
                to="/doctor-portal" 
                onClick={onNavigate}
                className={`text-[11px] font-semibold p-2 rounded-lg text-left transition-colors flex items-center justify-between ${
                  navConfig.portal === 'doctor' 
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30' 
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <span>2. Doctor Workspace</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </Link>
              <Link 
                to="/hospital" 
                onClick={onNavigate}
                className={`text-[11px] font-semibold p-2 rounded-lg text-left transition-colors flex items-center justify-between ${
                  navConfig.portal === 'hospital' 
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                }`}
              >
                <span>3. Hospital ER & Admin</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Section: SOS & User Profile & Logout */}
      <div className="space-y-3 pt-3 border-t border-border/70">
        {/* Quick Emergency 108 SOS */}
        <Link to="/sos" onClick={onNavigate}>
          <Button variant="destructive" className="w-full h-9 rounded-xl text-xs font-bold shadow-sm shadow-destructive/20 gap-2 animate-pulse justify-center">
            <Siren className="w-4 h-4" />
            <span>Emergency 108 SOS</span>
          </Button>
        </Link>

        {/* User Card */}
        {user ? (
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground leading-tight truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0">
                {profile?.role || currentRole || 'User'}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
              <LanguageSwitcher />
              <button 
                type="button"
                onClick={handleSignOut}
                className="text-xs font-semibold text-destructive hover:text-destructive/80 flex items-center gap-1 p-1 rounded-md hover:bg-destructive/10 transition-colors"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth" onClick={onNavigate} className="w-full">
              <Button size="sm" className="w-full rounded-xl shadow-sm font-bold text-xs h-8 gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Sign In</span>
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================
  // SCENARIO 1: PORTAL ACTIVE -> LEFT SIDEBAR
  // ==========================================
  if (isPortal) {
    return (
      <>
        {/* Desktop Left-Side Navigation Bar (Collapsible with smooth animation) */}
        <aside 
          id="portal-left-sidebar" 
          className={`fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-card/95 backdrop-blur-xl border-r border-border z-40 hidden lg:flex flex-col justify-between p-4 overflow-y-auto shadow-sm transition-all duration-300 ease-in-out ${
            isSidebarCollapsed 
              ? '-translate-x-full opacity-0 pointer-events-none' 
              : 'translate-x-0 opacity-100'
          }`}
        >
          <PortalSidebarContent />
        </aside>

        {/* Floating Sidebar Toggle Button when Desktop Sidebar is Collapsed / Hidden */}
        {isSidebarCollapsed && (
          <div className="fixed left-4 top-4 z-40 hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSidebarCollapsed(false);
                localStorage.setItem('portal_sidebar_collapsed', 'false');
                toast({
                  title: "Sidebar Expanded",
                  description: "Full portal navigation restored.",
                });
              }}
              className="bg-card/95 hover:bg-card text-foreground border-border shadow-lg backdrop-blur-xl rounded-xl h-9 px-3 gap-2 font-bold text-xs group animate-in fade-in slide-in-from-left-3 duration-200"
              title="Expand / Show Sidebar"
              aria-label="Expand Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold">{navConfig.portalName}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                Open Menu
              </Badge>
            </Button>
          </div>
        )}

        {/* Mobile Top Header Bar for Portal Screens */}
        <header 
          id="portal-mobile-topbar" 
          className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-b border-border z-40 flex lg:hidden items-center justify-between px-4"
        >
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2" title="Go to MEDISYNC Home Page">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
              </div>
              <span className="text-sm font-black tracking-tight text-foreground">
                MEDISYNC
              </span>
            </Link>
            <Badge 
              variant="outline" 
              className={`${navConfig.badgeBg} ${navConfig.badgeText} ${navConfig.badgeBorder} text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center gap-1`}
            >
              <PortalIcon className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[110px]">{navConfig.portalName}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/sos">
              <Button size="sm" variant="destructive" className="rounded-full h-8 px-2.5 text-xs font-bold shadow-xs gap-1">
                <Siren className="w-3.5 h-3.5 animate-pulse" />
                <span>108</span>
              </Button>
            </Link>

            {/* Mobile Drawer Trigger (Opens the Left Navigation Sidebar) */}
            <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open Left Navigation Menu" className="rounded-lg h-9 w-9 border-border/70 bg-background/80">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[320px] border-r border-border bg-background/98 backdrop-blur-2xl p-4">
                <SheetHeader className="sr-only">
                  <SheetTitle>{navConfig.portalName} Navigation Menu</SheetTitle>
                </SheetHeader>
                <PortalSidebarContent onNavigate={() => setIsMobileDrawerOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>
      </>
    );
  }

  // ==========================================
  // SCENARIO 2: PUBLIC / LANDING PAGES -> TOP NAVBAR
  // ==========================================
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "pt-2 pb-2 px-2 lg:px-4" 
          : "pt-3 pb-3 px-2 lg:px-4 bg-background/0"
      }`}
    >
      <div className={`mx-auto w-full transition-all duration-300 ${
        isScrolled 
          ? "max-w-7xl bg-background/95 backdrop-blur-xl border border-border bg-clip-padding rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)]" 
          : "max-w-7xl bg-background/85 backdrop-blur-md border border-border/60 rounded-full shadow-sm"
      }`}>
        <div className="flex items-center justify-between h-13 px-3.5 lg:px-5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Heart className="w-4 h-4 text-primary fill-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-foreground leading-none">
                  MEDISYNC
                </span>
                <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">
                  HEALTH PLATFORM
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navConfig.items.map((item) => {
              const isCurrent = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                    isCurrent 
                      ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                      : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-primary-foreground' : 'text-primary'}`} />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground ml-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Quick Emergency 108 Action Button */}
            <Link to="/sos">
              <Button size="sm" variant="destructive" className="rounded-full h-8 px-3 text-xs font-bold shadow-sm shadow-destructive/20 gap-1.5 animate-pulse">
                <Siren className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">108 SOS</span>
              </Button>
            </Link>

            {/* Portal Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5 rounded-full text-xs font-semibold border-border/70 bg-background/60 hover:bg-muted/40 gap-1 hidden md:flex"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden xl:inline text-[11px]">Portals</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-background/95 backdrop-blur-xl border-border p-2 rounded-2xl shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Healthcare Portals
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <Link to="/patient-portal">
                  <DropdownMenuItem className="cursor-pointer rounded-xl p-2 text-xs font-semibold hover:bg-blue-500/10">
                    <User className="w-3.5 h-3.5 mr-2 text-blue-600" /> 1. Patient Portal & Services
                  </DropdownMenuItem>
                </Link>
                <Link to="/doctor-portal">
                  <DropdownMenuItem className="cursor-pointer rounded-xl p-2 text-xs font-semibold hover:bg-emerald-500/10">
                    <Stethoscope className="w-3.5 h-3.5 mr-2 text-emerald-600" /> 2. Doctor Workspace
                  </DropdownMenuItem>
                </Link>
                <Link to="/hospital">
                  <DropdownMenuItem className="cursor-pointer rounded-xl p-2 text-xs font-semibold hover:bg-rose-500/10">
                    <Building2 className="w-3.5 h-3.5 mr-2 text-rose-600" /> 3. Hospital ER & Admin
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <LanguageSwitcher />

            {/* Account / User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2.5 rounded-full hover:bg-primary/10 transition-colors border border-border/70 bg-background/60 gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold max-w-[80px] truncate hidden md:inline">
                      {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl mt-2 p-2 bg-background/95 backdrop-blur-xl border-border">
                  <DropdownMenuLabel className="font-normal px-2 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-bold leading-none text-foreground truncate">
                        {profile?.full_name || user.email}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-[9px] capitalize font-bold">
                          Role: {profile?.role || 'Patient'}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-1 space-y-0.5">
                    <Link to="/">
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium rounded-xl">
                        <Home className="w-3.5 h-3.5 mr-2 text-primary" /> Platform Home
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile">
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium rounded-xl">
                        <User className="w-3.5 h-3.5 mr-2" /> My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/patient-portal">
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium rounded-xl text-blue-600">
                        <Activity className="w-3.5 h-3.5 mr-2" /> Patient Services
                      </DropdownMenuItem>
                    </Link>
                  </div>

                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <DropdownMenuItem 
                      className="cursor-pointer font-bold text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl text-xs" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="rounded-full shadow-sm font-bold text-xs px-3.5 h-8 gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}

            {/* Mobile Sheet Trigger for Public Pages */}
            <div className="lg:hidden">
              <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Menu" className="rounded-full h-8 w-8 border-border/60 bg-background/50">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[360px] border-l border-border/60 bg-background/95 backdrop-blur-2xl p-5">
                  <SheetHeader className="mb-3 text-left">
                    <SheetTitle className="text-base font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary fill-primary" />
                        <span>Platform Services</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                    {navConfig.items.map((item) => (
                      <SidebarNavItem 
                        key={item.to} 
                        item={item} 
                        onItemClick={() => setIsMobileDrawerOpen(false)} 
                      />
                    ))}

                    <div className="pt-3 mt-2 border-t border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1.5">
                        Switch Portal View
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        <Link 
                          to="/patient-portal" 
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className="text-[11px] font-semibold p-2.5 rounded-lg bg-blue-500/10 text-blue-700 text-left hover:bg-blue-500/20"
                        >
                          1. Patient Portal
                        </Link>
                        <Link 
                          to="/doctor-portal" 
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className="text-[11px] font-semibold p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-left hover:bg-emerald-500/20"
                        >
                          2. Doctor Workspace
                        </Link>
                        <Link 
                          to="/hospital" 
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className="text-[11px] font-semibold p-2.5 rounded-lg bg-rose-500/10 text-rose-700 text-left hover:bg-rose-500/20"
                        >
                          3. Hospital ER & Admin
                        </Link>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
