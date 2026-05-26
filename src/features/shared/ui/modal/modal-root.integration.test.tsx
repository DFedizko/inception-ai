import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Modal } from "./modal-root";
import { ModalTitle } from "./modal-title";
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

  it("throws when a piece is rendered outside <Modal>", () => {
    expect(() => render(<ModalTitle>solto</ModalTitle>)).toThrow(
      /must be rendered inside <Modal>/,
    );
  });
});
