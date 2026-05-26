import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { Select } from "./select";
import type { SelectOption } from "./select.types";

const options: SelectOption<string>[] = [
  { value: "flash", label: "Gemini 3.5 Flash", secondary: "fast" },
  { value: "tts", label: "Gemini TTS", secondary: "speech", disabled: true },
  { value: "live", label: "Gemini Live", secondary: "realtime" },
];

afterEach(cleanup);

const ControlledSelect = (props: { onChange: (value: string) => void; searchable?: boolean }) => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Select
      label="Model"
      placeholder="Choose a model"
      options={options}
      value={value}
      searchable={props.searchable}
      onChange={(next: string) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
};

describe("Select", () => {
  it("shows the placeholder and opens the listbox on click", () => {
    render(<Select label="Model" placeholder="Choose a model" options={options} value={null} onChange={() => {}} />);
    expect(screen.getByText("Choose a model")).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option, fires onChange with its value, and reflects the label", () => {
    const onChange = mock(() => {});
    render(<ControlledSelect onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: /Gemini Live/ }));

    expect(onChange).toHaveBeenCalledWith("live");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(within(screen.getByRole("combobox")).getByText("Gemini Live")).toBeInTheDocument();
  });

  it("navigates with arrows and selects with Enter", () => {
    const onChange = mock(() => {});
    render(<ControlledSelect onChange={onChange} />);

    const combobox = screen.getByRole("combobox");
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("live");
  });

  it("closes on Escape without selecting", () => {
    const onChange = mock(() => {});
    render(<ControlledSelect onChange={onChange} />);

    const combobox = screen.getByRole("combobox");
    fireEvent.click(combobox);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(combobox, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not select a disabled option", () => {
    const onChange = mock(() => {});
    render(<ControlledSelect onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    const disabled = screen.getByRole("option", { name: /Gemini TTS/ });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabled);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("filters options when searchable", () => {
    render(<ControlledSelect onChange={() => {}} searchable />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "live" } });

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Gemini Live/ })).toBeInTheDocument();
  });

  it("shows an empty message when no option matches the search", () => {
    render(<ControlledSelect onChange={() => {}} searchable />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No options")).toBeInTheDocument();
  });

  it("shows a loading state instead of options", () => {
    render(<Select label="Model" options={options} value={null} loading onChange={() => {}} />);

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("does not open when disabled", () => {
    render(<Select label="Model" options={options} value={null} disabled onChange={() => {}} />);

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports multi-select: toggles values and stays open", () => {
    const Multi = () => {
      const [value, setValue] = useState<string[]>([]);
      return <Select label="Capabilities" options={options} multiple value={value} onChange={setValue} />;
    };
    render(<Multi />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: /Gemini 3.5 Flash/ }));
    fireEvent.click(screen.getByRole("option", { name: /Gemini Live/ }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Gemini 3.5 Flash/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Gemini Live/ })).toHaveAttribute("aria-selected", "true");
  });

  it("throws when a piece is rendered outside the Root", () => {
    const { SelectTrigger } = require("./select-trigger");
    expect(() => render(<SelectTrigger />)).toThrow(/within <SelectRoot>/);
  });
});
