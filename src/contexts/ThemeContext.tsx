import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppTheme } from '../themes/theme.types';
import { getTheme, defaultThemeName } from '../themes/theme-registry';
import { applyThemeToElement } from '../themes/theme-css';

type CampaignMode = 'exploration' | 'combat';

interface ThemeContextType {
  theme: AppTheme;
  themeName: string;
  mode: CampaignMode;
  setTheme: (name: string) => void;
  setMode: (mode: CampaignMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState(defaultThemeName);
  const [mode, setMode] = useState<CampaignMode>('exploration');
  const theme = getTheme(themeName);

  useEffect(() => {
    applyThemeToElement(document.documentElement, theme, mode);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, mode, setTheme: setThemeName, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
