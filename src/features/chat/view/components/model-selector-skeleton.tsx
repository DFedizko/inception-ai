import { Skeleton } from "@/features/shared/ui";

export const ModelSelectorSkeleton = () => (
  <div className="w-full" aria-hidden>
    <Skeleton height={38} borderRadius={8} />
  </div>
);
