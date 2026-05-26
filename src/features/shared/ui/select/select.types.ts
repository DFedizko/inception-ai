import type { ReactNode } from "react";

export type SelectOption<T> = {
  value: T;
  label: string;
  secondary?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
};

export type SelectChange<T> = (value: T) => void;

export type SelectMultipleChange<T> = (value: T[]) => void;
