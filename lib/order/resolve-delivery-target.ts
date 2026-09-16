import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// DD2 + DD5 (design.md "Delivery Dedup Logic"). Exact sequence:
//   1. normalize the posted phone, look up an existing customer (fast path).
//   2. fall back to a bounded scan for human-formatted legacy rows.
//   3. create the customer if still missing.
//   4. reuse an address on normalized-text match, else INSERT a new one --
//      NEVER update an existing address row (an address id is an FK
//      pointer other orders may already reference; rewriting it in place
//      would silently rewrite their printed history).

export interface DeliveryTarget {
  customerId: string;
  customerAddressId: string;
}

export interface ResolveDeliveryTargetInput {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

// DD5: revisit this threshold if the shop passes ~2000 customers -- past
// that point the bounded fallback scan below stops being a cheap projection.
const FALLBACK_SCAN_LIMIT = 2000;

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function phoneKey(raw: string): string {
  return normalizePhone(raw).slice(-10);
}

function normalizeAddressText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

interface CustomerRow {
  id: string;
  name: string;
  phone?: string | null;
}

interface AddressRow {
  id: string;
  address: string | null;
}

async function findCustomerByPhoneExact(
  supabase: SupabaseClient,
  normalized: string,
): Promise<CustomerRow | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name")
    .eq("phone", normalized)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CustomerRow | null) ?? null;
}

// R13 (design.md, accepted v1 limitation): there is NO unique index on
// customers.phone (confirmed live against production at WU0/Q4 -- only
// customers_pkey exists). Two concurrent first-orders from the same
// brand-new phone number can race past both lookups below and each insert
// its own `customers` row; the shop ends up with a harmless duplicate that
// the NEXT order from that phone dedupes normally against whichever row
// this fast path happens to hit first. This is accepted as a real but low
// -impact v1 gap, not something this function should "fix" with
// `.upsert({ phone }, { onConflict: "phone" })` -- there is no unique
// constraint to conflict on, so an upsert without one degrades to a plain
// insert and would not close the race anyway. The real fix (a
// `phone_normalized` unique index) is a migration this change deliberately
// avoids (D1) -- tracked as a follow-up, not a blocker here.
async function findCustomerByPhoneFallback(
  supabase: SupabaseClient,
  key: string,
): Promise<CustomerRow | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone")
    .not("phone", "is", null)
    .limit(FALLBACK_SCAN_LIMIT);

  if (error) throw error;
  const candidates = (data as CustomerRow[] | null) ?? [];
  return candidates.find((c) => phoneKey(c.phone ?? "") === key) ?? null;
}

async function createCustomer(
  supabase: SupabaseClient,
  name: string,
  normalizedPhone: string,
): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from("customers")
    .insert({ name, phone: normalizedPhone })
    .select("id,name")
    .single();

  if (error || !data) {
    throw error ?? new Error("customers insert returned no row");
  }
  return data as CustomerRow;
}

async function loadAddresses(
  supabase: SupabaseClient,
  customerId: string,
): Promise<AddressRow[]> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id,address")
    .eq("customer_id", customerId);

  if (error) throw error;
  return (data as AddressRow[] | null) ?? [];
}

async function insertAddress(
  supabase: SupabaseClient,
  customerId: string,
  address: string,
  notes: string | undefined,
  isDefault: boolean,
): Promise<string> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      label: "Principal",
      address,
      notes: notes ?? null,
      is_default: isDefault,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("customer_addresses insert returned no row");
  }
  return (data as { id: string }).id;
}

export async function resolveDeliveryTarget(
  input: ResolveDeliveryTargetInput,
): Promise<DeliveryTarget> {
  const supabase = createAdminClient();
  const normalized = normalizePhone(input.phone);
  const key = phoneKey(input.phone);

  let customer = await findCustomerByPhoneExact(supabase, normalized);
  if (!customer) {
    customer = await findCustomerByPhoneFallback(supabase, key);
  }

  let addresses: AddressRow[];
  if (customer) {
    // DD2: the name is NEVER updated on a returning-customer match --
    // orders.customer_name carries whatever the customer typed this time,
    // so the wording still reaches the kitchen without rewriting the
    // master record.
    addresses = await loadAddresses(supabase, customer.id);
  } else {
    customer = await createCustomer(supabase, input.name, normalized);
    addresses = [];
  }

  const normalizedTarget = normalizeAddressText(input.address);
  const existingAddress = addresses.find(
    (a) => a.address && normalizeAddressText(a.address) === normalizedTarget,
  );

  const customerAddressId = existingAddress
    ? existingAddress.id
    : await insertAddress(
        supabase,
        customer.id,
        input.address,
        input.notes,
        addresses.length === 0,
      );

  return { customerId: customer.id, customerAddressId };
}
