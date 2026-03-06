import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GiScrollUnfurled } from 'react-icons/gi';
import CampaignCard, { type CampaignWithRole } from '../components/hub/CampaignCard';
import HubActionPanels from '../components/hub/HubActionPanels';

interface HubPageProps {
  onEnterCampaign: (campaignId: string, role: 'gm' | 'player') => void;
}

export default function HubPage({ onEnterCampaign }: HubPageProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    const { data: members } = await supabase
      .from('campaign_members')
      .select('campaign_id, role, campaigns(id, name, invite_code, mode, created_by, status)')
      .eq('user_id', user.id);

    if (!members) { setLoading(false); return; }

    const campaignIds = members.map(m => (m as any).campaigns?.id).filter(Boolean);

    const { data: allChars } = await supabase
      .from('characters')
      .select('id, name, class, race, level, hp_current, hp_max, campaign_id')
      .eq('user_id', user.id)
      .in('campaign_id', campaignIds);

    const { data: memberCounts } = await supabase
      .from('campaign_members')
      .select('campaign_id')
      .in('campaign_id', campaignIds);

    const countByCampaign: Record<string, number> = {};
    for (const m of memberCounts || []) {
      countByCampaign[m.campaign_id] = (countByCampaign[m.campaign_id] || 0) + 1;
    }

    const charByCampaign: Record<string, typeof allChars extends (infer T)[] | null ? T : never> = {};
    for (const c of allChars || []) {
      charByCampaign[(c as any).campaign_id] = c as any;
    }

    const enriched: CampaignWithRole[] = [];
    for (const m of members) {
      const camp = (m as any).campaigns;
      if (!camp) continue;
      enriched.push({
        campaign_id: camp.id,
        role: m.role as 'gm' | 'player',
        campaign: camp,
        character: m.role === 'player' ? (charByCampaign[camp.id] || null) : null,
        member_count: countByCampaign[camp.id] ?? 0,
      });
    }

    enriched.sort((a, b) => {
      const aActive = a.campaign.status === 'active' ? 0 : 1;
      const bActive = b.campaign.status === 'active' ? 0 : 1;
      return aActive - bActive;
    });

    setCampaigns(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function createCampaign() {
    if (!user || !newName.trim()) return;
    setBusy(true); setErr(null);
    const { data: c, error } = await supabase.from('campaigns').insert({ name: newName.trim(), created_by: user.id }).select().single();
    if (error || !c) { setErr(error?.message ?? 'Erreur'); setBusy(false); return; }
    const { error: e2 } = await supabase.from('campaign_members').insert({ campaign_id: c.id, user_id: user.id, role: 'gm' });
    if (e2) { setErr(e2.message); setBusy(false); return; }
    setNewName(''); setShowCreate(false); setBusy(false); fetchCampaigns();
  }

  async function joinCampaign() {
    if (!user || inviteCode.length < 6) return;
    setBusy(true); setErr(null);
    const { data: c } = await supabase.from('campaigns').select('id').eq('invite_code', inviteCode.trim().toUpperCase()).single();
    if (!c) { setErr('Code invalide'); setBusy(false); return; }
    const { error } = await supabase.from('campaign_members').insert({ campaign_id: c.id, user_id: user.id, role: 'player' });
    if (error) { setErr(error.message.includes('duplicate') ? 'Tu es déjà membre !' : error.message); setBusy(false); return; }
    setInviteCode(''); setShowJoin(false); setBusy(false); fetchCampaigns();
  }

  const activeCampaigns = campaigns.filter(c => c.campaign.status === 'active');
  const endedCampaigns = campaigns.filter(c => c.campaign.status !== 'active');

  return (
    <div className="app-shell">
      <div className="app-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>Mes Campagnes</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {profile?.display_name || 'Aventurier'}
              {isAdmin && <span className="badge badge--positive" style={{ fontSize: '0.5625rem' }}>ADMIN</span>}
            </p>
          </div>
          <button className="btn btn--ghost" onClick={signOut} style={{ fontSize: '0.8125rem' }}>Déconnexion</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <GiScrollUnfurled size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Aucune campagne</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Crée ou rejoins une campagne pour commencer</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeCampaigns.map(c => <CampaignCard key={c.campaign_id} campaign={c} onEnter={onEnterCampaign} />)}
            </div>

            {endedCampaigns.length > 0 && (
              <>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                  Terminées
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {endedCampaigns.map(c => <CampaignCard key={c.campaign_id} campaign={c} onEnter={onEnterCampaign} ended />)}
                </div>
              </>
            )}
          </>
        )}

        <HubActionPanels
          showJoin={showJoin}
          showCreate={showCreate}
          inviteCode={inviteCode}
          newName={newName}
          busy={busy}
          err={err}
          onToggleJoin={() => { setShowJoin(!showJoin); setShowCreate(false); setErr(null); }}
          onToggleCreate={() => { setShowCreate(!showCreate); setShowJoin(false); setErr(null); }}
          onInviteCodeChange={setInviteCode}
          onNewNameChange={setNewName}
          onJoinCampaign={joinCampaign}
          onCreateCampaign={createCampaign}
        />
      </div>
    </div>
  );
}