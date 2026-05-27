import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { MiniPaginator } from "./mini-paginator";

describe("MiniPaginator", () => {
  it("renders nothing when there is a single page", () => {
    const { container } = render(<MiniPaginator page={1} pageCount={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders even on a single page when alwaysShow is set", () => {
    render(<MiniPaginator page={1} pageCount={1} onChange={() => {}} alwaysShow />);
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("disables the previous arrow on the first page", () => {
    const onChange = mock(() => {});
    render(<MiniPaginator page={1} pageCount={3} onChange={onChange} />);
    expect(screen.getByLabelText("Página anterior")).toBeDisabled();
    expect(screen.getByLabelText("Próxima página")).toBeEnabled();
  });

  it("disables the next arrow on the last page", () => {
    render(<MiniPaginator page={3} pageCount={3} onChange={() => {}} />);
    expect(screen.getByLabelText("Próxima página")).toBeDisabled();
    expect(screen.getByLabelText("Página anterior")).toBeEnabled();
  });

  it("emits the neighbouring page when an arrow is clicked", () => {
    const onChange = mock(() => {});
    render(<MiniPaginator page={2} pageCount={3} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Próxima página"));
    fireEvent.click(screen.getByLabelText("Página anterior"));

    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });
});
