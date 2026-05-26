import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge tone="accent">free</Badge>);
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("applies the tone styling", () => {
    render(<Badge tone="accent">free</Badge>);
    expect(screen.getByText("free").className).toContain("text-accent");
  });
});
