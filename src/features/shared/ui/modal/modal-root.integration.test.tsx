import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Modal } from "./modal-root";
import { ModalTitle } from "./modal-title";
import { ModalBody } from "./modal-body";
import { ModalFooter } from "./modal-footer";

describe("Modal", () => {
  it("does not render anything while closed", () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("conteúdo")).toBeNull();
  });

  it("renders its composed pieces when open", () => {
    render(
      <Modal open onClose={() => {}}>
        <ModalTitle>Título</ModalTitle>
        <p>corpo</p>
        <ModalFooter>
          <button type="button">ok</button>
        </ModalFooter>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("corpo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ok" })).toBeInTheDocument();
  });

  it("calls onClose from the title close button, Escape and backdrop click", () => {
    const onClose = mock(() => {});
    render(
      <Modal open onClose={onClose}>
        <ModalTitle>Título</ModalTitle>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    const backdrop = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.mouseDown(backdrop);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close on Escape when closeOnEscape is false", () => {
    const onClose = mock(() => {});
    render(
      <Modal open onClose={onClose} closeOnEscape={false}>
        <p>corpo</p>
      </Modal>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("reflects the chosen animation on the dialog", () => {
    render(
      <Modal open onClose={() => {}} animation="flip">
        <p>corpo</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog").getAttribute("data-animation")).toBe("flip");
  });

  it("defaults the direction to bottom", () => {
    render(
      <Modal open onClose={() => {}}>
        <p>corpo</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog").getAttribute("data-direction")).toBe("bottom");
  });

  it("drives a directional animation from the chosen corner", () => {
    render(
      <Modal open onClose={() => {}} animation="reveal" direction="top-right">
        <p>corpo</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("data-direction")).toBe("top-right");
    expect(dialog.style.getPropertyValue("--modal-from-x")).toBe("60%");
    expect(dialog.style.getPropertyValue("--modal-from-y")).toBe("-60%");
    expect(dialog.style.getPropertyValue("--modal-origin")).toBe("top right");
  });

  it("supports the wild animation set", () => {
    const wild = ["vortex", "zoom-blur", "iris", "glitch", "elastic"] as const;
    for (const animation of wild) {
      const { unmount } = render(
        <Modal open onClose={() => {}} animation={animation}>
          <p>corpo</p>
        </Modal>,
      );
      expect(screen.getByRole("dialog").getAttribute("data-animation")).toBe(animation);
      unmount();
    }
  });

  it("keeps the scroll on the body region, not the title or footer", () => {
    render(
      <Modal open onClose={() => {}}>
        <ModalTitle>Título</ModalTitle>
        <ModalBody>
          <p>corpo</p>
        </ModalBody>
        <ModalFooter>
          <button type="button">ok</button>
        </ModalFooter>
      </Modal>,
    );

    const body = screen.getByText("corpo").parentElement as HTMLElement;
    expect(body.className).toContain("overflow-y-auto");
    expect(body.className).toContain("flex-1");
  });

  it("throws when a piece is rendered outside <Modal>", () => {
    expect(() => render(<ModalTitle>solto</ModalTitle>)).toThrow(
      /must be rendered inside <Modal>/,
    );
  });
});
