import ReactLoadingSkeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import type { SkeletonProps, SkeletonRenderer } from "./skeleton.port";

export const reactLoadingSkeletonRenderer: SkeletonRenderer = ({
  count,
  width,
  height,
  circle,
  borderRadius,
  className,
  containerClassName,
}: SkeletonProps) => (
  <SkeletonTheme baseColor="var(--color-raised)" highlightColor="var(--color-line)">
    <ReactLoadingSkeleton
      count={count}
      width={width}
      height={height}
      circle={circle}
      borderRadius={borderRadius}
      className={`block! ${className ?? ""}`}
      containerClassName={`block leading-[0] ${containerClassName ?? ""}`}
    />
  </SkeletonTheme>
);
