import { Skeleton } from "@/features/shared/ui";

export const ConversationListSkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, index) => (
      <Skeleton key={index} height={36} borderRadius={8} />
    ))}
  </>
);
