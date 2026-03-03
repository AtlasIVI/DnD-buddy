import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface Item {
  id: string;
  character_id: string;
  name: string;
  description: string;
  quantity: number;
  is_equipped: boolean;
  is_hidden: boolean;
  sort_order: number;
}

interface Props {
  characterId: string;
  canEdit: boolean;
}

export default function Inventory({ characterId, canEdit }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", quantity: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", description: "", quantity: 1 });

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from("inventory_items").select("*").eq("character_id", characterId).order("is_equipped", { ascending: false }).order("sort_order");
    if (data) setItems(data as Item[]);
  }, [characterId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    const ch = supabase.channel("inv-" + characterId)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items", filter: "character_id=eq." + characterId }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, fetchItems]);

  async function addItem() {
    if (!newItem.name.trim()) return;
    await supabase.from("inventory_items").insert({ character_id: characterId, ...newItem, sort_order: items.length });
    setNewItem({ name: "", description: "", quantity: 1 });
    setShowNew(false);
    fetchItems();
  }

  async function updateItem(id: string) {
    await supabase.from("inventory_items").update(editData).eq("id", id);
    setEditingId(null);
    fetchItems();
  }

  async function toggleEquipped(item: Item) {
    await supabase.from("inventory_items").update({ is_equipped: !item.is_equipped }).eq("id", item.id);
    fetchItems();
  }

  async function toggleHidden(item: Item) {
    await supabase.from("inventory_items").update({ is_hidden: !item.is_hidden }).eq("id", item.id);
    fetchItems();
  }

  async function changeQty(item: Item, delta: number) {
    const newQty = Math.max(0, item.quantity + delta);
    if (newQty === 0) {
      await supabase.from("inventory_items").delete().eq("id", item.id);
    } else {
      await supabase.from("inventory_items").update({ quantity: newQty }).eq("id", item.id);
    }
    fetchItems();
  }

  async function deleteItem(id: string) {
    await supabase.from("inventory_items").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  }

  const equipped = items.filter(i => i.is_equipped);
  const stored = items.filter(i => !i.is_equipped);

  function renderItem(item: Item) {
    if (editingId === item.id) {
      return (
        <div key={item.id} className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} autoFocus />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input" type="number" value={editData.quantity} onChange={e => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })} style={{ width: "4rem", fontFamily: "var(--font-mono)" }} min={1} />
            <input className="input" placeholder="Description" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn--primary" onClick={() => updateItem(item.id)} style={{ flex: 1 }}>Sauver</button>
            <button className="btn btn--ghost" onClick={() => setEditingId(null)}>Annuler</button>
          </div>
        </div>
      );
    }
    return (
      <div key={item.id} className="card" style={{ position: "relative" }}>
        {item.is_hidden && <span className="badge badge--hidden" style={{ position: "absolute", top: "0.5rem", right: "0.5rem", fontSize: "0.625rem" }}>Cache</span>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {item.is_equipped && <span style={{ color: "var(--color-accent)", fontSize: "0.875rem" }}>&#9733;</span>}
            <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{item.name}</span>
            {item.quantity > 1 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>x{item.quantity}</span>}
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
              <button className="btn btn--ghost" onClick={() => changeQty(item, -1)} style={{ padding: "0.125rem 0.375rem", fontSize: "0.875rem", fontFamily: "var(--font-mono)" }}>-</button>
              <button className="btn btn--ghost" onClick={() => changeQty(item, 1)} style={{ padding: "0.125rem 0.375rem", fontSize: "0.875rem", fontFamily: "var(--font-mono)" }}>+</button>
            </div>
          )}
        </div>
        {item.description && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>{item.description}</p>}
        {canEdit && (
          <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem" }}>
            <button className="btn btn--ghost" onClick={() => toggleEquipped(item)} style={{ fontSize: "0.6875rem" }}>{item.is_equipped ? "Ranger" : "Equiper"}</button>
            <button className="btn btn--ghost" onClick={() => toggleHidden(item)} style={{ fontSize: "0.6875rem" }}>{item.is_hidden ? "Montrer" : "Cacher"}</button>
            <button className="btn btn--ghost" onClick={() => { setEditingId(item.id); setEditData({ name: item.name, description: item.description, quantity: item.quantity }); }} style={{ fontSize: "0.6875rem" }}>Editer</button>
            <button className="btn btn--ghost" onClick={() => deleteItem(item.id)} style={{ fontSize: "0.6875rem", color: "var(--color-error)" }}>Suppr.</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem" }}>Inventaire</h2>
        {canEdit && <button className="btn btn--ghost" onClick={() => setShowNew(!showNew)} style={{ fontSize: "0.8125rem" }}>{showNew ? "Annuler" : "+ Ajouter"}</button>}
      </div>

      {showNew && (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Nom de l objet" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} autoFocus />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input" type="number" placeholder="Qte" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} style={{ width: "4rem", fontFamily: "var(--font-mono)" }} min={1} />
            <input className="input" placeholder="Description (optionnel)" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} style={{ flex: 1 }} />
          </div>
          <button className="btn btn--primary" onClick={addItem} disabled={!newItem.name.trim()}>Ajouter</button>
        </div>
      )}

      {items.length === 0 && !showNew ? (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Inventaire vide</p>
        </div>
      ) : (
        <>
          {equipped.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Equipe</p>
              {equipped.map(renderItem)}
            </>
          )}
          {stored.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{equipped.length > 0 ? "Sac" : ""}</p>
              {stored.map(renderItem)}
            </>
          )}
        </>
      )}
    </div>
  );
}
