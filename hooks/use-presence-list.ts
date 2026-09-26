import { useEffect, useRef, useState } from "react";

export interface PresenceEntry<T> {
  item: T;
  exiting: boolean;
}

// Keeps items that just disappeared from `items` alive for `exitMs` (marked
// `exiting`) so the caller can play an exit animation, no matter who
// triggered the removal. Order is stable: ghosts stay at their old position.
export function usePresenceList<T extends { id: string }>(
  items: T[],
  exitMs = 200,
): PresenceEntry<T>[] {
  const [entries, setEntries] = useState<PresenceEntry<T>[]>(() =>
    items.map((item) => ({ item, exiting: false })),
  );
  const [prevItems, setPrevItems] = useState(items);

  // Derive-during-render (React's documented "adjust state on prop change"
  // pattern) so the ghost is present on the very same commit the item leaves.
  if (items !== prevItems) {
    setPrevItems(items);
    const next = merge(entries, items);
    if (!sameEntries(entries, next)) setEntries(next);
  }

  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const live = timers.current;
    for (const { item, exiting } of entries) {
      const pending = live.get(item.id);
      if (exiting && !pending) {
        live.set(
          item.id,
          setTimeout(() => {
            live.delete(item.id);
            setEntries((cur) => cur.filter((e) => !(e.item.id === item.id && e.exiting)));
          }, exitMs),
        );
      } else if (!exiting && pending) {
        clearTimeout(pending);
        live.delete(item.id);
      }
    }
  }, [entries, exitMs]);

  useEffect(() => {
    const live = timers.current;
    return () => {
      live.forEach(clearTimeout);
      live.clear();
    };
  }, []);

  return entries;
}

function merge<T extends { id: string }>(
  prev: PresenceEntry<T>[],
  items: T[],
): PresenceEntry<T>[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const result: PresenceEntry<T>[] = prev.map((e) => {
    const fresh = byId.get(e.item.id);
    return fresh ? { item: fresh, exiting: false } : { item: e.item, exiting: true };
  });
  const known = new Set(prev.map((e) => e.item.id));
  items.forEach((item, idx) => {
    if (known.has(item.id)) return;
    // Insert right after its predecessor in the new list (or at the start).
    const before = idx > 0 ? items[idx - 1].id : null;
    const at = before === null ? 0 : result.findIndex((e) => e.item.id === before) + 1;
    result.splice(at, 0, { item, exiting: false });
  });
  return result;
}

function sameEntries<T>(a: PresenceEntry<T>[], b: PresenceEntry<T>[]) {
  return (
    a.length === b.length &&
    a.every((e, i) => e.item === b[i].item && e.exiting === b[i].exiting)
  );
}
