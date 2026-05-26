import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "./skeleton";
import { SkeletonProvider } from "./skeleton-provider";

describe("Skeleton", () => {
  it("renders a placeholder through the default renderer", () => {
    const { container } = render(<Skeleton width={120} />);
    expect(container.querySelector(".react-loading-skeleton")).not.toBeNull();
  });

  it("uses the injected renderer instead of the external library (dependency inversion)", () => {
    render(
      <SkeletonProvider renderer={() => <span data-testid="injected" />}>
        <Skeleton />
      </SkeletonProvider>,
    );

    expect(screen.getByTestId("injected")).toBeInTheDocument();
    expect(document.querySelector(".react-loading-skeleton")).toBeNull();
  });
});
