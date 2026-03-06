import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for subscribing to Supabase realtime changes on a table.
 */
export function useSupabaseSubscription<T = any>(
  channelName: string,
  table: string,
  filter: string,
  onUpdate: (payload: T) => void,
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE' = '*'
): void {
  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event, 
        schema: 'public', 
        table, 
        filter 
      }, (payload: any) => {
        onUpdate(payload as T);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [channelName, table, filter, onUpdate, event]);
}