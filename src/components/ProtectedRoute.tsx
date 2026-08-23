import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            const redirectPath = encodeURIComponent(location.pathname + location.search);
            navigate(`/auth?redirect=${redirectPath}`, { replace: true });
          }
          return;
        }

        if (allowedRoles && allowedRoles.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const userRole = profile?.role || user.user_metadata?.role;
          if (!userRole || !allowedRoles.includes(userRole)) {
            if (isMounted) {
              navigate('/', { replace: true });
            }
            return;
          }
        }

        if (isMounted) {
          setAuthorized(true);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          navigate('/auth', { replace: true });
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
  }, [navigate, location.pathname, location.search, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

