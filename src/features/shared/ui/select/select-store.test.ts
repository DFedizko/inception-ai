import { describe, expect, it, mock } from "bun:test";
import {
  createSelectStore,
  firstEnabledIndex,
  isSelected,
  pageCount,
  pagedOptions,
  visibleOptions,
  type SelectConfig,
} from "./select-store";
import type { SelectOption } from "./select.types";

const options: SelectOption<string>[] = [
  { value: "flash", label: "Gemini 3.5 Flash", secondary: "fast" },
  { value: "tts", label: "Gemini TTS", secondary: "speech", disabled: true },
  { value: "live", label: "Gemini Live", secondary: "realtime" },
];

const config = (overrides: Partial<SelectConfig<string>> = {}): SelectConfig<string> => ({
  options,
  selectedValues: [],
  multiple: false,
  searchable: false,
  loading: false,
  disabled: false,
  emit: () => {},
  ...overrides,
});

describe("visibleOptions", () => {
  it("returns all options when not searchable", () => {
    expect(visibleOptions({ options, query: "live", searchable: false })).toHaveLength(3);
  });

  it("filters by label and secondary text when searchable", () => {
    expect(visibleOptions({ options, query: "fast", searchable: true })).toEqual([options[0]]);
    expect(visibleOptions({ options, query: "live", searchable: true })).toEqual([options[2]]);
  });

  it("is empty when nothing matches", () => {
    expect(visibleOptions({ options, query: "zzz", searchable: true })).toEqual([]);
  });
});

describe("firstEnabledIndex", () => {
  it("skips a leading disabled option", () => {
    expect(firstEnabledIndex([{ value: "a", label: "a", disabled: true }, { value: "b", label: "b" }])).toBe(1);
  });
});

describe("createSelectStore", () => {
  it("opens highlighting the first enabled option and closes resetting state", () => {
    const store = createSelectStore(config());
    store.getState().open();
    expect(store.getState().isOpen).toBe(true);
    expect(store.getState().highlightedIndex).toBe(0);

    store.getState().setQuery("anything");
    store.getState().close();
    expect(store.getState().isOpen).toBe(false);
    expect(store.getState().query).toBe("");
    expect(store.getState().highlightedIndex).toBe(-1);
  });

  it("does not open when disabled", () => {
    const store = createSelectStore(config({ disabled: true }));
    store.getState().open();
    expect(store.getState().isOpen).toBe(false);
  });

  it("moves the highlight skipping disabled options and wraps", () => {
    const store = createSelectStore(config());
    store.getState().open();
    store.getState().moveHighlight(1);
    expect(store.getState().highlightedIndex).toBe(2);
    store.getState().moveHighlight(1);
    expect(store.getState().highlightedIndex).toBe(0);
    store.getState().moveHighlight(-1);
    expect(store.getState().highlightedIndex).toBe(2);
  });

  it("emits a single value and closes on select (single-select)", () => {
    const emit = mock(() => {});
    const store = createSelectStore(config({ emit }));
    store.getState().open();
    store.getState().selectValue("live");
    expect(emit).toHaveBeenCalledWith(["live"]);
    expect(store.getState().isOpen).toBe(false);
  });

  it("toggles values without closing (multi-select)", () => {
    const emit = mock(() => {});
    const store = createSelectStore(config({ multiple: true, selectedValues: ["flash"], emit }));
    store.getState().open();
    store.getState().selectValue("live");
    expect(emit).toHaveBeenCalledWith(["flash", "live"]);

    store.getState().syncConfig(config({ multiple: true, selectedValues: ["flash", "live"], emit }));
    store.getState().selectValue("flash");
    expect(emit).toHaveBeenLastCalledWith(["live"]);
    expect(store.getState().isOpen).toBe(true);
  });

  it("never selects a disabled option via index", () => {
    const emit = mock(() => {});
    const store = createSelectStore(config({ emit }));
    store.getState().open();
    store.getState().selectByIndex(1);
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("pagination", () => {
  const many: SelectOption<number>[] = Array.from({ length: 7 }, (_, i) => ({ value: i, label: `Model ${i}` }));
  const paged = (overrides = {}) => ({ options: many, query: "", searchable: false, pageSize: 3, page: 0, ...overrides });

  it("counts pages from the visible options and the page size", () => {
    expect(pageCount(paged())).toBe(3);
    expect(pageCount({ ...paged(), pageSize: undefined })).toBe(1);
  });

  it("slices the visible options to the current page", () => {
    expect(pagedOptions(paged({ page: 0 })).map((o) => o.value)).toEqual([0, 1, 2]);
    expect(pagedOptions(paged({ page: 2 })).map((o) => o.value)).toEqual([6]);
  });

  it("returns every visible option when no page size is set", () => {
    expect(pagedOptions({ ...paged(), pageSize: undefined })).toHaveLength(7);
  });

  it("clamps and navigates pages through the store", () => {
    const store = createSelectStore(config({ options: many as never, pageSize: 3 }) as never);
    store.getState().open();
    store.getState().setPage(2);
    expect(store.getState().page).toBe(2);
    store.getState().setPage(99);
    expect(store.getState().page).toBe(2);
    store.getState().setPage(-5);
    expect(store.getState().page).toBe(0);
  });

  it("resets to the first page when the query changes", () => {
    const store = createSelectStore(config({ options: many as never, pageSize: 3, searchable: true }) as never);
    store.getState().open();
    store.getState().setPage(2);
    store.getState().setQuery("Model");
    expect(store.getState().page).toBe(0);
  });
});

describe("isSelected", () => {
  it("detects membership", () => {
    expect(isSelected(["a", "b"], "b")).toBe(true);
    expect(isSelected(["a"], "z")).toBe(false);
  });
});
