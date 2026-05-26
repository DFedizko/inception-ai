"use client";

import { useContext } from "react";

import { SkeletonRendererContext } from "./skeleton-context";
import type { SkeletonProps } from "./skeleton.port";

export const Skeleton = (props: SkeletonProps) => {
  const render = useContext(SkeletonRendererContext);
  return <>{render(props)}</>;
};
