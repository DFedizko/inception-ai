"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "./modal.module.css";
import { ModalContextProvider } from "./modal-context";

export type ModalAnimation =
  | "fade"
  | "scale"
  | "slide-up"
  | "drawer-right"
  | "flip"
  | "swing"
  | "genie";

export type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  animation?: ModalAnimation;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  ariaLabel?: string;
};

type Phase = "enter" | "exit";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export const Modal = ({
  open,
  onClose,
  children,
  animation = "scale",
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabel,
}: ModalProps) => {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<Phase>(open ? "enter" : "exit");
  const [wasOpen, setWasOpen] = useState(open);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Derive mount/animation phase from the `open` prop during render (React's
  // "adjusting state on prop change" pattern) — no effect, so no cascading renders.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMounted(true);
      setPhase("enter");
    } else if (mounted) {
      setPhase("exit");
    }
  }

  useEffect(() => {
    if (!mounted || !closeOnEscape) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, closeOnEscape, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const direction = phase === "exit" ? "out" : "in";

  const onPanelAnimationEnd = () => {
    if (phase === "exit") setMounted(false);
  };

  return createPortal(
    <div
      className={`${styles.backdrop} ${styles[`backdrop-${direction}`]}`}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : titleId}
        data-animation={animation}
        data-phase={phase}
        onAnimationEnd={onPanelAnimationEnd}
        className={`${styles.panel} ${styles[`${animation}-${direction}`]} ${sizeClass[size]} rounded-2xl border border-line bg-panel text-ink shadow-2xl`}
      >
        <ModalContextProvider value={{ close: onClose, titleId }}>
          {children}
        </ModalContextProvider>
      </div>
    </div>,
    document.body,
  );
};
