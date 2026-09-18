import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { Burger, Extra } from "@/lib/types";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";

// R17 (design.md): meatExtra/friesExtra are matched by exact name because
// every meat/fries price adjustment in the calculator and the transformer
// silently becomes 0 when these lookups miss. A rename or an `is_available`
// flip on either row must fail loudly at catalog build time instead of
// silently undercharging every combo/burger meat or fries adjustment.
const MEAT_EXTRA_NAME = "Medallón";
const FRIES_EXTRA_NAME = "Papas fritas chicas";

export interface Catalog {
  burgers: Burger[]; // is_available = true, ordered by name
  extras: Extra[]; // is_available = true, ordered by category
  combos: ComboWithSlots[]; // is_available = true; slot rules parsed
  meatExtra: Extra; // name === "Medallón", is_available IGNORED (R17)
  friesExtra: Extra; // name === "Papas fritas chicas", is_available IGNORED (R17)
  deliveryFeeArs: number; // display only
}

interface ComboSlotRuleRow {
  id: number;
  rule_type: string | null;
  rule_value: string | null;
}

interface ComboSlotRow {
  id: string;
  combo_id: string;
  slot_type: string;
  quantity: number;
  required: boolean;
  default_meat_quantity: number | null;
  created_at: string;
  combo_slots_rules: ComboSlotRuleRow[] | null;
}

interface ComboRow {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
  combo_slots: ComboSlotRow[] | null;
}

async function fetchBurgers(supabase: SupabaseClient): Promise<Burger[]> {
  const { data, error } = await supabase
    .from("burgers")
    .select("*")
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Burger[];
}

async function fetchExtras(supabase: SupabaseClient): Promise<Extra[]> {
  const { data, error } = await supabase
    .from("extras")
    .select("*")
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Extra[];
}

function parseComboSlot(slot: ComboSlotRow): ComboSlotWithRules {
  const rules = slot.combo_slots_rules ?? [];

  const minRule = rules.find((r) => r.rule_type === "min_quantity");
  const maxRule = rules.find((r) => r.rule_type === "max_quantity");
  const allowedMeatRule = rules.find((r) => r.rule_type === "allowed_meat_count");
  const noFriesRule = rules.find((r) => r.rule_type === "no_fries");

  return {
    id: slot.id,
    combo_id: slot.combo_id,
    slot_type: slot.slot_type,
    quantity: slot.quantity,
    required: slot.required,
    default_meat_quantity: slot.default_meat_quantity,
    created_at: slot.created_at,
    rules: {
      min_quantity: minRule ? Number(minRule.rule_value) : 0,
      // Mirrors use-combos.ts:84-86: an unset max falls back to the slot's
      // own quantity, not to Infinity or 0.
      max_quantity: maxRule ? Number(maxRule.rule_value) : slot.quantity,
      allowed_meat_count: allowedMeatRule
        ? JSON.parse(allowedMeatRule.rule_value as string)
        : undefined,
      no_fries: noFriesRule?.rule_value === "true" ? true : undefined,
    },
  };
}

function parseComboRow(row: ComboRow): ComboWithSlots {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    is_available: row.is_available,
    created_at: row.created_at,
    slots: (row.combo_slots ?? []).map(parseComboSlot),
  };
}

async function fetchCombos(supabase: SupabaseClient): Promise<ComboWithSlots[]> {
  const { data, error } = await supabase
    .from("combos")
    .select(
      `
      id,
      name,
      price,
      description,
      is_available,
      created_at,
      combo_slots (
        id,
        combo_id,
        slot_type,
        quantity,
        required,
        default_meat_quantity,
        created_at,
        combo_slots_rules (
          id,
          rule_type,
          rule_value
        )
      )
    `,
    )
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as ComboRow[]).map(parseComboRow);
}

// R17: fetched via a lookup that deliberately does NOT filter by
// is_available -- unlike fetchExtras() above, which is the storefront list.
// Combo meat/fries scaling must keep working even if the shop temporarily
// marks "Medallón" or "Papas fritas chicas" unavailable for direct sale.
async function fetchRequiredExtraByName(
  supabase: SupabaseClient,
  name: string,
  integrityNote: string,
): Promise<Extra> {
  const { data, error } = await supabase
    .from("extras")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      `Catalog integrity: required extra '${name}' not found — ${integrityNote}`,
    );
  }
  return data as Extra;
}

export async function getCatalog(): Promise<Catalog> {
  const supabase = createAdminClient();

  const [burgers, extras, combos, meatExtra, friesExtra] = await Promise.all([
    fetchBurgers(supabase),
    fetchExtras(supabase),
    fetchCombos(supabase),
    fetchRequiredExtraByName(
      supabase,
      MEAT_EXTRA_NAME,
      "combo meat scaling will break",
    ),
    fetchRequiredExtraByName(
      supabase,
      FRIES_EXTRA_NAME,
      "combo fries scaling will break",
    ),
  ]);

  return {
    burgers,
    extras,
    combos,
    meatExtra,
    friesExtra,
    deliveryFeeArs: env.DELIVERY_FEE_ARS,
  };
}
