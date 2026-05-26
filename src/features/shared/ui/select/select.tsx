"use client";

import { SelectList } from "./select-list";
import { SelectRoot, type SelectRootProps } from "./select-root";
import { SelectTrigger } from "./select-trigger";

export type SelectProps<T> = Omit<SelectRootProps<T>, "children">;

export const Select = <T,>(props: SelectProps<T>) => (
  <SelectRoot {...(props as SelectRootProps<T>)}>
    <SelectTrigger />
    <SelectList />
  </SelectRoot>
);
