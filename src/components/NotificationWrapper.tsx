import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/use-notifications';

export const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useNotifications(userId);

  return <>{children}</>;
};
