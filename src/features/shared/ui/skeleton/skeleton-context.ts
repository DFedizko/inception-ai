import { createContext } from "react";

import { reactLoadingSkeletonRenderer } from "./react-loading-skeleton.adapter";
import type { SkeletonRenderer } from "./skeleton.port";

export const SkeletonRendererContext = createContext<SkeletonRenderer>(
  reactLoadingSkeletonRenderer,
);
