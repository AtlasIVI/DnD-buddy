import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Npc {
  id: string;
  campaign_id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  armor_class: number;
  notes: string;
  is_active: boolean;
  is_visible_to_players: boolean;
}

interface Props {
  campaignId: string;
}

export default function NpcManager({ campaignId }: Props) {
  const { user } = useAuth();
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newNpc, setNewNpc] = useState({ name: "", hp_max: 10, armor_class: 10, notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hpInputs, setHpInputs] = useState<Record<string, string>>({});

  const fetchNpcs = useCallback(async () => {
    const { data } = await supabase.from("npcs").select("*").eq("campaign_id", campaignId).order("is_active", { ascending: false }).order("name");
    if (data) setNpcs(data as Npc[]);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchNpcs(); }, [fetchNpcs]);
  useEffect(() => {
    const ch = supabase.channel("npcs-gm-" + campaignId)
      .on("postgres_changes", { event: "*", schema: "public", table: "npcs", filter: "campaign_id=eq." + campaignId }, () => fetchNpcs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, fetchNpcs]);

  async function addNpc() {
    if (!user || !newNpc.name.trim()) return;
    await supabase.from("npcs").insert({
      campaign_id: campaignId,
      created_by: user.id,
      name: newNpc.name,
      hp_current: newNpc.hp_max,
      hp_max: newNpc.hp_max,
      armor_class: newNpc.armor_class,
      notes: newNpc.notes,
    });
    setNewNpc({ name: "", hp_max: 10, armor_class: 10, notes: "" });
    setShowNew(false);
    fetchNpcs();
  }

  async function toggleActive(npc: Npc) {
    await supabase.from("npcs").update({ is_active: !npc.is_active }).eq("id", npc.id);
    fetchNpcs();
  }

  async function toggleVisible(npc: Npc) {
    await supabase.from("npcs").update({ is_visible_to_players: !npc.is_visible_to_players }).eq("id", npc.id);
    fetchNpcs();
  }

  async function applyHp(npcId: string, delta: number) {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return;
    const newHp = Math.max(0, Math.min(npc.hp_max, npc.hp_current + delta));
    await supabase.from("npcs").update({ hp_current: newHp }).eq("id", npcId);
    setHpInputs(h => ({ ...h, [npcId]: "" }));
    fetchNpcs();
  }

  async function deleteNpc(id: string) {
    await supabase.from("npcs").delete().eq("id", id);
    fetchNpcs();
  }

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>;

  const active = npcs.filter(n => n.is_active);
  const inactive = npcs.filter(n => !n.is_active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem" }}>PNJ Allies</h2>
        <button className="btn btn--ghost" onClick={() => setShowNew(!showNew)} style={{ fontSize: "0.8125rem" }}>{showNew ? "Annuler" : "+ Nouveau"}</button>
      </div>

      {showNew && (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Nom du PNJ" value={newNpc.name} onChange={e => setNewNpc({ ...newNpc, name: e.target.value })} autoFocus />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>PV max</label>
              <input className="input" type="number" value={newNpc.hp_max} onChange={e => setNewNpc({ ...newNpc, hp_max: parseInt(e.target.value) || 10 })} style={{ fontFamily: "var(--font-mono)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>CA</label>
              <input className="input" type="number" value={newNpc.armor_class} onChange={e => setNewNpc({ ...newNpc, armor_class: parseInt(e.target.value) || 10 })} style={{ fontFamily: "var(--font-mono)" }} />
            </div>
          </div>
          <input className="input" placeholder="Notes (prive MJ)" value={newNpc.notes} onChange={e => setNewNpc({ ...newNpc, notes: e.target.value })} />
          <button className="btn btn--primary" onClick={addNpc} disabled={!newNpc.name.trim()}>Creer le PNJ</button>
        </div>
      )}

      {active.length === 0 && inactive.length === 0 && !showNew && (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucun PNJ</p>
        </div>
      )}

      {active.map(npc => {
        const hpPercent = npc.hp_max > 0 ? (npc.hp_current / npc.hp_max) * 100 : 0;
        const hpColor = hpPercent > 50 ? "var(--color-success)" : hpPercent > 25 ? "var(--color-warning)" : "var(--color-error)";
        const hpVal = hpInputs[npc.id] || "";

        return (
          <div key={npc.id} className="card" style={{ borderLeft: "3px solid var(--color-npc-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontWeight: 600 }}>{npc.name}</span>
                <span className="badge badge--npc" style={{ marginLeft: "0.5rem", fontSize: "0.5625rem" }}>PNJ</span>
                {!npc.is_visible_to_players && <span className="badge badge--hidden" style={{ marginLeft: "0.25rem", fontSize: "0.5625rem" }}>Invisible</span>}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)" }}>CA</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{npc.armor_class}</div>
              </div>
            </div>

            {/* HP */}
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>PV</span>
                <span style={{ fontFamily: "var(--font-mono)", color: hpColor }}>{npc.hp_current}/{npc.hp_max}</span>
              </div>
              <div className="hp-bar">
                <div className="hp-bar__fill" style={{ width: hpPercent + "%", backgroundColor: hpColor }} />
              </div>
              <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem", alignItems: "center" }}>
                <button className="btn btn--danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }} onClick={() => applyHp(npc.id, -(parseInt(hpVal) || 1))}>-</button>
                <input className="input" type="number" placeholder="Val" value={hpVal} onChange={e => setHpInputs(h => ({ ...h, [npc.id]: e.target.value }))} style={{ width: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "0.25rem" }} />
                <button className="btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem", backgroundColor: "var(--color-healing)", color: "#fff" }} onClick={() => applyHp(npc.id, parseInt(hpVal) || 1)}>+</button>
              </div>
            </div>

            {/* Notes */}
            {npc.notes && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>{npc.notes}</p>}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn btn--ghost" onClick={() => toggleVisible(npc)} style={{ fontSize: "0.6875rem" }}>{npc.is_visible_to_players ? "Rendre invisible" : "Rendre visible"}</button>
              <button className="btn btn--ghost" onClick={() => toggleActive(npc)} style={{ fontSize: "0.6875rem", color: "var(--color-warning)" }}>Retirer de l equipe</button>
              <button className="btn btn--ghost" onClick={() => deleteNpc(npc.id)} style={{ fontSize: "0.6875rem", color: "var(--color-error)" }}>Supprimer</button>
            </div>
          </div>
        );
      })}

      {inactive.length > 0 && (
        <>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginTop: "0.5rem" }}>Retires ({inactive.length})</p>
          {inactive.map(npc => (
            <div key={npc.id} className="card" style={{ opacity: 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{npc.name}</span>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button className="btn btn--ghost" onClick={() => toggleActive(npc)} style={{ fontSize: "0.6875rem", color: "var(--color-success)" }}>Reintegrer</button>
                  <button className="btn btn--ghost" onClick={() => deleteNpc(npc.id)} style={{ fontSize: "0.6875rem", color: "var(--color-error)" }}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
