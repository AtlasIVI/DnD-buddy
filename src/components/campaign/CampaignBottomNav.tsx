import { GiSwordman, GiBroadsword, GiScrollUnfurled, GiBackpack, GiCharacter, GiCrestedHelmet, GiMagicSwirl, GiCrossedSwords } from 'react-icons/gi';
import type { GmTab, PlayerTab } from './CampaignViews';
import type { ViewMode } from '../ui/ViewToggle';

interface CampaignBottomNavProps {
  viewMode: ViewMode;
  gmTab: GmTab;
  playerTab: PlayerTab;
  inCombat: boolean;
  playerInCombat: boolean;
  onGmTabChange: (tab: GmTab) => void;
  onPlayerTabChange: (tab: PlayerTab) => void;
}

export default function CampaignBottomNav({
  viewMode,
  gmTab,
  playerTab,
  inCombat,
  playerInCombat,
  onGmTabChange,
  onPlayerTabChange,
}: CampaignBottomNavProps) {
  return (
    <nav className="bottom-nav">
      {viewMode === 'gm' ? (
        <>
          <NavItem icon={GiSwordman} label="Joueurs" active={gmTab === 'players'} onClick={() => onGmTabChange('players')} />
          <NavItem icon={GiBroadsword} label="Combat" active={gmTab === 'combat'} onClick={() => onGmTabChange('combat')} />
          <NavItem icon={GiCrestedHelmet} label="PNJs" active={gmTab === 'npcs'} onClick={() => onGmTabChange('npcs')} />
          <NavItem icon={GiScrollUnfurled} label="Monstres" active={gmTab === 'monsters'} onClick={() => onGmTabChange('monsters')} />
          <NavItem icon={GiCharacter} label="Config" active={gmTab === 'config'} onClick={() => onGmTabChange('config')} />
        </>
      ) : (
        inCombat && playerInCombat ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-error)', fontWeight: 600 }}>
            <GiCrossedSwords size={14} /> En combat — toutes vos actions sont accessibles sur la fiche
          </div>
        ) : (
          <>
            <NavItem icon={GiCharacter} label="Perso" active={playerTab === 'sheet'} onClick={() => onPlayerTabChange('sheet')} />
            <NavItem icon={GiMagicSwirl} label="Magie" active={playerTab === 'spells'} onClick={() => onPlayerTabChange('spells')} />
            <NavItem icon={GiScrollUnfurled} label="Compét." active={playerTab === 'skills'} onClick={() => onPlayerTabChange('skills')} />
            <NavItem icon={GiBackpack} label="Inventaire" active={playerTab === 'inventory'} onClick={() => onPlayerTabChange('inventory')} />
          </>
        )
      )}
    </nav>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`bottom-nav__item${active ? ' bottom-nav__item--active' : ''}`} onClick={onClick}>
      <Icon size={active ? 22 : 20} />
      {label}
    </button>
  );
}
