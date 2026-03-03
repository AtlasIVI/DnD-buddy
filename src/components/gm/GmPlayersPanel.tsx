import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface PlayerChar {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp_current: number;
  hp_max: number;
  armor_class: number;
  speed: number;
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
  xp: number;
  notes: string;
  profile?: { display_name: string };
  effects: { id: string; name: string; description: string; is_positive: boolean; source: string }[];
  skills: { id: string; name: string; modifier: string; description: string; is_hidden: boolean }[];
  items: { id: string; name: string; quantity: number; description: string; is_equipped: boolean; is_hidden: boolean }[];
}

interface Props {
  campaignId: string;
  gmSeeHidden: boolean;
}

export default function GmPlayersPanel({ campaignId, gmSeeHidden }: Props) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerChar[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hpInputs, setHpInputs] = useState<Record<string, string>>({});
  const [showEffectForm, setShowEffectForm] = useState<string | null>(null);
  const [newEffect, setNewEffect] = useState({ name: "", description: "", source: "MJ", is_positive: false });
  const [flashMap, setFlashMap] = useState<Record<string, "damage" | "heal">>({});

  const fetchPlayers = useCallback(async () => {
    const { data: chars } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignId);
    if (!chars) { setLoading(false); return; }

    const enriched: PlayerChar[] = [];
    for (const c of chars) {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", c.user_id).single();
      const { data: effects } = await supabase.from("effects").select("id, name, description, is_positive, source").eq("character_id", c.id);
      const { data: skills } = await supabase.from("skills").select("id, name, modifier, description, is_hidden").eq("character_id", c.id).order("sort_order");
      const { data: items } = await supabase.from("inventory_items").select("id, name, quantity, description, is_equipped, is_hidden").eq("character_id", c.id).order("sort_order");

      enriched.push({
        ...c,
        profile: profile || undefined,
        effects: (effects || []) as any,
        skills: (skills || []) as any,
        items: (items || []) as any,
      } as PlayerChar);
    }
    enriched.sort((a, b) => a.name.localeCompare(b.name));
    setPlayers(enriched);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  useEffect(() => {
    const ch = supabase.channel("gm-players-" + campaignId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters", filter: "campaign_id=eq." + campaignId }, (p: any) => {
        setPlayers(prev => prev.map(c => {
          if (c.id === p.new.id) {
            if (p.new.hp_current < c.hp_current) {
              setFlashMap(fm => ({ ...fm, [c.id]: "damage" }));
              setTimeout(() => setFlashMap(fm => { const n = { ...fm }; delete n[c.id]; return n; }), 500);
            } else if (p.new.hp_current > c.hp_current) {
              setFlashMap(fm => ({ ...fm, [c.id]: "heal" }));
              setTimeout(() => setFlashMap(fm => { const n = { ...fm }; delete n[c.id]; return n; }), 500);
            }
            return { ...c, ...p.new };
          }
          return c;
        }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "effects" }, () => fetchPlayers())
      .on("postgres_changes", { event: "*", schema: "public", table: "skills" }, () => fetchPlayers())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => fetchPlayers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, fetchPlayers]);

  async function applyHp(charId: string, delta: number) {
    const p = players.find(c => c.id === charId);
    if (!p) return;
    const newHp = Math.max(0, Math.min(p.hp_max, p.hp_current + delta));
    await supabase.from("characters").update({ hp_current: newHp }).eq("id", charId);
    setHpInputs(h => ({ ...h, [charId]: "" }));
  }

  async function applyHpToAll(delta: number, val: number) {
    for (const p of players) {
      const d = delta > 0 ? val : -val;
      const newHp = Math.max(0, Math.min(p.hp_max, p.hp_current + d));
      await supabase.from("characters").update({ hp_current: newHp }).eq("id", p.id);
    }
  }

  async function addEffect(charId: string) {
    if (!newEffect.name.trim()) return;
    await supabase.from("effects").insert({ character_id: charId, ...newEffect });
    setNewEffect({ name: "", description: "", source: "MJ", is_positive: false });
    setShowEffectForm(null);
    fetchPlayers();
  }

  async function addEffectToAll() {
    if (!newEffect.name.trim()) return;
    for (const p of players) {
      await supabase.from("effects").insert({ character_id: p.id, ...newEffect });
    }
    setNewEffect({ name: "", description: "", source: "MJ", is_positive: false });
    setShowEffectForm(null);
    fetchPlayers();
  }

  async function removeEffect(effectId: string) {
    await supabase.from("effects").delete().eq("id", effectId);
    fetchPlayers();
  }

  async function removeAllEffectsFrom(charId: string) {
    await supabase.from("effects").delete().eq("character_id", charId);
    fetchPlayers();
  }

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem" }}>Joueurs ({players.length})</h2>
        <button className="btn btn--ghost" onClick={() => setShowEffectForm(showEffectForm === "all" ? null : "all")} style={{ fontSize: "0.75rem" }}>
          Effet a tous
        </button>
      </div>

      {/* Bulk effect form */}
      {showEffectForm === "all" && (
        <div className="card animate-fade-in" style={{ borderColor: "var(--color-accent)" }}>
          <h3 style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Appliquer a tous les joueurs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input className="input" placeholder="Nom de l effet" value={newEffect.name} onChange={e => setNewEffect({ ...newEffect, name: e.target.value })} autoFocus />
            <input className="input" placeholder="Description" value={newEffect.description} onChange={e => setNewEffect({ ...newEffect, description: e.target.value })} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="input" placeholder="Source" value={newEffect.source} onChange={e => setNewEffect({ ...newEffect, source: e.target.value })} style={{ flex: 1 }} />
              <button className={newEffect.is_positive ? "btn btn--primary" : "btn btn--danger"} style={{ fontSize: "0.75rem" }} onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}>
                {newEffect.is_positive ? "Positif" : "Negatif"}
              </button>
            </div>
            <button className="btn btn--primary" onClick={addEffectToAll} disabled={!newEffect.name.trim()}>Appliquer a tous</button>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Aucun joueur dans la campagne</p>
        </div>
      ) : players.map(p => {
        const hpPercent = p.hp_max > 0 ? (p.hp_current / p.hp_max) * 100 : 0;
        const hpColor = hpPercent > 50 ? "var(--color-success)" : hpPercent > 25 ? "var(--color-warning)" : "var(--color-error)";
        const expanded = expandedId === p.id;
        const flash = flashMap[p.id];
        const hpVal = hpInputs[p.id] || "";

        return (
          <div key={p.id} className={"card" + (flash === "damage" ? " animate-damage" : flash === "heal" ? " animate-heal" : "")}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : p.id)}>
              <div>
                <span style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{p.name}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                  {p.race} {p.class} niv.{p.level}
                </span>
                {p.profile && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>({p.profile.display_name})</span>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>CA</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{p.armor_class}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>VIT</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{p.speed}</div>
                </div>
              </div>
            </div>

            {/* HP bar + controls */}
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>PV</span>
                <span style={{ fontFamily: "var(--font-mono)", color: hpColor }}>{p.hp_current}/{p.hp_max}</span>
              </div>
              <div className="hp-bar hp-bar--large">
                <div className="hp-bar__fill" style={{ width: hpPercent + "%", backgroundColor: hpColor }} />
              </div>
              <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", alignItems: "center" }}>
                <button className="btn btn--danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => applyHp(p.id, -(parseInt(hpVal) || 1))}>-Deg</button>
                <input className="input" type="number" placeholder="Val" value={hpVal} onChange={e => setHpInputs(h => ({ ...h, [p.id]: e.target.value }))} style={{ width: "3.5rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", padding: "0.25rem" }} />
                <button className="btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: "var(--color-healing)", color: "#fff" }} onClick={() => applyHp(p.id, parseInt(hpVal) || 1)}>+Soin</button>
                <div style={{ flex: 1 }} />
                <button className="btn btn--ghost" style={{ fontSize: "0.6875rem" }} onClick={() => setShowEffectForm(showEffectForm === p.id ? null : p.id)}>+Effet</button>
              </div>
            </div>

            {/* Effects */}
            {p.effects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem", alignItems: "center" }}>
                {p.effects.map(e => (
                  <span key={e.id} onClick={() => removeEffect(e.id)} className={e.is_positive ? "badge badge--positive" : "badge badge--negative"} style={{ fontSize: "0.625rem", cursor: "pointer" }} title="Cliquer pour retirer">
                    {e.name} x
                  </span>
                ))}
                <button className="btn btn--ghost" onClick={() => removeAllEffectsFrom(p.id)} style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.25rem", color: "var(--color-error)" }}>Tout retirer</button>
              </div>
            )}

            {/* Inline effect form */}
            {showEffectForm === p.id && (
              <div className="animate-fade-in" style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <input className="input" placeholder="Nom" value={newEffect.name} onChange={e => setNewEffect({ ...newEffect, name: e.target.value })} autoFocus style={{ fontSize: "0.8125rem" }} />
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <input className="input" placeholder="Desc." value={newEffect.description} onChange={e => setNewEffect({ ...newEffect, description: e.target.value })} style={{ flex: 1, fontSize: "0.8125rem" }} />
                  <button className={newEffect.is_positive ? "btn btn--primary" : "btn btn--danger"} style={{ fontSize: "0.6875rem", padding: "0.25rem 0.375rem" }} onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}>
                    {newEffect.is_positive ? "+" : "-"}
                  </button>
                  <button className="btn btn--primary" style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }} onClick={() => addEffect(p.id)} disabled={!newEffect.name.trim()}>OK</button>
                </div>
              </div>
            )}

            {/* Expanded: full details */}
            {expanded && (
              <div className="animate-fade-in" style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                {/* Abilities */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.375rem", marginBottom: "0.75rem" }}>
                  {[["str","FOR"],["dex","DEX"],["con","CON"],["int","INT"],["wis","SAG"],["cha","CHA"]].map(([key, label]) => (
                    <div key={key} style={{ textAlign: "center", padding: "0.25rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)" }}>
                      <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600 }}>{(p as any)[key]}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--color-accent)" }}>
                        {Math.floor(((p as any)[key] - 10) / 2) >= 0 ? "+" : ""}{Math.floor(((p as any)[key] - 10) / 2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* XP */}
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                  XP: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-xp)" }}>{p.xp}</span>
                </div>

                {/* Skills */}
                {p.skills.length > 0 && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Competences</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {p.skills.map(s => (
                        <span key={s.id} style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)", border: "1px solid var(--color-border)", opacity: s.is_hidden && gmSeeHidden ? 0.6 : 1 }}>
                          {s.name}{s.modifier ? " " + s.modifier : ""}
                          {s.is_hidden && <span style={{ marginLeft: "0.25rem", fontSize: "0.5625rem", color: "var(--color-text-muted)" }}>(cache)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                {p.items.length > 0 && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Inventaire</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      {p.items.map(i => (
                        <div key={i.id} style={{ fontSize: "0.75rem", display: "flex", gap: "0.375rem", alignItems: "center", opacity: i.is_hidden && gmSeeHidden ? 0.6 : 1 }}>
                          {i.is_equipped && <span style={{ color: "var(--color-accent)", fontSize: "0.6875rem" }}>E</span>}
                          <span>{i.name}{i.quantity > 1 ? " x" + i.quantity : ""}</span>
                          {i.is_hidden && <span className="badge badge--hidden" style={{ fontSize: "0.5rem" }}>cache</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes (visible to GM if gm_see_hidden) */}
                {gmSeeHidden && p.notes && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "rgba(201,168,76,0.08)", borderRadius: "var(--button-radius)", border: "1px dashed var(--color-border-accent)" }}>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-accent)", marginBottom: "0.25rem" }}>Notes privees du joueur</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>{p.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
