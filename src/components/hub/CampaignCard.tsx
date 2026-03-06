import { GiBroadsword, GiCompass, GiHearts, GiTrophy, GiDeathSkull } from 'react-icons/gi';

export interface CampaignWithRole {
  campaign_id: string;
  role: 'gm' | 'player';
  campaign: { id: string; name: string; invite_code: string; mode: 'exploration' | 'combat'; created_by: string; status: string };
  character?: { id: string; name: string; class: string; race: string; level: number; hp_current: number; hp_max: number } | null;
  member_count?: number;
}

interface CampaignCardProps {
  campaign: CampaignWithRole;
  onEnter: (id: string, role: 'gm' | 'player') => void;
  ended?: boolean;
}

export default function CampaignCard({ campaign: c, onEnter, ended }: CampaignCardProps) {
  const statusIcon = c.campaign.status === 'victory'
    ? <GiTrophy size={14} style={{ color: 'var(--color-success)' }} />
    : c.campaign.status === 'defeat'
    ? <GiDeathSkull size={14} style={{ color: 'var(--color-error)' }} />
    : null;

  return (
    <button className="card" style={{ cursor: 'pointer', textAlign: 'left', width: '100%', opacity: ended ? 0.65 : 1, transition: 'opacity 0.2s' }} onClick={() => onEnter(c.campaign_id, c.role)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {statusIcon}
          {c.campaign.name}
        </h3>
        <span className={c.role === 'gm' ? 'badge badge--npc' : 'badge badge--player'}>
          {c.role === 'gm' ? 'MJ' : 'Joueur'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
        <span>{c.member_count} membre{(c.member_count ?? 0) > 1 ? 's' : ''}</span>
        {ended ? (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {c.campaign.status === 'victory' ? '🏆 Victoire' : c.campaign.status === 'defeat' ? '💀 Défaite' : 'Terminée'}
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: c.campaign.mode === 'combat' ? 'var(--color-error)' : 'var(--color-success)' }}>
            {c.campaign.mode === 'combat' ? <GiBroadsword size={12} /> : <GiCompass size={12} />}
            {c.campaign.mode === 'combat' ? 'En combat' : 'Exploration'}
          </span>
        )}
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{c.campaign.invite_code}</span>
      </div>
      {c.character && (
        <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.5rem', backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{c.character.name}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{c.character.race} {c.character.class} niv.{c.character.level}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-hp)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GiHearts size={12} /> {c.character.hp_current}/{c.character.hp_max}
          </span>
        </div>
      )}
    </button>
  );
}
