import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryProvider } from "./query-provider";

const Probe = () => {
  const client = useQueryClient();
  return <span>{client ? "has client" : "no client"}</span>;
};

describe("QueryProvider", () => {
  it("provides a shared query client to its children", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );

    expect(screen.getByText("has client")).toBeInTheDocument();
  });
});
