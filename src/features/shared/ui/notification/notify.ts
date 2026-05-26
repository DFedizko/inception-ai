import { useNotificationStore } from "./notification-store";
import type { NotificationInput, NotificationVariant } from "./notification.types";

type VariantInput = Omit<NotificationInput, "variant">;

const emit = (variant: NotificationVariant) => (message: string, options?: Omit<VariantInput, "message">) =>
  useNotificationStore.getState().push({ ...options, message, variant });

export const notify = {
  success: emit("success"),
  danger: emit("danger"),
  warn: emit("warn"),
  info: emit("info"),
  dismiss: (id: string) => useNotificationStore.getState().dismiss(id),
};
