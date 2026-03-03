import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CampaignWithRole {
  campaign_id: string;
  role: 'gm' | 'player';
  campaign: { id: string; name: string; invite_code: string; mode: 'exploration' | 'combat'; created_by: string };
  character?: { id: string; name: string; class: string; race: string; level: number; hp_current: number; hp_max: number } | null;
  member_count?: number;
}

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
      .select('campaign_id, role, campaigns(id, name, invite_code, mode, created_by)')
      .eq('user_id', user.id);
    if (!members) { setLoading(false); return; }

    const enriched: CampaignWithRole[] = [];
    for (const m of members) {
      const camp = (m as any).campaigns;
      if (!camp) continue;
      let character = null;
      if (m.role === 'player') {
        const { data } = await supabase.from('characters').select('id, name, class, race, level, hp_current, hp_max').eq('campaign_id', camp.id).eq('user_id', user.id).single();
        character = data;
      }
      const { count } = await supabase.from('campaign_members').select('id', { count: 'exact', head: true }).eq('campaign_id', camp.id);
      enriched.push({ campaign_id: camp.id, role: m.role as 'gm' | 'player', campaign: camp, character, member_count: count ?? 0 });
    }
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
    if (error) { setErr(error.message.includes('duplicate') ? 'Tu es deja membre !' : error.message); setBusy(false); return; }
    setInviteCode(''); setShowJoin(false); setBusy(false); fetchCampaigns();
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>Mes Campagnes</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {profile?.display_name || 'Aventurier'}
              {isAdmin && <span className="badge badge--positive" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>ADMIN</span>}
            </p>
          </div>
          <button className="btn btn--ghost" onClick={signOut}>Deconnexion</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
        ) : campaigns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Aucune campagne</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Cree ou rejoins une campagne pour commencer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map((c) => (
              <button key={c.campaign_id} className="card" style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }} onClick={() => onEnterCampaign(c.campaign_id, c.role)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem' }}>{c.campaign.name}</h3>
                  <span className={c.role === 'gm' ? 'badge badge--npc' : 'badge badge--player'}>{c.role === 'gm' ? 'MJ' : 'Joueur'}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span>{c.member_count} membre{(c.member_count ?? 0) > 1 ? 's' : ''}</span>
                  <span style={{ color: c.campaign.mode === 'combat' ? 'var(--color-error)' : 'var(--color-success)' }}>{c.campaign.mode === 'combat' ? 'En combat' : 'Exploration'}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{c.campaign.invite_code}</span>
                </div>
                {c.character && (
                  <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.5rem', backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-accent)' }}>{c.character.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}> - {c.character.race} {c.character.class} niv.{c.character.level}</span>
                    <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--color-hp)' }}>{c.character.hp_current}/{c.character.hp_max} PV</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setErr(null); }}>Rejoindre</button>
          <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setErr(null); }}>Nouvelle campagne</button>
        </div>

        {showJoin && (
          <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Rejoindre une campagne</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" placeholder="CODE (6 lettres)" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} style={{ flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }} />
              <button className="btn btn--primary" onClick={joinCampaign} disabled={busy || inviteCode.length < 6}>{busy ? '...' : 'OK'}</button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Nouvelle campagne</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" placeholder="Nom de la campagne" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn--primary" onClick={createCampaign} disabled={busy || !newName.trim()}>{busy ? '...' : 'Creer'}</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Tu seras le Maitre du Jeu.</p>
          </div>
        )}

        {err && (
          <div className="animate-fade-in" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid var(--color-error)', borderRadius: 'var(--button-radius)', color: 'var(--color-error)', fontSize: '0.8125rem' }}>{err}</div>
        )}
      </div>
    </div>
  );
}
