"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from "react";
import {
  createSelectStore,
  SelectStoreProvider,
  type SelectConfig,
} from "./select-store";
import type { SelectChange, SelectMultipleChange, SelectOption } from "./select.types";

type SharedProps<T> = {
  options: SelectOption<T>[];
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  pageSize?: number;
  toolbar?: ReactNode;
  placeholder?: string;
  label?: string;
  className?: string;
  children: ReactNode;
};

type SingleSelectProps<T> = SharedProps<T> & {
  multiple?: false;
  value: T | null;
  onChange: SelectChange<T>;
};

type MultiSelectProps<T> = SharedProps<T> & {
  multiple: true;
  value: T[];
  onChange: SelectMultipleChange<T>;
};

export type SelectRootProps<T> = SingleSelectProps<T> | MultiSelectProps<T>;

export const SelectRoot = <T,>(props: SelectRootProps<T>) => {
  const { options, multiple, value, onChange, children, className } = props;
  const searchable = props.searchable ?? false;
  const loading = props.loading ?? false;
  const disabled = props.disabled ?? false;

  const containerRef = useRef<HTMLDivElement>(null);

  const config = useMemo<SelectConfig<T>>(
    () => ({
      options,
      selectedValues: multiple ? (value ?? []) : value == null ? [] : [value],
      multiple: multiple ?? false,
      searchable,
      loading,
      disabled,
      pageSize: props.pageSize,
      toolbar: props.toolbar,
      placeholder: props.placeholder,
      label: props.label,
      emit: (values) =>
        multiple
          ? (onChange as SelectMultipleChange<T>)(values)
          : (onChange as SelectChange<T>)(values[0]),
    }),
    [options, multiple, value, onChange, searchable, loading, disabled, props.pageSize, props.toolbar, props.placeholder, props.label],
  );

  const storeRef = useRef(createSelectStore(config));
  useEffect(() => storeRef.current.getState().syncConfig(config), [config]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) storeRef.current.getState().close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const store = storeRef.current.getState();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        store.isOpen ? store.moveHighlight(1) : store.open();
        break;
      case "ArrowUp":
        event.preventDefault();
        store.isOpen ? store.moveHighlight(-1) : store.open();
        break;
      case "Enter":
        if (store.isOpen) {
          event.preventDefault();
          store.selectByIndex(store.highlightedIndex);
        }
        break;
      case "Escape":
        if (store.isOpen) {
          event.preventDefault();
          store.close();
        }
        break;
    }
  };

  return (
    <SelectStoreProvider value={storeRef.current as never}>
      <div ref={containerRef} onKeyDown={onKeyDown} className={`relative w-full ${className ?? ""}`}>
        {children}
      </div>
    </SelectStoreProvider>
  );
};
