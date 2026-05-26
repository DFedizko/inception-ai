import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("renders headings, emphasis and lists from markdown source", () => {
    render(<Markdown>{"# Título\n\nTexto **forte** aqui\n\n- um\n- dois"}</Markdown>);

    expect(screen.getByRole("heading", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByText("forte")).toBeInTheDocument();
    expect(screen.getByText("um")).toBeInTheDocument();
    expect(screen.getByText("dois")).toBeInTheDocument();
  });

  it("turns single line breaks into <br> (remark-breaks)", () => {
    const { container } = render(<Markdown>{"linha um\nlinha dois"}</Markdown>);

    expect(container.querySelector("br")).not.toBeNull();
  });

  it("renders GitHub-flavored tables via remark-gfm", () => {
    render(<Markdown>{"| a | b |\n| - | - |\n| 1 | 2 |"}</Markdown>);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "a" })).toBeInTheDocument();
  });
});
