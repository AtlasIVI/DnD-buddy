import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface TeamCharacter {
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
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  avatar_url: string | null;
  profile?: { display_name: string; avatar_url: string | null };
  effects: TeamEffect[];
  equipment: TeamItem[];
  skills: TeamSkill[];
}

interface TeamEffect {
  id: string;
  name: string;
  description: string;
  is_positive: boolean;
  source: string;
}

interface TeamItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  is_equipped: boolean;
}

interface TeamSkill {
  id: string;
  name: string;
  modifier: string;
  description: string;
}

interface TeamNpc {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  armor_class: number;
  avatar_url: string | null;
}

interface Props {
  campaignId: string;
}

export default function TeamView({ campaignId }: Props) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<TeamCharacter[]>([]);
  const [npcs, setNpcs] = useState<TeamNpc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Record<string, "damage" | "heal">>({});

  const fetchTeam = useCallback(async () => {
    if (!user) return;

    // Fetch all characters in this campaign except mine
    const { data: chars } = await supabase
      .from("characters")
      .select("id, user_id, name, race, class, level, hp_current, hp_max, armor_class, speed, str, dex, con, int, wis, cha, avatar_url")
      .eq("campaign_id", campaignId);

    if (!chars) { setLoading(false); return; }

    const enriched: TeamCharacter[] = [];
    for (const c of chars) {
      // Get profile
      const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", c.user_id).single();

      // Get visible effects
      const { data: effects } = await supabase.from("effects").select("id, name, description, is_positive, source").eq("character_id", c.id);

      // Get visible equipped items (non-hidden)
      const { data: items } = await supabase.from("inventory_items").select("id, name, quantity, description, is_equipped").eq("character_id", c.id).eq("is_hidden", false);

      // Get visible skills (non-hidden)
      const { data: skills } = await supabase.from("skills").select("id, name, modifier, description").eq("character_id", c.id).eq("is_hidden", false);

      enriched.push({
        ...c,
        profile: profile || undefined,
        effects: (effects || []) as TeamEffect[],
        equipment: ((items || []) as TeamItem[]).filter(i => i.is_equipped),
        skills: (skills || []) as TeamSkill[],
      } as TeamCharacter);
    }

    // Sort: my character first, then alphabetical
    enriched.sort((a, b) => {
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;
      return a.name.localeCompare(b.name);
    });

    setCharacters(enriched);

    // Fetch active visible NPCs
    const { data: npcData } = await supabase
      .from("npcs")
      .select("id, name, hp_current, hp_max, armor_class, avatar_url")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .eq("is_visible_to_players", true);

    setNpcs((npcData || []) as TeamNpc[]);
    setLoading(false);
  }, [campaignId, user]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase.channel("team-" + campaignId)
      .on("postgres_changes", { event: "*", schema: "public", table: "characters", filter: "campaign_id=eq." + campaignId }, (payload: any) => {
        if (payload.eventType === "UPDATE") {
          setCharacters(prev => {
            return prev.map(c => {
              if (c.id === payload.new.id) {
                // Flash on HP change
                if (payload.new.hp_current < c.hp_current) {
                  setFlashMap(fm => ({ ...fm, [c.id]: "damage" }));
                  setTimeout(() => setFlashMap(fm => { const n = { ...fm }; delete n[c.id]; return n; }), 500);
                } else if (payload.new.hp_current > c.hp_current) {
                  setFlashMap(fm => ({ ...fm, [c.id]: "heal" }));
                  setTimeout(() => setFlashMap(fm => { const n = { ...fm }; delete n[c.id]; return n; }), 500);
                }
                return { ...c, ...payload.new };
              }
              return c;
            });
          });
        } else {
          fetchTeam();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "effects" }, () => fetchTeam())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => fetchTeam())
      .on("postgres_changes", { event: "*", schema: "public", table: "skills" }, () => fetchTeam())
      .on("postgres_changes", { event: "*", schema: "public", table: "npcs", filter: "campaign_id=eq." + campaignId }, () => fetchTeam())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaignId, fetchTeam]);

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Chargement de l equipe...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h2 style={{ fontSize: "1.25rem" }}>Equipe</h2>

      {characters.length === 0 && npcs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Personne dans l equipe pour le moment</p>
        </div>
      ) : (
        <>
          {characters.map(c => {
            const isMe = c.user_id === user?.id;
            const hpPercent = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 0;
            const hpColor = hpPercent > 50 ? "var(--color-success)" : hpPercent > 25 ? "var(--color-warning)" : "var(--color-error)";
            const expanded = expandedId === c.id;
            const flash = flashMap[c.id];

            return (
              <div
                key={c.id}
                className={"card" + (isMe ? " card--accent" : "") + (flash === "damage" ? " animate-damage" : flash === "heal" ? " animate-heal" : "")}
                style={{ cursor: "pointer" }}
                onClick={() => setExpandedId(expanded ? null : c.id)}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{c.name}</span>
                      {isMe && <span className="badge badge--player" style={{ fontSize: "0.5625rem" }}>Toi</span>}
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {c.race} {c.class} niv.{c.level}
                    </span>
                    {c.profile && (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                        ({c.profile.display_name})
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div className="stat-block" style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)" }}>
                      <span className="stat-block__label">CA</span>
                      <span className="stat-block__value" style={{ fontSize: "1rem", color: "var(--color-armor-class)" }}>{c.armor_class}</span>
                    </div>
                  </div>
                </div>

                {/* HP bar */}
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>PV</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: hpColor }}>{c.hp_current}/{c.hp_max}</span>
                  </div>
                  <div className="hp-bar">
                    <div className="hp-bar__fill" style={{ width: hpPercent + "%", backgroundColor: hpColor }} />
                  </div>
                </div>

                {/* Active effects */}
                {c.effects.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem" }}>
                    {c.effects.map(e => (
                      <span key={e.id} className={e.is_positive ? "badge badge--positive" : "badge badge--negative"} style={{ fontSize: "0.625rem" }}>
                        {e.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded details */}
                {expanded && (
                  <div className="animate-fade-in" style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                    {/* Ability scores */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.375rem", marginBottom: "0.75rem" }}>
                      {[["str","FOR"],["dex","DEX"],["con","CON"],["int","INT"],["wis","SAG"],["cha","CHA"]].map(([key, label]) => (
                        <div key={key} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>{label}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9375rem", fontWeight: 600 }}>{(c as any)[key]}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--color-accent)" }}>
                            {Math.floor(((c as any)[key] - 10) / 2) >= 0 ? "+" : ""}{Math.floor(((c as any)[key] - 10) / 2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Visible skills */}
                    {c.skills.length > 0 && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Competences</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {c.skills.map(s => (
                            <span key={s.id} style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)", border: "1px solid var(--color-border)" }}>
                              {s.name}{s.modifier ? " " + s.modifier : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visible equipped items */}
                    {c.equipment.length > 0 && (
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Equipement</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {c.equipment.map(i => (
                            <span key={i.id} style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)", border: "1px solid var(--color-border)", color: "var(--color-accent)" }}>
                              {i.name}{i.quantity > 1 ? " x" + i.quantity : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Effect details */}
                    {c.effects.length > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Detail des effets</p>
                        {c.effects.map(e => (
                          <div key={e.id} style={{ fontSize: "0.75rem", padding: "0.25rem 0", borderBottom: "1px solid var(--color-border)" }}>
                            <span style={{ fontWeight: 600, color: e.is_positive ? "var(--color-success)" : "var(--color-error)" }}>{e.name}</span>
                            {e.description && <span style={{ color: "var(--color-text-secondary)", marginLeft: "0.375rem" }}>{e.description}</span>}
                            {e.source && <span style={{ color: "var(--color-text-muted)", marginLeft: "0.375rem", fontSize: "0.6875rem" }}>({e.source})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* NPCs */}
          {npcs.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", color: "var(--color-npc-color)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.5rem" }}>Allies PNJ</p>
              {npcs.map(npc => {
                const hpPercent = npc.hp_max > 0 ? (npc.hp_current / npc.hp_max) * 100 : 0;
                const hpColor = hpPercent > 50 ? "var(--color-success)" : hpPercent > 25 ? "var(--color-warning)" : "var(--color-error)";
                return (
                  <div key={npc.id} className="card" style={{ borderLeft: "3px solid var(--color-npc-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600 }}>{npc.name}</span>
                        <span className="badge badge--npc" style={{ fontSize: "0.5625rem" }}>PNJ</span>
                      </div>
                      <div className="stat-block" style={{ padding: "0.125rem 0.375rem", backgroundColor: "var(--color-background-alt)", borderRadius: "var(--button-radius)" }}>
                        <span className="stat-block__label" style={{ fontSize: "0.5625rem" }}>CA</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>{npc.armor_class}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: "0.375rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", marginBottom: "0.125rem" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>PV</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: hpColor }}>{npc.hp_current}/{npc.hp_max}</span>
                      </div>
                      <div className="hp-bar">
                        <div className="hp-bar__fill" style={{ width: hpPercent + "%", backgroundColor: hpColor }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
