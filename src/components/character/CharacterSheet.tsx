import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Character {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  xp: number;
  avatar_url: string | null;
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
  notes: string;
}

interface Effect {
  id: string;
  name: string;
  description: string;
  source: string;
  is_positive: boolean;
  created_at: string;
}

interface Props {
  campaignId: string;
  isGM?: boolean;
  targetUserId?: string;
}

const ABILITIES = [
  { key: "str", label: "FOR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "SAG" },
  { key: "cha", label: "CHA" },
] as const;

export default function CharacterSheet({ campaignId, isGM, targetUserId }: Props) {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const [char, setChar] = useState<Character | null>(null);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hpDelta, setHpDelta] = useState("");
  const [showNewEffect, setShowNewEffect] = useState(false);
  const [newEffect, setNewEffect] = useState({ name: "", description: "", source: "", is_positive: true });
  const [flashType, setFlashType] = useState<"damage" | "heal" | null>(null);
  const canEdit = isGM || userId === user?.id;

  const fetchChar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .single();
    if (data) setChar(data as Character);
    setLoading(false);
  }, [campaignId, userId]);

  const fetchEffects = useCallback(async () => {
    if (!char) return;
    const { data } = await supabase
      .from("effects")
      .select("*")
      .eq("character_id", char.id)
      .order("created_at", { ascending: false });
    if (data) setEffects(data as Effect[]);
  }, [char?.id]);

  useEffect(() => { fetchChar(); }, [fetchChar]);
  useEffect(() => { if (char) fetchEffects(); }, [char?.id, fetchEffects]);

  useEffect(() => {
    if (!char) return;
    const channel = supabase.channel("char-" + char.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters", filter: "id=eq." + char.id }, (p: any) => {
        const prev = char.hp_current;
        const next = p.new.hp_current;
        if (next < prev) { setFlashType("damage"); setTimeout(() => setFlashType(null), 500); }
        else if (next > prev) { setFlashType("heal"); setTimeout(() => setFlashType(null), 500); }
        setChar(p.new as Character);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "effects", filter: "character_id=eq." + char.id }, () => { fetchEffects(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [char?.id]);

  async function createCharacter() {
    if (!user) return;
    const { data } = await supabase
      .from("characters")
      .insert({ campaign_id: campaignId, user_id: user.id, name: "Nouveau personnage" })
      .select()
      .single();
    if (data) setChar(data as Character);
    setLoading(false);
  }

  async function updateField(field: string, value: any) {
    if (!char || !canEdit) return;
    await supabase.from("characters").update({ [field]: value } as any).eq("id", char.id);
    setChar({ ...char, [field]: value });
    setEditing(null);
  }

  async function applyHpChange(delta: number) {
    if (!char) return;
    const newHp = Math.max(0, Math.min(char.hp_max, char.hp_current + delta));
    await supabase.from("characters").update({ hp_current: newHp }).eq("id", char.id);
    if (delta < 0) { setFlashType("damage"); } else { setFlashType("heal"); }
    setTimeout(() => setFlashType(null), 500);
    setChar({ ...char, hp_current: newHp });
    setHpDelta("");
  }

  async function addEffect() {
    if (!char || !newEffect.name.trim()) return;
    await supabase.from("effects").insert({ character_id: char.id, ...newEffect });
    setNewEffect({ name: "", description: "", source: "", is_positive: true });
    setShowNewEffect(false);
    fetchEffects();
  }

  async function removeEffect(id: string) {
    await supabase.from("effects").delete().eq("id", id);
    setEffects(effects.filter(e => e.id !== id));
  }

  function startEdit(field: string, currentValue: any) {
    if (!canEdit) return;
    setEditing(field);
    setEditValue(String(currentValue));
  }

  function confirmEdit(field: string, isNumber?: boolean) {
    const val = isNumber ? parseInt(editValue) || 0 : editValue;
    updateField(field, val);
  }

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>;

  if (!char) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>Pas encore de personnage dans cette campagne</p>
        {userId === user?.id && (
          <button className="btn btn--primary" onClick={createCharacter}>Creer mon personnage</button>
        )}
      </div>
    );
  }

  const hpPercent = char.hp_max > 0 ? (char.hp_current / char.hp_max) * 100 : 0;
  const hpColor = hpPercent > 50 ? "var(--color-success)" : hpPercent > 25 ? "var(--color-warning)" : "var(--color-error)";

  return (
    <div className={flashType === "damage" ? "animate-damage" : flashType === "heal" ? "animate-heal" : ""} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Identity */}
      <div className="card card--accent">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {editing === "name" ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && confirmEdit("name")} style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)" }} />
                <button className="btn btn--primary" onClick={() => confirmEdit("name")}>OK</button>
              </div>
            ) : (
              <h2 onClick={() => startEdit("name", char.name)} style={{ cursor: canEdit ? "pointer" : "default", fontSize: "1.5rem" }}>{char.name}</h2>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              {editing === "race" ? (
                <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("race")} onKeyDown={e => e.key === "Enter" && confirmEdit("race")} style={{ width: "8rem", fontSize: "0.875rem" }} placeholder="Race" />
              ) : (
                <span onClick={() => startEdit("race", char.race)} style={{ cursor: canEdit ? "pointer" : "default" }}>{char.race || "Race"}</span>
              )}
              <span style={{ color: "var(--color-text-muted)" }}>|</span>
              {editing === "class" ? (
                <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("class")} onKeyDown={e => e.key === "Enter" && confirmEdit("class")} style={{ width: "8rem", fontSize: "0.875rem" }} placeholder="Classe" />
              ) : (
                <span onClick={() => startEdit("class", char.class)} style={{ cursor: canEdit ? "pointer" : "default" }}>{char.class || "Classe"}</span>
              )}
            </div>
          </div>
          <div className="stat-block" style={{ backgroundColor: "var(--color-background-alt)", borderRadius: "var(--card-radius)", padding: "0.375rem 0.75rem" }}>
            <span className="stat-block__label">Niveau</span>
            {editing === "level" ? (
              <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("level", true)} onKeyDown={e => e.key === "Enter" && confirmEdit("level", true)} style={{ width: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.25rem", padding: "0.125rem" }} />
            ) : (
              <span className="stat-block__value" onClick={() => startEdit("level", char.level)} style={{ cursor: canEdit ? "pointer" : "default", color: "var(--color-accent)" }}>{char.level}</span>
            )}
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>XP</span>
            {editing === "xp" ? (
              <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("xp", true)} onKeyDown={e => e.key === "Enter" && confirmEdit("xp", true)} style={{ width: "5rem", textAlign: "right", fontSize: "0.75rem", padding: "0.125rem 0.375rem" }} />
            ) : (
              <span onClick={() => startEdit("xp", char.xp)} style={{ cursor: canEdit ? "pointer" : "default", fontFamily: "var(--font-mono)", color: "var(--color-xp)" }}>{char.xp}</span>
            )}
          </div>
        </div>
      </div>

      {/* HP + AC + Speed */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Points de Vie</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", color: hpColor }}>
            {char.hp_current} / {editing === "hp_max" ? (
              <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("hp_max", true)} onKeyDown={e => e.key === "Enter" && confirmEdit("hp_max", true)} style={{ width: "3.5rem", display: "inline", textAlign: "center", fontSize: "1.125rem", padding: "0" }} />
            ) : (
              <span onClick={() => startEdit("hp_max", char.hp_max)} style={{ cursor: canEdit ? "pointer" : "default" }}>{char.hp_max}</span>
            )}
          </span>
        </div>
        <div className="hp-bar hp-bar--large">
          <div className="hp-bar__fill" style={{ width: hpPercent + "%", backgroundColor: hpColor, transition: "width 0.5s ease, background-color 0.3s ease" }} />
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center" }}>
            <button className="btn btn--danger" style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }} onClick={() => { const d = parseInt(hpDelta) || 1; applyHpChange(-d); }}>-Degats</button>
            <input className="input" type="number" placeholder="Valeur" value={hpDelta} onChange={e => setHpDelta(e.target.value)} style={{ width: "4.5rem", textAlign: "center", fontFamily: "var(--font-mono)" }} onKeyDown={e => { if (e.key === "Enter") { const d = parseInt(hpDelta) || 1; applyHpChange(-d); } }} />
            <button className="btn" style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", backgroundColor: "var(--color-healing)", color: "#fff" }} onClick={() => { const d = parseInt(hpDelta) || 1; applyHpChange(d); }}>+Soin</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
          <div className="stat-block" style={{ backgroundColor: "var(--color-background-alt)", borderRadius: "var(--card-radius)" }}>
            <span className="stat-block__label">CA</span>
            {editing === "armor_class" ? (
              <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("armor_class", true)} onKeyDown={e => e.key === "Enter" && confirmEdit("armor_class", true)} style={{ width: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.25rem", padding: "0.125rem" }} />
            ) : (
              <span className="stat-block__value" onClick={() => startEdit("armor_class", char.armor_class)} style={{ cursor: canEdit ? "pointer" : "default", color: "var(--color-armor-class)" }}>{char.armor_class}</span>
            )}
          </div>
          <div className="stat-block" style={{ backgroundColor: "var(--color-background-alt)", borderRadius: "var(--card-radius)" }}>
            <span className="stat-block__label">Vitesse</span>
            {editing === "speed" ? (
              <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit("speed", true)} onKeyDown={e => e.key === "Enter" && confirmEdit("speed", true)} style={{ width: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.25rem", padding: "0.125rem" }} />
            ) : (
              <span className="stat-block__value" onClick={() => startEdit("speed", char.speed)} style={{ cursor: canEdit ? "pointer" : "default" }}>{char.speed}</span>
            )}
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="card">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>Caracteristiques</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {ABILITIES.map(({ key, label }) => (
            <div key={key} className="stat-block" style={{ backgroundColor: "var(--color-background-alt)", borderRadius: "var(--card-radius)", border: "1px solid var(--color-border)" }}>
              <span className="stat-block__label">{label}</span>
              {editing === key ? (
                <input className="input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onBlur={() => confirmEdit(key, true)} onKeyDown={e => e.key === "Enter" && confirmEdit(key, true)} style={{ width: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.25rem", padding: "0.125rem" }} />
              ) : (
                <span className="stat-block__value" onClick={() => startEdit(key, (char as any)[key])} style={{ cursor: canEdit ? "pointer" : "default" }}>{(char as any)[key]}</span>
              )}
              <span style={{ fontSize: "0.6875rem", color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                {Math.floor(((char as any)[key] - 10) / 2) >= 0 ? "+" : ""}{Math.floor(((char as any)[key] - 10) / 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Effects */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)" }}>Effets actifs</h3>
          {canEdit && <button className="btn btn--ghost" onClick={() => setShowNewEffect(!showNewEffect)} style={{ fontSize: "0.75rem" }}>{showNewEffect ? "Annuler" : "+ Ajouter"}</button>}
        </div>
        {showNewEffect && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem", padding: "0.75rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)" }}>
            <input className="input" placeholder="Nom de l effet" value={newEffect.name} onChange={e => setNewEffect({ ...newEffect, name: e.target.value })} />
            <input className="input" placeholder="Description (optionnel)" value={newEffect.description} onChange={e => setNewEffect({ ...newEffect, description: e.target.value })} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="input" placeholder="Source" value={newEffect.source} onChange={e => setNewEffect({ ...newEffect, source: e.target.value })} style={{ flex: 1 }} />
              <button className={newEffect.is_positive ? "btn btn--primary" : "btn btn--danger"} style={{ fontSize: "0.75rem", minWidth: "4rem" }} onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}>{newEffect.is_positive ? "Positif" : "Negatif"}</button>
            </div>
            <button className="btn btn--primary" onClick={addEffect} disabled={!newEffect.name.trim()}>Appliquer</button>
          </div>
        )}
        {effects.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucun effet actif</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {effects.map(e => (
              <div key={e.id} className="animate-pop-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)", borderLeft: "3px solid " + (e.is_positive ? "var(--color-success)" : "var(--color-error)") }}>
                <div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{e.name}</span>
                  {e.description && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{e.description}</span>}
                  {e.source && <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>({e.source})</span>}
                </div>
                {canEdit && <button className="btn btn--ghost" onClick={() => removeEffect(e.id)} style={{ fontSize: "0.75rem", color: "var(--color-error)", padding: "0.125rem 0.375rem" }}>x</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {(userId === user?.id) && (
        <div className="card">
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>Notes personnelles</h3>
          <textarea
            className="input"
            rows={4}
            placeholder="Notes privees..."
            value={char.notes}
            onChange={e => setChar({ ...char, notes: e.target.value })}
            onBlur={() => updateField("notes", char.notes)}
            style={{ resize: "vertical", fontFamily: "var(--font-body)", fontSize: "0.8125rem" }}
          />
          <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Visible uniquement par toi</p>
        </div>
      )}
    </div>
  );
}
