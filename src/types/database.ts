export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campaign_members: {
        Row: { campaign_id: string; id: string; joined_at: string; role: Database["public"]["Enums"]["campaign_role"]; user_id: string }
        Insert: { campaign_id: string; id?: string; joined_at?: string; role?: Database["public"]["Enums"]["campaign_role"]; user_id: string }
        Update: { campaign_id?: string; id?: string; joined_at?: string; role?: Database["public"]["Enums"]["campaign_role"]; user_id?: string }
        Relationships: [{ foreignKeyName: "campaign_members_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] }, { foreignKeyName: "campaign_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      campaigns: {
        Row: { active_combat_id: string | null; created_at: string; created_by: string; ended_at: string | null; gm_see_hidden: boolean; id: string; invite_code: string; mode: Database["public"]["Enums"]["campaign_mode"]; name: string; status: string; updated_at: string }
        Insert: { active_combat_id?: string | null; created_at?: string; created_by: string; ended_at?: string | null; gm_see_hidden?: boolean; id?: string; invite_code?: string; mode?: Database["public"]["Enums"]["campaign_mode"]; name: string; status?: string; updated_at?: string }
        Update: { active_combat_id?: string | null; created_at?: string; created_by?: string; ended_at?: string | null; gm_see_hidden?: boolean; id?: string; invite_code?: string; mode?: Database["public"]["Enums"]["campaign_mode"]; name?: string; status?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "campaigns_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "fk_campaigns_active_combat"; columns: ["active_combat_id"]; isOneToOne: false; referencedRelation: "combats"; referencedColumns: ["id"] }]
      }
      characters: {
        Row: { armor_class: number; avatar_url: string | null; campaign_id: string; cha: number; class: string; con: number; created_at: string; dex: number; hp_current: number; hp_max: number; id: string; int: number; level: number; name: string; notes: string; race: string; speed: number; str: number; updated_at: string; user_id: string; wis: number; xp: number }
        Insert: { armor_class?: number; avatar_url?: string | null; campaign_id: string; cha?: number; class?: string; con?: number; created_at?: string; dex?: number; hp_current?: number; hp_max?: number; id?: string; int?: number; level?: number; name?: string; notes?: string; race?: string; speed?: number; str?: number; updated_at?: string; user_id: string; wis?: number; xp?: number }
        Update: { armor_class?: number; avatar_url?: string | null; campaign_id?: string; cha?: number; class?: string; con?: number; created_at?: string; dex?: number; hp_current?: number; hp_max?: number; id?: string; int?: number; level?: number; name?: string; notes?: string; race?: string; speed?: number; str?: number; updated_at?: string; user_id?: string; wis?: number; xp?: number }
        Relationships: [{ foreignKeyName: "characters_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] }, { foreignKeyName: "characters_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      combat_participants: {
        Row: { armor_class: number; character_id: string | null; combat_id: string; created_at: string; display_name: string; hp_current: number; hp_max: number; id: string; initiative: number; is_active: boolean; monster_id: string | null; npc_id: string | null; participant_type: Database["public"]["Enums"]["participant_type"] }
        Insert: { armor_class?: number; character_id?: string | null; combat_id: string; created_at?: string; display_name: string; hp_current?: number; hp_max?: number; id?: string; initiative?: number; is_active?: boolean; monster_id?: string | null; npc_id?: string | null; participant_type: Database["public"]["Enums"]["participant_type"] }
        Update: { armor_class?: number; character_id?: string | null; combat_id?: string; created_at?: string; display_name?: string; hp_current?: number; hp_max?: number; id?: string; initiative?: number; is_active?: boolean; monster_id?: string | null; npc_id?: string | null; participant_type?: Database["public"]["Enums"]["participant_type"] }
        Relationships: [{ foreignKeyName: "combat_participants_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }, { foreignKeyName: "combat_participants_combat_id_fkey"; columns: ["combat_id"]; isOneToOne: false; referencedRelation: "combats"; referencedColumns: ["id"] }, { foreignKeyName: "combat_participants_monster_id_fkey"; columns: ["monster_id"]; isOneToOne: false; referencedRelation: "monster_library"; referencedColumns: ["id"] }, { foreignKeyName: "combat_participants_npc_id_fkey"; columns: ["npc_id"]; isOneToOne: false; referencedRelation: "npcs"; referencedColumns: ["id"] }]
      }
      combats: {
        Row: { campaign_id: string; created_at: string; current_turn_index: number | null; ended_at: string | null; id: string; name: string; status: Database["public"]["Enums"]["combat_status"] }
        Insert: { campaign_id: string; created_at?: string; current_turn_index?: number | null; ended_at?: string | null; id?: string; name?: string; status?: Database["public"]["Enums"]["combat_status"] }
        Update: { campaign_id?: string; created_at?: string; current_turn_index?: number | null; ended_at?: string | null; id?: string; name?: string; status?: Database["public"]["Enums"]["combat_status"] }
        Relationships: [{ foreignKeyName: "combats_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] }]
      }
      effects: {
        Row: { character_id: string; created_at: string; description: string; id: string; is_positive: boolean; name: string; source: string }
        Insert: { character_id: string; created_at?: string; description?: string; id?: string; is_positive?: boolean; name: string; source?: string }
        Update: { character_id?: string; created_at?: string; description?: string; id?: string; is_positive?: boolean; name?: string; source?: string }
        Relationships: [{ foreignKeyName: "effects_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }]
      }
      inventory_items: {
        Row: { character_id: string; created_at: string; description: string; id: string; is_equipped: boolean; is_hidden: boolean; name: string; quantity: number; sort_order: number }
        Insert: { character_id: string; created_at?: string; description?: string; id?: string; is_equipped?: boolean; is_hidden?: boolean; name: string; quantity?: number; sort_order?: number }
        Update: { character_id?: string; created_at?: string; description?: string; id?: string; is_equipped?: boolean; is_hidden?: boolean; name?: string; quantity?: number; sort_order?: number }
        Relationships: [{ foreignKeyName: "inventory_items_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }]
      }
      monster_library: {
        Row: { armor_class: number; created_at: string; created_by: string; hp_default: number; id: string; is_favorite: boolean; last_used_at: string | null; name: string; notes: string }
        Insert: { armor_class?: number; created_at?: string; created_by: string; hp_default?: number; id?: string; is_favorite?: boolean; last_used_at?: string | null; name: string; notes?: string }
        Update: { armor_class?: number; created_at?: string; created_by?: string; hp_default?: number; id?: string; is_favorite?: boolean; last_used_at?: string | null; name?: string; notes?: string }
        Relationships: [{ foreignKeyName: "monster_library_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      npcs: {
        Row: { armor_class: number; avatar_url: string | null; campaign_id: string; created_at: string; created_by: string; hp_current: number; hp_max: number; id: string; is_active: boolean; is_visible_to_players: boolean; name: string; notes: string; updated_at: string }
        Insert: { armor_class?: number; avatar_url?: string | null; campaign_id: string; created_at?: string; created_by: string; hp_current?: number; hp_max?: number; id?: string; is_active?: boolean; is_visible_to_players?: boolean; name: string; notes?: string; updated_at?: string }
        Update: { armor_class?: number; avatar_url?: string | null; campaign_id?: string; created_at?: string; created_by?: string; hp_current?: number; hp_max?: number; id?: string; is_active?: boolean; is_visible_to_players?: boolean; name?: string; notes?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "npcs_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] }, { foreignKeyName: "npcs_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; display_name: string; id: string; is_admin: boolean; updated_at: string }
        Insert: { avatar_url?: string | null; created_at?: string; display_name?: string; id: string; is_admin?: boolean; updated_at?: string }
        Update: { avatar_url?: string | null; created_at?: string; display_name?: string; id?: string; is_admin?: boolean; updated_at?: string }
        Relationships: []
      }
      skills: {
        Row: {
          id: string; character_id: string; name: string; description: string
          modifier: string; is_hidden: boolean; sort_order: number; created_at: string
          proficiency: Database["public"]["Enums"]["skill_proficiency"]
          ability: Database["public"]["Enums"]["skill_ability"] | null
          category: Database["public"]["Enums"]["skill_category"]
          tags: string[]
          is_active: boolean
          action_cost: Database["public"]["Enums"]["skill_action_cost"] | null
          uses_max: number | null; uses_remaining: number | null
          rest_reset: Database["public"]["Enums"]["rest_type"] | null
          stat_bonus_ability: Database["public"]["Enums"]["skill_ability"] | null
          stat_bonus_value: number | null
        }
        Insert: {
          id?: string; character_id: string; name: string; description?: string
          modifier?: string; is_hidden?: boolean; sort_order?: number; created_at?: string
          proficiency?: Database["public"]["Enums"]["skill_proficiency"]
          ability?: Database["public"]["Enums"]["skill_ability"] | null
          category?: Database["public"]["Enums"]["skill_category"]
          tags?: string[]
          is_active?: boolean
          action_cost?: Database["public"]["Enums"]["skill_action_cost"] | null
          uses_max?: number | null; uses_remaining?: number | null
          rest_reset?: Database["public"]["Enums"]["rest_type"] | null
          stat_bonus_ability?: Database["public"]["Enums"]["skill_ability"] | null
          stat_bonus_value?: number | null
        }
        Update: {
          id?: string; character_id?: string; name?: string; description?: string
          modifier?: string; is_hidden?: boolean; sort_order?: number; created_at?: string
          proficiency?: Database["public"]["Enums"]["skill_proficiency"]
          ability?: Database["public"]["Enums"]["skill_ability"] | null
          category?: Database["public"]["Enums"]["skill_category"]
          tags?: string[]
          is_active?: boolean
          action_cost?: Database["public"]["Enums"]["skill_action_cost"] | null
          uses_max?: number | null; uses_remaining?: number | null
          rest_reset?: Database["public"]["Enums"]["rest_type"] | null
          stat_bonus_ability?: Database["public"]["Enums"]["skill_ability"] | null
          stat_bonus_value?: number | null
        }
        Relationships: [{ foreignKeyName: "skills_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }]
      }
      spell_slots: {
        Row: { character_id: string; created_at: string; id: string; slot_level: number; slots_total: number; slots_used: number; updated_at: string }
        Insert: { character_id: string; created_at?: string; id?: string; slot_level: number; slots_total?: number; slots_used?: number; updated_at?: string }
        Update: { character_id?: string; created_at?: string; id?: string; slot_level?: number; slots_total?: number; slots_used?: number; updated_at?: string }
        Relationships: [{ foreignKeyName: "spell_slots_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }]
      }
      spells: {
        Row: { casting_time: string; character_id: string; concentration: boolean; created_at: string; damage_dice: string; description: string; duration: string; id: string; is_hidden: boolean; is_prepared: boolean; level: number; name: string; range: string; sort_order: number }
        Insert: { casting_time?: string; character_id: string; concentration?: boolean; created_at?: string; damage_dice?: string; description?: string; duration?: string; id?: string; is_hidden?: boolean; is_prepared?: boolean; level?: number; name?: string; range?: string; sort_order?: number }
        Update: { casting_time?: string; character_id?: string; concentration?: boolean; created_at?: string; damage_dice?: string; description?: string; duration?: string; id?: string; is_hidden?: boolean; is_prepared?: boolean; level?: number; name?: string; range?: string; sort_order?: number }
        Relationships: [{ foreignKeyName: "spells_character_id_fkey"; columns: ["character_id"]; isOneToOne: false; referencedRelation: "characters"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      add_monsters_to_combat: { Args: { p_combat_id: string; p_count?: number; p_monster_id: string }; Returns: undefined }
      end_combat: { Args: { p_combat_id: string }; Returns: undefined }
      generate_unique_invite_code: { Args: never; Returns: string }
      get_campaign_from_character: { Args: { p_character_id: string }; Returns: string }
      gm_can_see_hidden: { Args: { p_campaign_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_campaign_gm: { Args: { p_campaign_id: string }; Returns: boolean }
      is_campaign_member: { Args: { p_campaign_id: string }; Returns: boolean }
      start_combat: { Args: { p_campaign_id: string; p_name?: string }; Returns: string }
    }
    Enums: {
      campaign_mode: "exploration" | "combat"
      campaign_role: "gm" | "player"
      combat_status: "active" | "ended"
      participant_type: "player" | "monster" | "npc"
      skill_proficiency: "none" | "proficient" | "expertise"
      skill_ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"
      skill_category: "combat" | "social" | "exploration" | "connaissance" | "classe" | "autre"
      skill_action_cost: "action" | "bonus_action" | "reaction" | "free"
      rest_type: "short" | "long"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never