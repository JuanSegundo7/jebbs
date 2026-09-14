import { vi } from "vitest";

// Pinned per R16 (design.md DD1) so every test runs against the same
// timezone the deploy env asserts in lib/env.ts, regardless of the host
// machine's default zone.
process.env.TZ = "America/Argentina/Buenos_Aires";

// "server-only" relies on Next's webpack/SWC loader swapping it for a no-op
// in the server module graph at build time -- it has no such special
// handling under vitest/vite, so importing it unconditionally throws
// ("This module cannot be imported from a Client Component module").
// Stub it globally so server-only modules (lib/supabase/admin.ts,
// lib/catalog/get-catalog.ts) can be unit tested directly.
vi.mock("server-only", () => ({}));
