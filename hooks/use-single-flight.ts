"use client";

import { useCallback, useRef, useState } from "react";

// R14 (design.md) mitigation: a client-side single-flight guard mirroring
// jebbs-dashboard's use-order-wizard.ts:197-198 (`isSubmittingRef`) --
// re-invocations while a previous call is still in flight are ignored, and
// `isPending` lets the caller disable its trigger button meanwhile. There is
// no server-side idempotency key in v1 (deferred -- it would need a new
// column on `orders`); this is a client-side-only mitigation, same residual
// risk R14 documents for the dashboard's own wizard.
export function useSingleFlight<Args extends unknown[], R>(
  action: (...args: Args) => Promise<R>,
) {
  const inFlightRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      if (inFlightRef.current) return undefined;
      inFlightRef.current = true;
      setIsPending(true);
      try {
        return await action(...args);
      } finally {
        inFlightRef.current = false;
        setIsPending(false);
      }
    },
    [action],
  );

  return { run, isPending };
}
