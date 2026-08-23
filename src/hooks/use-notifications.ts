import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    logger.info('Initializing real-time notifications', { userId });

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('New notification received', payload);
          toast({
            title: payload.new.title || 'New Notification',
            description: payload.new.message,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Successfully subscribed to notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
