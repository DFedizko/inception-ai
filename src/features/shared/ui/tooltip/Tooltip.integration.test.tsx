import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Tooltip } from "./tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
  it("hides the label until the trigger is hovered", () => {
    render(
      <Tooltip label="Explica o motivo">
        <button type="button">Ação</button>
      </Tooltip>,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("Ação").parentElement as HTMLElement);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Explica o motivo");

    fireEvent.mouseLeave(screen.getByText("Ação").parentElement as HTMLElement);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows over a disabled button, since the wrapper captures hover", () => {
    render(
      <Tooltip label="Desabilitado porque X" placement="bottom">
        <button type="button" disabled>
          Enviar
        </button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Enviar").parentElement as HTMLElement);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Desabilitado porque X");
  });
});
