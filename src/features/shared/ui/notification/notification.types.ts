export type NotificationVariant = "success" | "danger" | "warn" | "info";

export type NotificationEnterFrom = "left" | "right" | "top" | "bottom";

export type NotificationPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";

export type NotificationAction = {
  label: string;
  run: () => void;
};

export type Notification = {
  id: string;
  variant: NotificationVariant;
  message: string;
  title?: string;
  duration: number;
  action?: NotificationAction;
  copyable: boolean;
  dismissible: boolean;
};

export type NotificationInput = Omit<Notification, "id" | "variant" | "duration" | "copyable" | "dismissible"> & {
  variant?: NotificationVariant;
  duration?: number;
  copyable?: boolean;
  dismissible?: boolean;
};

export const DEFAULT_NOTIFICATION_DURATION = 4000;

export const MAX_VISIBLE_NOTIFICATIONS = 4;
