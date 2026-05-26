import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { SelectOption } from "./select.types";

export type SelectConfig<T> = {
  options: SelectOption<T>[];
  selectedValues: T[];
  multiple: boolean;
  searchable: boolean;
  loading: boolean;
  disabled: boolean;
  placeholder?: string;
  label?: string;
  emit: (values: T[]) => void;
};

export type SelectStoreState<T> = SelectConfig<T> & {
  isOpen: boolean;
  query: string;
  highlightedIndex: number;
  syncConfig: (config: SelectConfig<T>) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setHighlightedIndex: (index: number) => void;
  moveHighlight: (delta: number) => void;
  selectByIndex: (index: number) => void;
  selectValue: (value: T) => void;
};

export const visibleOptions = <T,>(state: Pick<SelectStoreState<T>, "options" | "query" | "searchable">): SelectOption<T>[] => {
  const query = state.query.trim().toLowerCase();
  if (!state.searchable || query === "") return state.options;
  return state.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      (option.secondary?.toLowerCase().includes(query) ?? false),
  );
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
    highlightedIndex: -1,
    syncConfig: (next) => set({ ...next }),
    open: () => {
      if (get().disabled) return;
      set({ isOpen: true, highlightedIndex: firstEnabledIndex(visibleOptions(get())) });
    },
    close: () => set({ isOpen: false, query: "", highlightedIndex: -1 }),
    toggle: () => (get().isOpen ? get().close() : get().open()),
    setQuery: (query) =>
      set((state) => ({
        query,
        highlightedIndex: firstEnabledIndex(visibleOptions({ ...state, query })),
      })),
    setHighlightedIndex: (highlightedIndex) => set({ highlightedIndex }),
    moveHighlight: (delta) =>
      set((state) => ({
        highlightedIndex: nextEnabledIndex(visibleOptions(state), state.highlightedIndex, delta),
      })),
    selectByIndex: (index) => {
      const option = visibleOptions(get())[index];
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
