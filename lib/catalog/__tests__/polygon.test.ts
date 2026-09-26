import { describe, expect, it } from "vitest";
import { isValidPolygon } from "../polygon";

describe("isValidPolygon", () => {
  it("accepts an array of 3+ finite [x, y] pairs", () => {
    expect(isValidPolygon([[0, 0], [10, 0], [5, 8]])).toBe(true);
  });

  it("rejects fewer than 3 points", () => {
    expect(isValidPolygon([[0, 0], [1, 1]])).toBe(false);
    expect(isValidPolygon([])).toBe(false);
  });

  it("rejects NaN and Infinity coordinates", () => {
    expect(isValidPolygon([[0, 0], [NaN, 1], [2, 2]])).toBe(false);
    expect(isValidPolygon([[0, 0], [Infinity, 1], [2, 2]])).toBe(false);
  });

  it("rejects non-numeric coordinates and wrong pair length", () => {
    expect(isValidPolygon([[0, 0], ["1", 1], [2, 2]])).toBe(false);
    expect(isValidPolygon([[0, 0], [1], [2, 2]])).toBe(false);
    expect(isValidPolygon([[0, 0], [1, 1, 1], [2, 2]])).toBe(false);
  });

  it("rejects non-arrays", () => {
    expect(isValidPolygon(null)).toBe(false);
    expect(isValidPolygon(undefined)).toBe(false);
    expect(isValidPolygon("x")).toBe(false);
    expect(isValidPolygon({ length: 3 })).toBe(false);
  });
});
