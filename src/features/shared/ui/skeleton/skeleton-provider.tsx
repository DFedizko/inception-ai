"use client";

import type { ReactNode } from "react";

import { SkeletonRendererContext } from "./skeleton-context";
import type { SkeletonRenderer } from "./skeleton.port";

type SkeletonProviderProps = {
  renderer: SkeletonRenderer;
  children: ReactNode;
};

export const SkeletonProvider = ({ renderer, children }: SkeletonProviderProps) => (
  <SkeletonRendererContext.Provider value={renderer}>
    {children}
  </SkeletonRendererContext.Provider>
);
