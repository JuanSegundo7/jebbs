import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePresenceList } from "@/hooks/use-presence-list";

type Item = { id: string; label?: string };

const a: Item = { id: "a" };
const b: Item = { id: "b" };
const c: Item = { id: "c" };

const summary = (entries: { item: Item; exiting: boolean }[]) =>
  entries.map((e) => `${e.item.id}${e.exiting ? "*" : ""}`);

describe("usePresenceList", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial items as non-exiting", () => {
    const { result } = renderHook(({ items }) => usePresenceList(items), {
      initialProps: { items: [a, b] },
    });
    expect(summary(result.current)).toEqual(["a", "b"]);
  });

  it("adds new items in order", () => {
    const { result, rerender } = renderHook(({ items }) => usePresenceList(items), {
      initialProps: { items: [a] },
    });
    rerender({ items: [a, b] });
    expect(summary(result.current)).toEqual(["a", "b"]);
  });

  it("keeps a removed item as a ghost at its position, then drops it after exitMs", () => {
    const { result, rerender } = renderHook(({ items }) => usePresenceList(items, 200), {
      initialProps: { items: [a, b, c] },
    });
    rerender({ items: [a, c] });
    expect(summary(result.current)).toEqual(["a", "b*", "c"]);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(summary(result.current)).toEqual(["a", "b*", "c"]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(summary(result.current)).toEqual(["a", "c"]);
  });

  it("keeps the last item as a ghost when the list becomes empty", () => {
    const { result, rerender } = renderHook(({ items }) => usePresenceList(items, 200), {
      initialProps: { items: [a] },
    });
    rerender({ items: [] });
    expect(summary(result.current)).toEqual(["a*"]);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toEqual([]);
  });

  it("cancels the ghost when the id comes back before the timeout", () => {
    const { result, rerender } = renderHook(({ items }) => usePresenceList(items, 200), {
      initialProps: { items: [a, b] },
    });
    rerender({ items: [a] });
    expect(summary(result.current)).toEqual(["a", "b*"]);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ items: [a, b] });
    expect(summary(result.current)).toEqual(["a", "b"]);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(summary(result.current)).toEqual(["a", "b"]);
  });

  it("refreshes the item data of surviving entries", () => {
    const { result, rerender } = renderHook(({ items }) => usePresenceList(items), {
      initialProps: { items: [{ id: "a", label: "old" }] as Item[] },
    });
    rerender({ items: [{ id: "a", label: "new" }] });
    expect(result.current[0].item.label).toBe("new");
  });

  it("clears pending timers on unmount", () => {
    const { rerender, unmount } = renderHook(({ items }) => usePresenceList(items, 200), {
      initialProps: { items: [a] },
    });
    rerender({ items: [] });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
