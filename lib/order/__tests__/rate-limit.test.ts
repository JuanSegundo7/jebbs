import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimitForTests, checkRateLimit } from "@/lib/order/rate-limit";

describe("checkRateLimit()", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it("allows the first 10 requests from the same IP within the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit("1.2.3.4", now).allowed).toBe(true);
    }
  });

  it("rejects the 11th request within the window from the same IP", () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const eleventh = checkRateLimit("1.2.3.4", now);
    expect(eleventh.allowed).toBe(false);
    expect(eleventh.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the window after 10 minutes, allowing further requests", () => {
    const start = 1_000_000;
    for (let i = 0; i < 10; i++) {
      checkRateLimit("1.2.3.4", start);
    }
    expect(checkRateLimit("1.2.3.4", start).allowed).toBe(false);

    const afterWindow = start + 10 * 60 * 1000 + 1;
    expect(checkRateLimit("1.2.3.4", afterWindow).allowed).toBe(true);
  });

  it("tracks separate buckets per IP", () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      checkRateLimit("1.1.1.1", now);
    }
    expect(checkRateLimit("1.1.1.1", now).allowed).toBe(false);
    // A different IP has its own bucket -- unaffected by the first IP's usage.
    expect(checkRateLimit("2.2.2.2", now).allowed).toBe(true);
  });
});
