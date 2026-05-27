"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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
  | "genie"
  | "reveal"
  | "vortex"
  | "zoom-blur"
  | "iris"
  | "glitch"
  | "elastic";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalDirection =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  animation?: ModalAnimation;
  direction?: ModalDirection;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  ariaLabel?: string;
};

type Phase = "enter" | "exit";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-[28.8rem]",
  md: "max-w-[37.8rem]",
  lg: "max-w-[50.4rem]",
  xl: "max-w-[72rem]",
};

const heightClass: Record<ModalSize, string> = {
  sm: "h-[49.5vh]",
  md: "h-[63vh]",
  lg: "h-[73.8vh]",
  xl: "h-[81vh]",
};

const directionStyle: Record<ModalDirection, CSSProperties> = {
  "top-left": { "--modal-from-x": "-60%", "--modal-from-y": "-60%", "--modal-origin": "top left" },
  top: { "--modal-from-x": "0%", "--modal-from-y": "-60%", "--modal-origin": "top center" },
  "top-right": { "--modal-from-x": "60%", "--modal-from-y": "-60%", "--modal-origin": "top right" },
  right: { "--modal-from-x": "60%", "--modal-from-y": "0%", "--modal-origin": "center right" },
  "bottom-right": { "--modal-from-x": "60%", "--modal-from-y": "60%", "--modal-origin": "bottom right" },
  bottom: { "--modal-from-x": "0%", "--modal-from-y": "60%", "--modal-origin": "bottom center" },
  "bottom-left": { "--modal-from-x": "-60%", "--modal-from-y": "60%", "--modal-origin": "bottom left" },
  left: { "--modal-from-x": "-60%", "--modal-from-y": "0%", "--modal-origin": "center left" },
} as Record<ModalDirection, CSSProperties>;

export const Modal = ({
  open,
  onClose,
  children,
  animation = "scale",
  direction = "bottom",
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

  const motion = phase === "exit" ? "out" : "in";

  const onPanelAnimationEnd = () => {
    if (phase === "exit") setMounted(false);
  };

  return createPortal(
    <div
      className={`${styles.backdrop} ${styles[`backdrop-${motion}`]}`}
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
        data-direction={direction}
        data-phase={phase}
        style={directionStyle[direction]}
        onAnimationEnd={onPanelAnimationEnd}
        className={`${styles.panel} ${styles[`${animation}-${motion}`]} ${sizeClass[size]} ${heightClass[size]} rounded-2xl border border-line bg-panel text-ink shadow-2xl`}
      >
        <ModalContextProvider value={{ close: onClose, titleId }}>
          {children}
        </ModalContextProvider>
      </div>
    </div>,
    document.body,
  );
};
