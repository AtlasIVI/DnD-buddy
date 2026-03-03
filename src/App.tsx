import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CampaignProvider } from "./contexts/CampaignContext";
import LoginPage from "./pages/LoginPage";
import HubPage from "./pages/HubPage";
import CampaignPage from "./pages/CampaignPage";

type AppView = "hub" | "campaign";

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>("hub");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [role, setRole] = useState<"gm" | "player">("player");

  if (loading) return (<div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><h1 style={{ color: "var(--color-accent)" }}>DnD Buddy</h1></div>);
  if (!user) return <LoginPage />;
  if (view === "campaign" && campaignId) return <CampaignPage campaignId={campaignId} role={role} onBack={() => { setView("hub"); setCampaignId(null); }} />;
  return <HubPage onEnterCampaign={(id: string, r: "gm" | "player") => { setCampaignId(id); setRole(r); setView("campaign"); }} />;
}

export default function App() {
  return (<ThemeProvider><AuthProvider><CampaignProvider><AppContent /></CampaignProvider></AuthProvider></ThemeProvider>);
}
