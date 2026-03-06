import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

type Campaign = Tables<'campaigns'>;

/**
 * Hook for fetching and subscribing to campaign data.
 */
export function useCampaignData(campaignId: string): {
  campaign: Campaign | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (fetchError) throw new Error(fetchError.message);
      setCampaign(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('campaign-data-' + campaignId)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'campaigns', 
        filter: `id=eq.${campaignId}` 
      }, (payload: any) => {
        if (payload.new) setCampaign(payload.new);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [campaignId]);

  return { campaign, loading, error, refetch: fetchCampaign };
}