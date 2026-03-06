import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CampaignProvider } from "./contexts/CampaignContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import HubPage from "./pages/HubPage";
import CampaignPage from "./pages/CampaignPage";

type AppView = "hub" | "campaign";

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>("hub");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [role, setRole] = useState<"gm" | "player">("player");

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", display: "flex" }}>
        <h1 style={{ color: "var(--color-accent)" }}>DnD Buddy</h1>
      </div>
    );
  }
  
  if (!user) return <Layout showHeader={false}><LoginPage /></Layout>;
  
  if (view === "campaign" && campaignId) {
    return (
      <Layout>
        <CampaignPage campaignId={campaignId} role={role} onBack={() => { setView("hub"); setCampaignId(null); }} />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <HubPage onEnterCampaign={(id: string, r: "gm" | "player") => { setCampaignId(id); setRole(r); setView("campaign"); }} />
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CampaignProvider>
            <AppContent />
          </CampaignProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
