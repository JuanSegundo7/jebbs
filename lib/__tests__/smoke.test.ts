import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("test runner smoke test", () => {
  it("confirms vitest executes before any real logic exists", () => {
    expect(1 + 1).toBe(2);
  });

  it("confirms the @/* alias resolves and cn() merges classes", () => {
    // Regression guard for the extendTailwindMerge font-size group in
    // lib/utils.ts: without it, tailwind-merge treats "text-caption" as a
    // color-utility duplicate of "text-muted-foreground" and drops it.
    expect(cn("text-caption text-muted-foreground")).toBe(
      "text-caption text-muted-foreground",
    );
  });
});
