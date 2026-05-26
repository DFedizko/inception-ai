import { create } from "zustand";

import {
  DEFAULT_NOTIFICATION_DURATION,
  MAX_VISIBLE_NOTIFICATIONS,
  type Notification,
  type NotificationInput,
} from "./notification.types";

type NotificationStore = {
  notifications: Notification[];
  push: (input: NotificationInput) => string;
  dismiss: (id: string) => void;
  runAction: (id: string) => void;
  clear: () => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  push: (input) => {
    const notification = fromInput(input);
    set((state) => ({ notifications: capTail([...state.notifications, notification]) }));
    return notification.id;
  },
  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  runAction: (id) => {
    get().notifications.find((n) => n.id === id)?.action?.run();
    get().dismiss(id);
  },
  clear: () => set({ notifications: [] }),
}));

const fromInput = (input: NotificationInput): Notification => ({
  id: crypto.randomUUID(),
  variant: input.variant ?? "info",
  message: input.message,
  title: input.title,
  duration: input.duration ?? DEFAULT_NOTIFICATION_DURATION,
  action: input.action,
  copyable: input.copyable ?? true,
  dismissible: input.dismissible ?? true,
});

const capTail = (notifications: Notification[]): Notification[] =>
  notifications.slice(-MAX_VISIBLE_NOTIFICATIONS);
