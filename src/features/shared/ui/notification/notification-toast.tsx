"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Info, Undo2, X, XCircle } from "lucide-react";

import { useAutoDismiss } from "../../hooks/useAutoDismiss";
import { useNotificationStore } from "./notification-store";
import type { Notification, NotificationEnterFrom, NotificationVariant } from "./notification.types";
import styles from "./notification-toast.module.css";

const LEAVE_ANIMATION_MS = 260;

type NotificationToastProps = {
  notification: Notification;
  enterFrom: NotificationEnterFrom;
};

export const NotificationToast = ({ notification, enterFrom }: NotificationToastProps) => {
  const { dismiss, runAction } = useNotificationStore();
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { paused, pause, resume } = useAutoDismiss({
    duration: notification.duration,
    onElapsed: () => setLeaving(true),
  });

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dismiss(notification.id), LEAVE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [leaving, dismiss, notification.id]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(notification.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const palette = variantPalette[notification.variant];
  const Glyph = palette.glyph;
  const motionStyle = { "--leave-duration": `${LEAVE_ANIMATION_MS}ms` } as CSSProperties;

  return (
    <div
      role="status"
      onMouseEnter={() => !leaving && pause()}
      onMouseLeave={() => !leaving && resume()}
      style={motionStyle}
      className={`relative w-80 overflow-hidden rounded-xl border bg-panel shadow-lg ${palette.border} ${styles[enterFromClass[enterFrom]]} ${leaving ? styles.leave : styles.enter}`}
    >
      <div className="flex items-start gap-3 p-3 pb-4">
        <Glyph className={`mt-0.5 size-5 shrink-0 ${palette.icon}`} />
        <div className="min-w-0 flex-1">
          {notification.title && (
            <p className="text-sm font-medium text-ink">{notification.title}</p>
          )}
          <p className="break-words text-sm text-ink-muted">{notification.message}</p>
          {notification.action && (
            <button
              type="button"
              onClick={() => runAction(notification.id)}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition ${palette.action}`}
            >
              <Undo2 className="size-3.5" />
              {notification.action.label}
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {notification.copyable && (
            <button
              type="button"
              onClick={copyMessage}
              aria-label="Copiar mensagem"
              className="flex size-7 items-center justify-center rounded-md text-ink-muted transition hover:bg-raised hover:text-ink"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
          )}
          {notification.dismissible && (
            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              aria-label="Fechar notificação"
              className="flex size-7 items-center justify-center rounded-md text-ink-muted transition hover:bg-raised hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-1 origin-left ${palette.bar} ${styles.progressBar}`}
        style={{ "--duration": `${notification.duration}ms`, animationPlayState: paused ? "paused" : "running" } as CSSProperties}
      />
    </div>
  );
};

const enterFromClass: Record<NotificationEnterFrom, "fromLeft" | "fromRight" | "fromTop" | "fromBottom"> = {
  left: "fromLeft",
  right: "fromRight",
  top: "fromTop",
  bottom: "fromBottom",
};

type VariantStyle = {
  glyph: typeof Info;
  icon: string;
  border: string;
  bar: string;
  action: string;
};

const variantPalette: Record<NotificationVariant, VariantStyle> = {
  success: {
    glyph: CheckCircle2,
    icon: "text-success",
    border: "border-success/40",
    bar: "bg-success",
    action: "bg-success/15 text-success hover:bg-success/25",
  },
  danger: {
    glyph: XCircle,
    icon: "text-danger",
    border: "border-danger/40",
    bar: "bg-danger",
    action: "bg-danger/15 text-danger hover:bg-danger/25",
  },
  warn: {
    glyph: AlertTriangle,
    icon: "text-warn",
    border: "border-warn/40",
    bar: "bg-warn",
    action: "bg-warn/15 text-warn hover:bg-warn/25",
  },
  info: {
    glyph: Info,
    icon: "text-info",
    border: "border-info/40",
    bar: "bg-info",
    action: "bg-info/15 text-info hover:bg-info/25",
  },
};
