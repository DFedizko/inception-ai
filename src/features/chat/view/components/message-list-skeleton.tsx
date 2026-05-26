import { Skeleton } from "@/features/shared/ui";

export const MessageListSkeleton = () => (
  <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8" aria-hidden>
    <div className="flex justify-end">
      <div className="w-48">
        <Skeleton height={44} borderRadius={16} />
      </div>
    </div>
    <div className="flex justify-start">
      <div className="w-80 max-w-[75%]">
        <Skeleton height={72} borderRadius={16} />
      </div>
    </div>
    <div className="flex justify-end">
      <div className="w-36">
        <Skeleton height={44} borderRadius={16} />
      </div>
    </div>
  </div>
);
