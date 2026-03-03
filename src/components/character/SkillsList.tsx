import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Skill {
  id: string;
  character_id: string;
  name: string;
  description: string;
  modifier: string;
  is_hidden: boolean;
  sort_order: number;
}

interface Props {
  characterId: string;
  canEdit: boolean;
}

export default function SkillsList({ characterId, canEdit }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", description: "", modifier: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", description: "", modifier: "" });

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("skills").select("*").eq("character_id", characterId).order("sort_order");
    if (data) setSkills(data as Skill[]);
  }, [characterId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase.channel("skills-" + characterId)
      .on("postgres_changes", { event: "*", schema: "public", table: "skills", filter: "character_id=eq." + characterId }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, fetch]);

  async function addSkill() {
    if (!newSkill.name.trim()) return;
    await supabase.from("skills").insert({ character_id: characterId, ...newSkill, sort_order: skills.length });
    setNewSkill({ name: "", description: "", modifier: "" });
    setShowNew(false);
    fetch();
  }

  async function updateSkill(id: string) {
    await supabase.from("skills").update(editData).eq("id", id);
    setEditingId(null);
    fetch();
  }

  async function toggleHidden(skill: Skill) {
    await supabase.from("skills").update({ is_hidden: !skill.is_hidden }).eq("id", skill.id);
    fetch();
  }

  async function deleteSkill(id: string) {
    await supabase.from("skills").delete().eq("id", id);
    setSkills(skills.filter(s => s.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem" }}>Competences</h2>
        {canEdit && <button className="btn btn--ghost" onClick={() => setShowNew(!showNew)} style={{ fontSize: "0.8125rem" }}>{showNew ? "Annuler" : "+ Ajouter"}</button>}
      </div>

      {showNew && (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Nom de la competence" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} autoFocus />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input" placeholder="Modificateur (ex: +5)" value={newSkill.modifier} onChange={e => setNewSkill({ ...newSkill, modifier: e.target.value })} style={{ width: "6rem", fontFamily: "var(--font-mono)" }} />
            <input className="input" placeholder="Description (optionnel)" value={newSkill.description} onChange={e => setNewSkill({ ...newSkill, description: e.target.value })} style={{ flex: 1 }} />
          </div>
          <button className="btn btn--primary" onClick={addSkill} disabled={!newSkill.name.trim()}>Ajouter</button>
        </div>
      )}

      {skills.length === 0 && !showNew ? (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucune competence ajoutee</p>
        </div>
      ) : (
        skills.map(s => (
          <div key={s.id} className="card" style={{ position: "relative" }}>
            {s.is_hidden && <span className="badge badge--hidden" style={{ position: "absolute", top: "0.5rem", right: "0.5rem", fontSize: "0.625rem" }}>Cache</span>}
            {editingId === s.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} autoFocus />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input className="input" value={editData.modifier} onChange={e => setEditData({ ...editData, modifier: e.target.value })} style={{ width: "6rem", fontFamily: "var(--font-mono)" }} />
                  <input className="input" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn--primary" onClick={() => updateSkill(s.id)} style={{ flex: 1 }}>Sauver</button>
                  <button className="btn btn--ghost" onClick={() => setEditingId(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{s.name}</span>
                    {s.modifier && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--color-accent)", backgroundColor: "var(--color-background-alt)", padding: "0.125rem 0.375rem", borderRadius: "var(--button-radius)" }}>{s.modifier}</span>}
                  </div>
                  {canEdit && (
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button className="btn btn--ghost" onClick={() => toggleHidden(s)} style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem" }}>{s.is_hidden ? "Montrer" : "Cacher"}</button>
                      <button className="btn btn--ghost" onClick={() => { setEditingId(s.id); setEditData({ name: s.name, description: s.description, modifier: s.modifier }); }} style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem" }}>Editer</button>
                      <button className="btn btn--ghost" onClick={() => deleteSkill(s.id)} style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem", color: "var(--color-error)" }}>x</button>
                    </div>
                  )}
                </div>
                {s.description && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>{s.description}</p>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
