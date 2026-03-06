import { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../../lib/supabase';
import { GiCrossedSwords, GiHearts, GiShield, GiLeatherBoot, GiCharacter, GiEyeTarget } from 'react-icons/gi';
import { HpBar } from '../ui/HpBar';

interface GmPlayersPanelProps { campaignId: string; gmSeeHidden: boolean; }

interface CharacterData {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  hp_current: number;
  hp_max: number;
  armor_class: number;
  speed: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  user_id: string;
}

interface PlayerData {
  user_id: string;
  display_name: string;
  character?: CharacterData;
}

export default function GmPlayersPanel({ campaignId, gmSeeHidden }: GmPlayersPanelProps) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  // FIX: Single query with joins instead of N+1
  const fetchPlayers = useCallback(async () => {
    // Get all player members with their profiles in one query
    const { data: members } = await supabase
      .from('campaign_members')
      .select('user_id, profiles(display_name)')
      .eq('campaign_id', campaignId)
      .eq('role', 'player');

    if (!members) { 
      setLoading(false); 
      return; 
    }

    const userIds = members.map(m => m.user_id);

    // Get all characters for this campaign's players in one query
    const { data: characters } = await supabase
      .from('characters')
      .select('id, name, class, race, level, hp_current, hp_max, armor_class, speed, str, dex, con, int, wis, cha, user_id')
      .eq('campaign_id', campaignId)
      .in('user_id', userIds);

    // Map characters by user_id for O(1) lookup
    const charByUserId: Record<string, CharacterData> = {};
    for (const char of characters || []) {
      charByUserId[char.user_id] = char;
    }

    // Build result without additional queries
    const result: PlayerData[] = members.map(m => ({
      user_id: m.user_id,
      display_name: (m as any).profiles?.display_name || 'Joueur',
      character: charByUserId[m.user_id],
    }));

    setPlayers(result);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  useEffect(() => {
    const ch = supabase.channel('gm-players-' + campaignId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: 'campaign_id=eq.' + campaignId }, () => fetchPlayers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, fetchPlayers]);

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GiCrossedSwords /> Joueurs ({players.length})
      </h2>
      {players.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Aucun joueur dans la campagne</p>
        </div>
      ) : (
        <div className="card-grid card-grid--2col">
          {players.map(p => (
            <PlayerCard key={p.user_id} player={p} gmSeeHidden={gmSeeHidden} />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized player card component
const PlayerCard = memo<{ player: PlayerData; gmSeeHidden: boolean }>(({ player, gmSeeHidden }) => {
  const { character } = player;
  
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <GiCharacter size={16} /> {player.display_name}
        </span>
        <span className="badge badge--player">{character?.class || '?'}</span>
      </div>
      
      {character ? (
        <>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            {character.name} — {character.race} niv.{character.level}
          </p>
          <div style={{ marginBottom: '0.375rem' }}>
            <HpBar current={character.hp_current} max={character.hp_max} size="lg" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <GiHearts size={12} style={{ color: 'var(--color-hp)' }} /> {character.hp_current}/{character.hp_max}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <GiShield size={12} /> CA {character.armor_class}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <GiLeatherBoot size={12} /> {character.speed}ft
            </span>
          </div>
          
          {gmSeeHidden && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.375rem', 
              backgroundColor: 'var(--color-background-alt)', 
              borderRadius: 'var(--button-radius)', 
              fontSize: '0.6875rem' 
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', color: 'var(--color-accent)' }}>
                <GiEyeTarget size={12} /> Stats
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                <span><GiShield size={10} /> FOR {character.str}</span>
                <span>DEX {character.dex}</span>
                <span>CON {character.con}</span>
                <span>INT {character.int}</span>
                <span>SAG {character.wis}</span>
                <span>CHA {character.cha}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          Pas encore de personnage
        </p>
      )}
    </div>
  );
});
