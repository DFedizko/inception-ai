import { createContext, useContext, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { SelectOption } from "./select.types";

export type SelectConfig<T> = {
  options: SelectOption<T>[];
  selectedValues: T[];
  multiple: boolean;
  searchable: boolean;
  loading: boolean;
  disabled: boolean;
  pageSize?: number;
  toolbar?: ReactNode;
  placeholder?: string;
  label?: string;
  emit: (values: T[]) => void;
};

export type SelectStoreState<T> = SelectConfig<T> & {
  isOpen: boolean;
  query: string;
  page: number;
  highlightedIndex: number;
  syncConfig: (config: SelectConfig<T>) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setPage: (page: number) => void;
  setHighlightedIndex: (index: number) => void;
  moveHighlight: (delta: number) => void;
  selectByIndex: (index: number) => void;
  selectValue: (value: T) => void;
};

type PaginationState<T> = Pick<SelectStoreState<T>, "options" | "query" | "searchable" | "pageSize" | "page">;

export const visibleOptions = <T,>(state: Pick<SelectStoreState<T>, "options" | "query" | "searchable">): SelectOption<T>[] => {
  const query = state.query.trim().toLowerCase();
  if (!state.searchable || query === "") return state.options;
  return state.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      (option.secondary?.toLowerCase().includes(query) ?? false),
  );
};

const hasPaging = <T,>(state: PaginationState<T>): boolean => (state.pageSize ?? 0) > 0;

export const pageCount = <T,>(state: PaginationState<T>): number => {
  if (!hasPaging(state)) return 1;
  return Math.max(1, Math.ceil(visibleOptions(state).length / (state.pageSize as number)));
};

const clampedPage = <T,>(state: PaginationState<T>): number =>
  Math.min(Math.max(0, state.page), pageCount(state) - 1);

export const pagedOptions = <T,>(state: PaginationState<T>): SelectOption<T>[] => {
  const visible = visibleOptions(state);
  if (!hasPaging(state)) return visible;
  const size = state.pageSize as number;
  const start = clampedPage(state) * size;
  return visible.slice(start, start + size);
};

export const firstEnabledIndex = <T,>(options: SelectOption<T>[]): number =>
  options.findIndex((option) => !option.disabled);

const nextEnabledIndex = <T,>(options: SelectOption<T>[], from: number, delta: number): number => {
  if (options.length === 0) return -1;
  let index = from;
  for (let step = 0; step < options.length; step += 1) {
    index = (index + delta + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return from;
};

export const isSelected = <T,>(values: T[], value: T): boolean =>
  values.some((selected) => Object.is(selected, value));

export const createSelectStore = <T,>(config: SelectConfig<T>): StoreApi<SelectStoreState<T>> =>
  createStore<SelectStoreState<T>>((set, get) => ({
    ...config,
    isOpen: false,
    query: "",
    page: 0,
    highlightedIndex: -1,
    syncConfig: (next) => set({ ...next }),
    open: () => {
      if (get().disabled) return;
      set({ isOpen: true, highlightedIndex: firstEnabledIndex(pagedOptions(get())) });
    },
    close: () => set({ isOpen: false, query: "", page: 0, highlightedIndex: -1 }),
    toggle: () => (get().isOpen ? get().close() : get().open()),
    setQuery: (query) =>
      set((state) => ({
        query,
        page: 0,
        highlightedIndex: firstEnabledIndex(pagedOptions({ ...state, query, page: 0 })),
      })),
    setPage: (page) =>
      set((state) => {
        const next = { ...state, page };
        return { page: clampedPage(next), highlightedIndex: firstEnabledIndex(pagedOptions(next)) };
      }),
    setHighlightedIndex: (highlightedIndex) => set({ highlightedIndex }),
    moveHighlight: (delta) =>
      set((state) => ({
        highlightedIndex: nextEnabledIndex(pagedOptions(state), state.highlightedIndex, delta),
      })),
    selectByIndex: (index) => {
      const option = pagedOptions(get())[index];
      if (!option || option.disabled) return;
      get().selectValue(option.value);
    },
    selectValue: (value) => {
      const { multiple, selectedValues, emit } = get();
      if (multiple) {
        emit(
          isSelected(selectedValues, value)
            ? selectedValues.filter((selected) => !Object.is(selected, value))
            : [...selectedValues, value],
        );
        return;
      }
      emit([value]);
      get().close();
    },
  }));

const SelectStoreContext = createContext<StoreApi<SelectStoreState<unknown>> | null>(null);

export const SelectStoreProvider = SelectStoreContext.Provider;

export const useSelectStore = <T,>(): SelectStoreState<T> => {
  const store = useContext(SelectStoreContext);
  if (!store) throw new Error("Select pieces must be rendered within <SelectRoot>.");
  return useStore(store as unknown as StoreApi<SelectStoreState<T>>);
};
