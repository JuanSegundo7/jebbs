import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSingleFlight } from "@/hooks/use-single-flight";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useSingleFlight()", () => {
  it("ignores a second invocation while the first is still in flight", async () => {
    const { promise, resolve } = deferred<string>();
    const action = vi.fn(() => promise);
    const { result } = renderHook(() => useSingleFlight(action));

    let first: Promise<string | undefined>;
    let second: Promise<string | undefined>;
    act(() => {
      first = result.current.run();
      second = result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve("done");
      await first!;
      await second!;
    });

    expect(await second!).toBeUndefined();
    expect(await first!).toBe("done");
  });

  it("sets isPending true while the action is running, false once it settles", async () => {
    const { promise, resolve } = deferred<void>();
    const action = vi.fn(() => promise);
    const { result } = renderHook(() => useSingleFlight(action));

    expect(result.current.isPending).toBe(false);

    let runPromise: Promise<void | undefined>;
    act(() => {
      runPromise = result.current.run();
    });
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolve();
      await runPromise!;
    });
    expect(result.current.isPending).toBe(false);
  });

  it("releases the lock after settling, allowing a later call to run again", async () => {
    const action = vi.fn(async () => "ok");
    const { result } = renderHook(() => useSingleFlight(action));

    await act(async () => {
      await result.current.run();
    });
    await act(async () => {
      await result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(2);
  });
});
