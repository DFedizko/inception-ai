"use client";

import { useNotificationStore } from "./notification-store";
import { NotificationToast } from "./notification-toast";
import type { NotificationEnterFrom, NotificationPosition } from "./notification.types";

type NotificationViewportProps = {
  position?: NotificationPosition;
  enterFrom?: NotificationEnterFrom;
};

export const NotificationViewport = ({
  position = "bottom-right",
  enterFrom = "right",
}: NotificationViewportProps) => {
  const { notifications } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificações"
      className={`pointer-events-none fixed z-50 flex flex-col gap-2 ${positionClass[position]}`}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast notification={notification} enterFrom={enterFrom} />
        </div>
      ))}
    </div>
  );
};

const positionClass: Record<NotificationPosition, string> = {
  "top-left": "top-4 left-4 items-start",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};
