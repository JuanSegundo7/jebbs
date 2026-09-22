import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// lib/env.ts throws at module load (DD3), so every case needs a fresh
// module instance -- vi.resetModules() + dynamic import forces
// re-evaluation instead of reusing Node's cached export.
const ORIGINAL_ENV = { ...process.env };

async function importEnv() {
  vi.resetModules();
  return import("@/lib/env");
}

describe("lib/env.ts", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.TZ = "America/Argentina/Buenos_Aires";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when NEXT_PUBLIC_WHATSAPP_NUMBER is invalid", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+549345412"; // "+" not allowed

    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_WHATSAPP_NUMBER/);
  });

  it("throws when NEXT_PUBLIC_WHATSAPP_NUMBER is too short", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "123";

    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_WHATSAPP_NUMBER/);
  });

  it("throws when TZ is not America/Argentina/Buenos_Aires", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";
    process.env.TZ = "UTC";

    await expect(importEnv()).rejects.toThrow(/TZ/);
  });

  it("passes with a valid configuration", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

    const { env } = await importEnv();

    expect(env.NEXT_PUBLIC_WHATSAPP_NUMBER).toBe("5493454123456");
  });
});
