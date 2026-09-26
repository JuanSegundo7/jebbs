import { describe, expect, it } from "vitest";
import { coverageLabel } from "../coverage-text";

const z = (name: string) => ({ name });

describe("coverageLabel", () => {
  it("returns the neutral fallback with no zones", () => {
    expect(coverageLabel([])).toBe("Consultá las zonas de entrega");
  });

  it("returns the single zone name", () => {
    expect(coverageLabel([z("Gonnet")])).toBe("Gonnet");
  });

  it("joins two zones with 'y'", () => {
    expect(coverageLabel([z("Gonnet"), z("City Bell")])).toBe("Gonnet y City Bell");
  });

  it("joins 3+ zones with commas and a final 'y', preserving order", () => {
    expect(coverageLabel([z("C"), z("A"), z("B"), z("D")])).toBe("C, A, B y D");
  });

  it("only uses the zones it is given", () => {
    expect(coverageLabel([z("Villa Elisa")])).not.toContain("Gonnet");
  });
});
