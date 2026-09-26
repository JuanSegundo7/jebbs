import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// Imports are hoisted; lib/env.ts throws at load, so set the env first.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";
});

import { Hero } from "../hero";
import { FactsStrip } from "../facts-strip";
import { InfoSection } from "../info-section";
import { SiteFooter } from "../site-footer";

afterEach(cleanup);

describe("coverage text wiring", () => {
  it("Hero shows the given coverage", () => {
    render(<Hero coverage="Villa Elisa y Ringuelet" />);
    expect(screen.getByText(/Villa Elisa y Ringuelet/)).toBeTruthy();
    expect(screen.queryByText(/Gonnet/)).toBeNull();
  });

  it("FactsStrip shows the given coverage", () => {
    render(<FactsStrip coverage="Villa Elisa" />);
    expect(screen.getByText("Villa Elisa")).toBeTruthy();
    expect(screen.queryByText(/Gonnet/)).toBeNull();
  });

  it("InfoSection shows the given coverage", () => {
    render(<InfoSection coverage="Villa Elisa" />);
    expect(screen.getByText(/Villa Elisa/)).toBeTruthy();
    expect(screen.queryByText(/Gonnet/)).toBeNull();
  });

  it("SiteFooter shows the given coverage", () => {
    render(<SiteFooter coverage="Villa Elisa" />);
    expect(screen.getByText(/Villa Elisa/)).toBeTruthy();
    expect(screen.queryByText(/Gonnet/)).toBeNull();
  });

  it("falls back to the neutral text when no coverage is passed", () => {
    render(<FactsStrip />);
    expect(screen.getByText("Consultá las zonas de entrega")).toBeTruthy();
  });
});
