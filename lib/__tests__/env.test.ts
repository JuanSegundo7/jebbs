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

  it("throws when DELIVERY_FEE_ARS is missing", async () => {
    delete process.env.DELIVERY_FEE_ARS;
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

    await expect(importEnv()).rejects.toThrow(/DELIVERY_FEE_ARS/);
  });

  it("throws when DELIVERY_FEE_ARS is non-numeric", async () => {
    process.env.DELIVERY_FEE_ARS = "not-a-number";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

    await expect(importEnv()).rejects.toThrow(/DELIVERY_FEE_ARS/);
  });

  it("throws when DELIVERY_FEE_ARS is negative", async () => {
    process.env.DELIVERY_FEE_ARS = "-100";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

    await expect(importEnv()).rejects.toThrow(/DELIVERY_FEE_ARS/);
  });

  it("throws when NEXT_PUBLIC_WHATSAPP_NUMBER is invalid", async () => {
    process.env.DELIVERY_FEE_ARS = "2000";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+549345412"; // "+" not allowed

    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_WHATSAPP_NUMBER/);
  });

  it("throws when NEXT_PUBLIC_WHATSAPP_NUMBER is too short", async () => {
    process.env.DELIVERY_FEE_ARS = "2000";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "123";

    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_WHATSAPP_NUMBER/);
  });

  it("throws when TZ is not America/Argentina/Buenos_Aires", async () => {
    process.env.DELIVERY_FEE_ARS = "2000";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";
    process.env.TZ = "UTC";

    await expect(importEnv()).rejects.toThrow(/TZ/);
  });

  it("passes with a valid configuration and parses the fee as a number", async () => {
    process.env.DELIVERY_FEE_ARS = "2000";
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

    const { env } = await importEnv();

    expect(env.DELIVERY_FEE_ARS).toBe(2000);
    expect(env.NEXT_PUBLIC_WHATSAPP_NUMBER).toBe("5493454123456");
  });
});
