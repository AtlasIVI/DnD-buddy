import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Tables } from '../types/database';

type CampaignRole = 'gm' | 'player';

interface CampaignContextType {
  campaign: Tables<'campaigns'> | null;
  myRole: CampaignRole | null;
  myCharacter: Tables<'characters'> | null;
  setCampaign: (campaign: Tables<'campaigns'> | null) => void;
  setMyRole: (role: CampaignRole | null) => void;
  setMyCharacter: (character: Tables<'characters'> | null) => void;
  isGM: boolean;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<Tables<'campaigns'> | null>(null);
  const [myRole, setMyRole] = useState<CampaignRole | null>(null);
  const [myCharacter, setMyCharacter] = useState<Tables<'characters'> | null>(null);

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        myRole,
        myCharacter,
        setCampaign,
        setMyRole,
        setMyCharacter,
        isGM: myRole === 'gm',
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('useCampaign must be used within CampaignProvider');
  return context;
}
