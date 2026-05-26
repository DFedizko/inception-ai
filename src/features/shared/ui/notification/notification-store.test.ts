import { beforeEach, describe, expect, it, mock } from "bun:test";

import { DEFAULT_NOTIFICATION_DURATION, MAX_VISIBLE_NOTIFICATIONS } from "./notification.types";
import { useNotificationStore } from "./notification-store";

const reset = () => useNotificationStore.setState({ notifications: [] });

describe("notification store", () => {
  beforeEach(reset);

  it("appends a notification with defaults and returns its id", () => {
    const id = useNotificationStore.getState().push({ message: "Salvo" });

    const [notification] = useNotificationStore.getState().notifications;
    expect(notification.id).toBe(id);
    expect(notification.message).toBe("Salvo");
    expect(notification.variant).toBe("info");
    expect(notification.duration).toBe(DEFAULT_NOTIFICATION_DURATION);
    expect(notification.copyable).toBe(true);
    expect(notification.dismissible).toBe(true);
  });

  it("keeps explicit variant, duration and flags", () => {
    useNotificationStore.getState().push({
      message: "Falhou",
      variant: "danger",
      duration: 6000,
      copyable: false,
      dismissible: false,
    });

    const [notification] = useNotificationStore.getState().notifications;
    expect(notification.variant).toBe("danger");
    expect(notification.duration).toBe(6000);
    expect(notification.copyable).toBe(false);
    expect(notification.dismissible).toBe(false);
  });

  it("dismisses a notification by id", () => {
    const id = useNotificationStore.getState().push({ message: "Some" });
    useNotificationStore.getState().dismiss(id);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("drops the oldest once the visible cap is exceeded", () => {
    for (let index = 0; index < MAX_VISIBLE_NOTIFICATIONS + 2; index += 1) {
      useNotificationStore.getState().push({ message: `n-${index}` });
    }

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(MAX_VISIBLE_NOTIFICATIONS);
    expect(notifications[0].message).toBe("n-2");
  });

  it("runs the undo action and then dismisses on runAction", () => {
    const run = mock(() => {});
    const id = useNotificationStore.getState().push({
      message: "Mensagem apagada",
      action: { label: "Reverter", run },
    });

    useNotificationStore.getState().runAction(id);

    expect(run).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("clears every notification", () => {
    useNotificationStore.getState().push({ message: "a" });
    useNotificationStore.getState().push({ message: "b" });
    useNotificationStore.getState().clear();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
