import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Pinned per R16 (design.md DD1) so every test runs against the same
// timezone the deploy env asserts in lib/env.ts, regardless of the host
// machine's default zone.
process.env.APP_TIMEZONE = "America/Argentina/Buenos_Aires";

// @testing-library/react does not auto-cleanup under vitest the way it
// does under jest (there's no jest-specific afterEach hook wired in by
// default) -- without this, each `render()` in a test file leaves its DOM
// tree mounted for the next test, causing duplicate-element query errors.
// First needed by WU3b's checkout-panel.test.tsx, the first test file in
// this repo to call `render()` instead of `renderHook()`.
afterEach(() => {
  cleanup();
});

// "server-only" relies on Next's webpack/SWC loader swapping it for a no-op
// in the server module graph at build time -- it has no such special
// handling under vitest/vite, so importing it unconditionally throws
// ("This module cannot be imported from a Client Component module").
// Stub it globally so server-only modules (lib/supabase/admin.ts,
// lib/catalog/get-catalog.ts) can be unit tested directly.
vi.mock("server-only", () => ({}));

// jsdom has no matchMedia implementation -- vaul's Drawer reads it (to pick
// its default direction/behavior) the moment it actually opens, which
// cart-drawer.test.tsx is the first test file in this repo to do. Without
// this, any test that opens a Drawer throws "window.matchMedia is not a
// function" from inside vaul's own mount effect.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
