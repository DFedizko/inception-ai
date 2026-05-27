import { describe, expect, it } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("first", 50));
    expect(result.current).toBe("first");
  });

  it("keeps the previous value until the delay elapses, then updates", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    await waitFor(() => expect(result.current).toBe("second"));
  });

  it("only settles on the last value when changes arrive faster than the delay", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 60), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    rerender({ value: "abc" });

    expect(result.current).toBe("a");
    await waitFor(() => expect(result.current).toBe("abc"));
  });

  it("does not emit an intermediate value that was superseded before the delay", async () => {
    const seen: string[] = [];
    const { rerender } = renderHook(
      ({ value }) => {
        seen.push(useDebounce(value, 40));
      },
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    rerender({ value: "abc" });

    await waitFor(() => expect(seen.at(-1)).toBe("abc"));
    expect(seen).not.toContain("ab");
  });
});
