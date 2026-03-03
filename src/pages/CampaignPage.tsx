import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import CharacterSheet from "../components/character/CharacterSheet";
import SkillsList from "../components/character/SkillsList";
import Inventory from "../components/character/Inventory";
import TeamView from "../components/team/TeamView";
import GmPlayersPanel from "../components/gm/GmPlayersPanel";
import NpcManager from "../components/gm/NpcManager";

interface CampaignPageProps {
  campaignId: string;
  role: "gm" | "player";
  onBack: () => void;
}

type PlayerTab = "perso" | "skills" | "inventory" | "team" | "combat";
type GmTab = "players" | "npcs" | "combat" | "monsters" | "campaign";

export default function CampaignPage({ campaignId, role, onBack }: CampaignPageProps) {
  const { user } = useAuth();
  const { setMode } = useTheme();
  const [campaignName, setCampaignName] = useState("");
  const [campaignMode, setCampaignMode] = useState<"exploration" | "combat">("exploration");
  const [playerTab, setPlayerTab] = useState<PlayerTab>("perso");
  const [gmTab, setGmTab] = useState<GmTab>("players");
  const [charId, setCharId] = useState<string | null>(null);
  const [gmSeeHidden, setGmSeeHidden] = useState(false);

  useEffect(() => {
    supabase.from("campaigns").select("name, mode, gm_see_hidden").eq("id", campaignId).single().then(({ data }) => {
      if (data) { setCampaignName(data.name); setCampaignMode(data.mode); setMode(data.mode); setGmSeeHidden(data.gm_see_hidden); }
    });
    if (user) {
      supabase.from("characters").select("id").eq("campaign_id", campaignId).eq("user_id", user.id).single().then(({ data }) => {
        if (data) setCharId(data.id);
      });
    }
    const channel = supabase.channel("camp-" + campaignId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: "id=eq." + campaignId }, (payload: any) => {
        setCampaignMode(payload.new.mode);
        setMode(payload.new.mode);
        if (payload.new.name) setCampaignName(payload.new.name);
        if (payload.new.gm_see_hidden !== undefined) setGmSeeHidden(payload.new.gm_see_hidden);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaignId, setMode, user]);

  // Re-fetch charId when on character creation
  useEffect(() => {
    if (!charId && user) {
      const ch = supabase.channel("new-char-" + campaignId)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "characters", filter: "campaign_id=eq." + campaignId }, (p: any) => {
          if (p.new.user_id === user.id) setCharId(p.new.id);
        })
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [charId, campaignId, user]);

  const playerTabs: Array<[PlayerTab, string]> = [["perso", "Perso"], ["skills", "Comp."], ["inventory", "Sac"], ["team", "Equipe"], ["combat", "Combat"]];
  const gmTabs: Array<[GmTab, string]> = [["players", "Joueurs"], ["npcs", "PNJ"], ["combat", "Combat"], ["monsters", "Monstres"], ["campaign", "Config"]];

  function renderPlayerContent() {
    switch (playerTab) {
      case "perso":
        return <CharacterSheet campaignId={campaignId} />;
      case "skills":
        return charId ? <SkillsList characterId={charId} canEdit={true} /> : <p style={{ color: "var(--color-text-muted)" }}>Cree d abord ton personnage dans l onglet Perso</p>;
      case "inventory":
        return charId ? <Inventory characterId={charId} canEdit={true} /> : <p style={{ color: "var(--color-text-muted)" }}>Cree d abord ton personnage dans l onglet Perso</p>;
      case "team":
        return <TeamView campaignId={campaignId} />;
      case "combat":
        return <p style={{ color: "var(--color-text-muted)" }}>Phase 5 : Combat tracker a venir</p>;
      default:
        return null;
    }
  }

  function renderGmContent() {
    switch (gmTab) {
      case "players":
        return <GmPlayersPanel campaignId={campaignId} gmSeeHidden={gmSeeHidden} />;
      case "npcs":
        return <NpcManager campaignId={campaignId} />;
      case "combat":
        return <p style={{ color: "var(--color-text-muted)" }}>Phase 5 : Gestion combat a venir</p>;
      case "monsters":
        return <p style={{ color: "var(--color-text-muted)" }}>Phase 5 : Bibliotheque monstres a venir</p>;
      case "campaign":
        return <CampaignConfig campaignId={campaignId} campaignMode={campaignMode} />;
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
        <button className="btn btn--ghost" onClick={onBack} style={{ padding: "0.25rem 0.5rem", fontSize: "1.125rem" }}>&#8592;</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "1rem", lineHeight: 1.2 }}>{campaignName}</h2>
          <span style={{ fontSize: "0.6875rem", color: campaignMode === "combat" ? "var(--color-error)" : "var(--color-success)" }}>
            {campaignMode === "combat" ? "En combat" : "Exploration"}
          </span>
        </div>
        <span className={role === "gm" ? "badge badge--npc" : "badge badge--player"}>{role === "gm" ? "MJ" : "Joueur"}</span>
      </div>

      <div className="app-content">
        {role === "player" ? renderPlayerContent() : renderGmContent()}
      </div>

      <nav className="bottom-nav">
        {role === "player" ? playerTabs.map(([key, label]) => (
          <button key={key} className={"bottom-nav__item" + (playerTab === key ? " bottom-nav__item--active" : "")} onClick={() => setPlayerTab(key)}>{label}</button>
        )) : gmTabs.map(([key, label]) => (
          <button key={key} className={"bottom-nav__item" + (gmTab === key ? " bottom-nav__item--active" : "")} onClick={() => setGmTab(key)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}

// Campaign config sub-component (GM only)
function CampaignConfig({ campaignId, campaignMode }: { campaignId: string; campaignMode: string }) {
  const [inviteCode, setInviteCode] = useState("");
  const [gmSeeHidden, setGmSeeHidden] = useState(false);

  useEffect(() => {
    supabase.from("campaigns").select("invite_code, gm_see_hidden").eq("id", campaignId).single().then(({ data }) => {
      if (data) { setInviteCode(data.invite_code); setGmSeeHidden(data.gm_see_hidden); }
    });
  }, [campaignId]);

  async function toggleMode() {
    const newMode = campaignMode === "exploration" ? "combat" : "exploration";
    await supabase.from("campaigns").update({ mode: newMode }).eq("id", campaignId);
  }

  async function toggleGmVision() {
    const newVal = !gmSeeHidden;
    await supabase.from("campaigns").update({ gm_see_hidden: newVal }).eq("id", campaignId);
    setGmSeeHidden(newVal);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2 style={{ fontSize: "1.25rem" }}>Configuration</h2>

      <div className="card">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>Code d invitation</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", letterSpacing: "0.2em", color: "var(--color-accent)" }}>{inviteCode}</span>
          <button className="btn btn--ghost" onClick={() => navigator.clipboard.writeText(inviteCode)} style={{ fontSize: "0.75rem" }}>Copier</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>Mode de jeu</h3>
        <button className={campaignMode === "combat" ? "btn btn--danger" : "btn btn--primary"} onClick={toggleMode} style={{ width: "100%" }}>
          {campaignMode === "combat" ? "Passer en Exploration" : "Lancer le Combat"}
        </button>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          Change le mode pour tous les joueurs en temps reel.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>Vision du MJ</h3>
        <button className={gmSeeHidden ? "btn btn--primary" : "btn btn--secondary"} onClick={toggleGmVision} style={{ width: "100%" }}>
          {gmSeeHidden ? "Vision totale activee" : "Vision totale desactivee"}
        </button>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          {gmSeeHidden ? "Tu vois les elements caches des joueurs." : "Tu ne vois que les elements visibles."}
        </p>
      </div>
    </div>
  );
}
