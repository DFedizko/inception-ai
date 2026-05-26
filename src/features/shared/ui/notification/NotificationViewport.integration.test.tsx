import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NotificationViewport } from "./notification-viewport";
import { useNotificationStore } from "./notification-store";
import { notify } from "./notify";

beforeEach(() => useNotificationStore.setState({ notifications: [] }));
afterEach(cleanup);

describe("NotificationViewport", () => {
  it("renders a pushed notification message", () => {
    render(<NotificationViewport />);
    act(() => void notify.success("Conversa salva"));
    expect(screen.getByText("Conversa salva")).toBeInTheDocument();
  });

  it("removes the notification when the close button is clicked", () => {
    render(<NotificationViewport />);
    act(() => void notify.info("Olá"));
    fireEvent.click(screen.getByLabelText("Fechar notificação"));
    expect(screen.queryByText("Olá")).not.toBeInTheDocument();
  });

  it("runs the undo action and dismisses on Reverter", () => {
    const run = mock(() => {});
    render(<NotificationViewport />);
    act(() => void notify.warn("Mensagem apagada", { action: { label: "Reverter", run } }));

    fireEvent.click(screen.getByText("Reverter"));

    expect(run).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Mensagem apagada")).not.toBeInTheDocument();
  });

  it("copies the message to the clipboard", () => {
    const writeText = mock(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<NotificationViewport />);
    act(() => void notify.danger("Falha ao enviar"));
    fireEvent.click(screen.getByLabelText("Copiar mensagem"));

    expect(writeText).toHaveBeenCalledWith("Falha ao enviar");
  });
});
