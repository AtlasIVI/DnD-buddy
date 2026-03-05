import { ReactNode } from "react";
import ThemeSwitcher from "../theme/ThemeSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../img/logo.png";

// 1. On définit la structure d'un onglet
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode; // Optionnel : si vous voulez ajouter des icônes plus tard
}

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  // 2. Nouvelles props pour la navigation
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function Layout({ 
  children, 
  showHeader = true, 
  tabs, 
  activeTab, 
  onTabChange 
}: LayoutProps) {
  const { user, signOut } = useAuth();
  
  // On vérifie si on doit afficher la barre de navigation
  const hasNav = tabs && tabs.length > 0;

  return (
    // L'ajout de "app-shell--with-nav" permet au CSS de décaler le contenu sur PC
    <div className={`app-shell ${hasNav ? "app-shell--with-nav" : ""}`}>
      
      {/* === HEADER === */}
      {showHeader && user && (
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 1rem",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          position: "relative", // <-- AJOUTER CECI
          zIndex: 200           // <-- AJOUTER CECI
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src={logo} alt="DnD Buddy Logo" style={{ height: "2rem", width: "auto" }} />
            <h1 style={{ 
              fontFamily: "var(--font-display)", 
              color: "var(--color-accent)",
              fontSize: "1.125rem",
              margin: 0
            }}>
              DnD Buddy
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ThemeSwitcher />
            <button className="btn btn--ghost" onClick={signOut} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
              Déconnexion
            </button>
          </div>
        </header>
      )}

      {/* === CONTENU PRINCIPAL === */}
      <div className="app-content">
        {children}
      </div>

      {/* === BARRE DE NAVIGATION (Bottom sur mobile, Gauche sur PC) === */}
      {hasNav && onTabChange && (
        <nav className="bottom-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={"bottom-nav__item" + (activeTab === tab.id ? " bottom-nav__item--active" : "")}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span style={{ fontSize: "1.25rem", marginBottom: "0.125rem" }}>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}