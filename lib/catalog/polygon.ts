/**
 * True when `raw` is an array of at least 3 `[x, y]` pairs of finite numbers.
 * map_polygon comes from a JSON column, so it is untrusted at runtime.
 */
export function isValidPolygon(raw: unknown): raw is [number, number][] {
  return (
    Array.isArray(raw) &&
    raw.length >= 3 &&
    raw.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
    )
  );
}
