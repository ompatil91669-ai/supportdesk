import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Table, { type TableColumn } from "./Table";

interface Person {
  id: string;
  name: string;
}

const columns: TableColumn<Person>[] = [
  { key: "name", header: "Name", render: (person) => person.name },
];

describe("Table", () => {
  it("renders accessible headers and custom row content", () => {
    render(
      <Table
        columns={columns}
        data={[{ id: "1", name: "Morgan" }]}
        getRowKey={(person) => person.id}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Morgan" })).toBeTruthy();
  });

  it("renders loading and empty states", () => {
    const { rerender } = render(
      <Table columns={columns} data={[]} getRowKey={(person) => person.id} loading />
    );
    expect(screen.getByRole("status").textContent).toBe("Loading…");

    rerender(
      <Table
        columns={columns}
        data={[]}
        getRowKey={(person) => person.id}
        emptyState="No people found."
      />
    );
    expect(screen.getByText("No people found.")).toBeTruthy();
  });
});
