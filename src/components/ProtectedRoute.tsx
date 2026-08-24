import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShieldAlert, 
  Loader2, 
  ArrowRight, 
  User, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Home,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  portalName?: string;
  portalRole?: 'patient' | 'doctor' | 'hospital' | 'admin';
}

const ROLE_METADATA: Record<string, { label: string; icon: any; color: string; defaultPath: string }> = {
  user: { label: 'Patient', icon: User, color: 'text-blue-600 bg-blue-50 border-blue-200', defaultPath: '/patient-portal' },
  patient: { label: 'Patient', icon: User, color: 'text-blue-600 bg-blue-50 border-blue-200', defaultPath: '/patient-portal' },
  doctor: { label: 'Doctor', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', defaultPath: '/doctor-portal' },
  hospital: { label: 'Hospital Admin', icon: Building2, color: 'text-rose-600 bg-rose-50 border-rose-200', defaultPath: '/hospital' },
  admin: { label: 'System Admin', icon: ShieldCheck, color: 'text-slate-800 bg-slate-100 border-slate-300', defaultPath: '/admin' },
};

export const ProtectedRoute = ({ children, allowedRoles, portalName, portalRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          if (isMounted) {
            const redirectPath = encodeURIComponent(location.pathname + location.search);
            const targetPortal = portalRole || (location.pathname.includes('doctor') ? 'doctor' : location.pathname.includes('hospital') ? 'hospital' : location.pathname.includes('admin') ? 'admin' : 'patient');
            navigate(`/auth?portal=${targetPortal}&redirect=${redirectPath}`, { replace: true });
          }
          return;
        }

        if (isMounted) {
          setUser(currentUser);
        }

        // Fetch user's profile to inspect role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        // Determine effective role: profile role > user metadata role > email heuristic
        let detectedRole = profile?.role || currentUser.user_metadata?.role;
        if (!detectedRole) {
          const email = currentUser.email?.toLowerCase() || '';
          if (email.includes('doctor')) detectedRole = 'doctor';
          else if (email.includes('hospital')) detectedRole = 'hospital';
          else if (email.includes('admin')) detectedRole = 'admin';
          else detectedRole = 'user';
        }

        if (isMounted) {
          setUserRole(detectedRole);
          setUserProfile(profile);
        }

        // Check if role is allowed
        if (allowedRoles && allowedRoles.length > 0) {
          const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
          // normalize 'patient' to 'user' or vice versa
          const hasAccess = 
            normalizedAllowed.includes(detectedRole.toLowerCase()) ||
            (detectedRole === 'user' && normalizedAllowed.includes('patient')) ||
            (detectedRole === 'patient' && normalizedAllowed.includes('user')) ||
            detectedRole === 'admin'; // admin can access all if explicitly allowed or override

          if (hasAccess) {
            if (isMounted) setIsAuthorized(true);
          } else {
            if (isMounted) setIsAuthorized(false);
          }
        } else {
          if (isMounted) setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check error in ProtectedRoute:', error);
        if (isMounted) {
          setIsAuthorized(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname, location.search, allowedRoles, portalRole]);

  const handleSignOutAndSwitch = async (targetPortalRole?: string) => {
    await supabase.auth.signOut();
    const portal = targetPortalRole || portalRole || 'patient';
    navigate(`/auth?portal=${portal}&redirect=${encodeURIComponent(location.pathname)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Verifying portal credentials...
        </p>
      </div>
    );
  }

  // If user is logged in but role does NOT match the portal requirement
  if (!isAuthorized && user) {
    const currentMeta = ROLE_METADATA[userRole || 'user'] || ROLE_METADATA['user'];
    const CurrentIcon = currentMeta.icon;
    const requiredRoleName = portalName || (allowedRoles ? allowedRoles.map(r => r.toUpperCase()).join(" / ") : "Authorized Personnel");

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-2xl border-destructive/20 bg-background/95 backdrop-blur-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-3">
              <ShieldAlert className="w-7 h-7 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Portal Access Restricted
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              One account can only sign into its designated medical portal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="p-3.5 rounded-xl border bg-muted/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Your Active Account:</span>
                <Badge variant="outline" className={`font-semibold capitalize ${currentMeta.color}`}>
                  <CurrentIcon className="w-3 h-3 mr-1" />
                  {currentMeta.label}
                </Badge>
              </div>
              <p className="font-semibold text-foreground text-xs truncate">
                {userProfile?.full_name || user.email}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This portal (<strong>{requiredRoleName}</strong>) requires a dedicated <strong>{portalRole || 'authorized'}</strong> account. Patient accounts cannot access Doctor or Hospital systems, and vice versa.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full font-bold shadow-md"
              onClick={() => navigate(currentMeta.defaultPath)}
            >
              Go to My {currentMeta.label} Portal <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                className="font-semibold text-xs border-muted-foreground/30 hover:bg-muted"
                onClick={() => handleSignOutAndSwitch(portalRole)}
              >
                <LogOut className="w-3.5 h-3.5 mr-1 text-destructive" /> Switch Account
              </Button>
              <Button
                variant="ghost"
                className="font-semibold text-xs"
                onClick={() => navigate('/')}
              >
                <Home className="w-3.5 h-3.5 mr-1" /> Home
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};
