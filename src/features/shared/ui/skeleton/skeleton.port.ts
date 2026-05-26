import type { ReactNode } from "react";

export type SkeletonProps = {
  count?: number;
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  borderRadius?: number | string;
  className?: string;
  containerClassName?: string;
};

export type SkeletonRenderer = (props: SkeletonProps) => ReactNode;
